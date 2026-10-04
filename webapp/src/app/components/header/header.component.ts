import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  HostListener,
  Output,
  signal
} from '@angular/core';
import {
  NavigationEnd,
  Router,
  RouterModule
} from '@angular/router';
import { filter } from 'rxjs/operators';

import { AdminAuthService } from '../../services/admin-auth.service';
import { PublicApiService } from '../../services/public-api.service';
import { AdminLoginComponent } from '../login/admin-login.component';

@Component({
  selector: 'app-header',
  imports: [
    RouterModule,
    AdminLoginComponent
  ],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HeaderComponent {
  @Output() adminRequested = new EventEmitter<void>();

  readonly isLoggedIn = this.adminAuth.isLoggedIn;
  readonly logoUrl = signal('/assets/logos/logoNoWords.png');

  lastScrollTop = 0;
  isVisible = true;
  showDownload = false;
  showLoginPanel = false;

  constructor(
    private readonly router: Router,
    private readonly adminAuth: AdminAuthService,
    private readonly publicApi: PublicApiService
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

    this.router.events
      .pipe(
        filter(
          (event): event is NavigationEnd =>
            event instanceof NavigationEnd
        )
      )
  }

  @HostListener('window:scroll')
  onWindowScroll(): void {
    const scrollTop =
      window.scrollY ||
      document.documentElement.scrollTop;

    this.isVisible = scrollTop <= this.lastScrollTop;
    this.lastScrollTop = Math.max(scrollTop, 0);
  }

  toggleLoginPanel(): void {
    this.showLoginPanel = !this.showLoginPanel;
  }

  handleAdminLoginSuccess(): void {
    this.showLoginPanel = false;
    this.adminRequested.emit();
  }

  openAdminPanel(): void {
    this.adminRequested.emit();
  }
}
