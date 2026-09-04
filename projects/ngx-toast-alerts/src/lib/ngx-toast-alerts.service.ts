import { computed, DestroyRef, inject, PLATFORM_ID, signal, Service } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import {
  NGX_TOAST_ALERTS_CONFIG,
  NGX_TOAST_ALERTS_DEFAULTS,
  NgxToastAlertsConfig,
  NgxToastDismissReason,
  NgxToastEvent,
  NgxToastPosition,
  NgxToastType,
  ResolvedToastConfig,
} from './ngx-toast-alerts-config';
import { ToastOverlayService } from './toast-overlay.service';

/** How long the exit animation runs before the toast leaves the DOM. */
export const TOAST_EXIT_DURATION = 260;

export interface Toast {
  readonly id: number;
  readonly type: NgxToastType;
  readonly title: string;
  readonly message: string;
  readonly config: ResolvedToastConfig;
  readonly leaving: boolean;
  readonly createdAt: number;
}

const DEFAULT_TITLES: Record<NgxToastType, string> = {
  success: 'Success',
  error: 'Error',
  warning: 'Warning',
  info: 'Information',
  pending: 'Pending',
};

interface TimerState {
  handle: ReturnType<typeof setTimeout> | null;
  remaining: number;
  startedAt: number;
  paused: boolean;
}

@Service()
export class NgxToastAlertsService {
  private readonly toastQueue = signal<readonly Toast[]>([]);
  private readonly timers = new Map<number, TimerState>();
  private readonly exitTimers = new Set<ReturnType<typeof setTimeout>>();
  private nextId = 0;

  private readonly toastOverlay = inject(ToastOverlayService);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  private defaultConfig: ResolvedToastConfig = { ...NGX_TOAST_ALERTS_DEFAULTS };

  /** All live toasts, newest first. */
  readonly toasts = computed(() => this.toastQueue());

  /** Live toasts grouped by the position they should render at. */
  readonly toastsByPosition = computed(() => {
    const groups = new Map<NgxToastPosition, Toast[]>();
    for (const toast of this.toastQueue()) {
      const bucket = groups.get(toast.config.position);
      if (bucket) {
        bucket.push(toast);
      } else {
        groups.set(toast.config.position, [toast]);
      }
    }
    return groups;
  });

  /** True while at least one `center` toast wants a backdrop. */
  readonly hasBackdrop = computed(() =>
    this.toastQueue().some(
      (toast) =>
        toast.config.position === 'center' &&
        toast.config.backdrop &&
        !toast.leaving,
    ),
  );

  constructor() {
    const injectedConfig = inject(NGX_TOAST_ALERTS_CONFIG, { optional: true });
    if (injectedConfig) {
      this.defaultConfig = { ...this.defaultConfig, ...injectedConfig };
    }

    inject(DestroyRef).onDestroy(() => this.clearAllTimers());
  }

  /** Merge new defaults. Applies to toasts shown afterwards. */
  setConfig(config: NgxToastAlertsConfig): void {
    this.defaultConfig = { ...this.defaultConfig, ...config };
  }

  /** The globally configured position. */
  getPosition(): NgxToastPosition {
    return this.defaultConfig.position;
  }

  success(message: string, config?: NgxToastAlertsConfig): number {
    return this.show('success', message, config);
  }

  error(message: string, config?: NgxToastAlertsConfig): number {
    return this.show('error', message, config);
  }

  warning(message: string, config?: NgxToastAlertsConfig): number {
    return this.show('warning', message, config);
  }

  info(message: string, config?: NgxToastAlertsConfig): number {
    return this.show('info', message, config);
  }

  pending(message: string, config?: NgxToastAlertsConfig): number {
    return this.show('pending', message, config);
  }

  /**
   * Show a toast anchored to the middle of the viewport.
   *
   * Shorthand for `show(type, message, { position: 'center' })`.
   */
  center(
    message: string,
    type: NgxToastType = 'info',
    config?: NgxToastAlertsConfig,
  ): number {
    return this.show(type, message, { ...config, position: 'center' });
  }

  /** Show a toast of any type. Returns the toast id. */
  show(
    type: NgxToastType,
    message: string,
    config?: NgxToastAlertsConfig,
  ): number {
    // Lazy: apps that never toast never pay for the overlay.
    this.toastOverlay.createToastOverlay();

    const resolved: ResolvedToastConfig = { ...this.defaultConfig, ...config };
    const toast: Toast = {
      id: this.nextId++,
      type,
      title: resolved.title ?? DEFAULT_TITLES[type],
      message,
      config: resolved,
      leaving: false,
      createdAt: Date.now(),
    };

    this.toastQueue.update((queue) =>
      this.enforceLimit([toast, ...queue], resolved),
    );

    if (this.shouldAutoClose(resolved)) {
      this.startTimer(toast.id, resolved.timeout);
    }

    this.emit(toast, 'shown');

    return toast.id;
  }

