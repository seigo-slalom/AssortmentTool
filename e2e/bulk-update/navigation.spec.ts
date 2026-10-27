import { expect, test } from '@playwright/test';

test.use({ viewport: { width: 1366, height: 768 } });

test.describe('Bulk Update — deep links', () => {
  test('the old Mass update address redirects', async ({ page }) => {
    await page.goto('/#/doors/mass-update');
    await expect(page).toHaveURL(/#\/doors\/bulk-update$/);
    await expect(page.getByRole('heading', { level: 1, name: 'Bulk Update' })).toBeVisible();
    await expect(page).toHaveTitle('Bulk Update · Assortment tool');
  });

  test('a direct open starts at step 1 with the selection option disabled', async ({ page }) => {
    await page.goto('/#/doors/bulk-update');
    await expect(page.getByRole('heading', { name: 'Step 1: Choose the change' })).toBeVisible();
    await page.getByTestId('bulk-card-tier').click();
    await page.getByRole('button', { name: 'Continue' }).click();
    await expect(page.getByRole('radio', { name: /none selected/ })).toBeDisabled();
    await expect(page.getByRole('radio', { name: 'A saved filter' })).toBeChecked();
  });

  test('the breadcrumb and browser history keep the Doors filters', async ({ page }) => {
    await page.goto('/#/doors?saved=needs-tier');
    await page.getByTestId('doors-bulk-update').click();
    await expect(page.getByRole('heading', { level: 1, name: 'Bulk Update' })).toBeVisible();
    await page.goBack();
    await expect(page.getByTestId('saved-needs-tier')).toHaveAttribute('aria-checked', 'true');
    await page.goForward();
    await page
      .getByRole('navigation', { name: 'Breadcrumb' })
      .getByRole('link', { name: 'Doors' })
      .click();
    await expect(page).toHaveURL(/#\/doors\?saved=needs-tier$/);
    await page.reload();
    await expect(page.getByTestId('saved-needs-tier')).toHaveAttribute('aria-checked', 'true');
  });
});
