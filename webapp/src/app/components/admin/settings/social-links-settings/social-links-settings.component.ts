import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
  signal
} from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { Observable, of, switchMap } from 'rxjs';
import { AdminApiService } from '../../../../services/admin-api.service';

enum SocialPlatform {
  Custom = 0,
  YouTube = 1,
  Instagram = 2,
  TikTok = 3,
  AppleMusic = 4,
  GitHub = 5,
  LinkedIn = 6,
  Facebook = 7,
  Website = 8
}

enum SocialLinkDisplayStyle {
  Compact = 0,
  TitleCard = 1
}

interface BackgroundMedia {
  id: string;
  contentUrl: string;
  contentType: string;
  altText: string | null;
  focalPointX: number;
  focalPointY: number;
}

interface SocialLink {
  id: string;
  platform: SocialPlatform;
  displayStyle: SocialLinkDisplayStyle;
  label: string;
  handle: string | null;
  url: string;
  backgroundMediaItemId: string | null;
  backgroundMedia: BackgroundMedia | null;
  displayOrder: number;
}

interface UploadedMedia {
  id: string;
}

interface SocialLinkDraft {
  platform: SocialPlatform;
  displayStyle: SocialLinkDisplayStyle;
  label: string;
  handle: string;
  url: string;
  backgroundMediaItemId: string | null;
  displayOrder: number;
}

interface DeleteResponse {
  success: boolean;
}

