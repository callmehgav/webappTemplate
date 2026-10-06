import { ChangeDetectionStrategy, Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';

import { AdminApiService } from '../../../../services/admin-api.service';
import { ServiceOffering } from '../../../../services/public-api.service';

@Component({
  selector: 'app-services-settings',
  imports: [FormsModule],
  templateUrl: './services-settings.component.html',
  styleUrls: ['./services-settings.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ServicesSettingsComponent implements OnInit {
  readonly services = signal<ServiceOffering[]>([]);
  readonly isLoading = signal(true);
  readonly busyId = signal<string | null>(null);
  readonly isCreating = signal(false);
  readonly errorMessage = signal('');
  readonly successMessage = signal('');

  newTitle = '';
  newSummary = '';

  constructor(private readonly adminApi: AdminApiService) {}

  ngOnInit(): void { this.load(); }

  create(): void {
    if (!this.newTitle.trim() || !this.newSummary.trim()) {
      this.errorMessage.set('Add a title and brief description first.');
      return;
    }

    this.clearMessages();
    this.isCreating.set(true);
    const nextOrder = this.services().length
      ? Math.max(...this.services().map(item => item.displayOrder)) + 10
      : 10;

    this.adminApi.post<ServiceOffering>('/services/admin', {
      title: this.newTitle,
      summary: this.newSummary,
      displayOrder: nextOrder,
      isVisible: true
    }).subscribe({
      next: item => {
        this.services.update(items => [...items, this.resolve(item)]);
        this.newTitle = '';
        this.newSummary = '';
        this.isCreating.set(false);
        this.successMessage.set('Service added. You can upload its photo below.');
      },
      error: error => this.fail(error, 'The service could not be added.', () => this.isCreating.set(false))
    });
  }

  save(item: ServiceOffering): void {
    this.clearMessages();
    this.busyId.set(item.id);
    this.adminApi.put<ServiceOffering>(`/services/admin/${item.id}`, {
      title: item.title,
      summary: item.summary,
      displayOrder: item.displayOrder,
      isVisible: item.isVisible
    }).subscribe({
      next: saved => {
        this.replace(this.resolve(saved));
        this.busyId.set(null);
        this.successMessage.set('Service saved.');
      },
      error: error => this.fail(error, 'The service could not be saved.')
    });
  }

  chooseImage(item: ServiceOffering, event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type) || file.size > 10 * 1024 * 1024) {
      this.errorMessage.set('Use a JPEG, PNG, WebP, or GIF image up to 10 MB.');
      return;
    }

    const body = new FormData();
    body.append('File', file);
    this.clearMessages();
    this.busyId.set(item.id);
    this.adminApi.put<ServiceOffering>(`/services/admin/${item.id}/image`, body).subscribe({
      next: saved => {
        this.replace(this.resolve(saved));
        this.busyId.set(null);
        this.successMessage.set('Service photo updated.');
      },
      error: error => this.fail(error, 'The service photo could not be uploaded.')
    });
  }

  removeImage(item: ServiceOffering): void {
    this.clearMessages();
    this.busyId.set(item.id);
    this.adminApi.delete<{ success: boolean }>(`/services/admin/${item.id}/image`).subscribe({
      next: () => {
        this.replace({ ...item, image: null });
        this.busyId.set(null);
        this.successMessage.set('Service photo removed.');
      },
      error: error => this.fail(error, 'The service photo could not be removed.')
    });
  }

  remove(item: ServiceOffering): void {
    if (!window.confirm(`Delete “${item.title}”?`)) return;
    this.clearMessages();
    this.busyId.set(item.id);
    this.adminApi.delete<{ success: boolean }>(`/services/admin/${item.id}`).subscribe({
      next: () => {
        this.services.update(items => items.filter(value => value.id !== item.id));
        this.busyId.set(null);
        this.successMessage.set('Service deleted.');
      },
      error: error => this.fail(error, 'The service could not be deleted.')
    });
  }

  private load(): void {
    this.adminApi.get<ServiceOffering[]>('/services/admin').subscribe({
      next: items => {
        this.services.set(items.map(item => this.resolve(item)));
        this.isLoading.set(false);
      },
      error: error => this.fail(error, 'Services could not be loaded.', () => this.isLoading.set(false))
    });
  }

  private resolve(item: ServiceOffering): ServiceOffering {
    return {
      ...item,
      image: item.image ? { ...item.image, contentUrl: this.adminApi.resolveContentUrl(item.image.contentUrl) } : null
    };
  }

  private replace(saved: ServiceOffering): void {
    this.services.update(items => items
      .map(item => item.id === saved.id ? saved : item)
      .sort((a, b) => a.displayOrder - b.displayOrder));
  }

  private fail(error: HttpErrorResponse, fallback: string, done?: () => void): void {
    done?.();
    this.busyId.set(null);
    this.errorMessage.set(typeof error.error?.message === 'string' ? error.error.message : fallback);
  }

  private clearMessages(): void {
    this.errorMessage.set('');
    this.successMessage.set('');
  }
}
