import { computed, effect, Injectable, signal } from '@angular/core';

export interface Toast {
  type: 'success' | 'error' | 'info' | 'pending';
  message: string;
  config: ToastConfig;
}

export interface ToastConfig {
  timeout?: number;
  clickToClose?: boolean;
  position?: 'top-right' | 'top-left' | 'bottom-left' | 'bottom-right';
}

@Injectable({
  providedIn: 'root'
})
export class NgxToastAlertsService {
  private toastSignal = signal<Toast | null>(null);
  toast = computed(() => this.toastSignal());

  private defaultConfig: ToastConfig = {
    timeout: 3000,
    clickToClose: false,
    position: 'top-right'
  };

  constructor() {
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

  setConfig(config: Partial<ToastConfig>): void {
    this.defaultConfig = { ...this.defaultConfig, ...config };
  }

  success(message: string, config?: Partial<ToastConfig>): void {
    this.show('success', message, config);
  }

  error(message: string, config?: Partial<ToastConfig>): void {
    this.show('error', message, config);
  }

  info(message: string, config?: Partial<ToastConfig>): void {
    this.show('info', message, config);
  }

  pending(message: string, config?: Partial<ToastConfig>): void {
    this.show('pending', message, config);
  }

  private show(type: Toast['type'], message: string, config?: Partial<ToastConfig>): void {
    const toastConfig: ToastConfig = { ...this.defaultConfig, ...config };
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
