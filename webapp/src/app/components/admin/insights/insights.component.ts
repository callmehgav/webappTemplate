import { ChangeDetectionStrategy, Component, OnInit, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { AdminApiService } from '../../../services/admin-api.service';

type InsightSummary = Record<string, number>;

interface InsightCard {
  key: string;
  title: string;
  value: number;
}

interface InsightBreakdown {
  key: string;
  label: string;
  count: number;
}

@Component({
  selector: 'app-insights',
  imports: [],
  templateUrl: './insights.component.html',
  styleUrls: ['./insights.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class InsightsComponent implements OnInit {
  readonly isLoading = signal(true);
  readonly errorMessage = signal<string | null>(null);

  readonly insightCards = signal<InsightCard[]>([]);
  readonly referrers = signal<InsightBreakdown[]>([]);
  readonly clickLabels = signal<InsightBreakdown[]>([]);
  readonly pageViews = signal<InsightBreakdown[]>([]);

  private readonly preferredMetricOrder = [
    'visitors',
    'page-views',
    'button-clicks',
    'login-attempts',
    'invalid-login-attempts',
    'active-sessions'
  ];

  private readonly metricLabels: Record<string, string> = {
    'visitors': 'Visitors',
    'page-views': 'Page Views',
    'button-clicks': 'Button Clicks',
    'login-attempts': 'Login Attempts',
    'invalid-login-attempts': 'Invalid Login Attempts',
    'active-sessions': 'Active Sessions'
  };

  constructor(private readonly adminApi: AdminApiService) {}

  ngOnInit(): void {
    this.loadInsights();
  }

  loadInsights(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.adminApi.get<InsightSummary>('/insights/summary').subscribe({
      next: summary => {
        this.populateInsights(summary);
        this.isLoading.set(false);
      },
      error: (error: HttpErrorResponse) => {
        this.isLoading.set(false);

        if (error.status === 401) {
          this.errorMessage.set(
            'Your administrator session has expired. Log in again.'
          );
          return;
        }

        this.errorMessage.set(
          'Insights could not be loaded. Please try again.'
        );

        console.error('Insights fetch failed:', error);
      }
    });
  }

  getBarWidth(
    count: number,
    dataset: readonly InsightBreakdown[]
  ): number {
    const maximum = Math.max(
      ...dataset.map(item => item.count),
      1
    );

    return (count / maximum) * 100;
  }

  private populateInsights(summary: InsightSummary): void {
    const entries = Object.entries(summary);

    const generalMetrics = entries
      .filter(([key]) =>
        !key.startsWith('referrer:') &&
        !key.startsWith('click:') &&
        !key.startsWith('page:')
      )
      .sort(([firstKey], [secondKey]) =>
        this.compareMetricKeys(firstKey, secondKey)
      )
      .map(([key, value]) => ({
        key,
        title: this.metricLabels[key] ?? this.formatLabel(key),
        value
      }));

    this.insightCards.set(generalMetrics);
    this.referrers.set(
      this.createBreakdown(entries, 'referrer:')
    );
    this.clickLabels.set(
      this.createBreakdown(entries, 'click:')
    );
    this.pageViews.set(
      this.createBreakdown(entries, 'page:')
    );
  }

  private createBreakdown(
    entries: [string, number][],
    prefix: string
  ): InsightBreakdown[] {
    return entries
      .filter(([key]) => key.startsWith(prefix))
      .map(([key, count]) => ({
        key,
        label: this.formatLabel(key.slice(prefix.length)),
        count
      }))
      .sort((first, second) => second.count - first.count);
  }

  private compareMetricKeys(
    firstKey: string,
    secondKey: string
  ): number {
    const firstIndex =
      this.preferredMetricOrder.indexOf(firstKey);

    const secondIndex =
      this.preferredMetricOrder.indexOf(secondKey);

    if (firstIndex === -1 && secondIndex === -1) {
      return firstKey.localeCompare(secondKey);
    }

    if (firstIndex === -1) {
      return 1;
    }

    if (secondIndex === -1) {
      return -1;
    }

    return firstIndex - secondIndex;
  }

  private formatLabel(key: string): string {
    return key
      .replace(/[-_:]+/g, ' ')
      .replace(/\b\w/g, character =>
        character.toUpperCase()
      );
  }
}