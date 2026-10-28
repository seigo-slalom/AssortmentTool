import { act, fireEvent, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { resetClock, setClockForTests } from '../../lib/clock';
import {
  cancelException,
  createDoorException,
  recheckDoorExceptions,
  recheckDoors,
  setDoorTier,
} from '../../lib/data/mutations';
import { loadAssortmentRecords } from '../../lib/data/records';
import { TEST_RECORDS, TEST_TODAY } from '../../lib/doors/fixtures.testutil';
import { downloadWorkbook } from '../../lib/excel';
import { bulkIntroHidden, doorSelection, lastDoorsSearch } from '../../lib/session';
import { renderWithProviders } from '../../test/renderWithProviders';
import BulkUpdatePage from './BulkUpdatePage';

vi.mock('../../lib/data/records', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../lib/data/records')>()),
  loadAssortmentRecords: vi.fn(),
}));
vi.mock('../../lib/data/mutations', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../lib/data/mutations')>()),
  setDoorTier: vi.fn(),
  createDoorException: vi.fn(),
  cancelException: vi.fn(),
  recheckDoors: vi.fn(),
  recheckDoorExceptions: vi.fn(),
}));
vi.mock('../../lib/excel', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../lib/excel')>()),
  downloadWorkbook: vi.fn(() => Promise.resolve()),
}));

const doorsById = new Map(TEST_RECORDS.doors.map((d) => [d.id, d]));

const renderPage = (state?: unknown) =>
  renderWithProviders(<BulkUpdatePage />, {
    route: '/doors/bulk-update',
    path: '/doors/bulk-update',
    records: TEST_RECORDS,
    state,
  });

const location = () => screen.getByTestId('location').textContent;
const button = (name: string | RegExp) => screen.getByRole('button', { name });

async function pick(name: string | RegExp, option: string) {
  fireEvent.mouseDown(screen.getByRole('combobox', { name }));
  const items = await screen.findAllByTitle(option);
  fireEvent.click(items[items.length - 1]);
}

beforeEach(() => {
  setClockForTests(() => TEST_TODAY);
  vi.mocked(loadAssortmentRecords).mockResolvedValue(structuredClone(TEST_RECORDS));
  vi.mocked(setDoorTier).mockResolvedValue({ ok: true, value: undefined });
  vi.mocked(createDoorException).mockImplementation(async (i) => ({
    ok: true,
    value: { id: `E-${i.doorId}-${i.skuId}` },
  }));
  vi.mocked(cancelException).mockResolvedValue({ ok: true, value: undefined });
  vi.mocked(recheckDoors).mockImplementation(
    async (ids) =>
      new Map(
        ids.map((id) => [
          id,
          { tierId: doorsById.get(id)?.tierId, status: doorsById.get(id)?.status },
        ]),
      ),
  );
  vi.mocked(recheckDoorExceptions).mockImplementation(
    async (ids) => new Map(ids.map((id) => [id, []])),
  );
});

afterEach(() => {
  resetClock();
  doorSelection.clear();
  lastDoorsSearch.set('');
  bulkIntroHidden.set(false);
  vi.clearAllMocks();
});

