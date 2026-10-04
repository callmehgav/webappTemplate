import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  QueryList,
  ViewChildren,
  ChangeDetectionStrategy
} from '@angular/core';

import { RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';

type DroneCollection = 'biz' | 'bali' | 'wwt';
type CollectionFilter = 'all' | DroneCollection;

interface DroneVideo {
  id: string;
  title: string;
  collection: DroneCollection;
  collectionName: string;
  source: string;
}

@Component({
  selector: 'app-gallery',
  imports: [RouterLink],
  templateUrl: './gallery.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrls: ['./gallery.component.css']
})
export class GalleryComponent implements AfterViewInit, OnDestroy {
  @ViewChildren('portfolioVideo')
  private videoElements!: QueryList<ElementRef<HTMLVideoElement>>;

  private videoObserver?: IntersectionObserver;
  private videoElementChanges?: Subscription;

  private readonly r2Base =
    'https://pub-73e76b36160a4d3791dda44a7b93b54a.r2.dev';

  private readonly unavailableVideoIds = new Set<string>();

  readonly filters: Array<{
    value: CollectionFilter;
    label: string;
  }> = [
    { value: 'all', label: 'All Work' },
    { value: 'biz', label: 'Local' },
    { value: 'bali', label: 'Bali' },
    { value: 'wwt', label: "Willy's World Tour" },
  ];

  readonly videos: DroneVideo[] = [
    ...this.createVideos(
      'biz',
      'Local',
      [1, 2]
    ),
    ...this.createVideos(
      'bali',
      'Bali',
      [2, 4, 5, 6, 7, 9, 10, 12]
    ),
    ...this.createVideos(
      'wwt',
      "Willy's World Tour",
      [1, 2, 3, 4, 5, 6, 7]
    ),
  ];

  activeFilter: CollectionFilter = 'all';

  get visibleVideos(): DroneVideo[] {
    return this.videos.filter((video) => {
      const matchesFilter =
        this.activeFilter === 'all' ||
        video.collection === this.activeFilter;

      return (
        matchesFilter &&
        !this.unavailableVideoIds.has(video.id)
      );
    });
  }

  ngAfterViewInit(): void {
    this.videoObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) {
            return;
          }

          const video = entry.target as HTMLVideoElement;

          this.loadVideo(video);
          this.videoObserver?.unobserve(video);
        });
      },
      {
        rootMargin: '300px 0px',
        threshold: 0.01
      }
    );

    this.observeVideos();

    this.videoElementChanges =
      this.videoElements.changes.subscribe(() => {
        this.observeVideos();
      });
  }

  ngOnDestroy(): void {
    this.videoObserver?.disconnect();
    this.videoElementChanges?.unsubscribe();
  }

  setFilter(filter: CollectionFilter): void {
    this.pauseAllVideos();
    this.activeFilter = filter;
  }

  previewVideo(event: Event): void {
    const video = event.currentTarget as HTMLVideoElement;

    this.loadVideo(video);
    this.pauseOtherVideos(video);

    void video.play().catch(() => {
      // Playback may require user interaction on some devices.
    });
  }

  pauseVideo(event: Event): void {
    const video = event.currentTarget as HTMLVideoElement;
    video.pause();
  }

  pauseOtherVideos(activeEvent: Event | HTMLVideoElement): void {
    const activeVideo =
      activeEvent instanceof HTMLVideoElement
        ? activeEvent
        : (activeEvent.currentTarget as HTMLVideoElement);

    this.videoElements?.forEach((videoElement) => {
      const video = videoElement.nativeElement;

      if (video !== activeVideo) {
        video.pause();
      }
    });
  }

  primeFirstFrame(event: Event): void {
    const video = event.currentTarget as HTMLVideoElement;

    if (video.duration > 0) {
      try {
        video.currentTime = Math.min(0.05, video.duration);
      } catch {
        // Ignore browsers that do not allow seeking yet.
      }
    }
  }

  handleVideoError(videoId: string): void {
    this.unavailableVideoIds.add(videoId);
  }

  trackByVideoId(
    _index: number,
    video: DroneVideo
  ): string {
    return video.id;
  }

  scrollToContact(event: Event): void {
    event.preventDefault();

    document
      .getElementById('contact')
      ?.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
  }

  private observeVideos(): void {
    if (!this.videoObserver) {
      return;
    }

    this.videoObserver.disconnect();

    this.videoElements.forEach((videoElement) => {
      const video = videoElement.nativeElement;

      if (video.dataset['loaded'] !== 'true') {
        this.videoObserver?.observe(video);
      }
    });
  }

  private loadVideo(video: HTMLVideoElement): void {
    if (video.dataset['loaded'] === 'true') {
      return;
    }

    const source = video.dataset['src'];

    if (!source) {
      return;
    }

    video.dataset['loaded'] = 'true';
    video.preload = 'metadata';
    video.src = source;
    video.load();
  }

  private pauseAllVideos(): void {
    this.videoElements?.forEach((videoElement) => {
      videoElement.nativeElement.pause();
    });
  }

  private createVideos(
    collection: DroneCollection,
    collectionName: string,
    numbers: number[]
  ): DroneVideo[] {
    return numbers.map((number, index) => ({
      id: `${collection}-${number}`,
      title: `${collectionName} Film ${String(index + 1).padStart(2, '0')}`,
      collection,
      collectionName,
      source: `${this.r2Base}/${collection}/${number}${
        collection === 'bali' ? 'r' : ''
      }.mp4`,
    }));
  }
}