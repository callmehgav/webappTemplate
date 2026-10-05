import { ChangeDetectionStrategy, Component } from '@angular/core';
import { HeroComponent } from '../hero/hero.component';
import { AboutSectionComponent } from '../about/about-section.component';
import { LinkTreeComponent } from '../linkTree/link-tree.component';
import { ContactMeComponent } from '../contact-me/contact-me.component';
import { YoutubeFeatureComponent } from '../youtube-feature/youtube-feature.component';
import { LocationMapComponent } from '../location-map/location-map.component';

@Component({
  selector: 'app-home',
  imports: [HeroComponent, AboutSectionComponent, LinkTreeComponent, YoutubeFeatureComponent, LocationMapComponent, ContactMeComponent],
  template: `
    <app-hero></app-hero>
    <app-about-section></app-about-section>
    <app-link-tree></app-link-tree>
    <app-youtube-feature></app-youtube-feature>
    <app-location-map></app-location-map>
    <app-contact-me></app-contact-me>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HomeComponent {}
