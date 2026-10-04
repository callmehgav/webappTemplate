import { ChangeDetectionStrategy, Component, HostListener, signal } from '@angular/core';
import { RouterModule } from '@angular/router';
import { PublicApiService, PublicMediaItem } from '../../services/public-api.service';

@Component({
  selector: 'app-hero',
  imports: [RouterModule],
  templateUrl: './hero.component.html',
  styleUrls: ['./hero.component.css'],
  changeDetection: ChangeDetectionStrategy.Eager
})
export class HeroComponent {
  scrolled = false;
  showCTAs = false;
  readonly logoUrl = signal('/assets/logos/logo.png');
  readonly heroMedia = signal<PublicMediaItem | null>(null);

  constructor(private readonly publicApi: PublicApiService) {
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
        this.showCTAs = true;
      },
      error: error =>
      {
        this.showCTAs = true;
        console.error('Hero media fetch failed:', error);
      }
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
