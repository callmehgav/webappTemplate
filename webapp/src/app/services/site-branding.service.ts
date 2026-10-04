import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class SiteBrandingService {
  setFavicon(url: string, contentType: string): void {
    const currentIcon = document.querySelector<HTMLLinkElement>(
      'link[rel="icon"]'
    );
    const favicon = document.createElement('link');

    favicon.rel = 'icon';
    favicon.type = contentType;
    favicon.href = url;

    currentIcon?.remove();
    document.head.appendChild(favicon);
  }
}
