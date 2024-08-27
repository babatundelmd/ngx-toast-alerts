import { InjectionToken } from '@angular/core';
export interface NgxToastAlertsConfig {
  timeout?: number;
  clickToClose?: boolean;
  disableTimeout?: boolean;
  position?: 'top-right' | 'top-left' | 'bottom-left' | 'bottom-right';
}

export const NGX_TOAST_ALERTS_CONFIG = new InjectionToken<NgxToastAlertsConfig>('NGX_TOAST_ALERTS_CONFIG');