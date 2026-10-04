import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SocialLinksSettingsComponent } from './social-links-settings.component';

describe('SocialLinksSettingsComponent', () => {
  let component: SocialLinksSettingsComponent;
  let fixture: ComponentFixture<SocialLinksSettingsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SocialLinksSettingsComponent]
    })
      .compileComponents();

    fixture = TestBed.createComponent(SocialLinksSettingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