  /** Animates the toast out, then removes it once the animation finishes. */
  closeToast(
    id: number,
    reason: NgxToastDismissReason = 'programmatic',
  ): void {
    const closing = this.toastQueue().find(
      (toast) => toast.id === id && !toast.leaving,
    );
    if (!closing) {
      return;
    }

    this.stopTimer(id);
    this.emit(closing, 'dismissed', reason);
    this.toastQueue.update((queue) =>
      queue.map((toast) => (toast.id === id ? { ...toast, leaving: true } : toast)),
    );

    if (!this.isBrowser) {
      this.remove(id);
      return;
    }

    const handle = setTimeout(() => {
      this.exitTimers.delete(handle);
      this.remove(id);
    }, TOAST_EXIT_DURATION);
    this.exitTimers.add(handle);
  }

  /** Dismiss every live toast. */
  dismissAll(): void {
    for (const toast of this.toastQueue()) {
      this.closeToast(toast.id);
    }
  }

  /** Freeze the dismiss timer for a toast — used on pointer enter. */
  pauseToast(id: number): void {
    const timer = this.timers.get(id);
    if (!timer || timer.paused) {
      return;
    }
    if (timer.handle !== null) {
      clearTimeout(timer.handle);
    }
    const elapsed = Date.now() - timer.startedAt;
    this.timers.set(id, {
      handle: null,
      remaining: Math.max(0, timer.remaining - elapsed),
      startedAt: timer.startedAt,
      paused: true,
    });
  }

  /** Resume a frozen dismiss timer — used on pointer leave. */
  resumeToast(id: number): void {
    const timer = this.timers.get(id);
    if (!timer || !timer.paused) {
      return;
    }
    this.startTimer(id, timer.remaining);
  }

  /** Whether clicking the toast body dismisses it. */
  isCloseableOnClick(id: number): boolean {
    const toast = this.toastQueue().find((candidate) => candidate.id === id);
    return toast?.config.clickToClose !== false;
  }

  private shouldAutoClose(config: ResolvedToastConfig): boolean {
    return this.isBrowser && !config.disableTimeout && config.timeout > 0;
  }

  private startTimer(id: number, duration: number): void {
    this.stopTimer(id);
    const handle = setTimeout(() => {
      this.timers.delete(id);
      this.closeToast(id, 'timeout');
    }, duration);
    this.timers.set(id, {
      handle,
      remaining: duration,
      startedAt: Date.now(),
      paused: false,
    });
  }

  private stopTimer(id: number): void {
    const timer = this.timers.get(id);
    if (timer) {
      if (timer.handle !== null) {
        clearTimeout(timer.handle);
      }
      this.timers.delete(id);
    }
  }

  private remove(id: number): void {
    this.toastQueue.update((queue) => queue.filter((toast) => toast.id !== id));
  }

  /** Trim to `maxToasts` per position, oldest first. */
  private enforceLimit(
    queue: readonly Toast[],
    config: ResolvedToastConfig,
  ): Toast[] {
    if (config.maxToasts <= 0) {
      return [...queue];
    }

    const seen = new Map<NgxToastPosition, number>();
    const kept: Toast[] = [];
    for (const toast of queue) {
      const count = seen.get(toast.config.position) ?? 0;
      if (count >= config.maxToasts) {
        this.stopTimer(toast.id);
        this.emit(toast, 'dismissed', 'limit');
        continue;
      }
      seen.set(toast.config.position, count + 1);
      kept.push(toast);
    }
    return kept;
  }

  /**
   * Browser only, so hydration cannot double-count a toast. A throwing
   * handler is contained here — analytics must never break rendering.
   */
  private emit(
    toast: Toast,
    event: NgxToastEvent['event'],
    reason?: NgxToastDismissReason,
  ): void {
    const handler = toast.config.onEvent;
    if (!handler || !this.isBrowser) {
      return;
    }

    const payload: NgxToastEvent = {
      event,
      id: toast.id,
      type: toast.type,
      title: toast.title,
      message: toast.message,
      position: toast.config.position,
      at: Date.now(),
      ...(event === 'dismissed'
        ? { reason, visibleFor: Date.now() - toast.createdAt }
        : {}),
    };

    try {
      handler(payload);
    } catch (error) {
      console.error('[ngx-toast-alerts] onEvent handler threw:', error);
    }
  }

  private clearAllTimers(): void {
    for (const timer of this.timers.values()) {
      if (timer.handle !== null) {
        clearTimeout(timer.handle);
      }
    }
    this.timers.clear();
    for (const handle of this.exitTimers) {
      clearTimeout(handle);
    }
    this.exitTimers.clear();
  }
}
