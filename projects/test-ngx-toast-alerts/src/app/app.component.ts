import { Component, inject, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NgxToastAlertsService } from 'ngx-toast-alerts';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
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
    this.toastService.success('This is a success toast!', {
      timeout: 100000,
      position: 'top-left'
    });
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