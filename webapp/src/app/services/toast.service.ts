import { Injectable, signal } from '@angular/core';

export type ToastKind = 'success' | 'error' | 'warning' | 'info';

export interface ToastNotice {
  id: number;
  kind: ToastKind;
  message: string;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  readonly notices = signal<ToastNotice[]>([]);
  private nextId = 1;

  show(message: string, kind: ToastKind = 'info', duration = 5000): void {
    const notice = { id: this.nextId++, kind, message };
    this.notices.update(items => [...items, notice]);
    window.setTimeout(() => this.dismiss(notice.id), duration);
  }

  dismiss(id: number): void {
    this.notices.update(items => items.filter(item => item.id !== id));
  }
}
