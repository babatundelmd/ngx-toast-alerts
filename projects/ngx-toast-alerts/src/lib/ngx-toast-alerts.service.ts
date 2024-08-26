import { computed, inject, Injectable, PLATFORM_ID, signal } from '@angular/core';
import { NGX_TOAST_ALERTS_CONFIG, NgxToastAlertsConfig } from './ngx-toast-alerts-config';
import { ToastOverlayService } from './toast-overlay.service';
import { isPlatformBrowser } from '@angular/common';

export interface Toast {
  type: 'success' | 'error' | 'info' | 'pending';
  message: string;
  config: NgxToastAlertsConfig;
}

@Injectable({
  providedIn: 'root'
})
export class NgxToastAlertsService {
  private toastSignal = signal<Toast | null>(null);
  private timeoutId: number | null = null;

  toast = computed(() => this.toastSignal());
  private defaultConfig: NgxToastAlertsConfig = {
    timeout: 3000,
    clickToClose: false,
    position: 'top-right'
  };

  private toastOverlay = inject(ToastOverlayService);
  private platformId = inject(PLATFORM_ID);

  constructor() {
    const injectedConfig = inject(NGX_TOAST_ALERTS_CONFIG, { optional: true });
    if (injectedConfig) {
      this.defaultConfig = { ...this.defaultConfig, ...injectedConfig };
    }
    
    if (isPlatformBrowser(this.platformId)) {
      setTimeout(() => this.toastOverlay.createToastOverlay(), 0);
    }
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
    this.clearTimeout();
    const toastConfig: NgxToastAlertsConfig = { ...this.defaultConfig, ...config };
    const newToast: Toast = { type, message, config: toastConfig };
    this.toastSignal.set(newToast);

    if (!toastConfig.clickToClose) {
      if (toastConfig.timeout && toastConfig.timeout > 0) {
        this.timeoutId = window.setTimeout(() => {
          this.closeToast();
        }, toastConfig.timeout);
      }
    }
  }

  closeToast(): void {
    const currentToast = this.toast();
    if (currentToast) {
      if (currentToast.config.clickToClose) {
        this.toastSignal.set(null);
      } else {
        this.toastSignal.set(null);
      }
      this.clearTimeout();
    }
  }

  getPosition(): 'top-right' | 'top-left' | 'bottom-left' | 'bottom-right' {
    return this.toast()?.config.position || this.defaultConfig.position || 'top-right';
  }

  private clearTimeout(): void {
    if (this.timeoutId !== null) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
  }

  private shouldCloseOnClick(): boolean {
    const currentToast = this.toast();
    return currentToast?.config.clickToClose === true;
  }

  // This method can be used by the component to check if the toast should be closeable on click
  isCloseableOnClick(): boolean {
    return this.shouldCloseOnClick();
  }
}