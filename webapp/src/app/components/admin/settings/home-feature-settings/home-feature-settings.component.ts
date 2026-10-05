import { ChangeDetectionStrategy, Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AdminApiService } from '../../../../services/admin-api.service';
import { HomeFeatureSettings, PublicApiService } from '../../../../services/public-api.service';
import { ContentSettingsComponent } from '../content-settings/content-settings.component';
import { ToastService } from '../../../../services/toast.service';

@Component({
  selector: 'app-home-feature-settings',
  imports: [FormsModule, ContentSettingsComponent],
  templateUrl: './home-feature-settings.component.html',
  styleUrls: ['./home-feature-settings.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HomeFeatureSettingsComponent implements OnInit {
  readonly settings = signal<HomeFeatureSettings | null>(null);
  readonly saving = signal(false);

  constructor(
    private readonly api: AdminApiService,
    private readonly publicApi: PublicApiService,
    private readonly toast: ToastService
  ) {}

  ngOnInit(): void {
    this.api.get<HomeFeatureSettings>('/home-features').subscribe({
      next: settings => this.settings.set(settings),
      error: () => this.toast.show('Home features could not be loaded.', 'error')
    });
  }

  save(): void {
    const settings = this.settings();
    if (!settings) return;

    this.saving.set(true);
    this.api.put<HomeFeatureSettings>('/home-features/admin/settings', settings).subscribe({
      next: value => {
        this.settings.set(value);
        this.publicApi.updateHomeFeatureSettingsCache(value);
        this.saving.set(false);
        this.toast.show('Home features saved.', 'success');
      },
      error: error => {
        this.saving.set(false);
        this.toast.show(error?.error?.message || 'Home features could not be saved.', 'error');
      }
    });
  }
}
