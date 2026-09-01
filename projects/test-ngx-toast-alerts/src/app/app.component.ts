import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import {
  NgxToastAlertsService,
  NgxToastPosition,
  NgxToastRadius,
  NgxToastType,
} from 'ngx-toast-alerts';

@Component({
  selector: 'app-root',
  imports: [],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {
  private readonly toast = inject(NgxToastAlertsService);

  readonly positions: readonly NgxToastPosition[] = [
    'top-left',
    'top-center',
    'top-right',
    'bottom-left',
    'bottom-center',
    'bottom-right',
  ];

  readonly radii: readonly NgxToastRadius[] = ['soft', 'round', 'pill'];

  readonly types: readonly NgxToastType[] = [
    'success',
    'error',
    'warning',
    'info',
    'pending',
  ];

  readonly position = signal<NgxToastPosition>('top-right');
  readonly radius = signal<NgxToastRadius>('round');

  private readonly copy: Record<NgxToastType, string> = {
    success: 'Your changes have been saved',
    error: 'We could not reach the server',
    warning: 'Your session expires in 2 minutes',
    info: "It's a default notification state",
    pending: 'Uploading three files…',
  };

  setPosition(position: NgxToastPosition): void {
    this.position.set(position);
  }

  setRadius(radius: NgxToastRadius): void {
    this.radius.set(radius);
  }

  show(type: NgxToastType): void {
    this.toast.show(type, this.copy[type], {
      position: this.position(),
      radius: this.radius(),
    });
  }

  showCenter(): void {
    this.toast.center('Read the full tutorial to enhance your skills', 'pending', {
      title: 'Notifications UI design',
      radius: this.radius(),
      timeout: 6000,
    });
  }

  showCenterPersistent(): void {
    this.toast.center('Click the backdrop or the × to dismiss me', 'warning', {
      title: 'Sticky centred toast',
      radius: this.radius(),
      disableTimeout: true,
    });
  }

  showProgress(): void {
    this.toast.success('This one shows its countdown', {
      position: this.position(),
      radius: this.radius(),
      showProgress: true,
      timeout: 6000,
    });
  }

  showStack(): void {
    this.types.forEach((type, index) => {
      setTimeout(
        () =>
          this.toast.show(type, this.copy[type], {
            position: this.position(),
            radius: this.radius(),
          }),
        index * 140,
      );
    });
  }

  dismissAll(): void {
    this.toast.dismissAll();
  }
}
