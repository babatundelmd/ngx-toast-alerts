# ngx-toast-alerts

Rounded, animated toast notifications for Angular — including a centred toast
that springs out of a blur.

[![npm](https://img.shields.io/npm/v/ngx-toast-alerts.svg)](https://www.npmjs.com/package/ngx-toast-alerts)
[![downloads](https://img.shields.io/npm/dm/ngx-toast-alerts.svg)](https://www.npmjs.com/package/ngx-toast-alerts)
[![license](https://img.shields.io/npm/l/ngx-toast-alerts.svg)](https://github.com/babatundelmd/ngx-toast-alerts/blob/main/LICENSE)

No template wiring, no module imports, no web fonts. Inject the service and call
a method — the library mounts its own overlay the first time you use it.

## Features

- **Seven positions**, including a centred toast with a dimmed, blurred backdrop.
- **Rounded by design** — `soft`, `round` and `pill` corner presets.
- **Five types**: success, error, warning, info and pending.
- **Signal-driven and zoneless-ready.** No `zone.js` requirement, no
  `provideAnimations()`.
- **SSR-safe.** The overlay is only created in the browser.
- **Themeable** through CSS custom properties, with dark mode out of the box.
- **Accessible** — live-region announcements, a labelled close button, keyboard
  focus styles, and a `prefers-reduced-motion` path.
- **Zero runtime dependencies** beyond `tslib`.

## Installation

```bash
npm install ngx-toast-alerts
```

Requires Angular 22. For Angular 18–19, use `ngx-toast-alerts@2`.

## Setup

**There is none.** The service is `providedIn: 'root'` and mounts its own
overlay into `<body>` the first time you show a toast. After installing, this is
a complete integration:

```ts
import { Component, inject } from '@angular/core';
import { NgxToastAlertsService } from 'ngx-toast-alerts';

@Component({
  selector: 'app-root',
  template: `<button (click)="save()">Save</button>`,
})
export class AppComponent {
  private toast = inject(NgxToastAlertsService);

  save() {
    this.toast.success('Your changes have been saved');
  }
}
```

No module to import, no provider to register, no `<ngx-toast-alerts>` element to
place in a template, and no stylesheet to add to `angular.json`.

### Changing the defaults

Optionally register `provideNgxToastAlerts()` at bootstrap:

```ts
import { bootstrapApplication } from '@angular/platform-browser';
import { provideNgxToastAlerts } from 'ngx-toast-alerts';
import { AppComponent } from './app/app.component';

bootstrapApplication(AppComponent, {
  providers: [
    provideNgxToastAlerts({
      timeout: 5000,
      position: 'top-right',
      radius: 'round',
    }),
  ],
}).catch((err) => console.error(err));
```

It returns `EnvironmentProviders`, so pass it directly rather than spreading it.
It also works in an `NgModule`'s `providers` array if you are not on a
standalone bootstrap.

## Usage

```ts
import { Component, inject } from '@angular/core';
import { NgxToastAlertsService } from 'ngx-toast-alerts';

@Component({ /* ... */ })
export class YourComponent {
  private toast = inject(NgxToastAlertsService);

  save() {
    this.toast.success('Your changes have been saved');
  }

  upload() {
    const id = this.toast.pending('Uploading three files…', {
      disableTimeout: true,
    });

    this.uploads.done.subscribe(() => {
      this.toast.closeToast(id);
      this.toast.success('Upload complete');
    });
  }
}
```

### The centred toast

```ts
this.toast.center('Read the full tutorial to enhance your skills', 'pending', {
  title: 'Notifications UI design',
});
```

It dims and blurs the page behind it and animates in with a spring. Clicking the
backdrop dismisses it; pass `backdrop: false` to skip the dimming.

## Service API

| Member | Description |
| --- | --- |
| `success(message, config?)` | Green toast. Returns the toast id. |
| `error(message, config?)` | Red toast. |
| `warning(message, config?)` | Orange toast. |
| `info(message, config?)` | Neutral toast. |
| `pending(message, config?)` | Indigo toast with a spinner. |
| `center(message, type?, config?)` | Any type, pinned to the centre. |
| `show(type, message, config?)` | General entry point. |
| `closeToast(id)` | Animate one toast out and remove it. |
| `dismissAll()` | Dismiss every live toast. |
| `pauseToast(id)` / `resumeToast(id)` | Freeze and resume a dismiss timer. |
| `setConfig(config)` | Merge new defaults, for toasts shown afterwards. |
| `toasts` | Signal of the live toasts, newest first. |
| `toastsByPosition` | Signal of the live toasts grouped by position. |

## Positions

`top-left` · `top-center` · `top-right` · `bottom-left` · `bottom-center` ·
`bottom-right` · `center`

Position can be set globally or per toast — the two mix freely, and each gets
its own stack with matching entrance and exit animations.

## Configuration

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `timeout` | `number` | `5000` | Milliseconds before auto-dismiss. |
| `disableTimeout` | `boolean` | `false` | Keep the toast until dismissed explicitly. |
| `clickToClose` | `boolean` | `true` | Dismiss when the toast body is clicked. |
| `position` | `NgxToastPosition` | `'top-right'` | Where the toast is anchored. |
| `radius` | `'soft' \| 'round' \| 'pill'` | `'round'` | Corner rounding preset. |
| `showCloseButton` | `boolean` | `true` | Render the × button. |
| `pauseOnHover` | `boolean` | `true` | Freeze the timer while hovered. |
| `showProgress` | `boolean` | `false` | Draw a countdown bar. |
| `backdrop` | `boolean` | `true` | Dim the page behind a `center` toast. |
| `maxToasts` | `number` | `5` | Cap per position; oldest are dropped. |
| `title` | `string` | per type | Override the heading. |
| `ariaLive` | `'polite' \| 'assertive'` | `'polite'` | Announcement politeness. |

## Styling

Set any custom property anywhere above the toast in the tree — `:root` is the
usual place — and it wins. No `::ng-deep`, no `!important`.

```css
:root {
  --ngx-toast-surface: #ffffff;
  --ngx-toast-title-color: #0d1117;
  --ngx-toast-message-color: #6b7280;

  --ngx-toast-radius: 20px;
  --ngx-toast-icon-radius: 14px;
  --ngx-toast-icon-size: 44px;
  --ngx-toast-width: 400px;
  --ngx-toast-offset: 24px;

  --ngx-toast-success: #34c88a;
  --ngx-toast-error: #e0796d;
  --ngx-toast-warning: #efb265;
  --ngx-toast-info: #9aa2ae;
  --ngx-toast-pending: #8fa2f5;

  --ngx-toast-enter-duration: 460ms;
  --ngx-toast-exit-duration: 260ms;

  --ngx-toast-font: 'Inter', system-ui, sans-serif;
  --ngx-toast-z-index: 9999;
}
```

Every value above is a *default*, not a declaration: internally the library
reads `var(--ngx-toast-radius, 20px)` and never declares `--ngx-toast-radius`
itself. That is what lets a `:root` rule beat it.

Dark mode is applied automatically from `prefers-color-scheme`. Setting a
surface token pins that value in both themes; wrap overrides in your own
`@media (prefers-color-scheme: dark)` to theme each mode separately.

## Links

- [Documentation and demo](https://github.com/babatundelmd/ngx-toast-alerts#readme)
- [Changelog](https://github.com/babatundelmd/ngx-toast-alerts/blob/main/CHANGELOG.md)
- [Report an issue](https://github.com/babatundelmd/ngx-toast-alerts/issues)

## License

[MIT](https://github.com/babatundelmd/ngx-toast-alerts/blob/main/LICENSE) ©
Babatunde Lamidi
