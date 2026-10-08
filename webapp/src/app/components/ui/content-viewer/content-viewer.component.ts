import { ChangeDetectionStrategy, Component, computed, input, ViewEncapsulation } from '@angular/core';
import { renderContent } from './content-renderer';

@Component({
  selector: 'app-content-viewer',
  template: '<div class="content-body" [innerHTML]="html()"></div>',
  styles: [`
    app-content-viewer { display: block; min-width: 0; overflow-wrap: anywhere; }
    app-content-viewer .content-body p { margin: 0 0 1em; line-height: 1.75; }
    app-content-viewer .content-body h1 { font: 600 var(--h1-font-size, 88px)/1.1 var(--h1-font-family); color: var(--h1-color); }
    app-content-viewer .content-body h2 { font: 600 var(--h2-font-size, 58px)/1.15 var(--h2-font-family); color: var(--h2-color); }
    app-content-viewer .content-body h3 { font: 600 var(--h3-font-size, 30px)/1.2 var(--h3-font-family); color: var(--h3-color); }
    app-content-viewer .content-body :is(h1,h2,h3,h4,h5,h6) { margin: 0 0 .5em; }
    app-content-viewer .content-body > :last-child { margin-bottom: 0; }
    @media(max-width: 640px) {
      app-content-viewer .content-body h1 { font-size: min(var(--h1-font-size), 3.75rem); }
      app-content-viewer .content-body h2 { font-size: min(var(--h2-font-size), 3rem); }
      app-content-viewer .content-body h3 { font-size: min(var(--h3-font-size), 2rem); }
    }
  `],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ContentViewerComponent {
  readonly content = input('');
  readonly format = input(1);
  readonly html = computed(() => renderContent(this.content(), this.format()));
}
