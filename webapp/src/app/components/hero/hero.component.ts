import { ChangeDetectionStrategy, Component, HostListener, signal } from '@angular/core';
import { RouterModule } from '@angular/router';
import { PublicApiService, PublicMediaItem } from '../../services/public-api.service';
import { ScheduleApiService } from '../../services/schedule-api.service';

@Component({
  selector: 'app-hero',
  imports: [RouterModule],
  templateUrl: './hero.component.html',
  styleUrls: ['./hero.component.css'],
  changeDetection: ChangeDetectionStrategy.Eager
})
export class HeroComponent {
  scrolled = false;
  readonly showCTAs = signal(false);
  readonly logoUrl = signal('/assets/logos/logo.png');
  readonly heroMedia = signal<PublicMediaItem | null>(null);
  readonly bookingLabel = signal('Request an appointment');

  constructor(
    private readonly publicApi: PublicApiService,
    scheduleApi: ScheduleApiService
  ) {
    this.publicApi.getSiteLogo().subscribe({
      next: logo => {
        if (logo) {
          this.logoUrl.set(logo.contentUrl);
        }
      },
      error: error =>
        console.error('Site logo fetch failed:', error)
    });

    this.publicApi.getHeroMedia().subscribe({
      next: media => {
        this.heroMedia.set(media);
        this.showCTAs.set(true);
      },
      error: error =>
      {
        this.showCTAs.set(true);
        console.error('Hero media fetch failed:', error);
      }
    });

    scheduleApi.getSettings().subscribe({
      next: settings => this.bookingLabel.set(settings.bookingButtonLabel)
    });
  }

  isVideo(media: PublicMediaItem): boolean {
    return media.contentType.startsWith('video/');
  }

  @HostListener('window:scroll')
  onWindowScroll(): void {
    this.scrolled = window.scrollY > 50;
  }

  scrollToAbout(): void {
    const element =
      document.getElementById('app-about-section');

    element?.scrollIntoView({
      behavior: 'smooth'
    });
  }
}
