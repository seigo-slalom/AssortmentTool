import ExcelJS from 'exceljs';
import { expect, test, type Page } from '@playwright/test';
import { EXPECTED, FIXTURE_TODAY } from '../fixtures/dataset';

test.use({ viewport: { width: 1366, height: 768 } });

const HEADERS = [
  'Door name',
  'Door key',
  'Tier',
  'SKUs assorted',
  'Distributor name',
  'Product line',
  'Door type',
  'Online / offline',
  'Sales channel',
  'Exceptions',
  'Door status',
  'SAP Ship To',
  'Last changed on',
];

async function readDownload(page: Page, trigger: () => Promise<void>) {
  const [download] = await Promise.all([page.waitForEvent('download'), trigger()]);
  const path = await download.path();
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(path!);
  const sheet = wb.getWorksheet('Doors')!;
  const rows: string[][] = [];
  sheet.eachRow((row) => rows.push((row.values as unknown[]).slice(1).map((v) => String(v ?? ''))));
  return { name: download.suggestedFilename(), rows };
}

test.describe('Doors export', () => {
  test('exports the filtered grid (all pages) with the grid columns', async ({ page }) => {
    await page.goto('/#/doors?saved=closed');
    await expect(page.getByTestId('doors-region').getByRole('heading')).toHaveText(
      `${EXPECTED.closed} doors`,
    );
    const firstRow = page.getByTestId('doors-grid').locator('tbody tr[data-row-key]').first();
    const firstName = (await firstRow.locator('td').nth(1).textContent())!.trim();
    const { name, rows } = await readDownload(page, () => page.getByTestId('doors-export').click());
    expect(name).toBe(`Doors_filtered_${FIXTURE_TODAY}.xlsx`);
    expect(rows[0]).toEqual(HEADERS);
    expect(rows).toHaveLength(EXPECTED.closed + 1);
    expect(rows[1][0]).toBe(firstName);
    await expect(page.getByText(`Door list exported · ${EXPECTED.closed} doors`)).toBeVisible();
  });

  test('exports only the selected doors', async ({ page }) => {
    await page.goto('/#/doors');
    const rowsLoc = page.getByTestId('doors-grid').locator('tbody tr[data-row-key]');
    await rowsLoc.nth(0).getByRole('checkbox').check();
    await rowsLoc.nth(1).getByRole('checkbox').check();
    const { name, rows } = await readDownload(page, () =>
      page.getByTestId('doors-export-selection').click(),
    );
    expect(name).toBe(`Doors_selection_${FIXTURE_TODAY}.xlsx`);
    expect(rows).toHaveLength(3);
  });
});
