import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { BehaviorSubject, of } from 'rxjs';
import { LocationMapComponent } from './location-map.component';
import { HomeFeatureSettings, PublicApiService } from '../../services/public-api.service';

describe('Location map updates', () => {
  let fixture: ComponentFixture<LocationMapComponent>;
  let updates: BehaviorSubject<HomeFeatureSettings>;
  const firstLocation = { name: 'First venue', address: 'First address', latitude: 40, longitude: -74 };
  const secondLocation = { name: 'Second venue', address: 'Second address', latitude: 41, longitude: -73 };

  beforeEach(() => {
    updates = new BehaviorSubject({
      mapEnabled: true, mapZoom: 12, locationName: 'Our venues',
      locations: [firstLocation]
    } as HomeFeatureSettings);
    TestBed.configureTestingModule({ imports: [LocationMapComponent], providers: [
      { provide: PublicApiService, useValue: {
        getHomeFeatureSettings: () => updates.asObservable(), getSiteLogo: () => of(null)
      } }
    ] });
    fixture = TestBed.createComponent(LocationMapComponent);
  });

  function render(): void {
    fixture.detectChanges();
    tick();
  }

  it('reuses the map and replaces markers when a location is added or removed', fakeAsync(() => {
    render();
    const pane = fixture.nativeElement.querySelector('.leaflet-map-pane');
    updates.next({ ...updates.value, locations: [firstLocation, secondLocation] });
    render();
    expect(fixture.nativeElement.querySelector('.leaflet-map-pane')).toBe(pane);
    expect(fixture.nativeElement.querySelectorAll('.leaflet-marker-icon').length).toBe(2);
    updates.next({ ...updates.value, locations: [secondLocation] });
    render();
    expect(fixture.nativeElement.querySelectorAll('.leaflet-marker-icon').length).toBe(1);
    fixture.destroy();
  }));

  it('creates a fresh map after the section is hidden and shown again', fakeAsync(() => {
    render();
    updates.next({ ...updates.value, mapEnabled: false });
    render();
    expect(fixture.nativeElement.querySelector('.map-canvas')).toBeNull();
    updates.next({ ...updates.value, mapEnabled: true });
    render();
    expect(fixture.nativeElement.querySelectorAll('.leaflet-map-pane').length).toBe(1);
    fixture.destroy();
  }));

  it('unsubscribes and ignores future settings after navigating away', fakeAsync(() => {
    render();
    fixture.destroy();
    expect(updates.observed).toBeFalse();
    updates.next({ ...updates.value, locations: [firstLocation, secondLocation] });
    tick();
    expect(fixture.nativeElement.querySelector('.leaflet-map-pane')).toBeNull();
  }));

  it('cancels a pending render when destroyed before the map is initialized', fakeAsync(() => {
    fixture.detectChanges();
    fixture.destroy();
    tick();
    expect(fixture.nativeElement.querySelector('.leaflet-map-pane')).toBeNull();
  }));
});
