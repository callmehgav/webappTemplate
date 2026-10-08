import { inject } from '@angular/core';
import { ConfirmationService } from '../../../../services/confirmation.service';
import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
  signal
} from '@angular/core';
import { HttpErrorResponse, HttpParams } from '@angular/common/http';

import { AdminApiService } from '../../../../services/admin-api.service';
import {
  PublicApiService,
  SiteBrandingSettings
} from '../../../../services/public-api.service';
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
  private savedTypography?: SiteBrandingSettings;
  private readonly confirmation = inject(ConfirmationService);
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
  readonly isBackgroundLoading = signal(true);
  readonly isBackgroundSaving = signal(false);
  readonly backgroundColor = signal('#e9eef5');
  readonly useBackgroundImage = signal(false);
  readonly useAmbientBackground = signal(true);
  readonly currentBackgroundImage = signal<AdminMediaItem | null>(null);
  readonly selectedBackgroundFile = signal<File | null>(null);
  readonly backgroundPreviewUrl = signal<string | null>(null);
  readonly backgroundErrorMessage = signal('');
  readonly backgroundSuccessMessage = signal('');
  readonly buttonColor = signal("#356bd6");
  readonly buttonTextColor = signal("#ffffff");
  readonly pFontFamily = signal("Arial");
  readonly pFontSize = signal(16);
  readonly pColor = signal("#514252");
  readonly h1FontFamily = signal('Georgia');
  readonly h1FontSize = signal(88);
  readonly h1Color = signal('#2b2430');
  readonly h2FontFamily = signal('Georgia');
  readonly h2FontSize = signal(58);
  readonly h2Color = signal('#2b2430');
  readonly h3FontFamily = signal('Georgia');
  readonly h3FontSize = signal(30);
  readonly h3Color = signal('#514252');
  readonly typographySample = signal('Test Text');
  readonly fontOptions = ["Georgia","Times New Roman","Trebuchet MS","Arial","Verdana","system-ui","Tahoma","Segoe UI","Calibri","Cambria","Garamond","Palatino Linotype","Book Antiqua","Courier New","Lucida Console","Impact","Century Gothic"];

  constructor(
    private readonly adminApi: AdminApiService,
    private readonly publicApi: PublicApiService,
    private readonly siteBranding: SiteBrandingService
  ) {}

  ngOnInit(): void {
    this.loadLogo();
    this.loadHeroMedia();
    this.loadBackgroundSettings();
  }

  ngOnDestroy(): void {
    this.clearPreviewUrl();
    this.clearHeroPreviewUrl();
    this.clearBackgroundPreviewUrl();
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
    const selectedFile = this.selectedHeroFile();
    if (selectedFile) {
      return selectedFile.type.startsWith('video/') || /\.mov$/i.test(selectedFile.name);
    }
    const contentType =
      this.currentHeroMedia()?.contentType ||
      '';

    return contentType.startsWith('video/');
  }

  get displayedBackgroundImageUrl(): string | null {
    return this.backgroundPreviewUrl() ||
      (this.currentBackgroundImage()
        ? this.adminApi.resolveContentUrl(this.currentBackgroundImage()!.contentUrl)
        : null);
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

  async removeHeroMedia(): Promise<void> {
    if (!this.currentHeroMedia() ||
        !await this.confirmation.confirm('Remove the current hero image or video?')) {
      return;
    }

    this.isHeroSaving.set(true);
    this.heroErrorMessage.set('');
    this.heroSuccessMessage.set('');

    this.adminApi.delete<{ success: boolean }>('/admin/media/hero-media')
      .subscribe({
        next: () => {
          this.currentHeroMedia.set(null);
          this.selectedHeroFile.set(null);
          this.clearHeroPreviewUrl();
          this.publicApi.clearHeroMediaCache();
          this.isHeroSaving.set(false);
          this.heroSuccessMessage.set('Hero media removed. The default hero background is now active.');
        },
        error: (error: HttpErrorResponse) => {
          this.isHeroSaving.set(false);
          this.heroErrorMessage.set(
            this.getErrorMessage(error, 'The hero media could not be removed.')
          );
        }
      });
  }

  get selectedBackgroundMode(): 'ambient' | 'solid' | 'image' {
    if (this.useBackgroundImage()) return 'image';
    return this.useAmbientBackground() ? 'ambient' : 'solid';
  }

  setBackgroundMode(mode: 'ambient' | 'solid' | 'image'): void {
    this.useBackgroundImage.set(mode === 'image');
    this.useAmbientBackground.set(mode === 'ambient');
    this.backgroundErrorMessage.set('');
    this.backgroundSuccessMessage.set('');
  }

  onBackgroundColorChanged(event: Event): void {
    this.backgroundColor.set((event.target as HTMLInputElement).value);
    if (this.useBackgroundImage()) {
      this.useAmbientBackground.set(true);
    }
    this.useBackgroundImage.set(false);
  }

  onBackgroundFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;

    this.clearBackgroundPreviewUrl();
    this.selectedBackgroundFile.set(file);
    this.backgroundErrorMessage.set('');
    this.backgroundSuccessMessage.set('');

    if (file) {
      this.backgroundPreviewUrl.set(URL.createObjectURL(file));
      this.useBackgroundImage.set(true);
      this.useAmbientBackground.set(false);
    }
  }

  saveBackground(): void {
    const selectedImage = this.selectedBackgroundFile();
    if (this.useBackgroundImage() && selectedImage) {
      const formData = new FormData();
      formData.append('File', selectedImage);
      this.saveBackgroundRequest('/branding/admin/background-image', formData);
      return;
    }

    this.saveBackgroundRequest('/branding/admin/settings', {
      backgroundColor: this.backgroundColor(),
      useBackgroundImage: this.useBackgroundImage(),
      useAmbientBackground: this.useAmbientBackground(),
      ...this.typographyPayload()
    });
  }

  async removeBackgroundImage(): Promise<void> {
    if (!this.currentBackgroundImage() ||
        !await this.confirmation.confirm('Remove the uploaded site background image?')) {
      return;
    }

    this.isBackgroundSaving.set(true);
    this.backgroundErrorMessage.set('');
    this.backgroundSuccessMessage.set('');
    this.adminApi.delete<SiteBrandingSettings>('/branding/admin/background-image')
      .subscribe({
        next: settings => {
          this.applyBackgroundSettings(settings);
          this.backgroundSuccessMessage.set('Background image removed. The ambient color is now active.');
          this.isBackgroundSaving.set(false);
        },
        error: (error: HttpErrorResponse) => {
          this.isBackgroundSaving.set(false);
          this.backgroundErrorMessage.set(
            this.getErrorMessage(error, 'The background image could not be removed.')
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

  private loadBackgroundSettings(): void {
    this.isBackgroundLoading.set(true);
    this.publicApi.getBrandingSettings().subscribe({
      next: settings => {
        this.backgroundColor.set(settings.backgroundColor);
        this.useBackgroundImage.set(settings.useBackgroundImage);
        this.useAmbientBackground.set(settings.useAmbientBackground);
        this.currentBackgroundImage.set(settings.backgroundImage as AdminMediaItem | null);
        this.applyTypographySignals(settings);
        this.isBackgroundLoading.set(false);
      },
      error: (error: HttpErrorResponse) => {
        this.isBackgroundLoading.set(false);
        this.backgroundErrorMessage.set(
          this.getErrorMessage(error, 'The current page background could not be loaded.')
        );
      }
    });
  }

  private saveBackgroundRequest(path: string, body: unknown, message = 'Site background updated everywhere.'): void {
    this.isBackgroundSaving.set(true);
    this.backgroundErrorMessage.set('');
    this.backgroundSuccessMessage.set('');

    this.adminApi.put<SiteBrandingSettings>(path, body).subscribe({
      next: settings => {
        this.applyBackgroundSettings(settings);
        this.isBackgroundSaving.set(false);
        this.backgroundSuccessMessage.set(message);
      },
      error: (error: HttpErrorResponse) => {
        this.isBackgroundSaving.set(false);
        this.backgroundErrorMessage.set(
          this.getErrorMessage(error, 'The site background could not be saved.')
        );
      }
    });
  }

  private applyBackgroundSettings(settings: SiteBrandingSettings): void {
    const normalized: SiteBrandingSettings = {
      ...settings,
      backgroundImage: settings.backgroundImage
        ? {
            ...settings.backgroundImage,
            contentUrl: this.adminApi.resolveContentUrl(settings.backgroundImage.contentUrl)
          }
        : null
    };

    this.backgroundColor.set(normalized.backgroundColor);
    this.useBackgroundImage.set(normalized.useBackgroundImage);
    this.useAmbientBackground.set(normalized.useAmbientBackground);
    this.currentBackgroundImage.set(normalized.backgroundImage as AdminMediaItem | null);
    this.selectedBackgroundFile.set(null);
    this.clearBackgroundPreviewUrl();
    this.publicApi.updateBrandingSettingsCache(normalized);
    this.siteBranding.applyBackground(
      normalized.backgroundColor,
      normalized.useBackgroundImage
        ? normalized.backgroundImage?.contentUrl ?? null
        : null,
      normalized.useAmbientBackground
    );
    this.applyTypographySignals(normalized);
    this.siteBranding.applyTypography(normalized);
  }

  saveTypography(): void {
    this.saveBackgroundRequest('/branding/admin/settings', {
      backgroundColor: this.backgroundColor(),
      useBackgroundImage: this.useBackgroundImage(),
      useAmbientBackground: this.useAmbientBackground(),
      ...this.typographyPayload()
    }, 'Typography and button colors saved.');
  }

  resetTypography(): void {
    if (!this.savedTypography) return;
    this.applyTypographySignals(this.savedTypography);
    this.typographySample.set('Test Text');
    this.backgroundErrorMessage.set('');
    this.backgroundSuccessMessage.set('Typography and button colors restored to the last saved settings.');
  }

  private typographyPayload() {
    return {
      buttonColor: this.buttonColor(),
      buttonTextColor: this.buttonTextColor(),
      pFontFamily: this.pFontFamily(),
      pFontSize: this.pFontSize(),
      pColor: this.pColor(),
      h1FontFamily: this.h1FontFamily(), h1FontSize: this.h1FontSize(), h1Color: this.h1Color(),
      h2FontFamily: this.h2FontFamily(), h2FontSize: this.h2FontSize(), h2Color: this.h2Color(),
      h3FontFamily: this.h3FontFamily(), h3FontSize: this.h3FontSize(), h3Color: this.h3Color()
    };
  }

  private applyTypographySignals(settings: SiteBrandingSettings): void {
    this.savedTypography = structuredClone(settings);
    this.buttonColor.set(settings.buttonColor);
    this.buttonTextColor.set(settings.buttonTextColor);
    this.pFontFamily.set(settings.pFontFamily);
    this.pFontSize.set(settings.pFontSize);
    this.pColor.set(settings.pColor);
    this.h1FontFamily.set(settings.h1FontFamily);
    this.h1FontSize.set(settings.h1FontSize);
    this.h1Color.set(settings.h1Color);
    this.h2FontFamily.set(settings.h2FontFamily);
    this.h2FontSize.set(settings.h2FontSize);
    this.h2Color.set(settings.h2Color);
    this.h3FontFamily.set(settings.h3FontFamily);
    this.h3FontSize.set(settings.h3FontSize);
    this.h3Color.set(settings.h3Color);
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

  private clearBackgroundPreviewUrl(): void {
    const preview = this.backgroundPreviewUrl();

    if (preview) {
      URL.revokeObjectURL(preview);
      this.backgroundPreviewUrl.set(null);
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