describe('BulkUpdatePage — layout and step 1', () => {
  it('shows the breadcrumb, header, intro and step indicator', () => {
    lastDoorsSearch.set('?saved=closed');
    renderPage();
    expect(screen.getByRole('heading', { level: 1, name: 'Bulk Update' })).toBeInTheDocument();
    expect(document.title).toBe('Bulk Update · Assortment tool');
    expect(screen.getByTestId('page-eyebrow')).toHaveTextContent('Strategy');
    expect(screen.getByRole('link', { name: 'Doors' })).toHaveAttribute(
      'href',
      '/doors?saved=closed',
    );
    expect(screen.getByTestId('page-description')).toHaveTextContent(
      'Change many doors at once. You see every row checked and the impact per door before anything is saved.',
    );
    const intro = screen.getByTestId('bulk-intro');
    expect(
      within(intro).getByRole('heading', { name: 'How bulk update works' }),
    ).toBeInTheDocument();
    expect(within(intro).getAllByRole('listitem')).toHaveLength(4);
    for (const title of [
      'Choose the change',
      'Choose the doors',
      'Check the rows',
      'Review and apply',
    ]) {
      expect(screen.getByTestId('bulk-steps')).toHaveTextContent(title);
    }
    fireEvent.click(within(intro).getByRole('button', { name: 'Hide' }));
    expect(screen.queryByTestId('bulk-intro')).not.toBeInTheDocument();
    expect(bulkIntroHidden.get()).toBe(true);
  });

  it('requires a change type, marks the chosen card and cancels back to Doors', () => {
    lastDoorsSearch.set('?page=2');
    renderPage();
    expect(screen.getByRole('heading', { name: 'Step 1: Choose the change' })).toBeInTheDocument();
    expect(button('Continue')).toBeDisabled();
    const tier = screen.getByTestId('bulk-card-tier');
    expect(tier).toHaveAttribute('aria-pressed', 'false');
    fireEvent.click(tier);
    expect(tier).toHaveAttribute('aria-pressed', 'true');
    expect(within(tier).getByText('Selected')).toBeInTheDocument();
    expect(button('Continue')).toBeEnabled();
    expect(screen.getByTestId('bulk-redirect')).toHaveTextContent(
      'SKUs for a whole tier or retailer?',
    );
    fireEvent.click(button('Cancel'));
    expect(location()).toBe('/doors?page=2');
  });

  it.each([
    ['Open Tier assortments', '/tier-assortments'],
    ['Add a retailer exception', '/exceptions'],
  ])('%s links to %s', (label, path) => {
    renderPage();
    fireEvent.click(button(label));
    expect(location()).toBe(path);
  });

  it('shows loading, then an error with retry', async () => {
    let reject!: (e: Error) => void;
    vi.mocked(loadAssortmentRecords).mockReturnValueOnce(new Promise((_, r) => (reject = r)));
    renderWithProviders(<BulkUpdatePage />, {
      route: '/doors/bulk-update',
      path: '/doors/bulk-update',
    });
    expect(screen.getByLabelText('Loading content')).toBeInTheDocument();
    await act(async () => reject(new Error('down')));
    expect(
      await screen.findByText('Doors could not be loaded. Nothing was changed.'),
    ).toBeInTheDocument();
    fireEvent.click(button('Try again'));
    expect(await screen.findByTestId('bulk-card-tier')).toBeInTheDocument();
  });
});

