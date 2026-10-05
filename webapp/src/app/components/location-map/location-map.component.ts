import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  signal,
  ViewEncapsulation
} from '@angular/core';
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
  readonly openMapUrl = signal('');

  private map?: L.Map;
  private renderVersion = 0;

  constructor(
    private readonly api: PublicApiService,
    private readonly host: ElementRef<HTMLElement>
  ) {}

  ngOnInit(): void {
    combineLatest({
      settings: this.api.getHomeFeatureSettings(),
      logo: this.api.getSiteLogo()
    }).subscribe({
      next: ({ settings, logo }) => {
        this.settings.set(settings);
        const destination = settings.locationAddress.trim() ||
          `${settings.latitude},${settings.longitude}`;
        this.openMapUrl.set(
          `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(destination)}`
        );
        void this.renderMap(settings, logo);
      },
      error: error => console.error('Location map could not be loaded:', error)
    });
  }

  ngOnDestroy(): void {
    this.renderVersion += 1;
    this.map?.remove();
  }

  private async renderMap(
    settings: HomeFeatureSettings,
    logo: PublicMediaItem | null
  ): Promise<void> {
    const version = ++this.renderVersion;
    const location = await this.resolveLocation(settings);
    if (version !== this.renderVersion) return;

    window.setTimeout(() => {
      if (version !== this.renderVersion) return;
      const container = this.host.nativeElement.querySelector<HTMLElement>('.map-canvas');
      if (!container) return;

      this.map?.remove();
      const zoom = Math.max(1, Math.min(19, settings.mapZoom));
      this.map = L.map(container, {
        center: location,
        zoom,
        zoomControl: true,
        attributionControl: false
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19
      }).addTo(this.map);

      L.marker(location, { icon: this.createLogoIcon(logo) }).addTo(this.map);
      this.map.invalidateSize();
    });
  }

  private async resolveLocation(settings: HomeFeatureSettings): Promise<L.LatLngTuple> {
    const fallback: L.LatLngTuple = [settings.latitude, settings.longitude];
    const address = settings.locationAddress.trim();
    if (!address) return fallback;

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${encodeURIComponent(address)}`,
        { headers: { Accept: 'application/json' } }
      );
      if (!response.ok) return fallback;

      const matches = await response.json() as Array<{ lat: string; lon: string }>;
      const latitude = Number(matches[0]?.lat);
      const longitude = Number(matches[0]?.lon);
      return Number.isFinite(latitude) && Number.isFinite(longitude)
        ? [latitude, longitude]
        : fallback;
    } catch {
      return fallback;
    }
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
