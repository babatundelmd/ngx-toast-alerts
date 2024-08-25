import { computed, effect, inject, Injectable, PLATFORM_ID, signal } from '@angular/core';
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
  toast = computed(() => this.toastSignal());
  private defaultConfig: NgxToastAlertsConfig = {
    timeout: 3000,
    clickToClose: true,
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

    effect(() => {
      const currentToast = this.toast();
      if (currentToast) {
        const timeout = currentToast.config.timeout ?? this.defaultConfig.timeout;
        if (timeout && timeout > 0) {
          setTimeout(() => this.toastSignal.set(null), timeout);
        }
      }
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
    this.toastSignal.set({ type, message, config: toastConfig });
  }

  closeToast(): void {
    const currentToast = this.toast();
    if (currentToast && currentToast.config.clickToClose) {
      this.toastSignal.set(null);
    }
  }

  getPosition(): 'top-right' | 'top-left' | 'bottom-left' | 'bottom-right' {
    return this.toast()?.config.position ?? this.defaultConfig.position ?? 'top-right';
  }
}