describe('BulkUpdatePage — re-tier', () => {
  it('re-tiers a saved filter end to end and can undo', async () => {
    renderPage();
    fireEvent.click(screen.getByTestId('bulk-card-tier'));
    fireEvent.click(button('Continue'));
    expect(
      await screen.findByRole('heading', { name: 'Step 2: Choose the doors and the new tier' }),
    ).toHaveFocus();
    expect(screen.getByTestId('bulk-steps')).toHaveTextContent('Re-tier doors');
    const selection = screen.getByRole('radio', {
      name: 'Doors selected on the Doors screen (none selected)',
    });
    expect(selection).toBeDisabled();
    expect(screen.getByRole('radio', { name: 'A saved filter' })).toBeChecked();
    expect(screen.getByTestId('bulk-scope-text')).toHaveTextContent(
      'Choose the new tier to continue.',
    );
    expect(button('Check the rows')).toBeDisabled();

    await pick(/Saved filter/, 'Opened in last 90 days · 2 doors');
    await pick(/New tier/, 'Expertise');
    expect(screen.getByTestId('bulk-scope-text')).toHaveTextContent('2 rows to check.');
    fireEvent.click(button('Check the rows'));

    expect(
      await screen.findByRole('heading', { name: 'Step 3: Check the rows' }),
    ).toBeInTheDocument();
    expect(screen.getByTestId('bulk-counts')).toHaveTextContent('2 warnings');
    expect(screen.queryByTestId('bulk-left-out')).not.toBeInTheDocument();
    expect(screen.getByTestId('bulk-steps')).toHaveTextContent('2 rows');
    fireEvent.click(button('Review impact (2 rows)'));

    expect(await screen.findByTestId('bulk-sentence')).toHaveTextContent(
      '2 doors move to Expertise (1 from no tier, 1 from Premium).',
    );
    expect(screen.getByTestId('bulk-steps')).toHaveTextContent('2 to apply');
    const kpis = screen.getAllByTestId('kpi-tile').map((k) => k.textContent);
    expect(kpis[0]).toBe('Doors changing2');
    expect(kpis[1]).toMatch(/^Net SKU change per door \(average\)/);
    expect(kpis[3]).toBe('Rows left out0');
    expect(screen.getByTestId('bulk-impact')).toHaveTextContent('Bravo Store');
    expect(screen.getByText('What happens when you apply')).toBeInTheDocument();
    const apply = button('Re-tier 2 doors');
    expect(apply).toBeDisabled();
    fireEvent.click(button('Sales above tier threshold'));
    fireEvent.click(apply);

    expect(await screen.findByText('2 doors moved to Expertise.')).toBeInTheDocument();
    expect(screen.getByText('Applied 2 of 2 rows.')).toBeInTheDocument();
    expect(screen.getByTestId('page-description')).toHaveTextContent('Update applied.');
    expect(screen.getByTestId('bulk-progress')).toHaveTextContent(
      'Every screen already shows the new assortment for 2 doors.',
    );
    expect(setDoorTier).toHaveBeenCalledWith('D2', 'T3');
    expect(setDoorTier).toHaveBeenCalledWith('D4', 'T3');

    fireEvent.click(screen.getByTestId('bulk-undo'));
    fireEvent.click(await screen.findByRole('button', { name: 'Undo update' }));
    expect(await screen.findByText('Update undone')).toBeInTheDocument();
    expect(screen.getByText('Every change from this update was reversed.')).toBeInTheDocument();
    expect(setDoorTier).toHaveBeenCalledWith('D2', null);
    expect(setDoorTier).toHaveBeenCalledWith('D4', 'T2');
    expect(screen.queryByTestId('bulk-undo')).not.toBeInTheDocument();

    fireEvent.click(button('Start another update'));
    expect(await screen.findByTestId('bulk-card-tier')).toHaveAttribute('aria-pressed', 'false');
  });

  it('starts at step 2 with the selection from Change tier and goes back keeping choices', async () => {
    doorSelection.set(['D1', 'D2', 'D3', 'D4', 'D5']);
    renderPage({ type: 'tier', startStep: 1 });
    expect(
      screen.getByRole('heading', { name: 'Step 2: Choose the doors and the new tier' }),
    ).not.toHaveFocus();
    expect(
      screen.getByRole('radio', { name: 'Doors selected on the Doors screen (5)' }),
    ).toBeChecked();
    expect(screen.getByTestId('bulk-selection-text')).toHaveTextContent(
      'Alpha Store, Bravo Store, Charlie Store, Delta Store and 1 more',
    );
    await pick(/New tier/, 'Premium');
    fireEvent.click(button('Check the rows'));
    const leftOut = await screen.findByTestId('bulk-left-out');
    expect(leftOut).toHaveTextContent('3 rows will be left out');
    expect(leftOut).toHaveTextContent(
      '2 rows are skipped, 1 row changes nothing. You can continue; they do not need fixing.',
    );
    fireEvent.click(screen.getByText('Needs attention (5)'));
    expect(screen.getByTestId('bulk-rows').querySelectorAll('tbody tr[data-row-key]')).toHaveLength(
      5,
    );
    fireEvent.click(button('Download rows that need attention'));
    await waitFor(() => expect(downloadWorkbook).toHaveBeenCalled());
    expect(vi.mocked(downloadWorkbook).mock.calls[0][0]).toBe('Rows_to_fix_2026-09-23.xlsx');
    fireEvent.click(button(/^Review impact/));
    expect(
      await screen.findByRole('heading', { name: 'Step 4: Review and apply' }),
    ).toBeInTheDocument();
    fireEvent.click(button('Back'));
    expect(
      await screen.findByRole('heading', { name: 'Step 3: Check the rows' }),
    ).toBeInTheDocument();
    fireEvent.click(button('Back'));
    expect(await screen.findByRole('heading', { name: /Step 2/ })).toBeInTheDocument();
    expect(
      screen.getByRole('radio', { name: 'Doors selected on the Doors screen (5)' }),
    ).toBeChecked();
    fireEvent.click(button('Back'));
    expect(await screen.findByTestId('bulk-card-tier')).toHaveAttribute('aria-pressed', 'true');
  });

  it('cannot continue when every row is left out', async () => {
    doorSelection.set(['D3']);
    renderPage({ type: 'tier', startStep: 1 });
    await pick(/New tier/, 'Premium');
    fireEvent.click(button('Check the rows'));
    expect(await screen.findByRole('button', { name: 'No rows to apply' })).toBeDisabled();
    expect(screen.getByText('Needs attention (1)')).toBeInTheDocument();
  });

  it('reports failed and stale rows, retries the failures and shows the doors', async () => {
    doorSelection.set(['D1', 'D2', 'D4']);
    lastDoorsSearch.set('?saved=needs-tier');
    vi.mocked(setDoorTier).mockResolvedValueOnce({ ok: false, error: '429 Too Many Requests' });
    vi.mocked(recheckDoors).mockImplementationOnce(
      async () =>
        new Map([
          ['D1', { tierId: 'T1', status: 'Open' }],
          ['D2', { tierId: undefined, status: 'Pre-Trade' }],
          ['D4', { tierId: 'T3', status: 'Project (MTP)' }],
        ]),
    );
    renderPage({ type: 'tier', startStep: 1 });
    await pick(/New tier/, 'Expertise');
    fireEvent.click(button('Check the rows'));
    fireEvent.click(await screen.findByRole('button', { name: /^Review impact/ }));
    fireEvent.change(screen.getByLabelText(/Why is this change/), {
      target: { value: 'Cluster review' },
    });
    fireEvent.click(button(/^Re-tier 3 doors/));

    expect(
      await screen.findByText(
        'Applied 1 of 3 rows. 1 row was changed by someone else and not updated. 1 row could not be saved.',
      ),
    ).toBeInTheDocument();
    const failures = screen.getByTestId('bulk-failures');
    expect(failures).toHaveTextContent('Alpha Store: 429 Too Many Requests');
    expect(failures).toHaveTextContent('Delta Store: Changed by someone else — not updated');
    fireEvent.click(button('Retry failed rows'));
    await waitFor(() =>
      expect(screen.queryByRole('button', { name: 'Retry failed rows' })).not.toBeInTheDocument(),
    );
    expect(screen.getByText('2 doors moved to Expertise.')).toBeInTheDocument();
    fireEvent.click(button('View doors'));
    expect(location()).toBe('/doors?saved=needs-tier');
    expect(doorSelection.get().size).toBe(0);
  });

  it('names mixed targets and reports undo failures', async () => {
    vi.mocked(setDoorTier)
      .mockResolvedValueOnce({ ok: true, value: undefined })
      .mockResolvedValueOnce({ ok: true, value: undefined })
      .mockResolvedValueOnce({ ok: false, error: 'required' });
    renderPage({ type: 'tier' });
    fireEvent.click(button('Continue'));
    fireEvent.click(await screen.findByRole('radio', { name: /Upload a file/ }));
    const input = document.querySelector('input[type=file]')!;
    const file = new File(['Door key,New tier\nUS1001,Premium\nUS1002,Access\n'], 'mixed.csv');
    fireEvent.change(input, { target: { files: [file] } });
    expect(await screen.findByText('mixed.csv · 2 rows read')).toBeInTheDocument();
    fireEvent.click(button('Check the rows'));
    fireEvent.click(await screen.findByRole('button', { name: /^Review impact/ }));
    expect(screen.getByTestId('bulk-sentence')).toHaveTextContent('2 doors move to new tiers');
    fireEvent.click(button('Retailer request'));
    fireEvent.click(button('Re-tier 2 doors'));
    expect(await screen.findByText('2 doors moved to their new tiers.')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('bulk-undo'));
    fireEvent.click(await screen.findByRole('button', { name: 'Undo update' }));
    expect(await screen.findByText('1 change could not be reversed.')).toBeInTheDocument();
    expect(screen.getByTestId('bulk-progress')).toHaveTextContent(
      'The reversal shows straight away.',
    );
  });
});

