/**
 * Compares the app with baselines captured from the prototype (prototype.capture.ts).
 * Tolerance comes from playwright.config.ts (maxDiffPixelRatio 0.01).
 */
import { expect, test } from '@playwright/test';
import { SCREENS } from '../fixtures/screens';
import { VIEWPORTS } from '../fixtures/viewports';
import { APP_NORMALIZE_CSS } from './normalize';

for (const vp of VIEWPORTS) {
  test.describe(`app ${vp.name}`, () => {
    test.use({ viewport: { width: vp.width, height: vp.height } });

    for (const screen of SCREENS) {
      test(`${screen.id} matches the prototype`, async ({ page }) => {
        await page.goto(`/${screen.hash}`);
        await expect(page.getByRole('heading', { level: 1, name: screen.title })).toBeVisible();
        await page.evaluate(() => document.fonts.ready);
        await page.addStyleTag({ content: APP_NORMALIZE_CSS });
        await expect(page).toHaveScreenshot(`${screen.id}-${vp.name}.png`);
      });
    }
  });
}
