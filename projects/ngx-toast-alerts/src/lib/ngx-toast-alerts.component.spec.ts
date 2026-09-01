import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NgxToastAlertsComponent } from './ngx-toast-alerts.component';
import { NgxToastAlertsService } from './ngx-toast-alerts.service';

describe('NgxToastAlertsComponent', () => {
  let fixture: ComponentFixture<NgxToastAlertsComponent>;
  let service: NgxToastAlertsService;
  let host: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NgxToastAlertsComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(NgxToastAlertsComponent);
    service = TestBed.inject(NgxToastAlertsService);
    host = fixture.nativeElement as HTMLElement;
    await fixture.whenStable();
  });

  /** The toast card rendered inside this fixture (not the auto-mounted overlay). */
  const card = () => host.querySelector<HTMLElement>('.ngx-toast');

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('renders nothing until a toast is queued', () => {
    expect(card()).toBeNull();
  });

  it('renders the title, message and type of a toast', async () => {
    service.success('All good');
    await fixture.whenStable();

    const toast = card();
    expect(toast).not.toBeNull();
    expect(toast!.getAttribute('data-type')).toBe('success');
    expect(toast!.querySelector('.ngx-toast__title')?.textContent?.trim()).toBe(
      'Success',
    );
    expect(toast!.querySelector('.ngx-toast__message')?.textContent?.trim()).toBe(
      'All good',
    );
  });

  it('tags the toast with its position and radius for styling', async () => {
    service.info('Positioned', { position: 'bottom-left', radius: 'pill' });
    await fixture.whenStable();

    expect(card()!.getAttribute('data-position')).toBe('bottom-left');
    expect(card()!.getAttribute('data-radius')).toBe('pill');
  });

  it('renders one container per position in use', async () => {
    service.info('a', { position: 'top-left' });
    service.info('b', { position: 'bottom-right' });
    service.info('c', { position: 'top-left' });
    await fixture.whenStable();

    const containers = host.querySelectorAll('.ngx-toast-container');
    expect(containers).toHaveLength(2);

    const positions = [...containers].map((el) => el.getAttribute('data-position'));
    expect(positions.sort()).toEqual(['bottom-right', 'top-left']);
  });

  it('shows a backdrop for a centred toast', async () => {
    service.center('Middle');
    await fixture.whenStable();

    expect(host.querySelector('.ngx-toast-backdrop')).not.toBeNull();
  });

  it('shows no backdrop for an edge toast', async () => {
    service.info('Edge');
    await fixture.whenStable();

    expect(host.querySelector('.ngx-toast-backdrop')).toBeNull();
  });

  it('dismisses the toast when the close button is clicked', async () => {
    service.info('Close me', { disableTimeout: true });
    await fixture.whenStable();

    host.querySelector<HTMLButtonElement>('.ngx-toast__close')!.click();
    await fixture.whenStable();

    expect(card()!.classList).toContain('is-leaving');
  });

  it('hides the close button when configured off', async () => {
    service.info('No close', { showCloseButton: false });
    await fixture.whenStable();

    expect(host.querySelector('.ngx-toast__close')).toBeNull();
  });

  it('dismisses the toast when the body is clicked', async () => {
    service.info('Click me', { disableTimeout: true });
    await fixture.whenStable();

    card()!.click();
    await fixture.whenStable();

    expect(card()!.classList).toContain('is-leaving');
  });

  it('keeps the toast when clickToClose is off', async () => {
    service.info('Stay', { clickToClose: false, disableTimeout: true });
    await fixture.whenStable();

    card()!.click();
    await fixture.whenStable();

    expect(card()!.classList).not.toContain('is-leaving');
  });

  it('renders a progress bar only when asked', async () => {
    service.info('Silent', { disableTimeout: true });
    await fixture.whenStable();
    expect(host.querySelector('.ngx-toast__progress')).toBeNull();

    service.dismissAll();
    service.success('Counted', { showProgress: true, timeout: 3000 });
    await fixture.whenStable();
    expect(host.querySelector('.ngx-toast__progress')).not.toBeNull();
  });

  it('announces the toast through a live region', async () => {
    service.error('Something broke', { ariaLive: 'assertive' });
    await fixture.whenStable();

    const assertive = host.querySelector('[aria-live="assertive"]');
    expect(assertive?.textContent).toContain('Something broke');
  });

  it('routes a polite toast to the polite region only', async () => {
    service.info('Just so you know');
    await fixture.whenStable();

    expect(host.querySelector('[aria-live="polite"]')?.textContent).toContain(
      'Just so you know',
    );
    expect(
      host.querySelector('[aria-live="assertive"]')?.textContent?.trim(),
    ).toBe('');
  });

  it('keeps both live regions in the DOM before any toast exists', () => {
    // A live region inserted at the same time as its content is not reliably
    // announced, so these must be present from the start.
    expect(host.querySelector('[aria-live="polite"]')).not.toBeNull();
    expect(host.querySelector('[aria-live="assertive"]')).not.toBeNull();
  });

  describe('pause on hover', () => {
    it('pauses and resumes the dismiss timer with the pointer', async () => {
      const pause = vi.spyOn(service, 'pauseToast');
      const resume = vi.spyOn(service, 'resumeToast');

      const id = service.info('Hover me');
      await fixture.whenStable();

      card()!.dispatchEvent(new MouseEvent('mouseenter'));
      expect(pause).toHaveBeenCalledWith(id);

      card()!.dispatchEvent(new MouseEvent('mouseleave'));
      expect(resume).toHaveBeenCalledWith(id);
    });

    it('does nothing on hover when pauseOnHover is off', async () => {
      const pause = vi.spyOn(service, 'pauseToast');
      const resume = vi.spyOn(service, 'resumeToast');

      service.info('Do not pause', { pauseOnHover: false });
      await fixture.whenStable();

      card()!.dispatchEvent(new MouseEvent('mouseenter'));
      card()!.dispatchEvent(new MouseEvent('mouseleave'));

      expect(pause).not.toHaveBeenCalled();
      expect(resume).not.toHaveBeenCalled();
    });
  });

  describe('the centred backdrop', () => {
    it('dismisses the toast when clicked', async () => {
      service.center('Middle', 'info', { disableTimeout: true });
      await fixture.whenStable();

      host.querySelector<HTMLElement>('.ngx-toast-backdrop')!.click();
      await fixture.whenStable();

      expect(card()!.classList).toContain('is-leaving');
    });

    it('leaves a clickToClose:false toast alone', async () => {
      service.center('Sticky', 'info', {
        disableTimeout: true,
        clickToClose: false,
      });
      await fixture.whenStable();

      host.querySelector<HTMLElement>('.ngx-toast-backdrop')!.click();
      await fixture.whenStable();

      expect(card()!.classList).not.toContain('is-leaving');
    });
  });

  it('closes exactly once when the close button is clicked', async () => {
    // The button sits inside the clickable toast body; without
    // stopPropagation the body handler would fire a second close.
    const close = vi.spyOn(service, 'closeToast');
    service.info('Close me', { disableTimeout: true, clickToClose: true });
    await fixture.whenStable();

    host.querySelector<HTMLButtonElement>('.ngx-toast__close')!.click();

    expect(close).toHaveBeenCalledTimes(1);
  });

  it('closes via the button even when clickToClose is off', async () => {
    service.info('Button still works', {
      disableTimeout: true,
      clickToClose: false,
    });
    await fixture.whenStable();

    host.querySelector<HTMLButtonElement>('.ngx-toast__close')!.click();
    await fixture.whenStable();

    expect(card()!.classList).toContain('is-leaving');
  });

  it('gives the close button an accessible label', async () => {
    service.info('Labelled');
    await fixture.whenStable();

    expect(
      host.querySelector('.ngx-toast__close')!.getAttribute('aria-label'),
    ).toBe('Dismiss notification');
  });

  it.each(['success', 'error', 'warning', 'info', 'pending'] as const)(
    'renders an icon for a %s toast',
    async (type) => {
      service.show(type, 'iconography');
      await fixture.whenStable();

      expect(host.querySelector('.ngx-toast__icon svg')).not.toBeNull();
    },
  );

  it('renders a spinning icon for a pending toast only', async () => {
    service.pending('Working…');
    await fixture.whenStable();
    expect(card()!.querySelector('.ngx-toast__spinner')).not.toBeNull();

    // A dismissed toast lingers in the DOM for its exit animation, so scope
    // the second assertion to the newest card rather than the whole host.
    service.dismissAll();
    service.success('Done');
    await fixture.whenStable();
    expect(card()!.querySelector('.ngx-toast__spinner')).toBeNull();
  });

  it('hides the icon from assistive technology', async () => {
    service.info('Decorative icon');
    await fixture.whenStable();

    expect(
      host.querySelector('.ngx-toast__icon')!.getAttribute('aria-hidden'),
    ).toBe('true');
  });

  it('omits the progress bar when the timeout is disabled', async () => {
    // A countdown bar would be a lie with nothing to count down to.
    service.info('No countdown', { showProgress: true, disableTimeout: true });
    await fixture.whenStable();

    expect(host.querySelector('.ngx-toast__progress')).toBeNull();
  });

  it('drives the progress bar duration from the timeout', async () => {
    service.info('Counting', { showProgress: true, timeout: 4000 });
    await fixture.whenStable();

    const bar = host.querySelector<HTMLElement>('.ngx-toast__progress')!;
    expect(bar.style.animationDuration).toBe('4000ms');
  });

  it('marks a clickable toast so the cursor can change', async () => {
    service.info('Clickable', { clickToClose: true });
    await fixture.whenStable();
    expect(card()!.classList).toContain('is-clickable');

    service.dismissAll();
    service.info('Not clickable', { clickToClose: false });
    await fixture.whenStable();
    expect(card()!.classList).not.toContain('is-clickable');
  });
});
