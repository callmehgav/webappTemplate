import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
  signal
} from '@angular/core';
import { HttpErrorResponse, HttpParams } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';

import { AdminApiService } from '../../../../services/admin-api.service';
import { ConfirmDialogComponent } from '../../../ui/confirm-dialog/confirm-dialog.component';

interface GalleryImage {
  id: string;
  originalFileName: string;
  contentType: string;
  contentUrl: string;
  byteLength: number;
  displayOrder: number;
  altText: string | null;
  focalPointX: number;
  focalPointY: number;
}

interface PreviewImage {
  file: File;
  url: string;
}

@Component({
  selector: 'app-gallery-settings',
  imports: [FormsModule, ConfirmDialogComponent],
  templateUrl: './gallery-settings.component.html',
  styleUrls: ['./gallery-settings.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GallerySettingsComponent implements OnInit, OnDestroy {
  readonly images = signal<GalleryImage[]>([]);
  readonly previews = signal<PreviewImage[]>([]);
  readonly isLoading = signal(true);
  readonly isUploading = signal(false);
  readonly busyImageId = signal<string | null>(null);
  readonly deleteCandidate = signal<GalleryImage | null>(null);
  readonly errorMessage = signal('');
  readonly successMessage = signal('');

  constructor(private readonly adminApi: AdminApiService) {}

  ngOnInit(): void {
    this.loadImages();
  }

  ngOnDestroy(): void {
    this.clearPreviews();
  }

  chooseFiles(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files ?? []);

    this.clearPreviews();
    this.clearMessages();

    const validFiles = files.filter(file => {
      const supported = [
        'image/jpeg',
        'image/png',
        'image/webp',
        'image/gif'
      ].includes(file.type);

      return supported && file.size <= 10 * 1024 * 1024;
    });

    if (validFiles.length !== files.length) {
      this.errorMessage.set(
        'Some files were skipped. Use JPEG, PNG, WebP, or GIF images up to 10 MB each.'
      );
    }

    this.previews.set(
      validFiles.map(file => ({
        file,
        url: URL.createObjectURL(file)
      }))
    );

    input.value = '';
  }

  removePreview(index: number): void {
    const previews = [...this.previews()];
    const [removed] = previews.splice(index, 1);

    if (removed) {
      URL.revokeObjectURL(removed.url);
    }

    this.previews.set(previews);
  }

  uploadImages(): void {
    const previews = this.previews();

    if (!previews.length) {
      return;
    }

    const nextOrder = this.images().length
      ? Math.max(...this.images().map(image => image.displayOrder)) + 10
      : 10;

    const requests = previews.map((preview, index) => {
      const formData = new FormData();
      formData.append('File', preview.file);
      formData.append('Usage', '8');
      formData.append('DisplayOrder', String(nextOrder + index * 10));

      return this.adminApi.post<GalleryImage>('/admin/media', formData);
    });

    this.isUploading.set(true);
    this.clearMessages();

    forkJoin(requests).subscribe({
      next: () => {
        this.isUploading.set(false);
        this.clearPreviews();
        this.successMessage.set(
          `${requests.length} ${requests.length === 1 ? 'image' : 'images'} added to the gallery.`
        );
        this.loadImages(false);
      },
      error: (error: HttpErrorResponse) => {
        this.isUploading.set(false);
        this.errorMessage.set(
          this.getErrorMessage(error, 'The selected images could not be uploaded.')
        );
        this.loadImages(false);
      }
    });
  }

  saveImage(image: GalleryImage): void {
    this.busyImageId.set(image.id);
    this.clearMessages();

    this.updateImage(image).subscribe({
      next: saved => {
        this.replaceImage(saved);
        this.busyImageId.set(null);
        this.successMessage.set('Caption and display order saved.');
      },
      error: (error: HttpErrorResponse) => {
        this.busyImageId.set(null);
        this.errorMessage.set(
          this.getErrorMessage(error, 'The image details could not be saved.')
        );
      }
    });
  }

  moveImage(image: GalleryImage, offset: number): void {
    const images = [...this.images()];
    const currentIndex = images.findIndex(item => item.id === image.id);
    const nextIndex = currentIndex + offset;

    if (currentIndex < 0 || nextIndex < 0 || nextIndex >= images.length) {
      return;
    }

    [images[currentIndex], images[nextIndex]] = [images[nextIndex], images[currentIndex]];
    images.forEach((item, index) => item.displayOrder = (index + 1) * 10);
    this.images.set(images);
    this.busyImageId.set(image.id);
    this.clearMessages();

    forkJoin(images.map(item => this.updateImage(item))).subscribe({
      next: () => {
        this.busyImageId.set(null);
        this.successMessage.set('Gallery order updated.');
      },
      error: (error: HttpErrorResponse) => {
        this.busyImageId.set(null);
        this.errorMessage.set(
          this.getErrorMessage(error, 'The gallery order could not be saved.')
        );
        this.loadImages(false);
      }
    });
  }

  requestDelete(image: GalleryImage): void {
    this.deleteCandidate.set(image);
  }

  cancelDelete(): void {
    this.deleteCandidate.set(null);
  }

  confirmDelete(): void {
    const image = this.deleteCandidate();

    if (!image) {
      return;
    }

    this.deleteCandidate.set(null);
    this.busyImageId.set(image.id);
    this.clearMessages();

    this.adminApi.delete<{ success: boolean }>(`/admin/media/${image.id}`).subscribe({
      next: () => {
        this.images.update(images => images.filter(item => item.id !== image.id));
        this.busyImageId.set(null);
        this.successMessage.set('Image removed from the gallery.');
      },
      error: (error: HttpErrorResponse) => {
        this.busyImageId.set(null);
        this.errorMessage.set(
          this.getErrorMessage(error, 'The image could not be deleted.')
        );
      }
    });
  }

  imageUrl(image: GalleryImage): string {
    return this.adminApi.resolveContentUrl(image.contentUrl);
  }

  formatBytes(bytes: number): string {
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  }

  private loadImages(showLoading = true): void {
    const params = new HttpParams().set('usage', '8');

    if (showLoading) {
      this.isLoading.set(true);
    }

    this.adminApi.get<GalleryImage[]>('/admin/media', params).subscribe({
      next: images => {
        this.images.set(images);
        this.isLoading.set(false);
      },
      error: (error: HttpErrorResponse) => {
        this.isLoading.set(false);
        this.errorMessage.set(
          this.getErrorMessage(error, 'Gallery images could not be loaded.')
        );
      }
    });
  }

  private updateImage(image: GalleryImage) {
    return this.adminApi.put<GalleryImage>(`/admin/media/${image.id}`, {
      altText: image.altText,
      displayOrder: image.displayOrder,
      focalPointX: image.focalPointX,
      focalPointY: image.focalPointY
    });
  }

  private replaceImage(saved: GalleryImage): void {
    this.images.update(images =>
      images
        .map(image => image.id === saved.id ? saved : image)
        .sort((a, b) => a.displayOrder - b.displayOrder)
    );
  }

  private clearPreviews(): void {
    this.previews().forEach(preview => URL.revokeObjectURL(preview.url));
    this.previews.set([]);
  }

  private clearMessages(): void {
    this.errorMessage.set('');
    this.successMessage.set('');
  }

  private getErrorMessage(error: HttpErrorResponse, fallback: string): string {
    if (error.status === 401) {
      return 'Your administrator session has expired.';
    }

    return typeof error.error?.message === 'string'
      ? error.error.message
      : fallback;
  }
}
