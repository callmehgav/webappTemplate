import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { HomeFeatureSettingsComponent } from './home-feature-settings.component';
import { AdminApiService } from '../../../../services/admin-api.service';
import { HomeFeatureSettings, PublicApiService } from '../../../../services/public-api.service';
import { ConfirmationService } from '../../../../services/confirmation.service';
import { ToastService } from '../../../../services/toast.service';

describe('Home feature save scopes', () => {
  let component: HomeFeatureSettingsComponent;
  let api: jasmine.SpyObj<AdminApiService>;
  let toast: jasmine.SpyObj<ToastService>;
  let saved: HomeFeatureSettings;

  beforeEach(() => {
    saved = { servicesEnabled: true, servicesHeading: 'Saved services', galleryHeading: 'Saved gallery', locations: [] } as unknown as HomeFeatureSettings;
    api = jasmine.createSpyObj('AdminApiService', ['get', 'put']);
    api.get.and.callFake((path: string) => of(path === '/home-features' ? structuredClone(saved) : []) as any);
    api.put.and.callFake((path: string, value: any) => of(structuredClone(value)));
    toast = jasmine.createSpyObj('ToastService', ['show']);
    TestBed.configureTestingModule({ providers: [
      HomeFeatureSettingsComponent,
      { provide: AdminApiService, useValue: api },
      { provide: PublicApiService, useValue: { updateHomeFeatureSettingsCache: jasmine.createSpy() } },
      { provide: ConfirmationService, useValue: { confirm: () => Promise.resolve(true) } },
      { provide: ToastService, useValue: toast }
    ] });
    component = TestBed.inject(HomeFeatureSettingsComponent);
    component.ngOnInit();
  });

  it('saves one tile while preserving unsaved edits in other tiles', async () => {
    component.settings()!.servicesHeading = 'New services';
    component.settings()!.galleryHeading = 'Unsaved gallery';
    expect(await component.saveTile(['servicesHeading'])).toBeTrue();
    expect(api.put.calls.mostRecent().args[1]).toEqual(jasmine.objectContaining({ servicesHeading: 'New services', galleryHeading: 'Saved gallery' }));
    expect(component.settings()!.galleryHeading).toBe('Unsaved gallery');
    await component.saveTile(['galleryHeading']);
    expect(api.put.calls.mostRecent().args[1]).toEqual(jasmine.objectContaining({ servicesHeading: 'New services', galleryHeading: 'Unsaved gallery' }));
  });

  it('saves all home settings, pending media, and About content', async () => {
    const media = spyOn(component, 'saveMedia').and.resolveTo(true);
    const content = jasmine.createSpy().and.resolveTo(true);
    (component as any).contentEditor = { saveContent: content };
    component.settings()!.galleryHeading = 'New gallery';
    await component.saveEverything();
    expect(api.put.calls.mostRecent().args[1]).toEqual(jasmine.objectContaining({ galleryHeading: 'New gallery' }));
    expect(media.calls.allArgs()).toEqual([[3], [4]]);
    expect(content).toHaveBeenCalled();
    expect(component.savingEverything()).toBeFalse();
  });

  it('does not report success or overwrite the saved baseline after a failed save', async () => {
    api.put.and.returnValue(throwError(() => ({ error: { message: 'Invalid coordinates' } })));
    component.settings()!.servicesHeading = 'Failed edit';
    expect(await component.saveTile(['servicesHeading'])).toBeFalse();
    api.put.and.callFake((path: string, value: any) => of(value));
    component.settings()!.galleryHeading = 'New gallery';
    await component.saveTile(['galleryHeading']);
    expect(api.put.calls.mostRecent().args[1]).toEqual(jasmine.objectContaining({ servicesHeading: 'Saved services' }));
  });

  it('stops Save everything and clears the busy state when a media upload fails', async () => {
    spyOn(component, 'saveMedia').and.resolveTo(false);
    await component.saveEverything();
    expect(component.savingEverything()).toBeFalse();
    expect(toast.show).not.toHaveBeenCalledWith('Everything in Home Features saved.', 'success');
  });

  it('resets map drags and deleted locations without discarding another tile’s edits', () => {
    const baseline = structuredClone(component.settings()!.locations);
    component.settings()!.galleryHeading = 'Unsaved gallery';
    component.settings()!.locations[0].latitude = 65;
    component.addLocation();
    component.resetLocations();
    expect(component.settings()!.locations).toEqual(baseline);
    expect(component.settings()!.galleryHeading).toBe('Unsaved gallery');
    expect(component.mapResetVersion()).toBe(1);
    expect(api.put).not.toHaveBeenCalled();
  });
});
