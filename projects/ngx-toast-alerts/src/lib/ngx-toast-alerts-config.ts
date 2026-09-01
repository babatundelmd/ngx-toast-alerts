import { InjectionToken } from '@angular/core';

/**
 * Where a toast is anchored on screen.
 *
 * `center` floats the toast in the middle of the viewport with a scale/blur
 * entrance — use it for messages that should interrupt, not just inform.
 */
export type NgxToastPosition =
  | 'top-right'
  | 'top-left'
  | 'top-center'
  | 'bottom-right'
  | 'bottom-left'
  | 'bottom-center'
  | 'center';

/** The visual state a toast represents. */
export type NgxToastType = 'success' | 'error' | 'warning' | 'info' | 'pending';

/** How aggressively the toast corners are rounded. */
export type NgxToastRadius = 'soft' | 'round' | 'pill';

export interface NgxToastAlertsConfig {
  /** Milliseconds before the toast auto-dismisses. Defaults to 5000. */
  timeout?: number;

  /** Dismiss the toast when its body is clicked. Defaults to true. */
  clickToClose?: boolean;

  /** Keep the toast on screen until it is dismissed explicitly. */
  disableTimeout?: boolean;

  /** Screen anchor. Can be set globally or per toast. */
  position?: NgxToastPosition;

  /** Render the close (×) button. Defaults to true. */
  showCloseButton?: boolean;

  /** Freeze the dismiss timer while the pointer is over the toast. Defaults to true. */
  pauseOnHover?: boolean;

  /** Draw a thin progress bar tracking the remaining timeout. Defaults to false. */
  showProgress?: boolean;

  /** Corner rounding preset. Defaults to `round`. */
  radius?: NgxToastRadius;

  /** Dim and blur the page behind a `center` toast. Defaults to true. */
  backdrop?: boolean;

  /** Maximum simultaneous toasts per position. Oldest are dropped first. Defaults to 5. */
  maxToasts?: number;

  /** Overrides the heading. Falls back to a sensible default per type. */
  title?: string;

  /** Politeness of the live region announcement. Defaults to `polite`. */
  ariaLive?: 'polite' | 'assertive';
}

/** Fully resolved configuration — every option has a value. */
export type ResolvedToastConfig = Required<Omit<NgxToastAlertsConfig, 'title'>> &
  Pick<NgxToastAlertsConfig, 'title'>;

export const NGX_TOAST_ALERTS_DEFAULTS: ResolvedToastConfig = {
  timeout: 5000,
  clickToClose: true,
  disableTimeout: false,
  position: 'top-right',
  showCloseButton: true,
  pauseOnHover: true,
  showProgress: false,
  radius: 'round',
  backdrop: true,
  maxToasts: 5,
  ariaLive: 'polite',
};

export const NGX_TOAST_ALERTS_CONFIG = new InjectionToken<NgxToastAlertsConfig>(
  'NGX_TOAST_ALERTS_CONFIG',
);
