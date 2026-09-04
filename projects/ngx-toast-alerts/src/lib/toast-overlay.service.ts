import { ApplicationRef, ComponentRef, createComponent, DestroyRef, DOCUMENT, EnvironmentInjector, inject, PLATFORM_ID, Service } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { NgxToastAlertsComponent } from './ngx-toast-alerts.component';

/** Owns the single `<ngx-toast-alerts>` host appended to `<body>`. */
@Service()
export class ToastOverlayService {
  private componentRef: ComponentRef<NgxToastAlertsComponent> | null = null;

  private readonly appRef = inject(ApplicationRef);
  private readonly injector = inject(EnvironmentInjector);
  private readonly document = inject(DOCUMENT);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  constructor() {
    inject(DestroyRef).onDestroy(() => this.destroyToastOverlay());
  }

  /** Idempotent, and a no-op on the server. */
  createToastOverlay(): void {
    if (!this.isBrowser || this.componentRef) {
      return;
    }

    this.componentRef = createComponent(NgxToastAlertsComponent, {
      environmentInjector: this.injector,
    });

    this.document.body.appendChild(this.componentRef.location.nativeElement);
    this.appRef.attachView(this.componentRef.hostView);
  }


  destroyToastOverlay(): void {
    if (!this.componentRef) {
      return;
    }

    this.appRef.detachView(this.componentRef.hostView);
    this.componentRef.location.nativeElement.remove();
    this.componentRef.destroy();
    this.componentRef = null;
  }
}
