import { expect, test, type Page } from '@playwright/test';
import { EXPECTED } from '../fixtures/dataset';

test.use({ viewport: { width: 1366, height: 768 } });

const rows = (page: Page) => page.getByTestId('doors-grid').locator('tbody tr[data-row-key]');

async function pick(page: Page, label: RegExp, option: string) {
  await page.getByRole('combobox', { name: label }).click();
  await page.locator('.ant-select-dropdown:visible').getByTitle(option, { exact: true }).click();
}

async function selectFirst(page: Page, n: number, query = '?saved=fragrance-only') {
  await page.goto(`/#/doors${query}`);
  for (let i = 0; i < n; i += 1) await rows(page).nth(i).getByRole('checkbox').check();
}

test.describe('Bulk Update — re-tier', () => {
  test('selection → Change tier → check → review → apply → undo', async ({ page }) => {
    await selectFirst(page, 3);
    await page.getByRole('button', { name: 'Change tier' }).click();
    await expect(page).toHaveURL(/#\/doors\/bulk-update$/);
    await expect(
      page.getByRole('radio', { name: 'Doors selected on the Doors screen (3)' }),
    ).toBeChecked();
    await pick(page, /New tier/, 'Prestige');
    await page.getByRole('button', { name: 'Check the rows' }).click();
    await expect(page.getByRole('heading', { name: 'Step 3: Check the rows' })).toBeVisible();
    await page.getByRole('button', { name: /^Review impact/ }).click();
    await expect(page.getByTestId('bulk-sentence')).toContainText('to Prestige');
    await page.getByRole('button', { name: 'New door opening' }).click();
    await page.getByRole('button', { name: /^Re-tier \d+ doors?$/ }).click();
    await expect(page.getByText(/doors? moved to Prestige\./)).toBeVisible();
    await expect(page.getByTestId('page-description')).toContainText('Update applied.');

    await page.getByTestId('bulk-undo').click();
    await page.getByRole('button', { name: 'Undo update' }).click();
    await expect(page.getByText('Update undone')).toBeVisible();
    await page.getByRole('button', { name: 'View doors' }).click();
    await expect(page).toHaveURL(/#\/doors\?saved=fragrance-only$/);
    await expect(page.getByTestId('doors-selection-bar')).toHaveCount(0);
  });

  test('saved filter source shows counts and re-tiers doors that need a tier', async ({ page }) => {
    await page.goto('/#/doors');
    await page.getByTestId('doors-bulk-update').click();
    await page.getByTestId('bulk-card-tier').click();
    await page.getByRole('button', { name: 'Continue' }).click();
    await expect(page.getByRole('radio', { name: /none selected/ })).toBeDisabled();
    await expect(page.getByTestId('bulk-filter')).toContainText(
      `Needs tier · ${EXPECTED.needsTier} doors`,
    );
    await pick(page, /New tier/, 'Access');
    await expect(page.getByTestId('bulk-scope-text')).toHaveText(
      `${EXPECTED.needsTier} rows to check.`,
    );
    await page.getByRole('button', { name: 'Check the rows' }).click();
    await page.getByRole('button', { name: /^Review impact/ }).click();
    await page.getByLabel(/Why is this change/).fill('Onboarding');
    await page.getByRole('button', { name: /^Re-tier/ }).click();
    await expect(page.getByText(/moved to Access\./)).toBeVisible();
    await page.getByRole('button', { name: 'View doors' }).click();
    await expect(page.getByTestId('page-description')).toContainText('Every door has a tier.');
  });

  test('uploaded file: exact statuses and rows that need attention', async ({ page }) => {
    await page.goto('/#/doors/bulk-update');
    await page.getByTestId('bulk-card-tier').click();
    await page.getByRole('button', { name: 'Continue' }).click();
    await page.getByRole('radio', { name: /^Upload a file/ }).check();
    const csv = [
      'Door key,Door name,New tier,Reason',
      'US1002,Valid,Prestige,',
      'US9999,Mall of the South,Premium,',
      'US1003,Bad tier,Premium Plus,',
      'US1012,Closed door,Premium,',
      'US1004,Same tier,Access,',
    ].join('\n');
    await page
      .locator('input[type=file]')
      .setInputFiles({ name: 'q4.csv', mimeType: 'text/csv', buffer: Buffer.from(csv) });
    await expect(page.getByText('q4.csv · 5 rows read')).toBeVisible();
    await page.getByRole('button', { name: 'Check the rows' }).click();
    await expect(page.getByTestId('bulk-counts')).toContainText('2 errors');
    await expect(page.getByTestId('bulk-counts')).toContainText('1 skipped');
    await expect(page.getByTestId('bulk-counts')).toContainText('1 no change');
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('button', { name: 'Download rows that need attention' }).click(),
    ]);
    expect(download.suggestedFilename()).toMatch(/^Rows_to_fix_\d{4}-\d{2}-\d{2}\.xlsx$/);
  });

  test('throttled saves give a partial result that can be retried', async ({ page }) => {
    await page.goto('/?data=throttle#/doors?saved=fragrance-only');
    for (let i = 0; i < 6; i += 1) await rows(page).nth(i).getByRole('checkbox').check();
    await page.getByRole('button', { name: 'Change tier' }).click();
    await pick(page, /New tier/, 'Prestige');
    await page.getByRole('button', { name: 'Check the rows' }).click();
    await page.getByRole('button', { name: /^Review impact/ }).click();
    await page.getByRole('button', { name: 'Retailer request' }).click();
    await page.getByRole('button', { name: /^Re-tier/ }).click();
    await expect(page.getByTestId('bulk-failures')).toContainText('429 Too Many Requests');
    const applied = page.getByText(/^Applied \d+ of/);
    const before = await applied.textContent();
    await page.getByRole('button', { name: 'Retry failed rows' }).click();
    await expect(applied).not.toHaveText(before!, { timeout: 10_000 });
  });
});

