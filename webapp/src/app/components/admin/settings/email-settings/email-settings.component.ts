import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  signal
} from '@angular/core';
import { FormsModule } from '@angular/forms';

import { AdminApiService } from '../../../../services/admin-api.service';

interface EmailSettingsResponse {
  senderName: string;
  senderEmail: string;
  recipientEmail: string;
  hasAppPassword: boolean;
}

interface UpdateEmailSettingsResponse {
  success: boolean;
  hasAppPassword: boolean;
}

@Component({
  selector: 'app-email-settings',
  imports: [FormsModule],
  templateUrl: './email-settings.component.html',
  styleUrls: ['./email-settings.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EmailSettingsComponent implements OnInit {
  readonly isLoading = signal(true);
  readonly isSaving = signal(false);
  readonly hasAppPassword = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);

  senderName = 'Website Contact';
  senderEmail = '';
  recipientEmail = '';
  appPassword = '';

  constructor(private readonly adminApi: AdminApiService) {}

  ngOnInit(): void {
    this.loadSettings();
  }

  loadSettings(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.adminApi
      .get<EmailSettingsResponse>('/admin/email-settings')
      .subscribe({
        next: settings => {
          this.senderName = settings.senderName;
          this.senderEmail = settings.senderEmail;
          this.recipientEmail = settings.recipientEmail;
          this.hasAppPassword.set(settings.hasAppPassword);
          this.appPassword = '';
          this.isLoading.set(false);
        },
        error: error => {
          this.errorMessage.set(
            error.error?.message ??
              'Email settings could not be loaded.'
          );
          this.isLoading.set(false);
        }
      });
  }

  saveSettings(): void {
    this.errorMessage.set(null);
    this.successMessage.set(null);

    if (
      !this.senderName.trim() ||
      !this.senderEmail.trim() ||
      !this.recipientEmail.trim() ||
      (!this.hasAppPassword() && !this.appPassword.trim())
    ) {
      this.errorMessage.set(
        'Complete all fields and provide an app password for the first setup.'
      );
      return;
    }

    this.isSaving.set(true);

    this.adminApi
      .put<UpdateEmailSettingsResponse>(
        '/admin/email-settings',
        {
          senderName: this.senderName.trim(),
          senderEmail: this.senderEmail.trim(),
          recipientEmail: this.recipientEmail.trim(),
          appPassword: this.appPassword.trim() || null
        }
      )
      .subscribe({
        next: response => {
          this.hasAppPassword.set(response.hasAppPassword);
          this.appPassword = '';
          this.isSaving.set(false);
          this.successMessage.set('Email settings saved.');
        },
        error: error => {
          this.isSaving.set(false);
          this.errorMessage.set(
            error.error?.message ??
              'Email settings could not be saved.'
          );
        }
      });
  }
}
