import { computed, inject, Injectable, PLATFORM_ID, signal } from '@angular/core';
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
  private toastQueue = signal<Toast[]>([]);
  private nextId = 0;

  toasts = computed(() => this.toastQueue());
  private defaultConfig: NgxToastAlertsConfig = {
    timeout: 5000,
    clickToClose: true,
    position: 'top-right',
    disableTimeout: false,
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
      setTimeout(() => {
        this.closeToast(id);
      }, totalDuration);
    }
  }

  closeToast(id: number): void {
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