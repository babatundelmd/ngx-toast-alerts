import { CommonModule, NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component, HostBinding, inject, effect, OnDestroy } from '@angular/core';
import { NgxToastAlertsService } from './ngx-toast-alerts.service';
import { NgxToastAlertsConfig } from './ngx-toast-alerts-config';

@Component({
  selector: 'ngx-toast-alerts',
  standalone: true,
  imports: [CommonModule, NgClass],
  template: `
    @if (toastService.toast(); as toast) {
      <div class="toast-container" [ngClass]="getPosition()">
        <div class="toast" [ngClass]="toast.type" (click)="closeToast()">
          <div class="content">
            <h3>{{ getTitle(toast.type) }}</h3>
            <p>{{ toast.message }}</p>
          </div>
        </div>
      </div>
    }
  `,
  styleUrls: ['./ngx-toast.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NgxToastAlertsComponent implements OnDestroy {
  @HostBinding('attr.ng-version') version = '1'; 
  toastService = inject(NgxToastAlertsService);
  private timeoutId: number | null = null;

  constructor() {
    effect(() => {
      this.handleToastChange(this.toastService.toast());
    });
  }

  private handleToastChange(toast: ReturnType<typeof this.toastService.toast>) {
    if (this.timeoutId !== null) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }

    if (toast && toast.config.timeout) {
      this.timeoutId = window.setTimeout(() => {
        this.toastService.closeToast();
      }, toast.config.timeout);
    }
  }

  ngOnDestroy() {
    if (this.timeoutId !== null) {
      clearTimeout(this.timeoutId);
    }
  }

  getTitle(type: string): string {
    switch (type) {
      case 'success': return 'Success';
      case 'error': return 'Error';
      case 'info': return 'Information';
      case 'pending': return 'Pending';
      default: return '';
    }
  }

  getPosition(): NgxToastAlertsConfig['position'] {
    return this.toastService.getPosition();
  }

  closeToast() {
    this.toastService.closeToast();
  }
}