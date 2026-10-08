import { inject } from '@angular/core';
import { ConfirmationService } from '../../../../services/confirmation.service';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnInit,
  signal,
  ViewChild
} from '@angular/core';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';

import { AdminApiService } from '../../../../services/admin-api.service';
import { ContentViewerComponent } from '../../../ui/content-viewer/content-viewer.component';

enum SiteContentFormat {
  PlainText = 0,
  Markdown = 1
}

interface SiteContentItem {
  id: string;
  contentKey: string;
  title: string | null;
  content: string;
  format: SiteContentFormat;
  isVisible: boolean;
  concurrencyStamp: string;
  updatedUtc: string;
}

interface UpdateContentResponse extends SiteContentItem {
  success: boolean;
}

@Component({
  selector: 'app-content-settings',
  imports: [
    ReactiveFormsModule,
    DatePipe,
    ContentViewerComponent
  ],
  templateUrl: './content-settings.component.html',
  styleUrls: ['./content-settings.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ContentSettingsComponent implements OnInit {
  @ViewChild('contentInput') private contentInput?: ElementRef<HTMLTextAreaElement>;
  readonly showPreview = signal(true);
  private readonly confirmation = inject(ConfirmationService);
  readonly isLoading = signal(true);
  readonly isSaving = signal(false);

  readonly loadError = signal<string | null>(null);
  readonly saveError = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);

  readonly contentItems = signal<SiteContentItem[]>([]);
  readonly selectedContent = signal<SiteContentItem | null>(null);

  readonly formatOptions = [
    {
      value: SiteContentFormat.PlainText,
      label: 'Plain text'
    },
    {
      value: SiteContentFormat.Markdown,
      label: 'Markdown'
    }
  ];

  readonly contentForm = this.formBuilder.nonNullable.group({
    title: [''],
    content: ['', Validators.required],
    format: [SiteContentFormat.Markdown],
    isVisible: [true],
    concurrencyStamp: ['', Validators.required]
  });

  constructor(
    private readonly adminApi: AdminApiService,
    private readonly formBuilder: FormBuilder
  ) {}

  ngOnInit(): void {
    this.loadContent();
  }

  formatSelection(style: 'bold' | 'h1' | 'h2' | 'h3' | 'paragraph'): void {
    const input = this.contentInput?.nativeElement;
    if (!input) return;
    const control = this.contentForm.controls.content;
    const text = control.value;
    let start = input.selectionStart;
    let end = input.selectionEnd;
    let replacement: string;
    let selectionStart: number;
    let selectionEnd: number;
    if (style === 'bold') {
      const selected = text.slice(start, end) || 'Bold text';
      replacement = `**${selected}**`;
      selectionStart = start + 2;
      selectionEnd = selectionStart + selected.length;
    } else {
      start = start === 0 ? 0 : text.lastIndexOf('\n', start - 1) + 1;
      const lineEnd = text.indexOf('\n', end);
      end = lineEnd < 0 ? text.length : lineEnd;
      const selected = text.slice(start, end).replace(/^#{1,6}\s+/gm, '') || (style === 'paragraph' ? 'Paragraph text' : 'Heading');
      const prefix = style === 'paragraph' ? '' : '#'.repeat(+style.slice(1)) + ' ';
      replacement = selected.split('\n').map(line => prefix + line).join('\n');
      selectionStart = start + prefix.length;
      selectionEnd = start + replacement.length;
    }
    this.contentForm.controls.format.setValue(SiteContentFormat.Markdown);
    control.setValue(text.slice(0, start) + replacement + text.slice(end));
    control.markAsDirty();
    input.focus();
    requestAnimationFrame(() => input.setSelectionRange(selectionStart, selectionEnd));
  }

  async loadContent(): Promise<void> {
    if (
      this.contentForm.dirty &&
      !await this.confirmation.confirm('Discard your unsaved content changes?')
    ) {
      return;
    }

    this.isLoading.set(true);
    this.loadError.set(null);
    this.saveError.set(null);
    this.successMessage.set(null);

    this.adminApi.get<SiteContentItem[]>('/admin/content').subscribe({
      next: items => {
        this.contentItems.set(items);
        this.isLoading.set(false);

        const previouslySelectedId = this.selectedContent()?.id;
        const nextSelection =
          items.find(item => item.id === previouslySelectedId) ??
          items.find(item => item.contentKey === 'about.body') ??
          items[0] ??
          null;

        if (nextSelection) {
          this.selectContent(nextSelection, true);
        } else {
          this.selectedContent.set(null);
          this.contentForm.reset();
        }
      },
      error: (error: HttpErrorResponse) => {
        this.isLoading.set(false);
        this.loadError.set(
          this.getErrorMessage(error, 'Content could not be loaded.')
        );

        console.error('Administrator content fetch failed:', error);
      }
    });
  }

  async selectContent(item: SiteContentItem, force = false): Promise<void> {
    if (
      !force &&
      this.selectedContent()?.id !== item.id &&
      this.contentForm.dirty &&
      !await this.confirmation.confirm('Discard your unsaved content changes?')
    ) {
      return;
    }

    this.selectedContent.set(item);
    this.saveError.set(null);
    this.successMessage.set(null);

    this.contentForm.reset({
      title: item.title ?? '',
      content: item.content,
      format: item.format,
      isVisible: item.isVisible,
      concurrencyStamp: item.concurrencyStamp
    });
  }

  async saveContent(): Promise<boolean> {
    if (!this.contentForm.dirty) return true;
    const selected = this.selectedContent();

    if (!selected || this.contentForm.invalid) {
      this.contentForm.markAllAsTouched();
      return false;
    }

    const formValue = this.contentForm.getRawValue();

    this.isSaving.set(true);
    this.saveError.set(null);
    this.successMessage.set(null);

    return new Promise<boolean>(resolve => {
    this.adminApi.put<UpdateContentResponse>(
      `/admin/content/${selected.id}`,
      {
        title: formValue.title.trim() || null,
        content: formValue.content,
        format: formValue.format,
        isVisible: formValue.isVisible,
        concurrencyStamp: formValue.concurrencyStamp
      }
    ).subscribe({
      next: response => {
        const updatedItem: SiteContentItem = {
          id: response.id,
          contentKey: response.contentKey,
          title: response.title,
          content: response.content,
          format: response.format,
          isVisible: response.isVisible,
          concurrencyStamp: response.concurrencyStamp,
          updatedUtc: response.updatedUtc
        };

        this.contentItems.update(items =>
          items.map(item => item.id === updatedItem.id ? updatedItem : item)
        );

        this.selectedContent.set(updatedItem);

        this.contentForm.reset({
          title: updatedItem.title ?? '',
          content: updatedItem.content,
          format: updatedItem.format,
          isVisible: updatedItem.isVisible,
          concurrencyStamp: updatedItem.concurrencyStamp
        });

        this.isSaving.set(false);
        resolve(true);
        this.successMessage.set(`${updatedItem.contentKey} was saved.`);
      },
      error: (error: HttpErrorResponse) => {
        this.isSaving.set(false);
        this.saveError.set(
          this.getErrorMessage(error, 'Content could not be saved.')
        );

        resolve(false);
        console.error('Administrator content update failed:', error);
      }
    });
    });
  }

  resetChanges(): void {
    const selected = this.selectedContent();

    if (selected) {
      this.selectContent(selected, true);
    }
  }

  private getErrorMessage(
    error: HttpErrorResponse,
    fallback: string
  ): string {
    if (error.status === 401) {
      return 'Your administrator session has expired. Log in again.';
    }

    if (error.status === 409) {
      return 'This content changed elsewhere. Reload it before saving again.';
    }

    if (
      typeof error.error?.message === 'string' &&
      error.error.message.trim()
    ) {
      return error.error.message;
    }

    return fallback;
  }
}
