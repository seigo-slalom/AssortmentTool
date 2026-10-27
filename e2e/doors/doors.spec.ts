import { expect, test, type Page } from '@playwright/test';
import { EXPECTED } from '../fixtures/dataset';

test.use({ viewport: { width: 1366, height: 768 } });

const grid = (page: Page) => page.getByTestId('doors-grid');
const bodyRows = (page: Page) => grid(page).locator('tbody tr[data-row-key]');
const regionHeading = (page: Page) => page.getByTestId('doors-region').getByRole('heading');

async function pick(page: Page, name: string, option: string) {
  await page.getByRole('combobox', { name }).click();
  await page.locator('.ant-select-dropdown:visible').getByTitle(option, { exact: true }).click();
  await page.keyboard.press('Escape');
}

test.describe('Doors screen', () => {
  test('lists open doors with the prototype header', async ({ page }) => {
    await page.goto('/#/doors');
    await expect(page.getByRole('heading', { level: 1, name: 'Doors' })).toBeVisible();
    await expect(regionHeading(page)).toHaveText(`${EXPECTED.open} doors`);
    await expect(page.getByTestId('page-description')).toContainText(
      `${EXPECTED.open} doors match the current filters. ${EXPECTED.needsTier} doors need a tier.`,
    );
    await expect(page.getByText(`1–50 of ${EXPECTED.open}`)).toBeVisible();
    await expect(bodyRows(page)).toHaveCount(50);
  });

  test('saved filters give the expected counts and Q3 cluster review is absent', async ({
    page,
  }) => {
    await page.goto('/#/doors');
    const saved = page.getByTestId('doors-saved-filters');
    await expect(saved).not.toContainText('Q3');
    for (const [id, count] of [
      ['needs-tier', EXPECTED.needsTier],
      ['fragrance-only', EXPECTED.fragranceOnly],
      ['recent', EXPECTED.recent],
      ['closed', EXPECTED.closed],
    ] as const) {
      await page.getByTestId(`saved-${id}`).click();
      await expect(regionHeading(page)).toHaveText(`${count} doors`);
      await expect(page.getByTestId(`saved-${id}`)).toHaveAttribute('aria-checked', 'true');
    }
    await page.getByTestId('doors-clear-filters').click();
    await expect(regionHeading(page)).toHaveText(`${EXPECTED.open} doors`);
  });

  test('combines distributor, tier and More filters with AND', async ({ page }) => {
    await page.goto('/#/doors');
    await pick(page, 'Distributor name', 'Nordstrom');
    await expect(regionHeading(page)).toHaveText(`${EXPECTED.byDistributor.Nordstrom} doors`);
    const more = page.getByTestId('doors-more-filters');
    await more.click();
    await pick(page, 'Online / offline', 'Online');
    await expect(more).toHaveText(/Fewer filters \(1\)/);
    const filtered = Number((await regionHeading(page).textContent())!.split(' ')[0]);
    expect(filtered).toBeLessThan(EXPECTED.byDistributor.Nordstrom);
    await more.click();
    await expect(more).toHaveText('More filters');
    await expect(regionHeading(page)).toHaveText(`${EXPECTED.byDistributor.Nordstrom} doors`);
  });

  test('searches by Door key', async ({ page }) => {
    await page.goto('/#/doors');
    await page.getByTestId('doors-search').fill('US1004');
    await expect(bodyRows(page)).toHaveCount(1);
    await expect(bodyRows(page).first()).toContainText('US1004');
  });

  test('keeps a selection across pages', async ({ page }) => {
    await page.goto('/#/doors');
    await bodyRows(page).first().getByRole('checkbox').check();
    await page.getByTitle('2', { exact: true }).click();
    await expect(page.getByText(/^51–/)).toBeVisible();
    await bodyRows(page).first().getByRole('checkbox').check();
    await expect(page.getByTestId('doors-selection-bar')).toContainText('2 doors selected');
  });

  test('opens a door with Enter and returns with the filters intact', async ({ page }) => {
    await page.goto('/#/doors?saved=needs-tier');
    const first = bodyRows(page).first();
    const id = await first.getAttribute('data-row-key');
    await first.focus();
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(new RegExp(`#/doors/${id}$`));
    await page
      .getByRole('navigation', { name: 'Breadcrumb' })
      .getByRole('link', { name: 'Doors' })
      .click();
    await expect(page).toHaveURL(/#\/doors\?saved=needs-tier$/);
    await expect(regionHeading(page)).toHaveText(`${EXPECTED.needsTier} doors`);
  });

  test('shows retry on a load error and the empty copy with no doors', async ({ page }) => {
    await page.goto('/?data=error#/doors?saved=closed');
    await expect(page.getByText('Doors could not be loaded. Your filters are kept.')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Try again' })).toBeVisible();
    await expect(page.getByTestId('saved-closed')).toHaveAttribute('aria-checked', 'true');

    await page.goto('/?data=empty#/doors');
    await expect(
      page.getByText('No doors match these filters. Clear a filter to widen the list.'),
    ).toBeVisible();
  });
});
