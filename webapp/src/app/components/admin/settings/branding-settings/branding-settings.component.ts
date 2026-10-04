import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
  signal
} from '@angular/core';
import { HttpErrorResponse, HttpParams } from '@angular/common/http';

import { AdminApiService } from '../../../../services/admin-api.service';
import { PublicApiService } from '../../../../services/public-api.service';
import { SiteBrandingService } from '../../../../services/site-branding.service';

interface AdminMediaItem {
  id: string;
  originalFileName: string;
  contentType: string;
  contentUrl: string;
  byteLength: number;
}

@Component({
  selector: 'app-branding-settings',
  imports: [],
  templateUrl: './branding-settings.component.html',
  styleUrls: ['./branding-settings.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BrandingSettingsComponent implements OnInit, OnDestroy {
  readonly isLoading = signal(true);
  readonly isSaving = signal(false);
  readonly currentLogo = signal<AdminMediaItem | null>(null);
  readonly selectedFile = signal<File | null>(null);
  readonly previewUrl = signal<string | null>(null);
  readonly errorMessage = signal('');
  readonly successMessage = signal('');
  readonly isHeroLoading = signal(true);
  readonly isHeroSaving = signal(false);
  readonly currentHeroMedia = signal<AdminMediaItem | null>(null);
  readonly selectedHeroFile = signal<File | null>(null);
  readonly heroPreviewUrl = signal<string | null>(null);
  readonly heroErrorMessage = signal('');
  readonly heroSuccessMessage = signal('');

  constructor(
    private readonly adminApi: AdminApiService,
    private readonly publicApi: PublicApiService,
    private readonly siteBranding: SiteBrandingService
  ) {}

  ngOnInit(): void {
    this.loadLogo();
    this.loadHeroMedia();
  }

  ngOnDestroy(): void {
    this.clearPreviewUrl();
    this.clearHeroPreviewUrl();
  }

  get displayedLogoUrl(): string | null {
    const preview = this.previewUrl();

    if (preview) {
      return preview;
    }

    const logo = this.currentLogo();

    return logo
      ? this.adminApi.resolveContentUrl(logo.contentUrl)
      : null;
  }

  get displayedHeroMediaUrl(): string | null {
    const preview = this.heroPreviewUrl();

    if (preview) {
      return preview;
    }

    const media = this.currentHeroMedia();

    return media
      ? this.adminApi.resolveContentUrl(media.contentUrl)
      : null;
  }

  get displayedHeroMediaIsVideo(): boolean {
    const contentType =
      this.selectedHeroFile()?.type ||
      this.currentHeroMedia()?.contentType ||
      '';

    return contentType.startsWith('video/');
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;

    this.clearPreviewUrl();
    this.selectedFile.set(file);
    this.errorMessage.set('');
    this.successMessage.set('');

    if (file) {
      this.previewUrl.set(URL.createObjectURL(file));
    }
  }

  saveLogo(): void {
    const file = this.selectedFile();

    if (!file) {
      this.errorMessage.set('Choose a logo image first.');
      return;
    }

    const formData = new FormData();
    formData.append('File', file);

    this.isSaving.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    this.adminApi.put<AdminMediaItem>(
      '/admin/media/site-logo',
      formData
    ).subscribe({
      next: logo => {
        this.currentLogo.set(logo);
        this.publicApi.clearSiteLogoCache();
        this.siteBranding.setFavicon(
          this.adminApi.resolveContentUrl(logo.contentUrl),
          logo.contentType
        );
        this.selectedFile.set(null);
        this.clearPreviewUrl();
        this.isSaving.set(false);
        this.successMessage.set(
          'Site logo updated across the website.'
        );
      },
      error: (error: HttpErrorResponse) => {
        this.isSaving.set(false);
        this.errorMessage.set(
          this.getErrorMessage(
            error,
            'The site logo could not be saved.'
          )
        );
      }
    });
  }

  onHeroFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;

    this.clearHeroPreviewUrl();
    this.selectedHeroFile.set(file);
    this.heroErrorMessage.set('');
    this.heroSuccessMessage.set('');

    if (file) {
      this.heroPreviewUrl.set(URL.createObjectURL(file));
    }
  }

  saveHeroMedia(): void {
    const file = this.selectedHeroFile();

    if (!file) {
      this.heroErrorMessage.set(
        'Choose a hero image or video first.'
      );
      return;
    }

    const formData = new FormData();
    formData.append('File', file);

    this.isHeroSaving.set(true);
    this.heroErrorMessage.set('');
    this.heroSuccessMessage.set('');

    this.adminApi.put<AdminMediaItem>(
      '/admin/media/hero-media',
      formData
    ).subscribe({
      next: media => {
        this.currentHeroMedia.set(media);
        this.publicApi.clearHeroMediaCache();
        this.selectedHeroFile.set(null);
        this.clearHeroPreviewUrl();
        this.isHeroSaving.set(false);
        this.heroSuccessMessage.set('Hero media updated.');
      },
      error: (error: HttpErrorResponse) => {
        this.isHeroSaving.set(false);
        this.heroErrorMessage.set(
          this.getErrorMessage(
            error,
            'The hero image or video could not be saved.'
          )
        );
      }
    });
  }

  private loadLogo(): void {
    const params = new HttpParams().set('usage', '6');

    this.isLoading.set(true);
    this.errorMessage.set('');

    this.adminApi.get<AdminMediaItem[]>(
      '/admin/media',
      params
    ).subscribe({
      next: logos => {
        this.currentLogo.set(logos[0] ?? null);
        this.isLoading.set(false);
      },
      error: (error: HttpErrorResponse) => {
        this.isLoading.set(false);
        this.errorMessage.set(
          this.getErrorMessage(
            error,
            'The current site logo could not be loaded.'
          )
        );
      }
    });
  }

  private loadHeroMedia(): void {
    const params = new HttpParams().set('usage', '7');

    this.isHeroLoading.set(true);
    this.heroErrorMessage.set('');

    this.adminApi.get<AdminMediaItem[]>(
      '/admin/media',
      params
    ).subscribe({
      next: mediaItems => {
        this.currentHeroMedia.set(mediaItems[0] ?? null);
        this.isHeroLoading.set(false);
      },
      error: (error: HttpErrorResponse) => {
        this.isHeroLoading.set(false);
        this.heroErrorMessage.set(
          this.getErrorMessage(
            error,
            'The current hero media could not be loaded.'
          )
        );
      }
    });
  }

  private clearPreviewUrl(): void {
    const preview = this.previewUrl();

    if (preview) {
      URL.revokeObjectURL(preview);
      this.previewUrl.set(null);
    }
  }

  private clearHeroPreviewUrl(): void {
    const preview = this.heroPreviewUrl();

    if (preview) {
      URL.revokeObjectURL(preview);
      this.heroPreviewUrl.set(null);
    }
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