describe('BulkUpdatePage — upload', () => {
  const goToUpload = async () => {
    renderPage({ type: 'tier' });
    fireEvent.click(button('Continue'));
    fireEvent.click(
      await screen.findByRole('radio', {
        name: 'Upload a file (a different tier per door is fine)',
      }),
    );
  };

  it('shows the template, downloads it and rejects invalid files', async () => {
    await goToUpload();
    expect(screen.getByText('1 · Download the re-tier template')).toBeInTheDocument();
    expect(screen.getByTestId('bulk-template-columns')).toHaveTextContent('New tierRequired');
    expect(screen.getByTestId('bulk-scope-text')).toHaveTextContent('Upload a file to continue.');
    fireEvent.click(button('Download template'));
    await waitFor(() => expect(downloadWorkbook).toHaveBeenCalled());
    expect(vi.mocked(downloadWorkbook).mock.calls[0][0]).toBe('Re-tier_doors_template.xlsx');
    const input = document.querySelector('input[type=file]')!;
    fireEvent.change(input, { target: { files: [new File(['Door key\nUS1\n'], 'bad.csv')] } });
    expect(await screen.findByText('Column “New tier” is missing.')).toBeInTheDocument();
    expect(button('Check the rows')).toBeDisabled();
  });

  it('checks an uploaded file with every kind of row', async () => {
    await goToUpload();
    const csv = [
      'Door key,Door name,New tier,Reason',
      'US1001,Alpha,Expertise,Q4',
      'US9999,Mall of the South,Premium,',
      'US1002,Bravo,Premium Plus,',
      'US1003,Charlie,Premium,',
      'US1004,Delta,Premium,',
    ].join('\n');
    const input = document.querySelector('input[type=file]')!;
    fireEvent.change(input, { target: { files: [new File([csv], 'q4.csv')] } });
    expect(await screen.findByText('q4.csv · 5 rows read')).toBeInTheDocument();
    expect(screen.getByTestId('bulk-scope-text')).toHaveTextContent('5 rows to check.');
    fireEvent.click(button('Replace file'));
    expect(screen.getByText('Drop the file here or click to browse')).toBeInTheDocument();
    fireEvent.change(document.querySelector('input[type=file]')!, {
      target: { files: [new File([csv], 'q4.csv')] },
    });
    await screen.findByText('q4.csv · 5 rows read');
    fireEvent.click(button('Check the rows'));
    expect(await screen.findByTestId('bulk-counts')).toHaveTextContent(
      '1 ready1 no change1 skipped2 errors',
    );
    expect(screen.getByTestId('bulk-left-out')).toHaveTextContent(
      'Download them, fix the file and upload it again, or continue without them.',
    );
    expect(screen.getByTestId('bulk-rows')).toHaveTextContent('Mall of the South (from file)');
  });
});

