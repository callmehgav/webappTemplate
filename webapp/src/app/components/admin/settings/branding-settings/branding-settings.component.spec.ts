import { TestBed } from '@angular/core/testing';
import { BrandingSettingsComponent } from './branding-settings.component';
import { AdminApiService } from '../../../../services/admin-api.service';
import { PublicApiService, SiteBrandingSettings } from '../../../../services/public-api.service';
import { SiteBrandingService } from '../../../../services/site-branding.service';
import { ConfirmationService } from '../../../../services/confirmation.service';

describe('Typography reset', () => {
  it('previews MOV uploads as video even when the browser omits the MIME type', () => {
    TestBed.configureTestingModule({ providers: [
      BrandingSettingsComponent,
      { provide: AdminApiService, useValue: {} },
      { provide: PublicApiService, useValue: {} },
      { provide: SiteBrandingService, useValue: {} },
      { provide: ConfirmationService, useValue: {} }
    ] });
    const component = TestBed.inject(BrandingSettingsComponent);
    component.selectedHeroFile.set(new File(['video'], 'hero.MOV'));
    expect(component.displayedHeroMediaIsVideo).toBeTrue();
    component.selectedHeroFile.set(new File(['image'], 'hero.png', { type: 'image/png' }));
    expect(component.displayedHeroMediaIsVideo).toBeFalse();
  });

  it('restores saved fonts and colors without saving or changing the page background', () => {
    const put = jasmine.createSpy();
    TestBed.configureTestingModule({ providers: [
      BrandingSettingsComponent,
      { provide: AdminApiService, useValue: { put } },
      { provide: PublicApiService, useValue: {} },
      { provide: SiteBrandingService, useValue: {} },
      { provide: ConfirmationService, useValue: {} }
    ] });
    const component = TestBed.inject(BrandingSettingsComponent);
    const saved = {
      h1FontFamily: 'Georgia', h1FontSize: 88, h1Color: '#111111',
      h2FontFamily: 'Arial', h2FontSize: 58, h2Color: '#222222',
      h3FontFamily: 'Verdana', h3FontSize: 30, h3Color: '#333333',
      pFontFamily: 'Tahoma', pFontSize: 18, pColor: '#444444',
      buttonColor: '#445566', buttonTextColor: '#ffffff'
    } as SiteBrandingSettings;
    (component as any).applyTypographySignals(saved);
    component.h1FontFamily.set('Impact'); component.pFontSize.set(30); component.buttonColor.set('#ff0000');
    component.backgroundColor.set('#eeeeee');
    component.resetTypography();
    expect(component.h1FontFamily()).toBe('Georgia');
    expect(component.pFontSize()).toBe(18);
    expect(component.buttonColor()).toBe('#445566');
    expect(component.backgroundColor()).toBe('#eeeeee');
    expect(put).not.toHaveBeenCalled();
  });
});
