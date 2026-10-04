import {
  ChangeDetectionStrategy,
  Component
} from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-privacy',
  imports: [RouterLink],
  templateUrl: './privacy.component.html',
  styleUrl: './privacy.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PrivacyComponent {
  // Replace these values for each deployed website.
  readonly siteName = 'Website Name';
  readonly operatorName = 'Website Owner';
  readonly contactEmail = 'privacy@example.com';
  readonly operatorLocation = 'Your State and Country';
  readonly lastUpdated = 'October 2, 2026';

  // Keep these synchronized with the deployed website.
  readonly contactFormEnabled = true;
  readonly schedulerEnabled = true;
  readonly optionalAnalyticsEnabled = false;
  readonly sellsOrSharesPersonalInformation = false;
}