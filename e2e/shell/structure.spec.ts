import { expect, test } from '@playwright/test';
import { EXCLUDED_HASHES, NAV_LABELS, SCREENS } from '../fixtures/screens';

const mainNav = (page: import('@playwright/test').Page) =>
  page.getByRole('navigation', { name: 'Main' });

test.use({ viewport: { width: 1366, height: 768 } });

test.describe('frame', () => {
  test('matches the prototype frame at a standard viewport', async ({ page }) => {
    await page.goto('/#/');
    await expect(page.getByRole('heading', { level: 1, name: 'Overview' })).toBeVisible();

    const header = page.getByTestId('app-header');
    expect((await header.boundingBox())?.height).toBe(56);

    const appName = page.getByTestId('app-name');
    await expect(appName).toHaveText('Assortment tool');
    await expect(appName).toHaveCSS('text-transform', 'uppercase');
    expect(await appName.evaluate((el) => getComputedStyle(el).fontFamily)).toMatch(
      /^"?ABChanel Corpo Display/,
    );

    await expect(mainNav(page).getByRole('link')).toHaveText([...NAV_LABELS]);
    const overview = mainNav(page).getByRole('link', { name: 'Overview' });
    await expect(overview).toHaveAttribute('aria-current', 'page');
    await expect(overview).toHaveCSS('background-color', 'rgb(5, 5, 5)');
    await expect(overview).toHaveCSS('color', 'rgb(255, 255, 255)');
    await expect(page.locator('.cds-root')).toHaveCSS('background-color', 'rgb(247, 246, 244)');

    const sideLabel = overview.locator('.cds-side-label');
    await expect(sideLabel).toHaveCSS('text-transform', 'none');
    expect(await sideLabel.evaluate((el) => getComputedStyle(el).fontFamily)).toMatch(
      /^"?ABChanel Corpo Text/,
    );

    await expect(page.getByTestId('page-title')).toHaveCSS('text-transform', 'uppercase');
    await page.evaluate(() => document.fonts.ready);
    expect(await page.evaluate(() => document.fonts.check('12px "ABChanel Corpo Display"'))).toBe(
      true,
    );
  });
});

test.describe('navigation', () => {
  test('nav links switch screens, survive reload, and set the title', async ({ page }) => {
    await page.goto('/#/');
    for (const label of NAV_LABELS) {
      await mainNav(page).getByRole('link', { name: label }).click();
      const screen = SCREENS.find((s) => s.navLabel === label && !s.breadcrumb)!;
      await expect(page.getByRole('heading', { level: 1, name: screen.title })).toBeVisible();
      expect(new URL(page.url()).hash).toBe(screen.hash);
      await expect(mainNav(page).getByRole('link', { name: label })).toHaveAttribute(
        'aria-current',
        'page',
      );
      await expect(page.locator('[aria-current="page"]')).toHaveCount(1);
      await page.reload();
      await expect(page.getByRole('heading', { level: 1, name: screen.title })).toBeVisible();
    }
  });

  for (const screen of SCREENS) {
    test(`${screen.hash} shows its header, selection, and title`, async ({ page }) => {
      await page.goto(`/${screen.hash}`);
      await expect(page.getByRole('heading', { level: 1, name: screen.title })).toBeVisible();
      await expect(page.getByTestId('page-eyebrow')).toHaveText(screen.eyebrow!);
      await expect(mainNav(page).getByRole('link', { name: screen.navLabel })).toHaveAttribute(
        'aria-current',
        'page',
      );
      await expect(page).toHaveTitle(`${screen.title} · Assortment tool`);
      // Doors and Bulk Update have content since spec 003; the other screens are still placeholders.
      if (!['doors', 'bulk-update'].includes(screen.id)) {
        await expect(page.getByTestId('screen-placeholder')).toContainText(
          'Coming in a later spec',
        );
      }
    });
  }

  test('sub-screens show a Doors breadcrumb that returns to Doors', async ({ page }) => {
    for (const hash of ['#/doors/bulk-update', '#/doors/D-001']) {
      await page.goto(`/${hash}`);
      const crumbs = page.getByRole('navigation', { name: 'Breadcrumb' });
      await crumbs.getByRole('link', { name: 'Doors' }).click();
      await expect(page.getByRole('heading', { level: 1, name: 'Doors' })).toBeVisible();
      expect(new URL(page.url()).hash).toBe('#/doors');
    }
  });

  for (const hash of EXCLUDED_HASHES) {
    test(`${hash} is not found and links back to Overview`, async ({ page }) => {
      await page.goto(`/${hash}`);
      await expect(page.getByRole('heading', { level: 1, name: 'Page not found' })).toBeVisible();
      await expect(page).toHaveTitle('Page not found · Assortment tool');
      await expect(page.locator('[aria-current="page"]')).toHaveCount(0);
      await page.getByRole('link', { name: 'Go to Overview' }).click();
      await expect(page.getByRole('heading', { level: 1, name: 'Overview' })).toBeVisible();
    });
  }

  test('back and forward restore screen and selection', async ({ page }) => {
    await page.goto('/#/');
    await mainNav(page).getByRole('link', { name: 'Doors' }).click();
    await mainNav(page).getByRole('link', { name: 'Exceptions' }).click();
    await page.goBack();
    await expect(page.getByRole('heading', { level: 1, name: 'Doors' })).toBeVisible();
    await expect(mainNav(page).getByRole('link', { name: 'Doors' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    await page.goForward();
    await expect(page.getByRole('heading', { level: 1, name: 'Exceptions' })).toBeVisible();
  });
});
