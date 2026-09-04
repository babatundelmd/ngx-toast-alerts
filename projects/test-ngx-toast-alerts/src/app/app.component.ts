import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import {
  NgxToastAlertsService,
  NgxToastEvent,
  NgxToastPosition,
  NgxToastRadius,
  NgxToastType,
} from 'ngx-toast-alerts';

interface ApiRow {
  readonly name: string;
  readonly type: string;
  readonly fallback?: string;
  readonly detail: string;
}

interface Feature {
  readonly accent: string;
  readonly title: string;
  readonly detail: string;
}

interface Contributor {
  readonly handle: string;
  readonly name: string;
  readonly role: string;
}

@Component({
  selector: 'app-root',
  imports: [],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {
  private readonly toast = inject(NgxToastAlertsService);

  readonly version = '3.1.0';
  readonly repoUrl = 'https://github.com/babatundelmd/ngx-toast-alerts';
  readonly npmUrl = 'https://www.npmjs.com/package/ngx-toast-alerts';
  readonly installCommand = 'npm install ngx-toast-alerts';

  /**
   * Contributors, newest last. Avatars come from GitHub's own avatar endpoint
   * so no image is committed to the repo and it stays current if someone
   * changes their picture.
   */
  readonly contributors: readonly Contributor[] = [
    {
      handle: 'babatundelmd',
      name: 'Babatunde Lamidi',
      role: 'Author & maintainer',
    },
  ];

  avatarUrl(handle: string): string {
    return `https://github.com/${handle}.png?size=160`;
  }

  profileUrl(handle: string): string {
    return `https://github.com/${handle}`;
  }

  readonly copied = signal(false);

  // --- Playground -----------------------------------------------------------

  /** Ordered as the screen is: top row left→right, then bottom row. */
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

  /** The last few lifecycle events, newest first — this is the hook, live. */
  readonly events = signal<readonly NgxToastEvent[]>([]);

  constructor() {
    this.toast.setConfig({
      onEvent: (event) =>
        this.events.update((log) => [event, ...log].slice(0, 8)),
    });
  }

  clearEvents(): void {
    this.events.set([]);
  }

  private readonly copy: Record<NgxToastType, string> = {
    success: 'Your changes have been saved',
    error: 'We could not reach the server',
    warning: 'Your session expires in 2 minutes',
    info: "It's a default notification state",
    pending: 'Uploading three files…',
  };

  // --- Content --------------------------------------------------------------

  readonly features: readonly Feature[] = [
    {
      accent: 'var(--brand)',
      title: 'Zero setup',
      detail:
        'No module, no provider, no element in your template. Inject the service and call a method — the overlay mounts itself.',
    },
    {
      accent: 'var(--green)',
      title: 'Seven positions',
      detail:
        'Six edges plus a centred toast that springs out of a blur behind a dimmed backdrop. Set it globally or per toast.',
    },
    {
      accent: 'var(--amber)',
      title: 'Themed by CSS variables',
      detail:
        'Every colour, radius, duration and easing is a custom property you set from :root. No ::ng-deep, no !important.',
    },
    {
      accent: 'var(--red)',
      title: 'Signals, zoneless, SSR-safe',
      detail:
        'Built on signals with no zone.js requirement and no @angular/animations. The overlay is only created in the browser.',
    },
    {
      accent: 'var(--amber)',
      title: 'Analytics',
      detail:
        'An onEvent hook tells you when a toast is shown or dismissed, and why. The library collects nothing and sends nothing anywhere — pipe it into whatever you already run.',
    },
    {
      accent: 'var(--slate)',
      title: 'Accessible by default',
      detail:
        'Persistent live regions, a labelled close button, visible focus rings, and a real prefers-reduced-motion path.',
    },
    {
      accent: 'var(--brand)',
      title: 'One dependency',
      detail:
        'Just tslib. No web fonts are fetched, and the whole package is around 23 kB packed.',
    },
  ];

  readonly setupSnippet = `import { bootstrapApplication } from '@angular/platform-browser';
import { provideNgxToastAlerts } from 'ngx-toast-alerts';

bootstrapApplication(AppComponent, {
  providers: [
    provideNgxToastAlerts({
      timeout: 5000,
      position: 'top-right',
      radius: 'round',
    }),
  ],
});`;

  readonly usageSnippet = `import { Component, inject } from '@angular/core';
import { NgxToastAlertsService } from 'ngx-toast-alerts';

@Component({ /* ... */ })
export class SettingsComponent {
  private toast = inject(NgxToastAlertsService);

  save() {
    this.toast.success('Your changes have been saved');
  }

  announce() {
    this.toast.center('Read the full tutorial', 'pending', {
      title: 'Notifications UI design',
    });
  }
}`;

  readonly methods: readonly ApiRow[] = [
    {
      name: 'success(message, config?)',
      type: 'number',
      detail: 'Green toast. Returns the new toast id.',
    },
    { name: 'error(message, config?)', type: 'number', detail: 'Red toast.' },
    {
      name: 'warning(message, config?)',
      type: 'number',
      detail: 'Orange toast.',
    },
    { name: 'info(message, config?)', type: 'number', detail: 'Neutral toast.' },
    {
      name: 'pending(message, config?)',
      type: 'number',
      detail: 'Indigo toast with a spinner.',
    },
    {
      name: 'center(message, type?, config?)',
      type: 'number',
      detail: 'Any type, pinned to the middle of the viewport.',
    },
    {
      name: 'show(type, message, config?)',
      type: 'number',
      detail: 'General entry point.',
    },
    {
      name: 'closeToast(id)',
      type: 'void',
      detail: 'Animate one toast out, then remove it.',
    },
    { name: 'dismissAll()', type: 'void', detail: 'Dismiss every live toast.' },
    {
      name: 'pauseToast(id) / resumeToast(id)',
      type: 'void',
      detail: 'Freeze and resume a dismiss timer.',
    },
    {
      name: 'setConfig(config)',
      type: 'void',
      detail: 'Merge new defaults, applied to toasts shown afterwards.',
    },
    {
      name: 'closeToast(id, reason?)',
      type: 'void',
      detail: "Attribute your own dismissals, e.g. 'programmatic'.",
    },
    {
      name: 'toasts',
      type: 'Signal',
      detail: 'Live toasts, newest first.',
    },
    {
      name: 'toastsByPosition',
      type: 'Signal',
      detail: 'Live toasts grouped by position.',
    },
  ];

  readonly options: readonly ApiRow[] = [
    {
      name: 'timeout',
      type: 'number',
      fallback: '5000',
      detail: 'Milliseconds before auto-dismiss.',
    },
    {
      name: 'disableTimeout',
      type: 'boolean',
      fallback: 'false',
      detail: 'Keep the toast until dismissed explicitly.',
    },
    {
      name: 'clickToClose',
      type: 'boolean',
      fallback: 'true',
      detail: 'Dismiss when the toast body is clicked.',
    },
    {
      name: 'position',
      type: 'NgxToastPosition',
      fallback: "'top-right'",
      detail: 'Any of the seven anchors.',
    },
    {
      name: 'radius',
      type: "'soft' | 'round' | 'pill'",
      fallback: "'round'",
      detail: 'Corner rounding preset.',
    },
    {
      name: 'showCloseButton',
      type: 'boolean',
      fallback: 'true',
      detail: 'Render the close button.',
    },
    {
      name: 'pauseOnHover',
      type: 'boolean',
      fallback: 'true',
      detail: 'Freeze the timer while hovered.',
    },
    {
      name: 'showProgress',
      type: 'boolean',
      fallback: 'false',
      detail: 'Draw a countdown bar.',
    },
    {
      name: 'backdrop',
      type: 'boolean',
      fallback: 'true',
      detail: 'Dim the page behind a centred toast.',
    },
    {
      name: 'maxToasts',
      type: 'number',
      fallback: '5',
      detail: 'Cap per position; oldest are dropped.',
    },
    {
      name: 'title',
      type: 'string',
      fallback: 'per type',
      detail: 'Override the heading.',
    },
    {
      name: 'ariaLive',
      type: "'polite' | 'assertive'",
      fallback: "'polite'",
      detail: 'Announcement politeness.',
    },
    {
      name: 'onEvent',
      type: '(e: NgxToastEvent) => void',
      fallback: 'none',
      detail:
        'Called when a toast is shown or dismissed. Browser only; a throwing handler is caught and logged.',
    },
  ];

  readonly tokens: readonly ApiRow[] = [
    {
      name: '--ngx-toast-surface',
      type: 'colour',
      fallback: '#ffffff',
      detail: 'Card background. Dark mode swaps it automatically.',
    },
    {
      name: '--ngx-toast-radius',
      type: 'length',
      fallback: '20px',
      detail: 'Corner rounding. Beats the radius preset.',
    },
    {
      name: '--ngx-toast-width',
      type: 'length',
      fallback: '400px',
      detail: 'Maximum card width.',
    },
    {
      name: '--ngx-toast-offset',
      type: 'length',
      fallback: '24px',
      detail: 'Distance from the viewport edge.',
    },
    {
      name: '--ngx-toast-success',
      type: 'colour',
      fallback: '#34c88a',
      detail: 'Accent for success — one variable per type.',
    },
    {
      name: '--ngx-toast-enter-duration',
      type: 'time',
      fallback: '460ms',
      detail: 'Entrance animation length.',
    },
    {
      name: '--ngx-toast-font',
      type: 'font stack',
      fallback: 'system UI',
      detail: 'No web font is ever fetched for you.',
    },
    {
      name: '--ngx-toast-z-index',
      type: 'number',
      fallback: '9999',
      detail: 'Stacking order of the overlay.',
    },
  ];

  // --- Actions --------------------------------------------------------------

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

  async copyInstall(): Promise<void> {
    try {
      await navigator.clipboard.writeText(this.installCommand);
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 2000);
    } catch {
      // Clipboard access can be denied; the command stays selectable either way.
      this.toast.error('Could not copy — select the command instead');
    }
  }
}
