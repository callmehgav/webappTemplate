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

  applyBackground(
    backgroundColor: string,
    imageUrl: string | null,
    useAmbientBackground = true
  ): void {
    const root = document.documentElement;
    root.style.setProperty('--site-background-color', backgroundColor);
    root.style.setProperty(
      '--site-background-image',
      imageUrl ? `url("${this.escapeCssUrl(imageUrl)}")` : 'none'
    );

    const [firstBloom, secondBloom] = useAmbientBackground
      ? [
          this.createAmbientColor(backgroundColor, -22, 14, 9, 0.22),
          this.createAmbientColor(backgroundColor, 34, 18, 5, 0.16)
        ]
      : ['transparent', 'transparent'];

    root.style.setProperty('--site-ambient-first', firstBloom);
    root.style.setProperty('--site-ambient-second', secondBloom);
    root.style.setProperty(
      '--site-ambient-light',
      useAmbientBackground ? 'rgba(255, 255, 255, 0.2)' : 'transparent'
    );
  }

  applyTypography(settings: {
    buttonColor?: string; buttonTextColor?: string; pFontFamily?: string; pFontSize?: number; pColor?: string;
    h1FontFamily: string; h1FontSize: number; h1Color: string;
    h2FontFamily: string; h2FontSize: number; h2Color: string;
    h3FontFamily: string; h3FontSize: number; h3Color: string;
  }): void {
    const root = document.documentElement;
    root.style.setProperty('--button-color', settings.buttonColor ?? '#356bd6');
    root.style.setProperty('--button-text-color', settings.buttonTextColor ?? '#ffffff');
    root.style.setProperty('--accent', settings.buttonColor ?? '#356bd6');
    root.style.setProperty('--accent-strong', settings.buttonColor ?? '#356bd6');
    root.style.setProperty('--p-font-family', this.fontStack(settings.pFontFamily ?? 'Arial'));
    root.style.setProperty('--p-font-size', (settings.pFontSize ?? 16) + 'px');
    root.style.setProperty('--p-color', settings.pColor ?? '#514252');
    root.style.setProperty('--button-color-rgb', [1,3,5].map(i => parseInt((settings.buttonColor ?? '#356bd6').slice(i,i+2),16)).join(', '));
    root.style.setProperty('--h1-font-family', this.fontStack(settings.h1FontFamily));
    root.style.setProperty('--h1-font-size', `${settings.h1FontSize}px`);
    root.style.setProperty('--h1-color', settings.h1Color);
    root.style.setProperty('--h2-font-family', this.fontStack(settings.h2FontFamily));
    root.style.setProperty('--h2-font-size', `${settings.h2FontSize}px`);
    root.style.setProperty('--h2-color', settings.h2Color);
    root.style.setProperty('--h3-font-family', this.fontStack(settings.h3FontFamily));
    root.style.setProperty('--h3-font-size', `${settings.h3FontSize}px`);
    root.style.setProperty('--h3-color', settings.h3Color);
  }

  private fontStack(font: string): string {
    if (font === 'system-ui') return 'system-ui, sans-serif';
    const safe = font.replace(/["'\\]/g, '');
    return `"${safe}", Georgia, serif`;
  }

  private escapeCssUrl(value: string): string {
    return value.replace(/["\\\n\r\f]/g, character => `\\${character}`);
  }

  private createAmbientColor(
    hex: string,
    hueShift: number,
    saturationShift: number,
    lightnessShift: number,
    alpha: number
  ): string {
    const normalized = /^#[0-9a-f]{6}$/i.test(hex) ? hex.slice(1) : 'e9eef5';
    const red = parseInt(normalized.slice(0, 2), 16) / 255;
    const green = parseInt(normalized.slice(2, 4), 16) / 255;
    const blue = parseInt(normalized.slice(4, 6), 16) / 255;
    const maximum = Math.max(red, green, blue);
    const minimum = Math.min(red, green, blue);
    const delta = maximum - minimum;
    let hue = 0;

    if (delta !== 0) {
      if (maximum === red) hue = 60 * (((green - blue) / delta) % 6);
      else if (maximum === green) hue = 60 * ((blue - red) / delta + 2);
      else hue = 60 * ((red - green) / delta + 4);
    }

    const lightness = (maximum + minimum) / 2;
    const saturation = delta === 0
      ? 0
      : delta / (1 - Math.abs(2 * lightness - 1));
    const shiftedHue = (hue + hueShift + 360) % 360;
    const shiftedSaturation = Math.min(88, Math.max(22, saturation * 100 + saturationShift));
    const shiftedLightness = Math.min(88, Math.max(24, lightness * 100 + lightnessShift));

    return `hsla(${shiftedHue.toFixed(1)}, ${shiftedSaturation.toFixed(1)}%, ${shiftedLightness.toFixed(1)}%, ${alpha})`;
  }
}
