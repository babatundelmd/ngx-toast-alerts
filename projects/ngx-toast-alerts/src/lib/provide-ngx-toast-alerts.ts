import { EnvironmentProviders, makeEnvironmentProviders } from '@angular/core';
import {
  NGX_TOAST_ALERTS_CONFIG,
  NgxToastAlertsConfig,
} from './ngx-toast-alerts-config';

/**
 * Registers ngx-toast-alerts with the application injector.
 *
 * ```ts
 * bootstrapApplication(App, {
 *   providers: [provideNgxToastAlerts({ position: 'center' })],
 * });
 * ```
 *
 * The service and overlay are `providedIn: 'root'`, so this only supplies the
 * default configuration — calling it is optional but recommended.
 */
export function provideNgxToastAlerts(
  config: NgxToastAlertsConfig = {},
): EnvironmentProviders {
  return makeEnvironmentProviders([
    { provide: NGX_TOAST_ALERTS_CONFIG, useValue: config },
  ]);
}
