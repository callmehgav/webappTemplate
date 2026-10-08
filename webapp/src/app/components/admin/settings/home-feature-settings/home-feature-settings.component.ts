import { ChangeDetectionStrategy, Component, OnInit, signal, ViewChild } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { LocationPickerComponent } from './location-picker.component';
import { ConfirmationService } from '../../../../services/confirmation.service';
import { FormsModule } from '@angular/forms';
import { HttpParams } from '@angular/common/http';
import { AdminApiService } from '../../../../services/admin-api.service';
import { HomeFeatureSettings, PublicApiService } from '../../../../services/public-api.service';
import { ContentSettingsComponent } from '../content-settings/content-settings.component';
import { ToastService } from '../../../../services/toast.service';

interface AdminMediaItem { id: string; contentUrl: string; contentType: string; originalFileName: string; }

@Component({
  selector: 'app-home-feature-settings',
  imports: [FormsModule, ContentSettingsComponent, LocationPickerComponent],
  templateUrl: './home-feature-settings.component.html',
  styleUrls: ['./home-feature-settings.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HomeFeatureSettingsComponent implements OnInit {
  @ViewChild(ContentSettingsComponent) private contentEditor?: ContentSettingsComponent;
  private savedSettings: HomeFeatureSettings | null = null;
  readonly settings = signal<HomeFeatureSettings | null>(null);
  readonly saving = signal(false);
  readonly savingEverything = signal(false);
  readonly mapResetVersion = signal(0);
  readonly aboutImage = signal<AdminMediaItem | null>(null);
  readonly contactImage = signal<AdminMediaItem | null>(null);
  readonly aboutFile = signal<File | null>(null);
  readonly contactFile = signal<File | null>(null);
  readonly imageSaving = signal(false);

  constructor(
    private readonly api: AdminApiService,
    private readonly publicApi: PublicApiService,
    private readonly confirmation: ConfirmationService,
    private readonly toast: ToastService
  ) {}

  ngOnInit(): void {
    this.api.get<HomeFeatureSettings>('/home-features').subscribe({
      next: settings => {
        settings.locations = settings.locations?.length ? settings.locations : [{ name: settings.locationName, address: settings.locationAddress, latitude: settings.latitude, longitude: settings.longitude }];
        this.savedSettings = structuredClone(settings);
        this.settings.set(settings);
      },
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

  async removeSectionImage(usage: 3 | 4): Promise<void> {
    if (!await this.confirmation.confirm("Remove this section image?")) return;
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

  addLocation(): void {
    this.settings.update(value => value ? { ...value, locations: [...value.locations, { name: '', address: '', latitude: 0, longitude: 0 }] } : value);
  }
  resetLocations(): void {
    const saved = this.savedSettings;
    if (!saved) return;
    this.settings.update(value => value ? {
      ...value,
      locations: structuredClone(saved.locations),
      mapEnabled: saved.mapEnabled,
      locationName: saved.locationName,
      mapEyebrow: saved.mapEyebrow,
      mapZoom: saved.mapZoom
    } : value);
    this.mapResetVersion.update(value => value + 1);
    this.toast.show('Location map restored to the last saved settings.', 'success');
  }
  async removeLocation(index: number): Promise<void> {
    if (!await this.confirmation.confirm('Remove this location? Save the Location map tile to apply the change.')) return;
    this.settings.update(value => value ? { ...value, locations: value.locations.filter((_, i) => i !== index) } : value);
  }
  async saveContactTile(): Promise<void> {
    if (await this.saveTile(['contactHeading'])) await this.saveMedia(4);
  }
  async saveMedia(usage: 3 | 4): Promise<boolean> {
    const file = usage === 3 ? this.aboutFile() : this.contactFile();
    if (!file) return true;
    const body = new FormData(); body.append('File', file);
    this.imageSaving.set(true);
    try {
      const item = await firstValueFrom(this.api.put<AdminMediaItem>(`/admin/media/section-image/${usage}`, body));
      (usage === 3 ? this.aboutImage : this.contactImage).set(item);
      (usage === 3 ? this.aboutFile : this.contactFile).set(null);
      this.toast.show(usage === 3 ? 'About photo saved.' : 'Contact background saved.', 'success');
      return true;
    } catch { this.toast.show('The image could not be saved.', 'error'); return false; }
    finally { this.imageSaving.set(false); }
  }
  async saveTile(keys?: (keyof HomeFeatureSettings)[]): Promise<boolean> {
    const settings = this.settings();
    if (!settings || !this.savedSettings || this.saving()) return false;
    const snapshot = structuredClone(settings);
    const payload = keys ? { ...this.savedSettings, ...Object.fromEntries(keys.map(key => [key, snapshot[key]])) } : snapshot;
    this.saving.set(true);
    try {
      const value = await firstValueFrom(this.api.put<HomeFeatureSettings>('/home-features/admin/settings', payload));
      this.savedSettings = structuredClone(value);
      this.publicApi.updateHomeFeatureSettingsCache(value);
      this.toast.show(keys ? 'Tile saved.' : 'Home feature settings saved.', 'success');
      return true;
    } catch (error: any) { this.toast.show(error?.error?.message || 'Settings could not be saved.', 'error'); return false; }
    finally { this.saving.set(false); }
  }
  async saveEverything(): Promise<void> {
    if (this.savingEverything()) return;
    this.savingEverything.set(true);
    try {
    if (!await this.saveTile()) return;
    if (!await this.saveMedia(3) || !await this.saveMedia(4)) return;
    if (this.contentEditor && !await this.contentEditor.saveContent()) { this.toast.show('About content could not be saved. Review that tile.', 'error'); return; }
    this.toast.show('Everything in Home Features saved.', 'success');
    } finally { this.savingEverything.set(false); }
  }

}
