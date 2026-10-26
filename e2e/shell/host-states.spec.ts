import { expect, test } from '@playwright/test';

test('shows the branded loading state while the host connects', async ({ page }) => {
  await page.goto('/?host=slow#/');
  await expect(page.getByText('Connecting to Power Platform…')).toBeVisible();
  await expect(page.getByRole('region', { name: 'Loading content' })).toHaveAttribute(
    'aria-busy',
    'true',
  );
  await expect(page.getByRole('navigation', { name: 'Main' })).toHaveCount(0);
  await expect(page.getByRole('heading', { level: 1, name: 'Overview' })).toBeVisible();
});

test('shows the branded error state and no navigation when the host fails', async ({ page }) => {
  await page.goto('/?host=error#/');
  await expect(page.getByText('Power Platform host unavailable')).toBeVisible();
  await expect(page.getByText('Stubbed host failure')).toBeVisible();
  await expect(page.locator('.cds-root')).toHaveCSS('background-color', 'rgb(247, 246, 244)');
  await expect(page.getByRole('navigation', { name: 'Main' })).toHaveCount(0);
});
