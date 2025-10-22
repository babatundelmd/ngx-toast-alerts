import { ApplicationRef, ComponentRef, createComponent, DestroyRef, EnvironmentInjector, Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { NgxToastAlertsComponent } from './ngx-toast-alerts.component';

@Injectable({ providedIn: 'root' })
export class ToastOverlayService {
  private toastComponentRef: ComponentRef<NgxToastAlertsComponent> | null = null;
  private readonly appRef = inject(ApplicationRef);
  private readonly injector = inject(EnvironmentInjector);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    // Cleanup component on destroy
    this.destroyRef.onDestroy(() => {
      if (this.toastComponentRef) {
        this.appRef.detachView(this.toastComponentRef.hostView);
        this.toastComponentRef.destroy();
        this.toastComponentRef = null;
      }
    });
  }

  createToastOverlay(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    if (this.toastComponentRef) {
      return;
    }

    // Create the component
    this.toastComponentRef = createComponent(NgxToastAlertsComponent, {
      environmentInjector: this.injector,
      elementInjector: this.injector
    });

    // Attach the component to the app
    document.body.appendChild(this.toastComponentRef.location.nativeElement);

    // Attach the component to the application change detection mechanism
    this.appRef.attachView(this.toastComponentRef.hostView);
  }
}