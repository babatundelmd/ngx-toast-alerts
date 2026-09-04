import { EnvironmentProviders, makeEnvironmentProviders } from '@angular/core';
import {
  NGX_TOAST_ALERTS_CONFIG,
  NgxToastAlertsConfig,
} from './ngx-toast-alerts-config';

export function provideNgxToastAlerts(
  config: NgxToastAlertsConfig = {},
): EnvironmentProviders {
  return makeEnvironmentProviders([
    { provide: NGX_TOAST_ALERTS_CONFIG, useValue: config },
  ]);
}
