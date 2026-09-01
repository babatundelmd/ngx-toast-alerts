import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection,
} from '@angular/core';
import { provideNgxToastAlerts } from 'ngx-toast-alerts';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    // The library is signal-driven, so it needs no zone.js.
    provideZonelessChangeDetection(),
    provideNgxToastAlerts({
      timeout: 5000,
      position: 'top-right',
      radius: 'round',
    }),
  ],
};