describe('BulkUpdatePage — SKUs', () => {
  it('creates door exceptions from a selection and cancels them on undo', async () => {
    doorSelection.set(['D1', 'D4']);
    renderPage({ type: 'sku', startStep: 1 });
    expect(
      screen.getByRole('heading', { name: 'Step 2: Choose the doors and the SKUs' }),
    ).toBeInTheDocument();
    expect(screen.getByTestId('bulk-scope-text')).toHaveTextContent(
      'Choose at least one SKU to continue.',
    );
    await pick(/Add SKUs by group/, 'Chance · 1 SKU');
    expect(
      await screen.findByText('1 SKU from Chance added. Remove any you don’t want.'),
    ).toBeInTheDocument();
    expect(screen.getByTestId('bulk-scope-text')).toHaveTextContent(
      '2 rows to check (2 doors × 1 SKU).',
    );
    await pick(/^SKUs/, '100001 · N°5 EDP');
    fireEvent.click(screen.getByRole('radio', { name: 'Remove the SKUs' }));
    fireEvent.click(screen.getByRole('radio', { name: 'Add the SKUs' }));
    fireEvent.click(button('Check the rows'));
    expect(await screen.findByTestId('bulk-counts')).toHaveTextContent('1 ready3 no change');
    fireEvent.click(button('Review impact (1 row)'));
    expect(screen.getByTestId('bulk-sentence')).toHaveTextContent(
      '1 door exception will be created at 1 door: 1 to add a SKU, 0 to remove one.',
    );
    expect(screen.getAllByTestId('kpi-tile')[1]).toHaveTextContent('Door exceptions created1');
    expect(screen.getAllByTestId('kpi-tile')[3]).toHaveTextContent('Nothing to fix');
    fireEvent.click(button('Retailer agreement'));
    fireEvent.click(button('Create 1 exception'));
    expect(await screen.findByText('1 door exception created at 1 door.')).toBeInTheDocument();
    expect(createDoorException).toHaveBeenCalledWith(
      expect.objectContaining({
        doorId: 'D1',
        skuId: 'S5',
        action: 'add',
        reason: 'Retailer agreement',
        today: '2026-09-23',
      }),
    );
    fireEvent.click(screen.getByTestId('bulk-undo'));
    fireEvent.click(await screen.findByRole('button', { name: 'Undo update' }));
    expect(await screen.findByText('Update undone')).toBeInTheDocument();
    expect(cancelException).toHaveBeenCalledWith('E-D1-S5');
  });

  it('uses a saved filter and the SKU template', async () => {
    renderPage({ type: 'sku' });
    fireEvent.click(button('Continue'));
    expect(
      await screen.findByRole('radio', { name: 'Upload a file (different SKUs per door is fine)' }),
    ).toBeChecked();
    expect(screen.getByText('1 · Download the SKU exception template')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('radio', { name: 'A saved filter' }));
    await pick(/Saved filter/, 'Fragrance-only product line · 2 doors');
    await pick(/^SKUs/, '100005 · Chance');
    fireEvent.click(button('Check the rows'));
    expect(await screen.findByTestId('bulk-counts')).toHaveTextContent('1 ready1 no change');
  });
});
