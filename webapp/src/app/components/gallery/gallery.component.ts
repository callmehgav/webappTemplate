import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
  OnDestroy,
  OnInit,
  computed,
  signal
} from '@angular/core';
import { RouterLink } from '@angular/router';

import {
  MediaUsage,
  PublicApiService,
  PublicMediaItem
} from '../../services/public-api.service';

@Component({
  selector: 'app-gallery',
  imports: [RouterLink],
  templateUrl: './gallery.component.html',
  styleUrls: ['./gallery.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GalleryComponent implements OnInit, OnDestroy {
  readonly images = signal<PublicMediaItem[]>([]);
  readonly isLoading = signal(true);
  readonly errorMessage = signal('');
  readonly activeIndex = signal<number | null>(null);
  readonly activeImage = computed(() => {
    const index = this.activeIndex();
    return index === null ? null : this.images()[index] ?? null;
  });

  private touchStartX: number | null = null;

  constructor(private readonly publicApi: PublicApiService) {}

  ngOnInit(): void {
    this.publicApi.getMedia(MediaUsage.Gallery).subscribe({
      next: images => {
        this.images.set(images);
        this.isLoading.set(false);
      },
      error: error => {
        this.isLoading.set(false);
        this.errorMessage.set('The gallery could not be loaded right now.');
        console.error('Gallery fetch failed:', error);
      }
    });
  }

  ngOnDestroy(): void {
    this.unlockPage();
  }

  openImage(index: number): void {
    this.activeIndex.set(index);
    document.body.style.overflow = 'hidden';
  }

  closeImage(): void {
    this.activeIndex.set(null);
    this.unlockPage();
  }

  showPrevious(): void {
    const images = this.images();
    const index = this.activeIndex();

    if (!images.length || index === null) {
      return;
    }

    this.activeIndex.set((index - 1 + images.length) % images.length);
  }

  showNext(): void {
    const images = this.images();
    const index = this.activeIndex();

    if (!images.length || index === null) {
      return;
    }

    this.activeIndex.set((index + 1) % images.length);
  }

  handleBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.closeImage();
    }
  }

  beginTouch(event: TouchEvent): void {
    this.touchStartX = event.touches[0]?.clientX ?? null;
  }

  endTouch(event: TouchEvent): void {
    if (this.touchStartX === null) {
      return;
    }

    const endX = event.changedTouches[0]?.clientX;

    if (endX === undefined) {
      return;
    }

    const distance = endX - this.touchStartX;
    this.touchStartX = null;

    if (Math.abs(distance) < 50) {
      return;
    }

    distance > 0 ? this.showPrevious() : this.showNext();
  }

  @HostListener('document:keydown', ['$event'])
  handleKeyboard(event: KeyboardEvent): void {
    if (this.activeIndex() === null) {
      return;
    }

    if (event.key === 'Escape') {
      this.closeImage();
    } else if (event.key === 'ArrowLeft') {
      this.showPrevious();
    } else if (event.key === 'ArrowRight') {
      this.showNext();
    }
  }

  private unlockPage(): void {
    document.body.style.removeProperty('overflow');
  }
}
