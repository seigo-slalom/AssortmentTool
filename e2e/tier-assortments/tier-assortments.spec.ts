import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

test.use({ viewport: { width: 1366, height: 768 } });

const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];

async function expectNoViolations(page: Page) {
  const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
  expect(
    results.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`),
  ).toEqual([]);
}

test.describe('Tier assortments', () => {
  test('views a tier, stages a product group and saves it', async ({ page }) => {
    await page.goto('/#/tier-assortments');
    const rail = page.getByRole('navigation', { name: 'Cluster tiers' });
    await expect(rail.getByRole('button', { name: /Access/ })).toHaveAttribute(
      'aria-current',
      'true',
    );
    await expect(page.getByRole('heading', { level: 2, name: 'Access' })).toBeVisible();
    await expectNoViolations(page);

    await rail.getByRole('button', { name: /Premium/ }).click();
    await expect(page.getByRole('heading', { level: 2, name: 'Premium' })).toBeVisible();
    await rail.getByRole('button', { name: /Access/ }).click();

    await page.getByRole('checkbox', { name: 'Add every N°5 SKU to Access' }).first().click();
    const bar = page.getByTestId('tier-staging-bar');
    await expect(bar).toContainText('2 unsaved changes across 1 tier');
    await expect(rail).toContainText('● 2 unsaved changes');

    await bar.getByRole('button', { name: 'Review and save' }).click();
    const dialog = page.getByRole('dialog', { name: 'Save 2 tier changes' });
    await expect(dialog).toBeVisible();
    const save = dialog.getByRole('button', { name: 'Save changes' });
    await expect(save).toBeDisabled();
    await dialog.getByRole('button', { name: 'New launch' }).click();
    await expectNoViolations(page);
    await save.click();

    await expect(page.getByText(/^2 changes saved/)).toBeVisible();
    await expect(bar).toHaveCount(0);
  });
});
