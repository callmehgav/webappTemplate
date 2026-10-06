import { ChangeDetectionStrategy, Component, OnInit, signal } from '@angular/core';
import { combineLatest } from 'rxjs';

import { HomeFeatureSettings, PublicApiService, ServiceOffering } from '../../services/public-api.service';

@Component({
  selector: 'app-services-showcase',
  imports: [],
  templateUrl: './services-showcase.component.html',
  styleUrls: ['./services-showcase.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ServicesShowcaseComponent implements OnInit {
  readonly services = signal<ServiceOffering[]>([]);
  readonly isEnabled = signal(false);
  readonly isLoading = signal(true);

  constructor(private readonly publicApi: PublicApiService) {}

  ngOnInit(): void {
    combineLatest({
      settings: this.publicApi.getHomeFeatureSettings(),
      services: this.publicApi.getServices()
    }).subscribe({
      next: ({ settings, services }) => {
        this.isEnabled.set(settings.servicesEnabled);
        this.services.set(services);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }
}