test.describe('Bulk Update — SKUs', () => {
  test('creates door exceptions and cancels them on undo', async ({ page }) => {
    await selectFirst(page, 2, '?saved=fragrance-only&tier=T-4');
    const before = await rows(page).nth(0).locator('td').nth(10).textContent();
    await page.getByRole('button', { name: 'Add exception' }).click();
    await page.getByRole('radio', { name: 'Remove the SKUs' }).check();
    await pick(page, /Add SKUs by group/, 'Coco · 20 SKUs');
    await expect(
      page.getByText('20 SKUs from Coco added. Remove any you don’t want.'),
    ).toBeVisible();
    await page.getByRole('button', { name: 'Check the rows' }).click();
    await page.getByRole('button', { name: /^Review impact/ }).click();
    await page.getByRole('button', { name: 'Launch distribution' }).click();
    await page.getByRole('button', { name: /^Create \d+ exceptions?$/ }).click();
    await expect(page.getByText(/door exceptions? created at \d+ doors?\./)).toBeVisible();
    const created = await page.evaluate(
      () =>
        window.__e2eData!.cr380_assortmentexceptions.filter(
          (e) =>
            String(e.cr380_assortmentexceptionid).startsWith('NEW-') &&
            e.cr380_reason === 'Launch distribution',
        ).length,
    );
    expect(created).toBeGreaterThan(0);

    await page.getByTestId('bulk-undo').click();
    await page.getByRole('button', { name: 'Undo update' }).click();
    await expect(page.getByText('Update undone')).toBeVisible();
    const active = await page.evaluate(
      () =>
        window.__e2eData!.cr380_assortmentexceptions.filter(
          (e) =>
            String(e.cr380_assortmentexceptionid).startsWith('NEW-') &&
            e.cr380_exceptionstatus === 860080000,
        ).length,
    );
    expect(active).toBe(0);
    await page.getByRole('button', { name: 'View doors' }).click();
    await expect(rows(page).nth(0).locator('td').nth(10)).toHaveText(before!);
  });
});
