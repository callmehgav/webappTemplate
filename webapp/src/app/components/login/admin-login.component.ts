import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Output
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { AdminAuthService } from '../../services/admin-auth.service';

@Component({
  selector: 'app-admin-login',
  imports: [FormsModule],
  templateUrl: './admin-login.component.html',
  styleUrls: ['./admin-login.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminLoginComponent {
  @Output() closed = new EventEmitter<void>();
  @Output() loginSuccess = new EventEmitter<void>();

  username = '';
  password = '';
  isSubmitting = false;
  loginFailed = false;

  constructor(
    private readonly adminAuth: AdminAuthService
  ) {}

  login(): void {
    if (
      !this.username.trim() ||
      !this.password
    ) {
      this.showLoginError();
      return;
    }

    this.isSubmitting = true;
    this.loginFailed = false;

    this.adminAuth
      .login(
        this.username.trim(),
        this.password
      )
      .pipe(
        finalize(() => {
          this.isSubmitting = false;
        })
      )
      .subscribe({
        next: () => {
          this.password = '';
          this.loginSuccess.emit();
          this.closed.emit();
        },
        error: () => {
          this.showLoginError();
        }
      });
  }

  close(): void {
    this.closed.emit();
  }

  private showLoginError(): void {
    this.loginFailed = true;

    setTimeout(() => {
      this.loginFailed = false;
    }, 1500);
  }
}