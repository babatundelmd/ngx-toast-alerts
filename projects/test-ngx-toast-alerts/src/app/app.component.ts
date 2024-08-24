import { Component, inject, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NgxToastAlertsComponent, NgxToastAlertsService, NgxToastAlertsConfig } from 'ngx-toast-alerts';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NgxToastAlertsComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {
  title = 'test-ngx-toast-alerts';
  toastService = inject(NgxToastAlertsService);

  ngOnInit() {
    // Initialize any necessary setup here
  }

  showSuccessToast() {
    this.toastService.success('This is a success toast!');
  }

  showErrorToast() {
    this.toastService.error('This is an error toast!');
  }

  showInfoToast() {
    this.toastService.info('This is an info toast!');
  }

  showPendingToast() {
    this.toastService.pending('This is a pending toast!');
  }
}