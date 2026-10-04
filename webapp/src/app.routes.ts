import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    title: 'Home',
    loadComponent: () =>
      import('./app/components/home/home.component').then(m => m.HomeComponent),
  },
  {
    path: 'book',
    title: 'Book',
    loadComponent: () =>
      import('./app/components/booking/booking.component').then(m => m.BookingComponent),
  },
  {
    path: 'gallery',
    title: 'Gallery',
    loadComponent: () =>
      import(
        './app/components/gallery/gallery.component'
      ).then((m) => m.GalleryComponent),
  },
  {
    path: 'terms',
    title: 'Terms',
    loadComponent: () =>
      import(
        './app/components/terms/terms.component'
      ).then((m) => m.TermsComponent),
  },
  {
    path: 'privacy',
    title: 'Privacy',
    loadComponent: () =>
      import(
        './app/components/privacy/privacy.component'
      ).then((m) => m.PrivacyComponent),
  },
  {
    path: '**',
    redirectTo: '',
  },
];
