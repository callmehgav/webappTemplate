import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ContentSettingsComponent } from './content-settings.component';
import { AdminApiService } from '../../../../services/admin-api.service';
import { of } from 'rxjs';

describe('ContentSettingsComponent', () => {
  let component: ContentSettingsComponent;
  let fixture: ComponentFixture<ContentSettingsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ContentSettingsComponent],
      providers: [{ provide: AdminApiService, useValue: { get: () => of([{ id: 'about', contentKey: 'about.body', title: 'About', content: 'Our beautiful venue', format: 1, isVisible: true, concurrencyStamp: 'stamp', updatedUtc: '2026-10-08T00:00:00Z' }]) } }]
    })
      .compileComponents();

    fixture = TestBed.createComponent(ContentSettingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('adds bold formatting to selected text and renders it in the preview', () => {
    const input = fixture.nativeElement.querySelector('textarea') as HTMLTextAreaElement;
    input.setSelectionRange(4, 13);
    component.formatSelection('bold');
    fixture.detectChanges();
    expect(component.contentForm.controls.content.value).toBe('Our **beautiful** venue');
    expect(component.contentForm.dirty).toBeTrue();
    expect(fixture.nativeElement.querySelector('.content-preview strong')?.textContent).toBe('beautiful');
  });

  it('applies a heading to the current line and can return it to paragraph text', () => {
    const input = fixture.nativeElement.querySelector('textarea') as HTMLTextAreaElement;
    input.setSelectionRange(0, 0);
    component.formatSelection('h2'); fixture.detectChanges();
    expect(component.contentForm.controls.content.value).toBe('## Our beautiful venue');
    input.setSelectionRange(0, 0);
    component.formatSelection('paragraph'); fixture.detectChanges();
    expect(component.contentForm.controls.content.value).toBe('Our beautiful venue');
    expect(fixture.nativeElement.querySelector('.content-preview .content-body p')?.textContent).toBe('Our beautiful venue');
  });
});
