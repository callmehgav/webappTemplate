import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  signal
} from '@angular/core';
import { FormsModule } from '@angular/forms';

import { AdminApiService } from '../../../../services/admin-api.service';
import { PublicApiService } from '../../../../services/public-api.service';

interface EmailSettingsResponse {
  senderName: string;
  senderEmail: string;
  recipientEmail: string;
  publicPhoneNumber: string;
  hasAppPassword: boolean;
}

interface UpdateEmailSettingsResponse {
  success: boolean;
  hasAppPassword: boolean;
  email: string;
  phone: string;
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
  publicPhoneNumber = '';
  appPassword = '';

  constructor(
    private readonly adminApi: AdminApiService,
    private readonly publicApi: PublicApiService
  ) {}

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
          this.publicPhoneNumber = settings.publicPhoneNumber;
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

  saveSettings(scope: 'sender' | 'destination' = 'sender'): void {
    this.errorMessage.set(null);
    this.successMessage.set(null);

    if (
      scope === 'sender' && ( !this.senderName.trim() ||
      !this.senderEmail.trim() ||
      (!this.hasAppPassword() && !this.appPassword.trim()))
    ) {
      this.errorMessage.set(
        'Enter the sender name, email, and an app password for the first setup.'
      );
      return;
    }

    this.isSaving.set(true);

    this.adminApi
      .put<UpdateEmailSettingsResponse>(
        '/admin/email-settings',
        {
          scope,
          senderName: this.senderName.trim(),
          senderEmail: this.senderEmail.trim(),
          recipientEmail: this.recipientEmail.trim(),
          publicPhoneNumber: this.publicPhoneNumber.trim(),
          appPassword: scope === 'sender' ? this.appPassword.trim() || null : null
        }
      )
      .subscribe({
        next: response => {
          this.publicApi.updateContactSettingsCache({
            email: response.email,
            phone: response.phone
          });
          this.hasAppPassword.set(response.hasAppPassword);
          if (scope === 'sender') this.appPassword = '';
          this.isSaving.set(false);
          this.successMessage.set(scope === 'sender' ? 'Sender account saved.' : 'Delivery destination saved.');
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
