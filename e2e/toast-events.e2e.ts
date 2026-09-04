import { expect, test } from '@playwright/test';
import { ToastPage } from './support/toast-page';

/**
 * The demo wires `onEvent` into a visible log, so these assertions prove the
 * hook fires from the real built package in a real browser — not just that the
 * service calls a spy.
 */
test.describe('the onEvent hook', () => {
  let toast: ToastPage;

  test.beforeEach(async ({ page }) => {
    toast = new ToastPage(page);
    await toast.goto();
  });

  const log = () => toast.newest.page().getByTestId('event-log');
  const rows = () => log().locator('.log__row');

  test('starts empty', async () => {
    await expect(log()).toContainText('Fire a toast');
    await expect(rows()).toHaveCount(0);
  });

  test('reports a toast being shown, with its type', async () => {
    await toast.show('success');

    await expect(rows()).toHaveCount(1);
    await expect(rows().first()).toContainText('shown');
    await expect(rows().first().locator('.log__type')).toHaveText('success');
  });

  test('reports the close button as the dismissal reason', async () => {
    await toast.show('error');
    await toast.waitForSettled();

    await toast.newest.locator('.ngx-toast__close').click();

    await expect(rows().first()).toContainText('dismissed');
    await expect(rows().first()).toContainText('close-button');
  });

  test('reports a body click as the dismissal reason', async () => {
    await toast.show('info');
    await toast.waitForSettled();

    await toast.newest.click();

    await expect(rows().first()).toContainText('click');
  });

  test('reports a backdrop dismissal on a centred toast', async ({ page }) => {
    await toast.showCentredPersistent();
    await toast.waitForSettled();

    await page.mouse.click(20, 20);

    await expect(rows().first()).toContainText('backdrop');
  });

  test('reports a timeout when nobody interacts', async () => {
    await toast.show('warning');

    // The demo's default timeout is 5s; allow for the exit animation.
    await expect(rows().first()).toContainText('timeout', { timeout: 9000 });
  });

  test('reports how long the toast was visible', async () => {
    await toast.show('info');
    await toast.waitForSettled();
    await toast.newest.click();

    const duration = await rows().first().locator('.log__ms').textContent();
    expect(duration).toMatch(/^\d+ms$/);
    expect(parseInt(duration!, 10)).toBeGreaterThan(0);
  });

  test('logs a shown and a dismissed event for one toast', async () => {
    await toast.show('success');
    await toast.waitForSettled();
    await toast.newest.click();

    await expect(rows()).toHaveCount(2);
    await expect(rows().nth(0)).toContainText('dismissed');
    await expect(rows().nth(1)).toContainText('shown');
  });

  test('reports an eviction when the position limit is reached', async () => {
    // The demo caps each position at five; a stack of five then one more
    // pushes the oldest out.
    await toast.showStack();
    await expect(toast.toasts).toHaveCount(5);

    await toast.show('success');

    await expect(log()).toContainText('limit');
  });

  test('keeps the newest events at the top', async () => {
    await toast.show('success');
    await toast.show('error');

    await expect(rows().first().locator('.log__type')).toHaveText('error');
  });

  test('clears the log on request', async ({ page }) => {
    await toast.show('info');
    await expect(rows()).not.toHaveCount(0);

    await page.getByRole('button', { name: 'clear', exact: true }).click();

    await expect(rows()).toHaveCount(0);
    await expect(log()).toContainText('Fire a toast');
  });
});
