import { ChangeDetectionStrategy, Component, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { combineLatest } from 'rxjs';

import { MediaUsage, PublicApiService, PublicMediaItem } from '../../services/public-api.service';

@Component({
  selector: 'app-home-gallery-preview',
  imports: [RouterLink],
  templateUrl: './home-gallery-preview.component.html',
  styleUrls: ['./home-gallery-preview.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HomeGalleryPreviewComponent implements OnInit {
  readonly images = signal<PublicMediaItem[]>([]);
  readonly isEnabled = signal(false);

  constructor(private readonly publicApi: PublicApiService) {}

  ngOnInit(): void {
    combineLatest({
      settings: this.publicApi.getHomeFeatureSettings(),
      images: this.publicApi.getMedia(MediaUsage.Gallery)
    }).subscribe({
      next: ({ settings, images }) => {
        this.isEnabled.set(settings.galleryPreviewEnabled);
        this.images.set(images.slice(0, 5));
      }
    });
  }
}
