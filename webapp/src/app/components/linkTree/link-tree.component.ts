import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  signal
} from '@angular/core';
import {
  PublicApiService,
  PublicSocialLink,
  SocialLinkDisplayStyle,
  SocialPlatform
} from '../../services/public-api.service';

@Component({
  selector: 'app-link-tree',
  imports: [],
  templateUrl: './link-tree.component.html',
  styleUrls: ['./link-tree.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LinkTreeComponent implements OnInit {
  readonly isLoading = signal(true);
  readonly errorMessage = signal<string | null>(null);
  readonly links = signal<PublicSocialLink[]>([]);

  readonly featuredLinks = computed(() =>
    this.links().filter(
      link => link.displayStyle === SocialLinkDisplayStyle.TitleCard
    )
  );

  readonly compactLinks = computed(() =>
    this.links().filter(
      link => link.displayStyle === SocialLinkDisplayStyle.Compact
    )
  );

  constructor(private readonly publicApi: PublicApiService) {}

  readonly sectionText = signal({"socialEyebrow":"Stay connected","socialHeading":"Follow along"});

  ngOnInit(): void {
    this.publicApi.getHomeFeatureSettings().subscribe(settings => this.sectionText.set({socialEyebrow: settings.socialEyebrow,socialHeading: settings.socialHeading}));
    this.publicApi.getSocialLinks().subscribe({
      next: links => {
        this.links.set(links);
        this.isLoading.set(false);
      },
      error: error => {
        this.isLoading.set(false);
        this.errorMessage.set('Social links are unavailable right now.');
        console.error('Social-link fetch failed:', error);
      }
    });
  }

  trackButtonClick(label: string): void {
    const labelKey = this.normalizeMetricKey(label);

    this.publicApi.trackInsight('button-clicks').subscribe({
      error: error =>
        console.error('Button-click tracking failed:', error)
    });

    this.publicApi
      .trackInsight(`click:${labelKey}-link`)
      .subscribe({
        error: error =>
          console.error(
            `Click tracking failed for "${label}":`,
            error
          )
      });
  }

  getIconPath(link: PublicSocialLink): string {
    const specialIcon = this.getSpecialIcon(link.label);

    if (specialIcon) {
      return `/assets/assets/${specialIcon}`;
    }

    const icons: Partial<Record<SocialPlatform, string>> = {
      [SocialPlatform.YouTube]: 'youtube.svg',
      [SocialPlatform.Instagram]: 'instagram.svg',
      [SocialPlatform.TikTok]: 'tiktok.svg',
      [SocialPlatform.AppleMusic]: 'applemusic.svg',
      [SocialPlatform.GitHub]: 'github.svg',
      [SocialPlatform.LinkedIn]: 'linkedin.svg',
      [SocialPlatform.Facebook]: 'facebook.svg'
    };

    return `/assets/assets/${icons[link.platform] ?? 'account.svg'}`;
  }

  getLinkClass(link: PublicSocialLink): string {
    const specialClass = this.getSpecialClass(link.label);

    if (specialClass) {
      return specialClass;
    }

    const classes: Record<SocialPlatform, string> = {
      [SocialPlatform.Custom]: 'custom',
      [SocialPlatform.YouTube]: 'youtube',
      [SocialPlatform.Instagram]: 'instagram',
      [SocialPlatform.TikTok]: 'tiktok',
      [SocialPlatform.AppleMusic]: 'apple-music',
      [SocialPlatform.GitHub]: 'github',
      [SocialPlatform.LinkedIn]: 'linkedin',
      [SocialPlatform.Facebook]: 'facebook',
      [SocialPlatform.Website]: 'website'
    };

    return classes[link.platform];
  }

  getBackgroundImage(link: PublicSocialLink): string | null {
    return link.backgroundMedia
      ? `url("${link.backgroundMedia.contentUrl}")`
      : null;
  }

  getBackgroundPosition(link: PublicSocialLink): string | null {
    const media = link.backgroundMedia;

    return media
      ? `${media.focalPointX}% ${media.focalPointY}%`
      : null;
  }

  getAriaLabel(link: PublicSocialLink): string {
    return `Visit ${link.label}${link.handle ? ` (${link.handle})` : ''}`;
  }

  private getSpecialIcon(label: string): string | null {
    switch (this.normalizeMetricKey(label)) {
      case 'snapchat':
        return 'snapchat.svg';
      case 'wilson':
      case 'willy':
        return 'pet.svg';
      case 'gav-grows':
      case 'lifting':
        return 'dumbbell.svg';
      default:
        return null;
    }
  }

  private getSpecialClass(label: string): string | null {
    switch (this.normalizeMetricKey(label)) {
      case 'snapchat':
        return 'snapchat';
      case 'wilson':
      case 'willy':
        return 'willy';
      case 'gav-grows':
      case 'lifting':
        return 'lifting';
      default:
        return null;
    }
  }

  private normalizeMetricKey(value: string): string {
    return value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
}
