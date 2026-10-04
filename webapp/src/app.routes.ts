import { Routes } from '@angular/router';

export const routes: Routes = [
  
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