@Component({
  selector: 'app-social-links-settings',
  imports: [FormsModule],
  templateUrl: './social-links-settings.component.html',
  styleUrls: ['./social-links-settings.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SocialLinksSettingsComponent implements OnInit, OnDestroy {
  readonly SocialLinkDisplayStyle = SocialLinkDisplayStyle;

  readonly platformOptions = [
    { value: SocialPlatform.Custom, label: 'Custom' },
    { value: SocialPlatform.YouTube, label: 'YouTube' },
    { value: SocialPlatform.Instagram, label: 'Instagram' },
    { value: SocialPlatform.TikTok, label: 'TikTok' },
    { value: SocialPlatform.AppleMusic, label: 'Apple Music' },
    { value: SocialPlatform.GitHub, label: 'GitHub' },
    { value: SocialPlatform.LinkedIn, label: 'LinkedIn' },
    { value: SocialPlatform.Facebook, label: 'Facebook' },
    { value: SocialPlatform.Website, label: 'Website' }
  ];

  readonly displayStyleOptions = [
    { value: SocialLinkDisplayStyle.Compact, label: 'Compact link' },
    { value: SocialLinkDisplayStyle.TitleCard, label: 'Title card' }
  ];

  readonly links = signal<SocialLink[]>([]);
  readonly selectedId = signal<string | null>(null);

  draft: SocialLinkDraft = this.createEmptyDraft();

  readonly selectedFile = signal<File | null>(null);
  readonly previewUrl = signal<string | null>(null);

  readonly isLoading = signal(true);
  readonly isSaving = signal(false);
  readonly isDeleting = signal(false);

  readonly successMessage = signal('');
  readonly errorMessage = signal('');

  constructor(private readonly adminApi: AdminApiService) {}

  ngOnInit(): void {
    this.loadLinks();
  }

  ngOnDestroy(): void {
    this.clearPreviewUrl();
  }

  loadLinks(selectedId?: string): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.adminApi.get<SocialLink[]>('/admin/social-links').subscribe({
      next: links => {
        this.links.set(links);
        this.isLoading.set(false);

        const selected =
          links.find(link => link.id === selectedId) ??
          links.find(link => link.id === this.selectedId()) ??
          links[0];

        if (selected) {
          this.selectLink(selected);
        } else {
          this.newLink();
        }
      },
      error: (error: HttpErrorResponse) => {
        this.isLoading.set(false);
        this.errorMessage.set(
          this.getErrorMessage(
            error,
            'Social links could not be loaded.'
          )
        );

        console.error('Social-link fetch failed:', error);
      }
    });
  }

  selectLink(link: SocialLink): void {
    this.selectedId.set(link.id);
    this.selectedFile.set(null);
    this.clearPreviewUrl();
    this.clearMessages();

    this.draft = {
      platform: link.platform,
      displayStyle: link.displayStyle,
      label: link.label,
      handle: link.handle ?? '',
      url: link.url,
      backgroundMediaItemId: link.backgroundMediaItemId,
      displayOrder: link.displayOrder
    };
  }

  newLink(): void {
    const links = this.links();
    const nextOrder =
      links.length === 0
        ? 10
        : Math.max(...links.map(link => link.displayOrder)) + 10;

    this.selectedId.set(null);
    this.selectedFile.set(null);
    this.clearPreviewUrl();
    this.clearMessages();

    this.draft = this.createEmptyDraft();
    this.draft.displayOrder = nextOrder;
  }

  chooseImage(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;

    this.selectedFile.set(file);
    this.clearPreviewUrl();

    if (file) {
      this.previewUrl.set(URL.createObjectURL(file));
    }
  }

  clearImage(fileInput: HTMLInputElement): void {
    this.selectedFile.set(null);
    this.draft.backgroundMediaItemId = null;
    fileInput.value = '';
    this.clearPreviewUrl();
  }

  saveLink(): void {
    const label = this.draft.label.trim();
    const url = this.draft.url.trim();

    if (!label || !url) {
      this.errorMessage.set('A label and URL are required.');
      return;
    }

    this.isSaving.set(true);
    this.clearMessages();

    this.uploadImage().pipe(
      switchMap(backgroundMediaItemId => {
        const request = {
          platform: this.draft.platform,
          displayStyle: this.draft.displayStyle,
          label,
          handle: this.draft.handle.trim() || null,
          url,
          backgroundMediaItemId:
            this.draft.displayStyle === SocialLinkDisplayStyle.TitleCard
              ? backgroundMediaItemId
              : null,
          displayOrder: this.draft.displayOrder
        };

        const selectedId = this.selectedId();

        return selectedId
          ? this.adminApi.put<SocialLink>(
              `/admin/social-links/${selectedId}`,
              request
            )
          : this.adminApi.post<SocialLink>(
              '/admin/social-links',
              request
            );
      })
    ).subscribe({
      next: savedLink => {
        this.isSaving.set(false);
        this.selectedFile.set(null);
        this.clearPreviewUrl();
        this.loadLinks(savedLink.id);
        this.successMessage.set(`${savedLink.label} was saved.`);
      },
      error: (error: HttpErrorResponse) => {
        this.isSaving.set(false);
        this.errorMessage.set(
          this.getErrorMessage(
            error,
            'The social link could not be saved.'
          )
        );

        console.error('Social-link save failed:', error);
      }
    });
  }

  deleteLink(): void {
    const link = this.selectedLink;

    if (!link || !window.confirm(`Delete "${link.label}"?`)) {
      return;
    }

    this.isDeleting.set(true);
    this.clearMessages();

    this.adminApi.delete<DeleteResponse>(
      `/admin/social-links/${link.id}`
    ).subscribe({
      next: () => {
        this.isDeleting.set(false);
        this.links.update(links =>
          links.filter(item => item.id !== link.id)
        );

        const nextLink = this.links()[0];

        if (nextLink) {
          this.selectLink(nextLink);
        } else {
          this.newLink();
        }

        this.successMessage.set(`${link.label} was deleted.`);
      },
      error: (error: HttpErrorResponse) => {
        this.isDeleting.set(false);
        this.errorMessage.set(
          this.getErrorMessage(
            error,
            'The social link could not be deleted.'
          )
        );

        console.error('Social-link deletion failed:', error);
      }
    });
  }

  get selectedLink(): SocialLink | null {
    const selectedId = this.selectedId();

    return this.links().find(link => link.id === selectedId) ?? null;
  }

  get currentImageUrl(): string | null {
    const previewUrl = this.previewUrl();

    if (previewUrl) {
      return previewUrl;
    }

    const media = this.selectedLink?.backgroundMedia;

    if (!media || !this.draft.backgroundMediaItemId) {
      return null;
    }

    return this.adminApi.resolveContentUrl(media.contentUrl);
  }

  private uploadImage(): Observable<string | null> {
    const selectedFile = this.selectedFile();

    if (!selectedFile) {
      return of(this.draft.backgroundMediaItemId);
    }

    const formData = new FormData();

    formData.append('File', selectedFile);
    formData.append('Usage', '1');
    formData.append('AltText', this.draft.label.trim());
    formData.append('FocalPointX', '50');
    formData.append('FocalPointY', '50');

    return this.adminApi.post<UploadedMedia>(
      '/admin/media',
      formData
    ).pipe(
      switchMap(media => of(media.id))
    );
  }

  private createEmptyDraft(): SocialLinkDraft {
    return {
      platform: SocialPlatform.Custom,
      displayStyle: SocialLinkDisplayStyle.Compact,
      label: '',
      handle: '',
      url: '',
      backgroundMediaItemId: null,
      displayOrder: 10
    };
  }

  private clearPreviewUrl(): void {
    const previewUrl = this.previewUrl();

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      this.previewUrl.set(null);
    }
  }

  private clearMessages(): void {
    this.successMessage.set('');
    this.errorMessage.set('');
  }

  private getErrorMessage(
    error: HttpErrorResponse,
    fallback: string
  ): string {
    if (error.status === 401) {
      return 'Your administrator session has expired.';
    }

    if (typeof error.error?.message === 'string') {
      return error.error.message;
    }

    return fallback;
  }
}
