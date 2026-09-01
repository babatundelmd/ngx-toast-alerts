# ngx-toast-alerts

Rounded, animated toast notifications for Angular — including a centred toast
that springs out of a blur.

[![npm](https://img.shields.io/npm/v/ngx-toast-alerts.svg)](https://www.npmjs.com/package/ngx-toast-alerts)
[![downloads](https://img.shields.io/npm/dm/ngx-toast-alerts.svg)](https://www.npmjs.com/package/ngx-toast-alerts)
[![license](https://img.shields.io/npm/l/ngx-toast-alerts.svg)](LICENSE)

No template wiring, no module imports, no web fonts. Inject the service and call
a method — the library mounts its own overlay the first time you use it.

```ts
private toast = inject(NgxToastAlertsService);

this.toast.success('Your changes have been saved');
this.toast.center('Read the full tutorial', 'pending', { title: 'Notifications UI' });
```

## Contents

- [Features](#features)
- [Installation](#installation)
- [Setup](#setup)
- [Usage](#usage)
- [Positions](#positions)
- [Configuration](#configuration)
- [Styling](#styling)
- [Accessibility](#accessibility)
- [Server-side rendering](#server-side-rendering)
- [Compatibility](#compatibility)
- [Contributing](#contributing)

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
- **Zero runtime dependencies** beyond `tslib`. No web fonts are fetched.

## Installation

```bash
npm install ngx-toast-alerts
```

## Setup

**There is none.** The service is `providedIn: 'root'` and mounts its own
overlay into `<body>` the first time you show a toast. After installing, this is
a complete, working integration:

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
place in a template, and no stylesheet to add to `angular.json` — the styles are
bundled with the component.

### Changing the defaults

Optionally, register `provideNgxToastAlerts()` at bootstrap to set defaults for
the whole application:

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
You can also change the defaults at runtime with `toast.setConfig({ ... })`, or
override any option on a single toast.

### Using an `NgModule` app

The library ships standalone components, but nothing here requires a standalone
app. Register the defaults in your root module and inject the service exactly
the same way:

```ts
@NgModule({
  providers: [provideNgxToastAlerts({ position: 'center' })],
})
export class AppModule {}
```

## Usage

Inject `NgxToastAlertsService` and call one of the type methods. Each returns the
new toast's id.

```ts
import { Component, inject } from '@angular/core';
import { NgxToastAlertsService } from 'ngx-toast-alerts';

@Component({ /* ... */ })
export class YourComponent {
  private toast = inject(NgxToastAlertsService);

  save() {
    this.toast.success('Your changes have been saved');
  }

  fail() {
    this.toast.error('We could not reach the server', { timeout: 8000 });
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

`center()` anchors the toast to the middle of the viewport, dims and blurs the
page behind it, and animates it in with a spring.

```ts
this.toast.center('Read the full tutorial to enhance your skills', 'pending', {
  title: 'Notifications UI design',
});

// Equivalent to:
this.toast.show('pending', '…', { position: 'center' });
```

Clicking the backdrop dismisses the toast unless `clickToClose: false` is set.
Pass `backdrop: false` for a centred toast with no dimming.

### Service API

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

Position can be set globally or per toast — the two mix freely, and each
position gets its own stack with an entrance and exit animation to match.

```ts
this.toast.info('Global position');
this.toast.info('Bottom left, just this once', { position: 'bottom-left' });
```

## Configuration

Every option can be set globally in `provideNgxToastAlerts()` or overridden on a
single toast.

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

The library ships one stylesheet driven entirely by custom properties. Set any
of them anywhere above the toast in the tree — `:root` is the usual place — and
it wins. No `::ng-deep`, no `!important`, no stylesheet to register.

```css
:root {
  /* Surface */
  --ngx-toast-surface: #ffffff;
  --ngx-toast-title-color: #0d1117;
  --ngx-toast-message-color: #6b7280;

  /* Shape */
  --ngx-toast-radius: 20px;
  --ngx-toast-icon-radius: 14px;
  --ngx-toast-icon-size: 44px;
  --ngx-toast-width: 400px;
  --ngx-toast-offset: 24px;

  /* Type accents */
  --ngx-toast-success: #34c88a;
  --ngx-toast-error: #e0796d;
  --ngx-toast-warning: #efb265;
  --ngx-toast-info: #9aa2ae;
  --ngx-toast-pending: #8fa2f5;

  /* Motion */
  --ngx-toast-enter-duration: 460ms;
  --ngx-toast-exit-duration: 260ms;

  --ngx-toast-font: 'Inter', system-ui, sans-serif;
  --ngx-toast-z-index: 9999;
}
```

The full set also covers the shadow, the backdrop colour and blur, the easing
curves, and the close button colours — see
[`ngx-toast.component.scss`](projects/ngx-toast-alerts/src/lib/ngx-toast.component.scss).

Every value above is a *default*, not a declaration: internally the library
reads `var(--ngx-toast-radius, 20px)` and never declares `--ngx-toast-radius`
itself. That is what lets a `:root` rule beat it — a token declared on the
component host would outrank both `:root` and an `ngx-toast-alerts` selector.

Dark mode is applied automatically from `prefers-color-scheme`. Setting a
surface token yourself pins that value in **both** themes, which is the point —
you have opted out of the automatic switch. To theme each mode separately, wrap
your overrides in your own media query:

```css
@media (prefers-color-scheme: dark) {
  :root {
    --ngx-toast-surface: #101418;
  }
}
```

> **Changing the exit duration?** `--ngx-toast-exit-duration` only affects the
> animation. The service waits a fixed 260ms before removing the element, so a
> longer exit animation will be cut short.

## Accessibility

- Toasts are announced through live regions that are present in the DOM before
  any toast is inserted, so they are reliably read out.
- `ariaLive: 'assertive'` interrupts; the default `'polite'` waits.
- The close button carries an accessible label and a visible focus ring.
- Under `prefers-reduced-motion: reduce`, entrance and exit animations are
  reduced to a fade and the hover lift is dropped.

## Server-side rendering

The library is SSR-safe. `ToastOverlayService` checks the platform and only
mounts the overlay in the browser, and dismiss timers never start on the server.
No extra configuration is required.

## Compatibility

| ngx-toast-alerts | Angular |
| --- | --- |
| 3.x | 22 |
| 2.x | 18 – 19 |

## Contributing

Contributions are welcome — see [CONTRIBUTING.md](CONTRIBUTING.md) and the
[Code of Conduct](CODE_OF_CONDUCT.md).

```bash
git clone https://github.com/babatundelmd/ngx-toast-alerts.git
cd ngx-toast-alerts
npm install

npm run build     # build the library
npm test          # run the library tests
npm start         # serve the demo app on :4200
```

The demo app under `projects/test-ngx-toast-alerts` exercises every position,
radius and type — it is the fastest way to see a change.

## License

[MIT](LICENSE) © Babatunde Lamidi
