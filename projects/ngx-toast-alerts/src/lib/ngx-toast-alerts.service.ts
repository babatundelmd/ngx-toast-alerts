import { afterNextRender, computed, DestroyRef, inject, Injectable, Injector, PLATFORM_ID, signal } from '@angular/core';
import { NGX_TOAST_ALERTS_CONFIG, NgxToastAlertsConfig } from './ngx-toast-alerts-config';
import { ToastOverlayService } from './toast-overlay.service';
import { isPlatformBrowser } from '@angular/common';

export interface Toast {
  id: number;
  type: 'success' | 'error' | 'info' | 'pending';
  message: string;
  config: NgxToastAlertsConfig;
}

@Injectable({
  providedIn: 'root'
})
export class NgxToastAlertsService {
  private readonly toastQueue = signal<Toast[]>([]);
  private nextId = 0;
  private readonly timeoutIds = new Map<number, ReturnType<typeof setTimeout>>();

  readonly toasts = computed(() => this.toastQueue());

  private defaultConfig: NgxToastAlertsConfig = {
    timeout: 5000,
    clickToClose: true,
    position: 'top-right',
    disableTimeout: false,
  };

  private readonly toastOverlay = inject(ToastOverlayService);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly destroyRef = inject(DestroyRef);
  private readonly injector = inject(Injector);

  constructor() {
    const injectedConfig = inject(NGX_TOAST_ALERTS_CONFIG, { optional: true });
    if (injectedConfig) {
      this.defaultConfig = { ...this.defaultConfig, ...injectedConfig };
    }

    if (isPlatformBrowser(this.platformId)) {
      afterNextRender(() => {
        this.toastOverlay.createToastOverlay();
      }, { injector: this.injector });
    }

    // Cleanup all timeouts on destroy
    this.destroyRef.onDestroy(() => {
      this.timeoutIds.forEach(timeoutId => clearTimeout(timeoutId));
      this.timeoutIds.clear();
    });
  }

  setConfig(config: Partial<NgxToastAlertsConfig>): void {
    this.defaultConfig = { ...this.defaultConfig, ...config };
  }

  success(message: string, config?: Partial<NgxToastAlertsConfig>): void {
    this.show('success', message, config);
  }

  error(message: string, config?: Partial<NgxToastAlertsConfig>): void {
    this.show('error', message, config);
  }

  info(message: string, config?: Partial<NgxToastAlertsConfig>): void {
    this.show('info', message, config);
  }

  pending(message: string, config?: Partial<NgxToastAlertsConfig>): void {
    this.show('pending', message, config);
  }

  private show(type: Toast['type'], message: string, config?: Partial<NgxToastAlertsConfig>): void {
    const toastConfig: NgxToastAlertsConfig = { ...this.defaultConfig, ...config };
    const newToast: Toast = { id: this.nextId++, type, message, config: toastConfig };
    
    this.toastQueue.update(queue => [newToast, ...queue]);

    // Set timeout only if disableTimeout is false
    if (!toastConfig.disableTimeout && toastConfig.timeout && toastConfig.timeout > 0) {
      this.setAutoCloseTimeout(newToast.id, toastConfig.timeout);
    }
  }

  private setAutoCloseTimeout(id: number, timeout: number): void {
    if (isPlatformBrowser(this.platformId)) {
      const totalDuration = timeout + 300; // Add 300ms for the fadeOut animation
      const timeoutId = setTimeout(() => {
        this.closeToast(id);
        this.timeoutIds.delete(id);
      }, totalDuration);
      this.timeoutIds.set(id, timeoutId);
    }
  }

  closeToast(id: number): void {
    // Clear timeout if exists
    const timeoutId = this.timeoutIds.get(id);
    if (timeoutId) {
      clearTimeout(timeoutId);
      this.timeoutIds.delete(id);
    }

    this.toastQueue.update(queue => queue.filter(toast => toast.id !== id));
  }

  getPosition(): 'top-right' | 'top-left' | 'bottom-left' | 'bottom-right' {
    return this.defaultConfig.position || 'top-right';
  }

  isCloseableOnClick(id: number): boolean {
    const toast = this.toastQueue().find(t => t.id === id);
    return toast?.config.clickToClose !== false; // Default to true if not specified
  }
}