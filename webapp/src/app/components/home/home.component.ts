import { ChangeDetectionStrategy, Component } from '@angular/core';
import { HeroComponent } from '../hero/hero.component';
import { AboutSectionComponent } from '../about/about-section.component';
import { LinkTreeComponent } from '../linkTree/link-tree.component';
import { ContactMeComponent } from '../contact-me/contact-me.component';
import { YoutubeFeatureComponent } from '../youtube-feature/youtube-feature.component';
import { LocationMapComponent } from '../location-map/location-map.component';
import { ServicesShowcaseComponent } from '../services-showcase/services-showcase.component';
import { HomeGalleryPreviewComponent } from '../home-gallery-preview/home-gallery-preview.component';
import { HomeCalendarPreviewComponent } from '../home-calendar-preview/home-calendar-preview.component';

@Component({
  selector: 'app-home',
  imports: [
    HeroComponent,
    AboutSectionComponent,
    ServicesShowcaseComponent,
    HomeGalleryPreviewComponent,
    HomeCalendarPreviewComponent,
    YoutubeFeatureComponent,
    ContactMeComponent,
    LinkTreeComponent,
    LocationMapComponent
  ],
  template: `
    <app-hero></app-hero>
    <app-about-section></app-about-section>
    <app-services-showcase></app-services-showcase>
    <app-home-gallery-preview></app-home-gallery-preview>
    <app-home-calendar-preview></app-home-calendar-preview>
    <app-youtube-feature></app-youtube-feature>
    <app-contact-me></app-contact-me>
    <app-link-tree></app-link-tree>
    <app-location-map></app-location-map>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HomeComponent {}
