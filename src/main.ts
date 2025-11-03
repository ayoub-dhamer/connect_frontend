// Fix global for libraries that expect node global in browser
(window as any).global = window;

// If Buffer is needed
import { Buffer } from 'buffer';
(window as any).Buffer = Buffer;



import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { AppModule } from './app/app.module';


platformBrowserDynamic().bootstrapModule(AppModule)
  .catch(err => console.error(err));
