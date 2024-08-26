import { CommonModule, NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component, HostBinding, inject } from '@angular/core';
import { NgxToastAlertsService } from './ngx-toast-alerts.service';
import { NgxToastAlertsConfig } from './ngx-toast-alerts-config';

@Component({
  selector: 'ngx-toast-alerts',
  standalone: true,
  imports: [CommonModule, NgClass],
  template: `
    @if (toastService.toast(); as toast) {
      <div class="toast-container" [ngClass]="getPosition()">
        <div class="toast" [ngClass]="toast.type" (click)="closeToast(toast.config)">
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
export class NgxToastAlertsComponent {
  @HostBinding('attr.ng-version') version = '1'; 
  toastService = inject(NgxToastAlertsService);

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

  closeToast(config: NgxToastAlertsConfig) {
    if (config.clickToClose) {
      this.toastService.closeToast();
    }
  }
}