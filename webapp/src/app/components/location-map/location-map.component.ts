import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  inject,
  OnDestroy,
  OnInit,
  signal,
  ViewEncapsulation
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { combineLatest } from 'rxjs';
import * as L from 'leaflet';
import { HomeFeatureSettings, PublicApiService, PublicMediaItem } from '../../services/public-api.service';

@Component({
  selector: 'app-location-map',
  templateUrl: './location-map.component.html',
  styleUrls: ['./location-map.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class LocationMapComponent implements OnInit, OnDestroy {
  readonly settings = signal<HomeFeatureSettings | null>(null);

  private map?: L.Map;
  private markers?: L.LayerGroup;
  private renderTimer?: number;
  private readonly destroyRef = inject(DestroyRef);
  private renderVersion = 0;

  constructor(
    private readonly api: PublicApiService,
    private readonly host: ElementRef<HTMLElement>
  ) {}

  ngOnInit(): void {
    combineLatest({
      settings: this.api.getHomeFeatureSettings(),
      logo: this.api.getSiteLogo()
    }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: ({ settings, logo }) => {
        this.settings.set(settings);
        this.renderMap(settings, logo);
      },
      error: error => console.error('Location map could not be loaded:', error)
    });
  }

  ngOnDestroy(): void {
    this.renderVersion += 1;
    window.clearTimeout(this.renderTimer);
    this.removeMap();
  }

  private removeMap(): void {
    this.map?.remove();
    this.map = undefined;
    this.markers = undefined;
  }

  private renderMap(
    settings: HomeFeatureSettings,
    logo: PublicMediaItem | null
  ): void {
    const version = ++this.renderVersion;
    window.clearTimeout(this.renderTimer);
    if (!settings.mapEnabled) {
      this.removeMap();
      return;
    }
    const locations = this.locations(settings);
    const location: L.LatLngTuple = [locations[0].latitude, locations[0].longitude];
    this.renderTimer = window.setTimeout(() => {
      if (this.destroyRef.destroyed || version !== this.renderVersion) return;
      const container = this.host.nativeElement.querySelector<HTMLElement>('.map-canvas');
      if (!container) return;

      const zoom = Math.max(1, Math.min(19, settings.mapZoom));
      if (this.map && this.map.getContainer() !== container) this.removeMap();
      if (!this.map) {
        this.map = L.map(container, {
          center: location,
          zoom,
          zoomControl: true,
          attributionControl: true
        });

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19, attribution: '&copy; OpenStreetMap contributors'
        }).addTo(this.map);
        this.markers = L.layerGroup().addTo(this.map);
      }
      this.markers!.clearLayers();
      this.map.setView(location, zoom);

      for (const entry of locations) {
        const label = document.createElement('div');
        label.textContent = [entry.name, entry.address].filter(Boolean).join(' — ');
        L.marker([entry.latitude, entry.longitude], { icon: this.createLogoIcon(logo) }).addTo(this.markers!).bindPopup(label);
      }
      if (locations.length > 1) this.map.fitBounds(L.latLngBounds(locations.map(l => [l.latitude, l.longitude] as L.LatLngTuple)), { padding: [45,45], maxZoom: zoom });
      this.map.invalidateSize();
    });
  }

  locations(settings: HomeFeatureSettings) {
    return settings.locations?.length ? settings.locations : [{ name: settings.locationName, address: settings.locationAddress, latitude: settings.latitude, longitude: settings.longitude }];
  }
  directions(location: { latitude: number; longitude: number }): string {
    return 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(location.latitude + ',' + location.longitude);
  }

  focusLocation(location: { latitude: number; longitude: number }): void {
    this.map?.flyTo([location.latitude, location.longitude], this.settings()?.mapZoom ?? 15);
    this.host.nativeElement.querySelector('.map-shell')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  showAllLocations(): void {
    const settings = this.settings();
    if (!settings || !this.map) return;
    this.map.fitBounds(L.latLngBounds(this.locations(settings).map(location => [location.latitude, location.longitude] as L.LatLngTuple)), { padding: [45, 45], maxZoom: settings.mapZoom });
  }

  private createLogoIcon(logo: PublicMediaItem | null): L.DivIcon {
    const pin = document.createElement('div');
    pin.className = 'brand-map-pin';

    if (logo) {
      const image = document.createElement('img');
      image.src = logo.contentUrl;
      image.alt = '';
      image.className = 'brand-map-pin-logo';
      pin.appendChild(image);
    } else {
      const fallback = document.createElement('span');
      fallback.className = 'brand-map-pin-fallback';
      fallback.textContent = '●';
      pin.appendChild(fallback);
    }

    return L.divIcon({
      className: 'brand-map-marker',
      html: pin.outerHTML,
      iconSize: [66, 76],
      iconAnchor: [33, 70]
    });
  }
}
