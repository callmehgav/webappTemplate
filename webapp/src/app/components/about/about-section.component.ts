import { ChangeDetectionStrategy, Component, OnInit, signal } from '@angular/core';
import { ContentViewerComponent } from '../ui/content-viewer/content-viewer.component';
import { RouterModule } from '@angular/router';
import { MediaUsage, PublicApiService, SiteContent } from '../../services/public-api.service';

@Component({
  selector: 'app-about-section',
  imports: [RouterModule, ContentViewerComponent],
  templateUrl: './about-section.component.html',
  styleUrls: ['./about-section.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AboutSectionComponent implements OnInit {
  readonly aboutContent = signal<SiteContent | null>(null);
  readonly profileImageUrl = signal('/assets/Images/me.jpg');
  readonly isLoading = signal(true);
  readonly loadError = signal(false);

  constructor(private readonly publicApi: PublicApiService) {}

  ngOnInit(): void {
    this.loadAboutContent();
    this.loadAboutImage();
  }

  private loadAboutImage(): void {
    this.publicApi.getMedia(MediaUsage.AboutProfilePicture).subscribe({
      next: images => {
        if (images[0]) {
          this.profileImageUrl.set(images[0].contentUrl);
        }
      },
      error: error =>
        console.error('About image fetch failed:', error)
    });
  }


  private loadAboutContent(): void {
    this.isLoading.set(true);
    this.loadError.set(false);

    this.publicApi.getContentByKey('about.body').subscribe({
      next: content => {
        this.aboutContent.set(content);
        this.isLoading.set(false);
      },
      error: error => {
        this.isLoading.set(false);
        this.loadError.set(true);
        console.error('About content fetch failed:', error);
      }
    });
  }
}
