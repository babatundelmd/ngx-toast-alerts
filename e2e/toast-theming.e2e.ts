import { expect, test } from '@playwright/test';
import { hasNoTransform, ToastPage } from './support/toast-page';

test.describe('theming', () => {
  let toast: ToastPage;

  test.beforeEach(async ({ page }) => {
    toast = new ToastPage(page);
    await toast.goto();
  });

  test.describe('consumer overrides', () => {
    /**
     * Regression guard. The library used to declare its tokens on `:host`,
     * which compiles to an attribute selector that outranks both `:root` and
     * an `ngx-toast-alerts` rule — so every override was silently discarded.
     * Only a real browser cascade can prove this works.
     */
    test('honours custom properties set on :root', async () => {
      await toast.applyTheme(`
        :root {
          --ngx-toast-radius: 0px;
          --ngx-toast-success: rgb(255, 0, 0);
          --ngx-toast-width: 250px;
        }
      `);

      await toast.show('success');
      await toast.waitForSettled();

      await expect(toast.newest).toHaveCSS('border-radius', '0px');
      await expect(toast.newest.locator('.ngx-toast__icon')).toHaveCSS(
        'background-color',
        'rgb(255, 0, 0)',
      );

      const box = (await toast.newest.boundingBox())!;
      expect(Math.round(box.width)).toBe(250);
    });

    test('honours custom properties set on the host element', async () => {
      await toast.applyTheme(
        'ngx-toast-alerts { --ngx-toast-radius: 2px; --ngx-toast-info: rgb(0, 128, 0); }',
      );

      await toast.show('info');
      await toast.waitForSettled();

      await expect(toast.newest).toHaveCSS('border-radius', '2px');
      await expect(toast.newest.locator('.ngx-toast__icon')).toHaveCSS(
        'background-color',
        'rgb(0, 128, 0)',
      );
    });

    test('honours custom properties set on body', async () => {
      await toast.applyTheme('body { --ngx-toast-radius: 4px; }');

      await toast.show('warning');
      await toast.waitForSettled();

      await expect(toast.newest).toHaveCSS('border-radius', '4px');
    });

    test('an explicit radius token beats the radius preset', async () => {
      await toast.applyTheme(':root { --ngx-toast-radius: 6px; }');

      await toast.chooseRadius('pill');
      await toast.show('info');
      await toast.waitForSettled();

      // `pill` would otherwise apply 999px.
      await expect(toast.newest).toHaveCSS('border-radius', '6px');
    });

    test('falls back to the library defaults with no overrides', async () => {
      await toast.show('success');
      await toast.waitForSettled();

      await expect(toast.newest).toHaveCSS('border-radius', '20px');
      await expect(toast.newest.locator('.ngx-toast__icon')).toHaveCSS(
        'background-color',
        'rgb(52, 200, 138)',
      );
    });
  });

  test.describe('radius presets', () => {
    const presets = [
      { name: 'soft', radius: '12px' },
      { name: 'round', radius: '20px' },
    ] as const;

    for (const preset of presets) {
      test(`${preset.name} rounds the card to ${preset.radius}`, async () => {
        await toast.chooseRadius(preset.name);
        await toast.show('info');
        await toast.waitForSettled();

        await expect(toast.newest).toHaveCSS('border-radius', preset.radius);
      });
    }

    test('pill rounds the card to a full capsule', async () => {
      await toast.chooseRadius('pill');
      await toast.show('info');
      await toast.waitForSettled();

      const box = (await toast.newest.boundingBox())!;
      const radius = await toast.cssOf(toast.newest, 'border-radius');

      // 999px is clamped by the browser to half the shorter side.
      expect(parseFloat(radius)).toBeGreaterThanOrEqual(box.height / 2 - 1);
    });
  });

  test.describe('colour scheme', () => {
    test('uses a light surface in light mode', async ({ page }) => {
      await page.emulateMedia({ colorScheme: 'light' });
      await toast.show('info');
      await toast.waitForSettled();

      await expect(toast.newest).toHaveCSS(
        'background-color',
        'rgb(255, 255, 255)',
      );
    });

    test('uses a dark surface in dark mode', async ({ page }) => {
      await page.emulateMedia({ colorScheme: 'dark' });
      await toast.show('info');
      await toast.waitForSettled();

      await expect(toast.newest).toHaveCSS(
        'background-color',
        'rgb(23, 26, 33)',
      );
    });

    test('a pinned surface token wins in both schemes', async ({ page }) => {
      await toast.applyTheme(':root { --ngx-toast-surface: rgb(10, 20, 30); }');

      await page.emulateMedia({ colorScheme: 'light' });
      await toast.show('info');
      await toast.waitForSettled();
      await expect(toast.newest).toHaveCSS(
        'background-color',
        'rgb(10, 20, 30)',
      );

      await page.emulateMedia({ colorScheme: 'dark' });
      await expect(toast.newest).toHaveCSS(
        'background-color',
        'rgb(10, 20, 30)',
      );
    });
  });

  test.describe('reduced motion', () => {
    test('fades in without moving or scaling', async ({ page }) => {
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await toast.show('info');
      await toast.waitForSettled();

      // A plain opacity fade — no slide, no scale.
      await expect(toast.newest).toHaveCSS('animation-duration', '0.001s');
      await expect(toast.newest).toHaveCSS(
        'animation-name',
        /ngx-toast-fade-in$/,
      );
      expect(await hasNoTransform(toast.newest)).toBe(true);
    });

    test('never leaves the viewport mid-entrance', async ({ page }) => {
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await toast.show('info');

      // The sliding keyframes start 120% off-screen. Under reduced motion the
      // card must never be positioned there, even for a frame.
      const box = (await toast.newest.boundingBox())!;
      const viewport = page.viewportSize()!;
      expect(box.x + box.width).toBeLessThanOrEqual(viewport.width + 1);
    });

    test('keeps the full animation when motion is allowed', async ({ page }) => {
      await page.emulateMedia({ reducedMotion: 'no-preference' });
      await toast.show('info');

      await expect(toast.newest).toHaveCSS('animation-duration', '0.46s');
    });
  });
});
