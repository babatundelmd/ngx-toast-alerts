import { ApplicationConfig } from '@angular/core';
import { provideAnimations } from '@angular/platform-browser/animations';
import { NgxToastAlertsService } from 'ngx-toast-alerts';

export const appConfig: ApplicationConfig = {
  providers: [
    NgxToastAlertsService,
    provideAnimations()
  ]
};