import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { AppModule } from './app/app.module';  // This should import the root AppModule

platformBrowserDynamic().bootstrapModule(AppModule)
  .catch(err => console.error(err));
