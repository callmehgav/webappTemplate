import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { map, Observable, shareReplay } from 'rxjs';
import { environment } from '../../environments/environment';

export enum MediaUsage {
  Other = 0,
  LinkTitleCard = 1,
  AboutBackground = 2,
  AboutProfilePicture = 3,
  ContactBackground = 4,
  WebsiteThumbnail = 5,
  SiteLogo = 6,
  HeroMedia = 7
}

export enum SocialPlatform {
  Custom = 0,
  YouTube = 1,
  Instagram = 2,
  TikTok = 3,
  AppleMusic = 4,
  GitHub = 5,
  LinkedIn = 6,
  Facebook = 7,
  Website = 8
}

export enum SocialLinkDisplayStyle {
  Compact = 0,
  TitleCard = 1
}

export interface SiteContent {
  contentKey: string;
  title: string | null;
  content: string;
  format: number;
}

export interface PublicMediaItem {
  id: string;
  usage: MediaUsage;
  contentUrl: string;
  contentType: string;
  altText: string | null;
  focalPointX: number;
  focalPointY: number;
}

export interface BackgroundMedia {
  id: string;
  contentUrl: string;
  contentType: string;
  altText: string | null;
  focalPointX: number;
  focalPointY: number;
}

export interface PublicSocialLink {
  id: string;
  platform: SocialPlatform;
  displayStyle: SocialLinkDisplayStyle;
  label: string;
  handle: string | null;
  url: string;
  displayOrder: number;
  backgroundMedia: BackgroundMedia | null;
}

export interface InsightEvent {
  key: string;
  amount: number;
}

export interface ContactRequest {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  message: string;
}

export interface ContactResponse {
  success: boolean;
  id?: string;
  message?: string;
}

export interface PublicContactSettings {
  email: string;
}

export interface InstagramMediaItem {
  id: string;
  caption: string;
  media_type: string;
  media_url: string;
  thumbnail_url: string;
  timestamp: string;
  permalink: string;
}
export interface WebsiteProjectThumbnail {
  id: string;
  contentUrl: string;
  contentType: string;
  altText: string | null;
}

export interface PublicWebsiteProject {
  id: string;
  eyebrowText: string;
  titleText: string;
  subtext: string;
  url: string | null;
  statusText: string | null;
  thumbnailMediaItemId: string | null;
  thumbnail: WebsiteProjectThumbnail | null;
  displayOrder: number;
}
interface SuccessResponse {
  success: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class PublicApiService {
  private contactSettingsRequest?: Observable<PublicContactSettings>;
  private siteLogoRequest?: Observable<PublicMediaItem | null>;
  private heroMediaRequest?: Observable<PublicMediaItem | null>;

  constructor(private readonly http: HttpClient) {}

  getContent(): Observable<SiteContent[]> {
    return this.http.get<SiteContent[]>(
      this.createUrl('/content')
    );
  }

  getContentByKey(
    key: string
  ): Observable<SiteContent> {
    return this.http.get<SiteContent>(
      this.createUrl(
        `/content/${encodeURIComponent(key)}`
      )
    );
  }

  getMedia(
    usage?: MediaUsage
  ): Observable<PublicMediaItem[]> {
    let params = new HttpParams();

    if (usage !== undefined) {
      params = params.set(
        'usage',
        usage.toString()
      );
    }

    return this.http
      .get<PublicMediaItem[]>(
        this.createUrl('/media'),
        { params }
      )
      .pipe(
        map(items =>
          items.map(item => ({
            ...item,
            contentUrl: this.resolveContentUrl(
              item.contentUrl
            )
          }))
        )
      );
  }

  getSiteLogo(): Observable<PublicMediaItem | null> {
    this.siteLogoRequest ??= this.getMedia(MediaUsage.SiteLogo)
      .pipe(
        map(items => items[0] ?? null),
        shareReplay({ bufferSize: 1, refCount: false })
      );

    return this.siteLogoRequest;
  }

  clearSiteLogoCache(): void {
    this.siteLogoRequest = undefined;
  }

  getHeroMedia(): Observable<PublicMediaItem | null> {
    this.heroMediaRequest ??= this.getMedia(MediaUsage.HeroMedia)
      .pipe(
        map(items => items[0] ?? null),
        shareReplay({ bufferSize: 1, refCount: false })
      );

    return this.heroMediaRequest;
  }

  clearHeroMediaCache(): void {
    this.heroMediaRequest = undefined;
  }

  getSocialLinks(): Observable<PublicSocialLink[]> {
    return this.http
      .get<PublicSocialLink[]>(
        this.createUrl('/social-links')
      )
      .pipe(
        map(links =>
          links.map(link => ({
            ...link,
            backgroundMedia: link.backgroundMedia
              ? {
                  ...link.backgroundMedia,
                  contentUrl: this.resolveContentUrl(
                    link.backgroundMedia.contentUrl
                  )
                }
              : null
          }))
        )
      );
  }

  trackInsight(
    key: string,
    amount = 1
  ): Observable<SuccessResponse> {
    const body: InsightEvent = {
      key,
      amount
    };

    return this.http.post<SuccessResponse>(
      this.createUrl('/insights/track'),
      body
    );
  }

  submitContact(
    request: ContactRequest
  ): Observable<ContactResponse> {
    return this.http.post<ContactResponse>(
      this.createUrl('/contact'),
      request
    );
  }

  getContactSettings(): Observable<PublicContactSettings> {
    this.contactSettingsRequest ??= this.http
      .get<PublicContactSettings>(
        this.createUrl('/contact/settings')
      )
      .pipe(
        shareReplay({ bufferSize: 1, refCount: false })
      );

    return this.contactSettingsRequest;
  }

  getInstagramFeed(): Observable<InstagramMediaItem[]> {
    return this.http.get<InstagramMediaItem[]>(
      this.createUrl('/instagram/feed')
    );
  }

  private createUrl(path: string): string {
    const normalizedPath =
      path.startsWith('/') ? path : `/${path}`;

    return `${environment.apiUrl}${normalizedPath}`;
  }

  private resolveContentUrl(path: string): string {
    if (/^https?:\/\//i.test(path)) {
      return path;
    }

    const apiUrl = new URL(
      environment.apiUrl,
      window.location.origin
    );

    return new URL(
      path,
      apiUrl.origin
    ).toString();
  }

  getWebsiteProjects(): Observable<PublicWebsiteProject[]> {
    return this.http
      .get<PublicWebsiteProject[]>(
        this.createUrl('/website-projects')
      )
      .pipe(
        map(projects =>
          projects.map(project => ({
            ...project,
            thumbnail: project.thumbnail
              ? {
                  ...project.thumbnail,
                  contentUrl: this.resolveContentUrl(
                    project.thumbnail.contentUrl
                  )
                }
              : null
          }))
        )
      );
  }

  
}
