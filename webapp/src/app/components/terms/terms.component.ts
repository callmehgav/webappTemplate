import {
  ChangeDetectionStrategy,
  Component
} from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-terms',
  imports: [RouterLink],
  templateUrl: './terms.component.html',
  styleUrl: './terms.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TermsComponent {
  // Replace these values for each deployed website.
  readonly siteName = 'Website Name';
  readonly operatorName = 'Website Owner';
  readonly contactEmail = 'contact@example.com';
  readonly governingLocation = 'Your State and Country';
  readonly lastUpdated = 'October 2, 2026';

  // Keep this synchronized with the public feature settings later.
  readonly schedulerEnabled = true;
}