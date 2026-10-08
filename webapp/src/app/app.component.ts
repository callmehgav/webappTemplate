import { ChangeDetectionStrategy, Component, HostListener, OnInit } from '@angular/core';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { filter } from 'rxjs/operators';
import { AdminAuthService } from './services/admin-auth.service';
import { PublicApiService } from './services/public-api.service';
import { SiteBrandingService } from './services/site-branding.service';
import { ContactScrollService } from './services/contact-scroll.service';
import { HeaderComponent } from './components/header/header.component';
import { AdminPanelComponent } from './components/admin/admin-panel/admin-panel.component';
import { FooterComponent } from './footer/footer.component';
import { ToastComponent } from './components/ui/toast/toast.component';

@Component({
  selector: 'app-root',
  imports: [
    RouterModule,
    HeaderComponent,
    AdminPanelComponent,
    FooterComponent,
    ToastComponent
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppComponent implements OnInit {
  showHeader = true;
  isAdminPanelOpen = false;

  constructor(
    private readonly router: Router,
    private readonly adminAuth: AdminAuthService,
    private readonly publicApi: PublicApiService,
    private readonly siteBranding: SiteBrandingService,
    private readonly contactScroll: ContactScrollService
  ) {}

  ngOnInit(): void {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'auto'
    });

    // Restore an existing administrator session after a refresh.
    this.adminAuth.checkSession().subscribe();

    this.publicApi.getSiteLogo().subscribe({
      next: logo => {
        if (logo) {
          this.siteBranding.setFavicon(
            logo.contentUrl,
            logo.contentType
          );
        }
      },
      error: error =>
        console.error('Site favicon fetch failed:', error)
    });

    this.publicApi.getBrandingSettings().subscribe({
      next: settings => {
        this.siteBranding.applyBackground(
          settings.backgroundColor,
          settings.useBackgroundImage
            ? settings.backgroundImage?.contentUrl ?? null
            : null,
          settings.useAmbientBackground
        );
        this.siteBranding.applyTypography(settings);
      },
      error: error =>
        console.error('Site background fetch failed:', error)
    });

    this.trackVisit();

    this.router.events
      .pipe(
        filter(
          (event): event is NavigationEnd =>
            event instanceof NavigationEnd
        )
      )
      .subscribe(event => {
        this.contactScroll.cancel();
        const fragment = this.router.parseUrl(event.urlAfterRedirects).fragment;
        if (fragment) {
          window.setTimeout(() => {
            if (this.router.parseUrl(this.router.url).fragment !== fragment) return;
            if (fragment === 'contact') { this.contactScroll.center(); return; }
            document.getElementById(fragment)?.scrollIntoView({
              behavior: 'smooth',
              block: fragment === 'contact' ? 'center' : 'start'
            });
          });
          this.trackPageView(event.urlAfterRedirects);
          return;
        }

        window.scrollTo({
          top: 0,
          left: 0,
          behavior: 'auto'
        });

        this.trackPageView(event.urlAfterRedirects);
      });
  }

  @HostListener('document:click', ['$event'])
  onContactLink(event: MouseEvent): void {
    const anchor = (event.target as Element)?.closest?.('a');
    if (!anchor || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || event.button !== 0) return;
    const destination = new URL(anchor.href, window.location.href);
    if (destination.origin !== window.location.origin || destination.hash !== '#contact') return;
    if (destination.pathname === window.location.pathname) {
      window.setTimeout(() => this.contactScroll.center());
    }
  }

  openAdminPanel(): void {
    if (!this.adminAuth.isLoggedIn()) {
      return;
    }

    this.isAdminPanelOpen = true;
  }

  closeAdminPanel(): void {
    this.isAdminPanelOpen = false;
  }

  private trackVisit(): void {
    this.trackMetric('visitors');

    const referrer = this.getReferrerKey(document.referrer);
    this.trackMetric(`referrer:${referrer}`);
  }

  private trackPageView(route: string): void {
    this.trackMetric('page-views');

    const routeKey = this.normalizeMetricKey(route);

    if (routeKey) {
      this.trackMetric(`page:${routeKey}`);
    }
  }

  private trackMetric(
    key: string,
    amount = 1
  ): void {
    this.publicApi.trackInsight(key, amount).subscribe({
      error: error =>
        console.error(
          `Insight tracking failed for "${key}":`,
          error
        )
    });
  }

  private getReferrerKey(referrer: string): string {
    if (!referrer) {
      return 'direct';
    }

    const value = referrer.toLowerCase();

    if (value.includes('instagram.com')) return 'instagram';
    if (value.includes('google.com')) return 'google';
    if (value.includes('facebook.com')) return 'facebook';
    if (value.includes('youtube.com')) return 'youtube';
    if (value.includes('linkedin.com')) return 'linkedin';
    if (value.includes('tiktok.com')) return 'tiktok';

    return 'other';
  }

  private normalizeMetricKey(value: string): string {
    return value
      .trim()
      .toLowerCase()
      .replace(/^\/+|\/+$/g, '')
      .replace(/[^a-z0-9/-]+/g, '-')
      .replace(/\//g, ':');
  }

}
