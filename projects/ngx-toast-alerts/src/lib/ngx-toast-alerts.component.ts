import { CommonModule, NgClass } from '@angular/common';
import { Component, inject } from '@angular/core';
import { NgxToastAlertsService } from './ngx-toast-alerts.service'

@Component({
  selector: 'ngx-toast-alerts',
  standalone: true,
  imports: [CommonModule, NgClass],
  template: `
    @if (toastService.toast()) {
      <div class="toast-container">
        
        <div class="toast" [ngClass]="toastService.toast()?.type">
          <div class="content">
            <h3>{{ getTitle() }}</h3>
            <p>{{ toastService.toast()!.message }}</p>
          </div>
        </div>
      </div>
    }
  `,
  styleUrls: ['./ngx-toast.component.scss'],
})
export class NgxToastAlertsComponent {
  toastService = inject(NgxToastAlertsService);

  getTitle(): string {
    switch (this.toastService.toast()?.type) {
      case 'success': return 'Success';
      case 'error': return 'Error';
      case 'info': return 'Information';
      case 'pending': return 'Pending';
      default: return '';
    }
  }

}