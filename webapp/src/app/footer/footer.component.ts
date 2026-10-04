import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { PublicApiService } from '../services/public-api.service';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.css'],
  changeDetection: ChangeDetectionStrategy.Eager
})
export class FooterComponent implements OnInit {
  readonly currentYear = new Date().getFullYear();
  readonly developerWebsiteUrl =
    'https://gavs-nexus.com';


  constructor(private readonly publicApi: PublicApiService) {}

  ngOnInit(): void {
  }

  trackButtonClick(label: string): void {
    const labelKey = this.normalizeMetricKey(label);

    this.publicApi.trackInsight('button-clicks').subscribe({
      error: error =>
        console.error('Button-click tracking failed:', error)
    });

    this.publicApi
      .trackInsight(`click:${labelKey}-link`)
      .subscribe({
        error: error =>
          console.error(
            `Click tracking failed for "${label}":`,
            error
          )
      });
  }

  private normalizeMetricKey(value: string): string {
    return value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

}
