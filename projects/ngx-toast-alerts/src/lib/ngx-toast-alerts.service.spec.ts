import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  NGX_TOAST_ALERTS_CONFIG,
  NgxToastEvent,
  NgxToastEventHandler,
} from './ngx-toast-alerts-config';
import {
  NgxToastAlertsService,
  TOAST_EXIT_DURATION,
} from './ngx-toast-alerts.service';

describe('NgxToastAlertsService', () => {
  let service: NgxToastAlertsService;

  beforeEach(() => {
    vi.useFakeTimers();
    TestBed.configureTestingModule({});
    service = TestBed.inject(NgxToastAlertsService);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  /** Run past the exit animation so a dismissed toast leaves the queue. */
  const flushExit = () => vi.advanceTimersByTime(TOAST_EXIT_DURATION + 1);

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('queues a toast with the type, message and default title', () => {
    service.success('Saved');

    const [toast] = service.toasts();
    expect(toast.type).toBe('success');
    expect(toast.message).toBe('Saved');
    expect(toast.title).toBe('Success');
  });

  it('honours a per-toast title override', () => {
    service.info('Body copy', { title: 'Custom heading' });
    expect(service.toasts()[0].title).toBe('Custom heading');
  });

  it('returns an id that can be used to dismiss the toast', () => {
    const id = service.error('Boom');
    expect(service.toasts()).toHaveLength(1);

    service.closeToast(id);
    flushExit();

    expect(service.toasts()).toHaveLength(0);
  });

  it('auto-dismisses after the configured timeout', () => {
    service.info('Transient', { timeout: 1000 });

    vi.advanceTimersByTime(999);
    expect(service.toasts()).toHaveLength(1);

    vi.advanceTimersByTime(1);
    flushExit();
    expect(service.toasts()).toHaveLength(0);
  });

  it('keeps a toast alive when the timeout is disabled', () => {
    service.warning('Sticky', { disableTimeout: true });

    vi.advanceTimersByTime(60_000);
    expect(service.toasts()).toHaveLength(1);
  });

  it('animates out before removing the toast from the queue', () => {
    const id = service.success('Bye');
    service.closeToast(id);

    expect(service.toasts()[0].leaving).toBe(true);

    flushExit();
    expect(service.toasts()).toHaveLength(0);
  });

  it('freezes the dismiss timer while paused', () => {
    const id = service.info('Hover me', { timeout: 1000 });

    vi.advanceTimersByTime(600);
    service.pauseToast(id);
    vi.advanceTimersByTime(10_000);
    expect(service.toasts()).toHaveLength(1);

    service.resumeToast(id);
    vi.advanceTimersByTime(399);
    expect(service.toasts()).toHaveLength(1);

    vi.advanceTimersByTime(1);
    flushExit();
    expect(service.toasts()).toHaveLength(0);
  });

  it('groups toasts by their own position, not just the global one', () => {
    service.success('A', { position: 'top-left' });
    service.error('B', { position: 'center' });
    service.info('C', { position: 'top-left' });

    const groups = service.toastsByPosition();
    expect([...groups.keys()].sort()).toEqual(['center', 'top-left']);
    expect(groups.get('top-left')).toHaveLength(2);
    expect(groups.get('center')).toHaveLength(1);
  });

  it('drops the oldest toast once the per-position limit is reached', () => {
    for (let i = 0; i < 4; i++) {
      service.info(`toast ${i}`, { maxToasts: 2, disableTimeout: true });
    }

    const messages = service.toasts().map((toast) => toast.message);
    expect(messages).toEqual(['toast 3', 'toast 2']);
  });

  it('counts the limit per position independently', () => {
    service.info('left 1', { position: 'top-left', maxToasts: 1 });
    service.info('center 1', { position: 'center', maxToasts: 1 });

    expect(service.toasts()).toHaveLength(2);
  });

  it('reports a backdrop only for centred toasts that ask for one', () => {
    service.info('edge');
    expect(service.hasBackdrop()).toBe(false);

    service.center('middle');
    expect(service.hasBackdrop()).toBe(true);
  });

  it('does not report a backdrop when the centred toast opts out', () => {
    service.center('middle', 'info', { backdrop: false });
    expect(service.hasBackdrop()).toBe(false);
  });

  it('places centred toasts at the center position', () => {
    service.center('middle', 'warning');

    const [toast] = service.toasts();
    expect(toast.config.position).toBe('center');
    expect(toast.type).toBe('warning');
  });

  it('dismisses every toast at once', () => {
    service.success('one', { disableTimeout: true });
    service.error('two', { disableTimeout: true });

    service.dismissAll();
    flushExit();

    expect(service.toasts()).toHaveLength(0);
  });

  it('ignores a repeated close for the same toast', () => {
    const id = service.info('once');

    service.closeToast(id);
    service.closeToast(id);
    flushExit();

    expect(service.toasts()).toHaveLength(0);
  });

  it('reports whether a toast closes on click', () => {
    const closeable = service.info('yes');
    const fixed = service.info('no', { clickToClose: false });

    expect(service.isCloseableOnClick(closeable)).toBe(true);
    expect(service.isCloseableOnClick(fixed)).toBe(false);
  });

  it('applies later setConfig defaults to new toasts only', () => {
    service.info('before');
    service.setConfig({ position: 'bottom-left' });
    service.info('after');

    const [after, before] = service.toasts();
    expect(after.config.position).toBe('bottom-left');
    expect(before.config.position).toBe('top-right');
  });
});

describe('NgxToastAlertsService types and titles', () => {
  let service: NgxToastAlertsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(NgxToastAlertsService);
  });

  it.each([
    ['success', 'Success'],
    ['error', 'Error'],
    ['warning', 'Warning'],
    ['info', 'Information'],
    ['pending', 'Pending'],
  ] as const)('gives %s the default title %s', (type, title) => {
    service.show(type, 'body');

    const [toast] = service.toasts();
    expect(toast.type).toBe(type);
    expect(toast.title).toBe(title);
  });

  it.each(['success', 'error', 'warning', 'info', 'pending'] as const)(
    'exposes %s as a shorthand method',
    (type) => {
      service[type]('body');
      expect(service.toasts()[0].type).toBe(type);
    },
  );

  it('defaults a centred toast to the info type', () => {
    service.center('no type given');

    expect(service.toasts()[0].type).toBe('info');
    expect(service.toasts()[0].config.position).toBe('center');
  });

  it('lets center() override the position back to an edge', () => {
    // The explicit `position: 'center'` in center() must win over the config.
    service.center('still centred', 'info', { position: 'top-left' });

    expect(service.toasts()[0].config.position).toBe('center');
  });

  it('treats maxToasts of 0 as unlimited', () => {
    for (let i = 0; i < 12; i++) {
      service.info(`toast ${i}`, { maxToasts: 0, disableTimeout: true });
    }

    expect(service.toasts()).toHaveLength(12);
  });

  it('orders the queue newest first', () => {
    service.info('first', { disableTimeout: true });
    service.info('second', { disableTimeout: true });
    service.info('third', { disableTimeout: true });

    expect(service.toasts().map((t) => t.message)).toEqual([
      'third',
      'second',
      'first',
    ]);
  });

  it('hands out a distinct id per toast', () => {
    const ids = [service.info('a'), service.info('b'), service.info('c')];

    expect(new Set(ids).size).toBe(3);
  });

  it('ignores a close for an unknown id', () => {
    service.info('present', { disableTimeout: true });

    expect(() => service.closeToast(9999)).not.toThrow();
    expect(service.toasts()).toHaveLength(1);
  });

  it('ignores pause and resume for an unknown id', () => {
    expect(() => service.pauseToast(9999)).not.toThrow();
    expect(() => service.resumeToast(9999)).not.toThrow();
  });

  it('reports the globally configured position', () => {
    expect(service.getPosition()).toBe('top-right');

    service.setConfig({ position: 'bottom-center' });
    expect(service.getPosition()).toBe('bottom-center');
  });
});

