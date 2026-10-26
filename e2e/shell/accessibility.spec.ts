import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { MATRIX_PAGES } from '../fixtures/screens';

const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];

const axe = async (page: Page) => {
  const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
  expect(
    results.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`),
  ).toEqual([]);
};

for (const viewport of [
  { width: 390, height: 844 },
  { width: 1366, height: 768 },
]) {
  test.describe(`axe at ${viewport.width}px`, () => {
    test.use({ viewport });
    for (const screen of MATRIX_PAGES) {
      test(`${screen.id} has no WCAG 2.1 AA violations`, async ({ page }) => {
        await page.goto(`/${screen.hash}`);
        await expect(page.getByRole('heading', { level: 1, name: screen.title })).toBeVisible();
        await axe(page);
      });
    }
  });
}

test.describe('keyboard', () => {
  test.use({ viewport: { width: 1366, height: 768 } });

  test('the first Tab reaches the skip link, which moves focus to main', async ({ page }) => {
    await page.goto('/#/doors');
    await expect(page.getByRole('heading', { level: 1, name: 'Doors' })).toBeVisible();
    await page.keyboard.press('Tab');
    const skip = page.getByRole('link', { name: 'Skip to main content' });
    await expect(skip).toBeFocused();
    await expect(skip).toBeInViewport();
    await page.keyboard.press('Enter');
    await expect(page.getByRole('main')).toBeFocused();
    expect(new URL(page.url()).hash).toBe('#/doors');
  });

  test('focused controls show the 3 px ink focus ring', async ({ page }) => {
    await page.goto('/#/');
    await expect(page.getByRole('heading', { level: 1, name: 'Overview' })).toBeVisible();
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    const toggle = page.getByTestId('rail-toggle');
    await expect(toggle).toBeFocused();
    await expect(toggle).toHaveCSS('outline-width', '3px');
    await expect(toggle).toHaveCSS('outline-color', 'rgb(5, 5, 5)');
    await expect(toggle).toHaveCSS('outline-offset', '2px');

    const doors = page.getByRole('link', { name: 'Doors' });
    await doors.focus();
    await expect(doors).toHaveCSS('outline-width', '3px');

    const overview = page.getByRole('link', { name: 'Overview' });
    await overview.focus();
    await expect(overview).toHaveCSS('outline-color', 'rgb(255, 255, 255)');
    await expect(overview).toHaveCSS('outline-offset', '-2px');
  });

  test('reduced motion removes navigation transitions', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/#/');
    const duration = await page
      .getByRole('link', { name: 'Doors' })
      .evaluate((el) => getComputedStyle(el).transitionDuration);
    for (const part of duration.split(',')) expect(parseFloat(part)).toBeLessThanOrEqual(0.00001);
  });

  test('forced colors keep the current page and focus visible', async ({ page }) => {
    await page.emulateMedia({ forcedColors: 'active' });
    await page.goto('/#/');
    const overview = page.getByRole('link', { name: 'Overview' });
    expect(await overview.evaluate((el) => getComputedStyle(el).outlineStyle)).toBe('solid');
    await page.getByRole('link', { name: 'Doors' }).focus();
    await expect(page.getByRole('link', { name: 'Doors' })).toHaveCSS('outline-width', '3px');
  });
});

test.describe('compact drawer', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('has no axe violations while open', async ({ page }) => {
    await page.goto('/#/');
    await page.getByTestId('nav-trigger').click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await axe(page);
  });

  test('traps focus, returns it on Escape, and moves it to main after navigation', async ({
    page,
  }) => {
    await page.goto('/#/');
    const trigger = page.getByTestId('nav-trigger');
    await trigger.click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    for (let i = 0; i < 12; i += 1) {
      await page.keyboard.press('Tab');
      expect(await dialog.evaluate((el) => el.contains(document.activeElement))).toBe(true);
    }
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await expect(trigger).toBeFocused();

    await trigger.click();
    await dialog.getByRole('link', { name: 'Exceptions' }).click();
    await expect(dialog).toBeHidden();
    await expect(page.getByRole('heading', { level: 1, name: 'Exceptions' })).toBeVisible();
    await expect(page.getByRole('main')).toBeFocused();
  });
});
