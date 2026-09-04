import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';
import { NgxToastAlertsService, Toast } from './ngx-toast-alerts.service';
import { NgxToastPosition } from './ngx-toast-alerts-config';

interface ToastGroup {
  position: NgxToastPosition;
  toasts: readonly Toast[];
}

/** Mounted by `ToastOverlayService`; never added to a template by hand. */
@Component({
  selector: 'ngx-toast-alerts',
  template: `
    <!-- Live regions must exist before content lands in them to be announced. -->
    <div class="ngx-toast-live" aria-live="polite" aria-atomic="true">
      {{ politeAnnouncement() }}
    </div>
    <div class="ngx-toast-live" aria-live="assertive" aria-atomic="true">
      {{ assertiveAnnouncement() }}
    </div>

    @if (hasBackdrop()) {
      <div class="ngx-toast-backdrop" (click)="onBackdropClick()"></div>
    }

    @for (group of groups(); track group.position) {
      <div class="ngx-toast-container" [attr.data-position]="group.position">
        @for (toast of group.toasts; track toast.id) {
          <div
            class="ngx-toast"
            [attr.data-type]="toast.type"
            [attr.data-position]="group.position"
            [attr.data-radius]="toast.config.radius"
            [class.is-leaving]="toast.leaving"
            [class.is-clickable]="toast.config.clickToClose"
            (click)="onToastClick(toast)"
            (mouseenter)="onPointerEnter(toast)"
            (mouseleave)="onPointerLeave(toast)"
          >
            <span class="ngx-toast__icon" aria-hidden="true">
              @switch (toast.type) {
                @case ('success') {
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M2 13.5 6 17.5 13.5 10" />
                    <path d="M9 13.5 13 17.5 22 8.5" />
                  </svg>
                }
                @case ('error') {
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <circle cx="12" cy="12" r="9" />
                    <path d="M5.6 18.4 18.4 5.6" />
                  </svg>
                }
                @case ('warning') {
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M12 3.5 22 20H2Z" stroke-linejoin="round" />
                    <path d="M12 9.5v4.2" />
                    <path d="M12 17h.01" />
                  </svg>
                }
                @case ('pending') {
                  <svg
                    class="ngx-toast__spinner"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                  >
                    <circle cx="12" cy="12" r="9" opacity="0.3" />
                    <path d="M21 12a9 9 0 0 0-9-9" />
                  </svg>
                }
                @default {
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <circle cx="12" cy="12" r="9" />
                    <path d="M12 11v6" />
                    <path d="M12 7.5h.01" />
                  </svg>
                }
              }
            </span>

            <div class="ngx-toast__body">
              <h3 class="ngx-toast__title">{{ toast.title }}</h3>
              <p class="ngx-toast__message">{{ toast.message }}</p>
            </div>

            @if (toast.config.showCloseButton) {
              <button
                type="button"
                class="ngx-toast__close"
                aria-label="Dismiss notification"
                (click)="onClose($event, toast)"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            }

            @if (showProgress(toast)) {
              <span
                class="ngx-toast__progress"
                [style.animation-duration.ms]="toast.config.timeout"
              ></span>
            }
          </div>
        }
      </div>
    }
  `,
  styleUrls: ['./ngx-toast.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NgxToastAlertsComponent {
  protected readonly toastService = inject(NgxToastAlertsService);

  protected readonly hasBackdrop = this.toastService.hasBackdrop;

  /** Position groups, rendered as one fixed container each. */
  protected readonly groups = computed<ToastGroup[]>(() =>
    [...this.toastService.toastsByPosition()].map(([position, toasts]) => ({
      position,
      toasts,
    })),
  );

  protected readonly politeAnnouncement = computed(() =>
    this.latestAnnouncement('polite'),
  );

  protected readonly assertiveAnnouncement = computed(() =>
    this.latestAnnouncement('assertive'),
  );

  protected showProgress(toast: Toast): boolean {
    return (
      toast.config.showProgress &&
      !toast.config.disableTimeout &&
      toast.config.timeout > 0
    );
  }

  protected onToastClick(toast: Toast): void {
    if (this.toastService.isCloseableOnClick(toast.id)) {
      this.toastService.closeToast(toast.id, 'click');
    }
  }

  protected onClose(event: Event, toast: Toast): void {
    // Never let the close button also trigger the body click handler.
    event.stopPropagation();
    this.toastService.closeToast(toast.id, 'close-button');
  }

  protected onPointerEnter(toast: Toast): void {
    if (toast.config.pauseOnHover) {
      this.toastService.pauseToast(toast.id);
    }
  }

  protected onPointerLeave(toast: Toast): void {
    if (toast.config.pauseOnHover) {
      this.toastService.resumeToast(toast.id);
    }
  }

  /** Dismiss centred toasts when the backdrop is clicked. */
  protected onBackdropClick(): void {
    for (const toast of this.toastService.toasts()) {
      if (
        toast.config.position === 'center' &&
        toast.config.clickToClose &&
        !toast.leaving
      ) {
        this.toastService.closeToast(toast.id, 'backdrop');
      }
    }
  }

  private latestAnnouncement(politeness: 'polite' | 'assertive'): string {
    const toast = this.toastService
      .toasts()
      .find((candidate) => !candidate.leaving && candidate.config.ariaLive === politeness);
    return toast ? `${toast.title}. ${toast.message}` : '';
  }
}
