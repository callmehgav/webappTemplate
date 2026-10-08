import { ChangeDetectionStrategy, Component, EventEmitter, Output, signal, Type } from '@angular/core';
import { NgComponentOutlet } from '@angular/common';
import { AdminAuthService } from '../../../services/admin-auth.service';
import { InsightsComponent } from '../insights/insights.component';
import { SocialLinksSettingsComponent } from '../settings/social-links-settings/social-links-settings.component';
import { EmailSettingsComponent } from '../settings/email-settings/email-settings.component';
import { BrandingSettingsComponent } from '../settings/branding-settings/branding-settings.component';
import { ScheduleSettingsComponent } from '../settings/schedule-settings/schedule-settings.component';
import { GallerySettingsComponent } from '../settings/gallery-settings/gallery-settings.component';
import { HomeFeatureSettingsComponent } from '../settings/home-feature-settings/home-feature-settings.component';
import { ServicesSettingsComponent } from '../settings/services-settings/services-settings.component';
type AdminSectionId = 'insights' | 'schedule' | 'branding' | 'gallery' | 'services' | 'home-features' | 'social-links' | 'email';

interface AdminSection {
  id: AdminSectionId;
  label: string;
  description: string;
  component: Type<unknown>;
}

@Component({
  selector: 'app-admin-panel',
  imports: [NgComponentOutlet],
  templateUrl: './admin-panel.component.html',
  styleUrls: ['./admin-panel.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminPanelComponent {
  @Output() closed = new EventEmitter<void>();

  readonly username = this.adminAuth.username;

  readonly sections: readonly AdminSection[] = [
    {
      id: 'insights',
      label: 'Insights',
      description: 'Traffic and interaction metrics',
      component: InsightsComponent
    },
    {
      id: 'schedule',
      label: 'Scheduler',
      description: 'Lock in events and booking hours',
      component: ScheduleSettingsComponent
    },
    {
      id: 'gallery',
      label: 'Gallery',
      description: 'Upload, caption, and arrange gallery images',
      component: GallerySettingsComponent
    },
    {
      id: 'services',
      label: 'Services',
      description: 'Add service photos and short descriptions',
      component: ServicesSettingsComponent
    },
    {
      id: 'home-features',
      label: 'Home Features',
      description: 'Choose homepage sections, photos, video, and map',
      component: HomeFeatureSettingsComponent
    },
    {
      id: 'social-links',
      label: 'Social Links',
      description: 'Manage public links and profiles',
      component: SocialLinksSettingsComponent
    },
    {
      id: 'branding',
      label: 'Site Styles',
      description: 'Logo, media, backgrounds, typography, and colors',
      component: BrandingSettingsComponent
    },
    {
      id: 'email',
      label: 'Email Delivery',
      description: 'Configure contact form delivery',
      component: EmailSettingsComponent
    }
  ];

  readonly activeSection = signal<AdminSection>(
    this.sections[0]
  );

  constructor(private readonly adminAuth: AdminAuthService) {}

  selectSection(section: AdminSection): void {
    this.activeSection.set(section);
  }

  close(): void {
    this.closed.emit();
  }

  logout(): void {
    this.adminAuth.logout().subscribe({
      next: () => this.closed.emit(),
      error: error =>
        console.error(
          'Administrator logout failed:',
          error
        )
    });
  }
}
