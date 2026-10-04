import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ToastService } from '../../../services/toast.service';

@Component({
  selector: 'app-toast',
  templateUrl: './toast.component.html',
  styleUrls: ['./toast.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ToastComponent {
  readonly notices = this.toastService.notices;

  constructor(readonly toastService: ToastService) {}
}
