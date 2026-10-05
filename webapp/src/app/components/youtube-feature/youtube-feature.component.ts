import { ChangeDetectionStrategy, Component, OnInit, signal } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { HomeFeatureSettings, PublicApiService } from '../../services/public-api.service';

@Component({
  selector: 'app-youtube-feature',
  templateUrl: './youtube-feature.component.html',
  styleUrls: ['./youtube-feature.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class YoutubeFeatureComponent implements OnInit {
  readonly settings = signal<HomeFeatureSettings | null>(null);
  readonly embedUrl = signal<SafeResourceUrl | null>(null);

  constructor(
    private readonly api: PublicApiService,
    private readonly sanitizer: DomSanitizer
  ) {}

  ngOnInit(): void {
    this.api.getHomeFeatureSettings().subscribe({
      next: settings => {
        this.settings.set(settings);
        const videoId = this.videoId(settings.youTubeUrl);
        this.embedUrl.set(videoId
          ? this.sanitizer.bypassSecurityTrustResourceUrl(
              `https://www.youtube-nocookie.com/embed/${encodeURIComponent(videoId)}?rel=0`
            )
          : null);
      },
      error: error => console.error('YouTube feature could not be loaded:', error)
    });
  }

  private videoId(value: string): string | null {
    try {
      const url = new URL(value);
      const host = url.hostname.replace(/^www\./, '').toLowerCase();
      let id = host === 'youtu.be'
        ? url.pathname.split('/').filter(Boolean)[0]
        : url.searchParams.get('v');

      if (!id) {
        const parts = url.pathname.split('/').filter(Boolean);
        if (['embed', 'shorts', 'live'].includes(parts[0])) id = parts[1];
      }

      return id && /^[A-Za-z0-9_-]{6,20}$/.test(id) ? id : null;
    } catch {
      return null;
    }
  }
}
