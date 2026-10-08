import { Injectable, OnDestroy } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ContactScrollService implements OnDestroy {
  private cleanup?: () => void;

  /** Follow late section/media layout changes until the visitor interacts. */
  center(): void {
    this.cancel();
    let frame = 0;
    const align = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const contact = document.getElementById('contact');
        if (!contact) return;
        const bounds = contact.getBoundingClientRect();
        if (Math.abs((bounds.top + bounds.bottom) / 2 - window.innerHeight / 2) > 2) {
          contact.scrollIntoView({ behavior: 'instant', block: 'center' });
        }
      });
    };
    const resize = new ResizeObserver(align);
    const mutations = new MutationObserver(align);
    // Body exists before lazy home rendering; the mutation observer covers mounting.
    resize.observe(document.body);
    const home = document.querySelector('app-home');
    if (home) resize.observe(home);
    mutations.observe(document.querySelector('app-root') ?? document.body, { childList: true, subtree: true, characterData: true });
    const stop = () => this.cancel();
    const events = ['wheel', 'touchstart', 'pointerdown', 'keydown'] as const;
    for (const name of events) window.addEventListener(name, stop, { capture: true, passive: true });
    window.addEventListener('load', align, true);
    const timeout = window.setTimeout(stop, 10000);
    this.cleanup = () => {
      cancelAnimationFrame(frame);
      resize.disconnect(); mutations.disconnect();
      clearTimeout(timeout);
      for (const name of events) window.removeEventListener(name, stop, true);
      window.removeEventListener('load', align, true);
    };
    align();
  }

  cancel(): void { this.cleanup?.(); this.cleanup = undefined; }
  ngOnDestroy(): void { this.cancel(); }
}
