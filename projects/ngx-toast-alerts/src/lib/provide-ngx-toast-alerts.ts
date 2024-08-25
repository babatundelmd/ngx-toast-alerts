import { Provider } from '@angular/core';
import { NgxToastAlertsConfig, NGX_TOAST_ALERTS_CONFIG } from './ngx-toast-alerts-config';
import { NgxToastAlertsService } from './ngx-toast-alerts.service';
import { ToastOverlayService } from './toast-overlay.service';

export function provideNgxToastAlerts(config?: NgxToastAlertsConfig): Provider[] {
  return [
    {
      provide: NGX_TOAST_ALERTS_CONFIG,
      useValue: config || {},
    },
    NgxToastAlertsService,
    ToastOverlayService
  ];
}