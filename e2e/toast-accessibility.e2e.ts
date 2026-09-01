import { expect, test } from '@playwright/test';
import { ToastPage } from './support/toast-page';

test.describe('accessibility', () => {
  let toast: ToastPage;

  test.beforeEach(async ({ page }) => {
    toast = new ToastPage(page);
    await toast.goto();
  });

  test('announces the toast through a live region', async ({ page }) => {
    // The regions must already exist — content inserted at the same moment as
    // its live region is not reliably announced.
    await expect(page.locator('[aria-live="polite"]')).toHaveCount(0);

    await toast.show('error');

    const polite = page.locator('[aria-live="polite"]');
    await expect(polite).toHaveCount(1);
    await expect(polite).toContainText('We could not reach the server');
  });

  test('keeps the live region present after the toast is gone', async ({
    page,
  }) => {
    await toast.show('info');
    await expect(page.locator('[aria-live="polite"]')).toHaveCount(1);

    await toast.dismissAll();
    await expect(toast.toasts).toHaveCount(0);

    await expect(page.locator('[aria-live="polite"]')).toHaveCount(1);
  });

  test('hides the decorative icon from assistive technology', async () => {
    await toast.show('success');

    await expect(toast.newest.locator('.ngx-toast__icon')).toHaveAttribute(
      'aria-hidden',
      'true',
    );
  });

  test('gives the close button an accessible name', async () => {
    await toast.show('info');

    await expect(
      toast.newest.getByRole('button', { name: 'Dismiss notification' }),
    ).toBeVisible();
  });

  test('dismisses from the keyboard', async ({ page }) => {
    await toast.showCentredPersistent();
    await toast.waitForSettled();

    const close = toast.newest.getByRole('button', {
      name: 'Dismiss notification',
    });
    await close.focus();
    await expect(close).toBeFocused();

    await page.keyboard.press('Enter');

    await expect(toast.toasts).toHaveCount(0);
  });

  test('the close button is reachable by tabbing, and shows a focus ring', async ({
    page,
  }) => {
    await toast.showCentredPersistent();
    await toast.waitForSettled();

    const close = toast.newest.getByRole('button', {
      name: 'Dismiss notification',
    });

    // The overlay is appended to the end of <body>, so the toast's button
    // comes after the page controls in tab order.
    for (let i = 0; i < 40; i++) {
      await page.keyboard.press('Tab');
      if (await close.evaluate((el) => el === document.activeElement)) {
        break;
      }
    }

    await expect(close).toBeFocused();

    // :focus-visible only matches for genuine keyboard focus, which is why
    // this is asserted after tabbing rather than after a programmatic focus().
    await expect(close).toHaveCSS('outline-width', '2px');
    await expect(close).toHaveCSS('outline-style', 'solid');
  });

  test('meets the AA contrast floor for the toast title', async () => {
    await toast.show('info');
    await toast.waitForSettled();

    const contrast = await toast.newest.evaluate((element) => {
      const title = element.querySelector('.ngx-toast__title')!;
      const parse = (value: string) =>
        value.match(/\d+(\.\d+)?/g)!.slice(0, 3).map(Number);

      const relativeLuminance = ([r, g, b]: number[]) => {
        const channel = (c: number) => {
          const s = c / 255;
          return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
        };
        return (
          0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b)
        );
      };

      const fg = relativeLuminance(parse(getComputedStyle(title).color));
      const bg = relativeLuminance(
        parse(getComputedStyle(element).backgroundColor),
      );
      const [light, dark] = fg > bg ? [fg, bg] : [bg, fg];
      return (light + 0.05) / (dark + 0.05);
    });

    expect(contrast).toBeGreaterThanOrEqual(4.5);
  });
});
