/**
 * Captures screenshot baselines FROM THE PROTOTYPE (constitution Principle XI).
 *
 * Run only by a human, then review and approve the PNGs before committing:
 *   npm run test:e2e -- --project=prototype-baseline --update-snapshots
 *
 * Each screen is reached through the prototype's own navigation; content below the page
 * header and data-driven header parts are hidden by prototypeNormalizeCss().
 */
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { expect, test, type Page } from '@playwright/test';
import { SCREENS } from '../fixtures/screens';
import { VIEWPORTS } from '../fixtures/viewports';
import { fontInjectionCss, prototypeNormalizeCss } from './normalize';

const PROTOTYPE_URL = pathToFileURL(path.resolve('docs/Assortment-Tool-Prototype.html')).href;
const FONT_URL = pathToFileURL(path.resolve('src/assets/fonts/ABChanel Corpo Regular.ttf')).href;

async function openNav(page: Page, compact: boolean, label: string) {
  if (compact) {
    await page.locator('.cds-nav-trigger').click();
    await page.locator('.cds-nav-drawer .ant-menu-item', { hasText: label }).click();
    await expect(page.locator('.cds-nav-drawer .ant-drawer-content-wrapper')).toBeHidden();
  } else {
    await page.locator('.cds-side-menu .ant-menu-item', { hasText: label }).click();
  }
}

async function reachScreen(page: Page, id: string, compact: boolean) {
  const screen = SCREENS.find((s) => s.id === id)!;
  if (id === 'door-detail') {
    await openNav(page, compact, 'Doors');
    await page.locator('.cds-content tbody tr[tabindex] td').nth(2).click();
    await expect(page.locator('.cds-page-header__crumbs')).toContainText('Doors');
    return;
  }
  if (id === 'bulk-update') {
    await openNav(page, compact, 'Doors');
    await page.getByRole('button', { name: 'Mass update' }).click();
    await expect(page.locator('h1')).toHaveText('Mass update');
    // The app renamed the screen (spec 003); compare everything but that wording.
    await page.locator('h1').evaluate((h) => (h.textContent = 'Bulk Update'));
    return;
  }
  await openNav(page, compact, screen.navLabel!);
  await expect(page.locator('h1')).toHaveText(screen.title);
}

for (const vp of VIEWPORTS) {
  test.describe(`prototype ${vp.name}`, () => {
    test.use({ viewport: { width: vp.width, height: vp.height } });

    for (const screen of SCREENS) {
      test(`capture ${screen.id}`, async ({ page }) => {
        await page.goto(PROTOTYPE_URL);
        await page.addStyleTag({ content: fontInjectionCss(FONT_URL) });
        await page.locator('.cds-shell').waitFor();
        await expect(
          page.locator('.cds-side-menu .ant-menu-item, .cds-nav-trigger').first(),
        ).toBeVisible();
        if (vp.tier !== 'compact') {
          // The five excluded entries must be the last five of nine before they are hidden.
          await expect(page.locator('.cds-side-menu .ant-menu-item')).toHaveCount(9);
        }
        await reachScreen(page, screen.id, vp.tier === 'compact');
        await page.evaluate(() => document.fonts.ready);
        expect(
          await page.evaluate(() => document.fonts.check('12px "ABChanel Corpo Display"')),
        ).toBe(true);
        await page.addStyleTag({ content: prototypeNormalizeCss(screen.id) });
        await expect(page).toHaveScreenshot(`${screen.id}-${vp.name}.png`);
      });
    }
  });
}
