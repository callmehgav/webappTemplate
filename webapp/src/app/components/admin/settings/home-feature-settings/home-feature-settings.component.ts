import { ChangeDetectionStrategy, Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse, HttpParams } from '@angular/common/http';
import { AdminApiService } from '../../../../services/admin-api.service';
import { HomeFeatureSettings, PublicApiService } from '../../../../services/public-api.service';
import { ContentSettingsComponent } from '../content-settings/content-settings.component';
import { ToastService } from '../../../../services/toast.service';

interface AdminMediaItem { id: string; contentUrl: string; contentType: string; originalFileName: string; }

@Component({
  selector: 'app-home-feature-settings',
  imports: [FormsModule, ContentSettingsComponent],
  templateUrl: './home-feature-settings.component.html',
  styleUrls: ['./home-feature-settings.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HomeFeatureSettingsComponent implements OnInit {
  readonly settings = signal<HomeFeatureSettings | null>(null);
  readonly saving = signal(false);
  readonly aboutImage = signal<AdminMediaItem | null>(null);
  readonly contactImage = signal<AdminMediaItem | null>(null);
  readonly aboutFile = signal<File | null>(null);
  readonly contactFile = signal<File | null>(null);
  readonly imageSaving = signal(false);

  constructor(
    private readonly api: AdminApiService,
    private readonly publicApi: PublicApiService,
    private readonly toast: ToastService
  ) {}

  ngOnInit(): void {
    this.api.get<HomeFeatureSettings>('/home-features').subscribe({
      next: settings => this.settings.set(settings),
      error: () => this.toast.show('Home features could not be loaded.', 'error')
    });
    this.loadSectionImage(3, this.aboutImage);
    this.loadSectionImage(4, this.contactImage);
  }

  imageUrl(item: AdminMediaItem | null): string | null {
    return item ? this.api.resolveContentUrl(item.contentUrl) : null;
  }

  chooseImage(event: Event, target: 'about' | 'contact'): void {
    const file = (event.target as HTMLInputElement).files?.[0] ?? null;
    (target === 'about' ? this.aboutFile : this.contactFile).set(file);
  }

  saveSectionImage(usage: 3 | 4): void {
    const file = usage === 3 ? this.aboutFile() : this.contactFile();
    if (!file) { this.toast.show('Choose an image first.', 'error'); return; }
    const body = new FormData();
    body.append('File', file);
    this.imageSaving.set(true);
    this.api.put<AdminMediaItem>(`/admin/media/section-image/${usage}`, body).subscribe({
      next: item => {
        (usage === 3 ? this.aboutImage : this.contactImage).set(item);
        (usage === 3 ? this.aboutFile : this.contactFile).set(null);
        this.imageSaving.set(false);
        this.toast.show(usage === 3 ? 'About photo updated.' : 'Contact background updated.', 'success');
      },
      error: (error: HttpErrorResponse) => {
        this.imageSaving.set(false);
        this.toast.show(error.error?.message || 'The image could not be saved.', 'error');
      }
    });
  }

  removeSectionImage(usage: 3 | 4): void {
    this.imageSaving.set(true);
    this.api.delete<{ success: boolean }>(`/admin/media/section-image/${usage}`).subscribe({
      next: () => {
        (usage === 3 ? this.aboutImage : this.contactImage).set(null);
        this.imageSaving.set(false);
        this.toast.show('Section image removed.', 'success');
      },
      error: () => { this.imageSaving.set(false); this.toast.show('The image could not be removed.', 'error'); }
    });
  }

  private loadSectionImage(usage: number, target: { set(value: AdminMediaItem | null): void }): void {
    this.api.get<AdminMediaItem[]>('/admin/media', new HttpParams().set('usage', `${usage}`)).subscribe({
      next: items => target.set(items[0] ?? null),
      error: () => target.set(null)
    });
  }

  save(): void {
    const settings = this.settings();
    if (!settings) return;

    this.saving.set(true);
    this.api.put<HomeFeatureSettings>('/home-features/admin/settings', settings).subscribe({
      next: value => {
        this.settings.set(value);
        this.publicApi.updateHomeFeatureSettingsCache(value);
        this.saving.set(false);
        this.toast.show('Home features saved.', 'success');
      },
      error: error => {
        this.saving.set(false);
        this.toast.show(error?.error?.message || 'Home features could not be saved.', 'error');
      }
    });
  }
}
