# ngx-toast-alerts

ngx-toast-alerts is a lightweight, customizable toast notification library for Angular 18+ applications. It provides an easy way to display success, error, info, and pending messages to users without the need to manually add components to your templates.

## Demo

Check out the live demo on StackBlitz: [ngx-toast-alerts Demo](https://stackblitz.com/edit/stackblitz-starters-fysgxq?file=src%2Fmain.ts)

## Features

- Easy to integrate with Angular 18+ applications
- Supports success, error, info, and pending toast types
- Customizable appearance and behavior
- Automatically creates toast overlay without manual template additions
- Compatible with server-side rendering (SSR)
- Uses Angular's latest features including standalone components and `inject` function

## Installation

To install ngx-toast-alerts, run the following command in your Angular project:
```bash
npm install ngx-toast-alerts
```

## Setup

1. In your `main.ts` file, import and provide the ngx-toast-alerts configuration:

```typescript
import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { provideNgxToastAlerts } from 'ngx-toast-alerts';

bootstrapApplication(AppComponent, {
  providers: [
    provideNgxToastAlerts({
      // Optional: Provide default configuration
      timeout: 3000,
      clickToClose: false,
      position: 'top-right'
    })
  ]
}).catch(err => console.error(err));
```

## Usage

To use ngx-toast-alerts in your components:

1. Import the `NgxToastAlertsService` in your component:

```typescript
import { Component, inject } from '@angular/core';
import { NgxToastAlertsService } from 'ngx-toast-alerts';

@Component({
  // ...
})
export class YourComponent {
  private toast = inject(NgxToastAlertsService);

  showSuccessToast() {
    this.toast.success('Operation completed successfully!');
  }

  showErrorToast() {
    this.toast.error('An error occurred.');
  }

  showInfoToast() {
    this.toast.info('Here's some information.');
  }

  showPendingToast() {
    this.toast.pending('Operation in progress...');
  }
}
```

2. Use the injected service to show toasts in your component methods.

## API

### NgxToastAlertsService

The `NgxToastAlertsService` provides the following methods:

- `success(message: string, config?: Partial<ToastConfig>)`: Display a success toast
- `error(message: string, config?: Partial<ToastConfig>)`: Display an error toast
- `info(message: string, config?: Partial<ToastConfig>)`: Display an info toast
- `pending(message: string, config?: Partial<ToastConfig>)`: Display a pending toast

Each method accepts a message string and an optional configuration object.

### ToastConfig

The `ToastConfig` interface allows you to customize individual toasts:

```typescript
interface ToastConfig {
  timeout?: number;        // Duration in milliseconds before the toast disappears
  clickToClose?: boolean;  // Whether the toast can be closed by clicking
  position?: 'top-right' | 'top-left' | 'bottom-left' | 'bottom-right';  // Position of the toast
}
```

## Customization

### Global Configuration

You can provide global configuration when setting up the library in your `main.ts`:

```typescript
provideNgxToastAlerts({
  timeout: 5000,
  clickToClose: true,
  position: 'bottom-right'
})
```

### Per-Toast Configuration

You can override the global configuration for individual toasts:

```typescript
this.toast.success('Custom toast!', {
  timeout: 10000,
  position: 'top-left'
});
```

## Styling

ngx-toast-alerts comes with default styles, but you can customize the appearance by overriding CSS variables in your global styles:

```css
:root {
  --toast-success-bg: #4caf50;
  --toast-success-color: #e7f6e7;
  --toast-error-bg: #f44336;
  --toast-error-color: #fdecea;
  --toast-info-bg: #2196f3;
  --toast-info-color: #e8f4fd;
  --toast-pending-bg: #ffc107;
  --toast-pending-color: #fff8e1;
  --toast-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  --toast-font-family: 'Inter', sans-serif;
}
```

## Server-Side Rendering (SSR)

ngx-toast-alerts is compatible with server-side rendering. The library automatically detects the platform and only creates the toast overlay in browser environments.

## Browser Support

ngx-toast-alerts supports all modern browsers. For older browsers, please ensure you have the necessary polyfills in place.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License.
