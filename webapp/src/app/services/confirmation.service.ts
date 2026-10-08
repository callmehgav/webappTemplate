import { ApplicationRef, createComponent, EnvironmentInjector, Injectable } from '@angular/core';
import { ConfirmDialogComponent } from '../components/ui/confirm-dialog/confirm-dialog.component';

@Injectable({ providedIn: 'root' })
export class ConfirmationService {
  constructor(private app: ApplicationRef, private injector: EnvironmentInjector) {}

  confirm(message: string, title = 'Confirm action', confirmLabel = 'Confirm'): Promise<boolean> {
    return new Promise(resolve => {
      const host = document.createElement('app-confirm-dialog');
      document.body.appendChild(host);
      const ref = createComponent(ConfirmDialogComponent, { environmentInjector: this.injector, hostElement: host });
      ref.setInput('title', title);
      ref.setInput('message', message);
      ref.setInput('confirmLabel', confirmLabel);
      const finish = (answer: boolean) => {
        this.app.detachView(ref.hostView);
        ref.destroy();
        host.remove();
        resolve(answer);
      };
      ref.instance.confirmed.subscribe(() => finish(true));
      ref.instance.cancelled.subscribe(() => finish(false));
      this.app.attachView(ref.hostView);
      ref.changeDetectorRef.detectChanges();
    });
  }
}
