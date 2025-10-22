import { ApplicationConfig } from '@angular/core';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideNgxToastAlerts } from 'ngx-toast-alerts';

export const appConfig: ApplicationConfig = {
  providers: [
    provideNgxToastAlerts({
      timeout: 5000,
      position: 'top-right',
      clickToClose: true
    }),
    provideAnimations()
  ]
};