describe('NgxToastAlertsService on the server', () => {
  let service: NgxToastAlertsService;

  beforeEach(() => {
    vi.useFakeTimers();
    TestBed.configureTestingModule({
      providers: [{ provide: PLATFORM_ID, useValue: 'server' }],
    });
    service = TestBed.inject(NgxToastAlertsService);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('still queues toasts so they can be server-rendered', () => {
    service.success('rendered on the server');

    expect(service.toasts()).toHaveLength(1);
  });

  it('never starts a dismiss timer', () => {
    service.info('no timer here', { timeout: 100 });

    vi.advanceTimersByTime(60_000);
    expect(service.toasts()).toHaveLength(1);
  });

  it('removes a closed toast immediately, without waiting on an animation', () => {
    const id = service.info('gone at once');

    service.closeToast(id);
    // No timer advance: on the server there is no exit animation to wait for.
    expect(service.toasts()).toHaveLength(0);
  });

  it('mounts no overlay', () => {
    service.info('server side');

    expect(document.querySelectorAll('ngx-toast-alerts')).toHaveLength(0);
  });
});

describe('NgxToastAlertsService with injected config', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: NGX_TOAST_ALERTS_CONFIG,
          useValue: { position: 'center', radius: 'pill', timeout: 1234 },
        },
      ],
    });
  });

  it('uses the provided defaults', () => {
    const service = TestBed.inject(NgxToastAlertsService);
    service.info('hello');

    const [toast] = service.toasts();
    expect(toast.config.position).toBe('center');
    expect(toast.config.radius).toBe('pill');
    expect(toast.config.timeout).toBe(1234);
    // Unspecified options still fall back to the library defaults.
    expect(toast.config.showCloseButton).toBe(true);
  });
});

