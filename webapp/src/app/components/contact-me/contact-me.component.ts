import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ContactRequest, PublicApiService } from '../../services/public-api.service';

@Component({
  selector: 'app-contact-me',
  imports: [FormsModule],
  templateUrl: './contact-me.component.html',
  styleUrls: ['./contact-me.component.css'],
  changeDetection: ChangeDetectionStrategy.Eager
})
export class ContactMeComponent implements OnInit {
  emailHref = '#contact';
  phoneHref = '';
  phoneNumber = '';
  formData: ContactRequest = this.createEmptyForm();

  loading = false;
  success = false;
  fieldError = false;
  apiError = false;

  constructor(private readonly publicApi: PublicApiService) {}

  ngOnInit(): void {
    this.publicApi.getContactSettings().subscribe({
      next: settings => {
        if (settings.email) {
          this.emailHref = this.createEmailHref(settings.email);
        }
        if (settings.phone) {
          this.phoneNumber = settings.phone;
          this.phoneHref = `tel:${settings.phone.replace(/[^+\d]/g, '')}`;
        }
      },
      error: error =>
        console.error('Contact settings could not be loaded:', error)
    });
  }

  submitForm(): void {
    this.success = false;
    this.fieldError = false;
    this.apiError = false;

    if (
      !this.formData.firstName.trim() ||
      !this.formData.lastName.trim() ||
      !this.formData.email.trim() ||
      !this.formData.message.trim()
    ) {
      this.fieldError = true;
      return;
    }

    this.loading = true;
    this.trackButtonClick('contact-send');

    this.publicApi.submitContact(this.formData).subscribe({
      next: () => {
        this.success = true;
        this.loading = false;
        this.formData = this.createEmptyForm();
      },
      error: error => {
        console.error('Contact request failed:', error);
        this.apiError = true;
        this.loading = false;
      }
    });
  }

  private trackButtonClick(label: string): void {
    this.publicApi.trackInsight('button-clicks').subscribe({
      error: error =>
        console.error('Button-click tracking failed:', error)
    });

    this.publicApi.trackInsight(`click:${label}`).subscribe({
      error: error =>
        console.error(`Click tracking failed for "${label}":`, error)
    });
  }

  private createEmptyForm(): ContactRequest {
    return {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      message: ''
    };
  }

  private createEmailHref(email: string): string {
    const subject = encodeURIComponent(
      'Project Inquiry - [Website Name]'
    );
    const body = encodeURIComponent(
      "Hello,\n\n" +
      "I came across [Website Name] and would like to learn more about working with you.\n\n" +
      "Project details:\n[Tell me a little about your project]\n\n" +
      "Desired timeline:\n[Your preferred timeline]\n\n" +
      "Thanks,\n[Your name]"
    );

    return `mailto:${email}?subject=${subject}&body=${body}`;
  }
}
