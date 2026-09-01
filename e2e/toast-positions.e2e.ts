import { expect, test } from '@playwright/test';
import { centreOf, hasNoTransform, Position, ToastPage } from './support/toast-page';

/**
 * Which half of the viewport each position must land in. `null` means the
 * toast should be horizontally centred rather than pinned to a side.
 */
const EXPECTED: Record<Position, { vertical: 'top' | 'bottom'; horizontal: 'left' | 'right' | null }> = {
  'top-left': { vertical: 'top', horizontal: 'left' },
  'top-center': { vertical: 'top', horizontal: null },
  'top-right': { vertical: 'top', horizontal: 'right' },
  'bottom-left': { vertical: 'bottom', horizontal: 'left' },
  'bottom-center': { vertical: 'bottom', horizontal: null },
  'bottom-right': { vertical: 'bottom', horizontal: 'right' },
};

test.describe('positions', () => {
  let toast: ToastPage;

  test.beforeEach(async ({ page }) => {
    toast = new ToastPage(page);
    await toast.goto();
  });

  for (const [position, expected] of Object.entries(EXPECTED) as [
    Position,
    (typeof EXPECTED)[Position],
  ][]) {
    test(`anchors a toast to ${position}`, async ({ page }) => {
      await toast.choosePosition(position);
      await toast.show('info');
      await toast.waitForSettled();

      await expect(toast.newest).toHaveAttribute('data-position', position);

      const viewport = page.viewportSize()!;
      const centre = await centreOf(toast.newest);

      if (expected.vertical === 'top') {
        expect(centre.y).toBeLessThan(viewport.height / 2);
      } else {
        expect(centre.y).toBeGreaterThan(viewport.height / 2);
      }

      if (expected.horizontal === 'left') {
        expect(centre.x).toBeLessThan(viewport.width / 2);
      } else if (expected.horizontal === 'right') {
        expect(centre.x).toBeGreaterThan(viewport.width / 2);
      } else {
        // Centred within a few pixels of the viewport midline.
        expect(Math.abs(centre.x - viewport.width / 2)).toBeLessThan(4);
      }
    });
  }

  test('renders separate stacks for two different positions', async () => {
    await toast.choosePosition('top-left');
    await toast.show('success');

    await toast.choosePosition('bottom-right');
    await toast.show('error');

    await expect(toast.toasts).toHaveCount(2);
    const containers = toast.newest.page().locator('.ngx-toast-container');
    await expect(containers).toHaveCount(2);
  });

  test.describe('the centred toast', () => {
    test('sits in the middle of the viewport', async ({ page }) => {
      await toast.showCentredPersistent();
      await toast.waitForSettled();

      const viewport = page.viewportSize()!;
      const centre = await centreOf(toast.newest);

      expect(Math.abs(centre.x - viewport.width / 2)).toBeLessThan(4);
      expect(Math.abs(centre.y - viewport.height / 2)).toBeLessThan(4);
    });

    test('dims and blurs the page behind it', async () => {
      await toast.showCentredPersistent();

      await expect(toast.backdrop).toBeVisible();
      await expect(toast.backdrop).toHaveCSS(
        'backdrop-filter',
        /blur\(3px\)/,
      );
    });

    test('is dismissed by clicking the backdrop', async ({ page }) => {
      await toast.showCentredPersistent();
      await toast.waitForSettled();

      // Click a corner, far from the toast itself.
      await page.mouse.click(20, 20);

      await expect(toast.toasts).toHaveCount(0);
      await expect(toast.backdrop).toHaveCount(0);
    });

    test('shows no backdrop for an edge toast', async () => {
      await toast.show('info');

      await expect(toast.newest).toBeVisible();
      await expect(toast.backdrop).toHaveCount(0);
    });

    test('springs in from a smaller, blurred state and settles', async () => {
      await toast.showCentred();
      await toast.newest.waitFor({ state: 'visible' });
      const frames = await toast.newest.evaluate((element) => {
        const animation = element
          .getAnimations()
          .find(
            (candidate): candidate is CSSAnimation =>
              'animationName' in candidate &&
              String((candidate as CSSAnimation).animationName).includes(
                'ngx-toast-center-in',
              ),
          );
        if (!animation?.effect) {
          throw new Error('the centred toast has no entrance animation');
        }

        const keyframes = (
          animation.effect as KeyframeEffect
        ).getKeyframes() as unknown as Array<Record<string, unknown>>;
        return {
          name: animation.animationName,
          count: keyframes.length,
          first: {
            transform: String(keyframes[0]['transform'] ?? ''),
            filter: String(keyframes[0]['filter'] ?? ''),
          },
          last: {
            transform: String(keyframes[keyframes.length - 1]['transform'] ?? ''),
            filter: String(keyframes[keyframes.length - 1]['filter'] ?? ''),
          },
        };
      });

      expect(frames.name).toContain('ngx-toast-center-in');
      expect(frames.count).toBeGreaterThanOrEqual(3);

      // Starts scaled down and blurred…
      expect(frames.first.transform).toContain('scale(0.84)');
      expect(frames.first.filter).toBe('blur(12px)');

      // …and ends at natural size, perfectly sharp.
      expect(frames.last.transform).toBe('none');
      expect(frames.last.filter).toBe('blur(0px)');

      await toast.waitForSettled();
      expect(await hasNoTransform(toast.newest)).toBe(true);
    });
  });

  test('keeps the toast inside a narrow mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await toast.goto();
    await toast.show('warning');
    await toast.waitForSettled();

    const box = (await toast.newest.boundingBox())!;
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(375);
  });
});
