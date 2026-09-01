import { expect, Locator, Page } from '@playwright/test';

/** The demo app's default toast timeout, set in `provideNgxToastAlerts`. */
export const DEMO_TIMEOUT = 5000;

/** Matches `TOAST_EXIT_DURATION` in the service. */
export const EXIT_DURATION = 260;

export type ToastType = 'success' | 'error' | 'warning' | 'info' | 'pending';
export type Position =
  | 'top-left'
  | 'top-center'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-center'
  | 'bottom-right';
export type Radius = 'soft' | 'round' | 'pill';

/**
 * Thin page object over the demo app. It exists so the specs read as
 * behaviour rather than selectors.
 */
export class ToastPage {
  readonly toasts: Locator;
  readonly backdrop: Locator;

  constructor(private readonly page: Page) {
    this.toasts = page.locator('.ngx-toast');
    this.backdrop = page.locator('.ngx-toast-backdrop');
  }

  async goto(): Promise<void> {
    await this.page.goto('/');
    // The demo is server-rendered; wait for the client to take over.
    await expect(
      this.page.getByRole('button', { name: 'success' }),
    ).toBeEnabled();
  }

  /** The most recent toast — the queue renders newest first. */
  get newest(): Locator {
    return this.toasts.first();
  }

  async show(type: ToastType): Promise<void> {
    await this.page.getByRole('button', { name: type, exact: true }).click();
  }

  async choosePosition(position: Position): Promise<void> {
    await this.page.getByRole('button', { name: position, exact: true }).click();
  }

  async chooseRadius(radius: Radius): Promise<void> {
    await this.page.getByRole('button', { name: radius, exact: true }).click();
  }

  async showCentred(): Promise<void> {
    await this.page.getByRole('button', { name: 'Centred toast' }).click();
  }

  async showCentredPersistent(): Promise<void> {
    await this.page.getByRole('button', { name: 'Centred, no timeout' }).click();
  }

  async showWithProgress(): Promise<void> {
    await this.page.getByRole('button', { name: 'With progress bar' }).click();
  }

  async showStack(): Promise<void> {
    await this.page.getByRole('button', { name: 'Stack of five' }).click();
  }

  async dismissAll(): Promise<void> {
    await this.page.getByRole('button', { name: 'Dismiss all' }).click();
  }

  /**
   * Wait until every CSS animation on the toast has finished, so geometry
   * assertions see the settled position rather than a mid-flight frame.
   */
  async waitForSettled(toast: Locator = this.newest): Promise<void> {
    await toast.waitFor({ state: 'visible' });
    await toast.evaluate((element) =>
      Promise.all(
        element.getAnimations().map((animation) =>
          // An animation on an element that leaves the DOM rejects with
          // AbortError. That is a settled state too, so do not fail on it.
          animation.finished.catch(() => undefined),
        ),
      ).then(() => undefined),
    );
  }

  /** Apply consumer-style theme overrides, exactly as a user would. */
  async applyTheme(css: string): Promise<void> {
    await this.page.addStyleTag({ content: css });
  }

  async cssOf(toast: Locator, property: string): Promise<string> {
    return toast.evaluate(
      (element, prop) => getComputedStyle(element).getPropertyValue(prop),
      property,
    );
  }
}

/**
 * True when the element has no effective transform. Chromium serialises an
 * untransformed element as either `none` or the identity matrix depending on
 * whether an animation has touched the property, so both must be accepted.
 */
export async function hasNoTransform(locator: Locator): Promise<boolean> {
  const transform = await locator.evaluate(
    (element) => getComputedStyle(element).transform,
  );
  return (
    transform === 'none' ||
    /^matrix\(\s*1,\s*0,\s*0,\s*1,\s*0,\s*0\s*\)$/.test(transform)
  );
}

/** Centre point of a locator's bounding box. */
export async function centreOf(
  locator: Locator,
): Promise<{ x: number; y: number }> {
  const box = await locator.boundingBox();
  if (!box) {
    throw new Error('Element has no bounding box — is it visible?');
  }
  return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
}