describe('NgxToastAlertsService event hooks', () => {
  let service: NgxToastAlertsService;
  let events: NgxToastEvent[];
  let onEvent: NgxToastEventHandler;

  beforeEach(() => {
    vi.useFakeTimers();
    events = [];
    onEvent = (event) => events.push(event);
    TestBed.configureTestingModule({
      providers: [
        { provide: NGX_TOAST_ALERTS_CONFIG, useValue: { onEvent } },
      ],
    });
    service = TestBed.inject(NgxToastAlertsService);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const flushExit = () => vi.advanceTimersByTime(TOAST_EXIT_DURATION + 1);

  it('emits "shown" with the toast details', () => {
    const id = service.success('Saved', { position: 'bottom-left' });

    expect(events).toHaveLength(1);
    expect(events[0]).toEqual(
      expect.objectContaining({
        event: 'shown',
        id,
        type: 'success',
        title: 'Success',
        message: 'Saved',
        position: 'bottom-left',
      }),
    );
    expect(typeof events[0].at).toBe('number');
  });

  it('does not attach a reason or duration to "shown"', () => {
    service.info('hello');

    expect(events[0].reason).toBeUndefined();
    expect(events[0].visibleFor).toBeUndefined();
  });

  it('emits "dismissed" with reason "timeout" when it expires', () => {
    service.info('transient', { timeout: 1000 });
    vi.advanceTimersByTime(1000);

    const dismissed = events.filter((event) => event.event === 'dismissed');
    expect(dismissed).toHaveLength(1);
    expect(dismissed[0].reason).toBe('timeout');
  });

  it('emits "dismissed" with reason "programmatic" by default', () => {
    const id = service.info('bye', { disableTimeout: true });
    service.closeToast(id);

    expect(events.at(-1)).toEqual(
      expect.objectContaining({ event: 'dismissed', reason: 'programmatic' }),
    );
  });

  it('passes an explicit reason through closeToast', () => {
    const id = service.info('bye', { disableTimeout: true });
    service.closeToast(id, 'close-button');

    expect(events.at(-1)?.reason).toBe('close-button');
  });

  it('emits "dismissed" with reason "limit" when a toast is evicted', () => {
    service.info('first', { maxToasts: 1, disableTimeout: true });
    service.info('second', { maxToasts: 1, disableTimeout: true });

    const evicted = events.find((event) => event.reason === 'limit');
    expect(evicted).toBeDefined();
    expect(evicted?.message).toBe('first');
  });

  it('reports how long the toast was visible', () => {
    const id = service.info('lingering', { disableTimeout: true });
    vi.advanceTimersByTime(1500);
    service.closeToast(id);

    expect(events.at(-1)?.visibleFor).toBeGreaterThanOrEqual(1500);
  });

  it('emits one dismissal per toast for dismissAll', () => {
    service.info('a', { disableTimeout: true });
    service.info('b', { disableTimeout: true });
    events.length = 0;

    service.dismissAll();

    expect(events).toHaveLength(2);
    expect(events.every((event) => event.event === 'dismissed')).toBe(true);
  });

  it('does not emit twice when a toast is closed repeatedly', () => {
    const id = service.info('once', { disableTimeout: true });
    service.closeToast(id);
    service.closeToast(id);
    flushExit();

    expect(events.filter((event) => event.event === 'dismissed')).toHaveLength(1);
  });

  it('survives a handler that throws', () => {
    const consoleError = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);

    service.setConfig({
      onEvent: () => {
        throw new Error('analytics is down');
      },
    });

    // Rendering must be unaffected by a broken handler.
    expect(() => service.success('still works')).not.toThrow();
    expect(service.toasts()).toHaveLength(1);
    expect(consoleError).toHaveBeenCalled();

    consoleError.mockRestore();
  });

  it('accepts a per-toast handler that overrides the global one', () => {
    const local: NgxToastEvent[] = [];
    service.info('scoped', { onEvent: (event) => local.push(event) });

    expect(local).toHaveLength(1);
    expect(events).toHaveLength(0);
  });
});

describe('NgxToastAlertsService event hooks on the server', () => {
  it('never emits, so hydration cannot double-count a toast', () => {
    const events: NgxToastEvent[] = [];
    TestBed.configureTestingModule({
      providers: [
        { provide: PLATFORM_ID, useValue: 'server' },
        {
          provide: NGX_TOAST_ALERTS_CONFIG,
          useValue: { onEvent: (event: NgxToastEvent) => events.push(event) },
        },
      ],
    });

    const service = TestBed.inject(NgxToastAlertsService);
    service.success('rendered on the server');
    service.dismissAll();

    expect(service.toasts()).toHaveLength(0);
    expect(events).toHaveLength(0);
  });
});
