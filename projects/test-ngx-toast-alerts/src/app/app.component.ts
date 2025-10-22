import { Component, inject, OnInit } from '@angular/core';
import { NgxToastAlertsService } from 'ngx-toast-alerts';

@Component({
    selector: 'app-root',
    imports: [],
    templateUrl: './app.component.html',
    styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {
  readonly title = 'test-ngx-toast-alerts';
  readonly toastService = inject(NgxToastAlertsService);

  ngOnInit(): void {
    // Initialize any necessary setup here
  }

  showSuccessToast(): void {
    this.toastService.success('This is a success toast!', {
      disableTimeout: true
    });
  }

  showErrorToast(): void {
    this.toastService.error('This is an error toast!');
  }

  showInfoToast(): void {
    this.toastService.info('This is an info toast!'); // Uses default config
  }

  showPendingToast(): void {
    this.toastService.pending('This is a pending toast!', {
      clickToClose: true,
    });
  }
}