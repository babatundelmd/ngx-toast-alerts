import { expect, test } from '@playwright/test';
import { DEMO_TIMEOUT, ToastPage } from './support/toast-page';

test.describe('toast lifecycle', () => {
  let toast: ToastPage;

  test.beforeEach(async ({ page }) => {
    toast = new ToastPage(page);
    await toast.goto();
  });

  test('shows a toast with its title and message', async () => {
    await toast.show('success');

    await expect(toast.newest).toBeVisible();
    await expect(toast.newest.locator('.ngx-toast__title')).toHaveText(
      'Success',
    );
    await expect(toast.newest.locator('.ngx-toast__message')).toHaveText(
      'Your changes have been saved',
    );
  });

  test('mounts its own overlay without any markup in the app', async ({
    page,
  }) => {
    // Nothing in app.component.html references the library's component.
    await expect(page.locator('ngx-toast-alerts')).toHaveCount(0);

    await toast.show('info');

    await expect(page.locator('ngx-toast-alerts')).toHaveCount(1);
    await expect(page.locator('body > ngx-toast-alerts')).toHaveCount(1);
  });

  test('settles fully into view after its entrance animation', async () => {
    await toast.show('info');
    await toast.waitForSettled();

    // Mid-animation the card sits outside the viewport; once settled it must
    // be fully within it.
    const box = (await toast.newest.boundingBox())!;
    const viewport = toast.newest.page().viewportSize()!;

    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(viewport.width);
    expect(box.y).toBeGreaterThanOrEqual(0);
    expect(box.y + box.height).toBeLessThanOrEqual(viewport.height);
  });

  test('auto-dismisses after the configured timeout', async () => {
    await toast.show('error');
    await expect(toast.newest).toBeVisible();

    // Still there comfortably before the deadline.
    await toast.newest.page().waitForTimeout(DEMO_TIMEOUT - 2000);
    await expect(toast.toasts).toHaveCount(1);

    await expect(toast.toasts).toHaveCount(0, { timeout: 5000 });
  });

  test('dismisses when the close button is clicked', async () => {
    await toast.show('warning');
    await toast.waitForSettled();

    await toast.newest.locator('.ngx-toast__close').click();

    await expect(toast.toasts).toHaveCount(0);
  });

  test('dismisses when the toast body is clicked', async () => {
    await toast.show('info');
    await toast.waitForSettled();

    await toast.newest.click();

    await expect(toast.toasts).toHaveCount(0);
  });

  test('pauses the dismiss timer while hovered', async ({ page }) => {
    await toast.show('success');
    await toast.waitForSettled();

    await toast.newest.hover();

    // Well past the 5s timeout — hovering must keep it alive.
    await page.waitForTimeout(DEMO_TIMEOUT + 2000);
    await expect(toast.toasts).toHaveCount(1);

    // Move the pointer away; the remaining time resumes and it goes.
    await page.mouse.move(0, 0);
    await expect(toast.toasts).toHaveCount(0, { timeout: 8000 });
  });

  test('stacks five toasts newest first', async () => {
    await toast.showStack();

    await expect(toast.toasts).toHaveCount(5);
    await expect(toast.toasts.first()).toHaveAttribute('data-type', 'pending');
    await expect(toast.toasts.last()).toHaveAttribute('data-type', 'success');
  });

  test('stacks toasts without overlapping', async () => {
    await toast.showStack();
    await expect(toast.toasts).toHaveCount(5);
    await toast.waitForSettled(toast.toasts.last());

    const boxes = await toast.toasts.evaluateAll((elements) =>
      elements.map((element) => element.getBoundingClientRect().top),
    );

    const sorted = [...boxes].sort((a, b) => a - b);
    expect(boxes).toEqual(sorted);
    for (let i = 1; i < boxes.length; i++) {
      expect(boxes[i] - boxes[i - 1]).toBeGreaterThan(0);
    }
  });

  test('dismisses every toast at once', async () => {
    await toast.showStack();
    await expect(toast.toasts).toHaveCount(5);

    await toast.dismissAll();

    await expect(toast.toasts).toHaveCount(0);
  });

  test('runs the progress bar for the toast timeout', async () => {
    await toast.showWithProgress();

    const bar = toast.newest.locator('.ngx-toast__progress');
    await expect(bar).toBeVisible();
    await expect(bar).toHaveCSS('animation-duration', '6s');
  });

  test('does not block clicks on the page behind it', async ({ page }) => {
    await toast.show('info');
    await toast.waitForSettled();

    // The radius chip sits far from the toast; the fixed container must not
    // swallow the click.
    await toast.chooseRadius('pill');

    await expect(
      page.getByRole('button', { name: 'pill', exact: true }),
    ).toHaveClass(/is-active/);
  });
});
