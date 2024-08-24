import { Provider } from '@angular/core';
import { NgxToastAlertsConfig, NGX_TOAST_ALERTS_CONFIG } from './ngx-toast-alerts-config';

export function provideNgxToastAlerts(config?: NgxToastAlertsConfig): Provider[] {
  return [
    {
      provide: NGX_TOAST_ALERTS_CONFIG,
      useValue: config || {},
    },
  ];
}