import { expect, test, type Page } from '@playwright/test';
import { EXPECTED } from '../fixtures/dataset';

test.use({ viewport: { width: 1366, height: 768 } });

const description = (page: Page) => page.getByTestId('page-description');

async function openDialog(page: Page, tier: string) {
  const row = page.getByTestId('doors-grid').locator('tbody tr[data-row-key]').first();
  const name = (await row.locator('td').nth(1).textContent())!.trim();
  await page.getByRole('combobox', { name: `Tier for ${name}` }).click();
  await page.locator('.ant-select-dropdown:visible').getByTitle(tier, { exact: true }).click();
  await expect(page.getByTestId('tier-dialog')).toBeVisible();
  return { row, name };
}

test.describe('Inline tier change', () => {
  test('assigns a tier to a door that needs one', async ({ page }) => {
    await page.goto('/#/doors?saved=needs-tier');
    await expect(description(page)).toContainText(`${EXPECTED.needsTier} doors need a tier.`);
    const { name } = await openDialog(page, 'Premium');
    await expect(page.getByTestId('tier-dialog')).toContainText(
      `Change tier for ${name} from no tier to Premium?`,
    );
    await expect(page.getByTestId('tier-impact')).toContainText('This door will receive');
    const save = page.getByTestId('tier-dialog-save');
    await expect(save).toBeDisabled();
    await page.getByRole('button', { name: 'New door opening' }).click();
    await save.click();
    await expect(page.getByText(new RegExp(`^${name} moved to Premium\\.`))).toBeVisible();
    await expect(description(page)).toContainText(`${EXPECTED.needsTier - 1} doors need a tier.`);
  });

  test('keeps the dialog open when the save fails', async ({ page }) => {
    await page.goto('/?data=writefail#/doors?saved=needs-tier');
    await openDialog(page, 'Access');
    await page.getByRole('button', { name: 'Retailer request' }).click();
    await page.getByTestId('tier-dialog-save').click();
    await expect(
      page.getByText('The tier could not be saved: Stubbed write failure'),
    ).toBeVisible();
    await expect(page.getByTestId('tier-dialog')).toBeVisible();
    await expect(description(page)).toContainText(`${EXPECTED.needsTier} doors need a tier.`);
  });

  test('closed doors have no tier picker', async ({ page }) => {
    await page.goto('/#/doors?saved=closed');
    await expect(page.getByTestId('doors-grid')).toBeVisible();
    await expect(page.getByRole('combobox', { name: /^Tier for / })).toHaveCount(0);
  });
});
