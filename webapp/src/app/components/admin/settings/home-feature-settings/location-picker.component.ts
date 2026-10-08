import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, input, OnChanges, OnDestroy, output, ViewChild } from '@angular/core';
import * as L from 'leaflet';

@Component({
  selector: 'app-location-picker',
  template: '<div #canvas class="picker" aria-label="Click the map or drag the pin to choose coordinates"></div><small>Click the map or drag the pin to set latitude and longitude.</small>',
  styles: ['.picker { height: 280px; border-radius: 10px; overflow: hidden; } small { display: block; margin-top: 8px; }'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LocationPickerComponent implements AfterViewInit, OnChanges, OnDestroy {
  readonly latitude = input(0);
  readonly longitude = input(0);
  readonly resetVersion = input(0);
  readonly coordinates = output<{ latitude: number; longitude: number }>();
  @ViewChild('canvas') canvas!: ElementRef<HTMLElement>;
  private map?: L.Map;
  private pin?: L.Marker;
  private observer?: ResizeObserver;
  ngAfterViewInit(): void {
    this.map = L.map(this.canvas.nativeElement).setView(this.position(), 12);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '&copy; OpenStreetMap contributors' }).addTo(this.map);
    this.pin = L.marker(this.position(), { draggable: true, icon: L.divIcon({ className: '', html: '<span style="display:block;background:var(--button-color,#356bd6);border:3px solid white;border-radius:50%;width:24px;height:24px;box-shadow:0 2px 8px #333"></span>', iconSize: [24,24], iconAnchor: [12,12] }) }).addTo(this.map);
    const update = (point: L.LatLng) => { this.pin?.setLatLng(point); this.coordinates.emit({ latitude: +point.lat.toFixed(6), longitude: +point.lng.toFixed(6) }); };
    this.map.on('click', (event: L.LeafletMouseEvent) => update(event.latlng.wrap()));
    this.pin.on('dragend', () => update(this.pin!.getLatLng().wrap()));
    this.observer = new ResizeObserver(() => this.map?.invalidateSize());
    this.observer.observe(this.canvas.nativeElement);
  }
  ngOnChanges(changes: import('@angular/core').SimpleChanges): void {
    if (this.map && this.pin) {
      const point = this.position(); this.pin.setLatLng(point);
      if (changes['resetVersion']) this.map.setView(point, 12);
      else this.map.panTo(point);
    }
  }
  ngOnDestroy(): void { this.observer?.disconnect(); this.map?.remove(); }
  private position(): L.LatLngTuple { return [Math.max(-90,Math.min(90,this.latitude() || 0)), Math.max(-180,Math.min(180,this.longitude() || 0))]; }
}
