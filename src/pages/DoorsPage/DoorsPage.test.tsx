import { act, fireEvent, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { resetClock, setClockForTests } from '../../lib/clock';
import { setDoorTier } from '../../lib/data/mutations';
import { loadAssortmentRecords } from '../../lib/data/records';
import { TEST_RECORDS, TEST_TODAY } from '../../lib/doors/fixtures.testutil';
import { downloadWorkbook } from '../../lib/excel';
import { doorSelection, lastDoorsSearch } from '../../lib/session';
import { renderWithProviders } from '../../test/renderWithProviders';
import DoorsPage from './DoorsPage';

vi.mock('../../lib/data/records', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../lib/data/records')>()),
  loadAssortmentRecords: vi.fn(),
}));
vi.mock('../../lib/data/mutations', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../lib/data/mutations')>()),
  setDoorTier: vi.fn(),
}));
vi.mock('../../lib/excel', () => ({ downloadWorkbook: vi.fn(() => Promise.resolve()) }));

const renderPage = (route = '/doors') =>
  renderWithProviders(<DoorsPage />, { route, path: '/doors', records: TEST_RECORDS });

const location = () => screen.getByTestId('location').textContent;
const gridRows = () =>
  [...document.querySelectorAll('[data-testid="doors-grid"] tbody tr[data-row-key]')].map((r) =>
    r.getAttribute('data-row-key'),
  );

/** Opens an Ant Design select by its accessible name and picks an option label. */
async function pick(name: string, option: string) {
  fireEvent.mouseDown(screen.getByRole('combobox', { name }));
  const items = await screen.findAllByTitle(option);
  fireEvent.click(items[items.length - 1]);
}

beforeEach(() => {
  setClockForTests(() => TEST_TODAY);
});

afterEach(() => {
  resetClock();
  doorSelection.clear();
  lastDoorsSearch.set('');
  vi.mocked(loadAssortmentRecords).mockReset();
  vi.mocked(setDoorTier).mockReset();
  vi.mocked(downloadWorkbook).mockClear();
});

describe('DoorsPage actions', () => {
  it('exports the filtered list (all pages) and confirms', async () => {
    renderPage('/doors?saved=closed');
    fireEvent.click(screen.getByTestId('doors-export'));
    expect(await screen.findByText('Door list exported · 2 doors')).toBeInTheDocument();
    const [fileName, sheets] = vi.mocked(downloadWorkbook).mock.calls[0];
    expect(fileName).toBe('Doors_filtered_2026-09-23.xlsx');
    expect(sheets[0].rows.map((r) => r[0])).toEqual(['Charlie Store', 'Echo Store']);
    expect(
      screen.getByTestId('doors-export').querySelector('.anticon-download'),
    ).toBeInTheDocument();
  });

  it('exports the selection, including selected doors hidden by filters', async () => {
    renderPage('/doors?sort=name&dir=desc');
    fireEvent.click(screen.getByRole('checkbox', { name: 'Select Alpha Store' }));
    fireEvent.click(screen.getByRole('checkbox', { name: 'Select Delta Store' }));
    fireEvent.click(screen.getByTestId('saved-needs-tier'));
    await waitFor(() => expect(gridRows()).toEqual(['D2']));
    fireEvent.click(screen.getByTestId('doors-export-selection'));
    expect(await screen.findByText('Door list exported · 2 doors')).toBeInTheDocument();
    const [fileName, sheets] = vi.mocked(downloadWorkbook).mock.calls[0];
    expect(fileName).toBe('Doors_selection_2026-09-23.xlsx');
    expect(sheets[0].rows.map((r) => r[0])).toEqual(['Delta Store', 'Alpha Store']);
  });

  it('reports a failed export', async () => {
    vi.mocked(downloadWorkbook).mockRejectedValueOnce(new Error('disk'));
    renderPage();
    fireEvent.click(screen.getByTestId('doors-export'));
    expect(
      await screen.findByText('The door list could not be exported. Try again.'),
    ).toBeInTheDocument();
  });

  it('Bulk Update is primary without a selection and opens the workflow', () => {
    renderPage();
    const bulk = screen.getByTestId('doors-bulk-update');
    expect(bulk).toHaveClass('ant-btn-primary');
    expect(bulk.querySelector('.anticon-sync')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('checkbox', { name: 'Select Alpha Store' }));
    expect(bulk).not.toHaveClass('ant-btn-primary');
    expect(screen.getByRole('button', { name: 'Change tier' })).toHaveClass('ant-btn-primary');
    fireEvent.click(bulk);
    expect(location()).toBe('/doors/bulk-update');
  });

  it.each([
    ['Change tier', 'tier'],
    ['Add exception', 'sku'],
  ])('%s opens Bulk Update at step 2 for the selection', (label) => {
    renderPage();
    fireEvent.click(screen.getByRole('checkbox', { name: 'Select Alpha Store' }));
    fireEvent.click(screen.getByRole('button', { name: label }));
    expect(location()).toBe('/doors/bulk-update');
  });
});

describe('inline tier change', () => {
  const openDialogFor = async (door: string, tier: string) => {
    fireEvent.mouseDown(screen.getByRole('combobox', { name: `Tier for ${door}` }));
    const options = await screen.findAllByTitle(tier);
    fireEvent.click(options[options.length - 1]);
    return screen.findByTestId('tier-dialog');
  };

  it('shows a picker for open doors only, without opening the door', () => {
    renderPage('/doors?saved=closed');
    expect(screen.queryByRole('combobox', { name: /Tier for/ })).not.toBeInTheDocument();
    fireEvent.click(screen.getByTestId('saved-closed'));
    const picker = screen.getByRole('combobox', { name: 'Tier for Bravo Store' });
    fireEvent.click(picker);
    fireEvent.keyDown(picker, { key: 'Enter' });
    expect(screen.queryByTestId('location')).not.toBeInTheDocument();
  });

  it('previews the impact, requires a reason and saves', async () => {
    const updated = structuredClone(TEST_RECORDS);
    updated.doors[1].tierId = 'T2';
    vi.mocked(setDoorTier).mockResolvedValue({ ok: true, value: undefined });
    vi.mocked(loadAssortmentRecords).mockResolvedValue(updated);
    renderPage();
    const dialog = await openDialogFor('Bravo Store', 'Premium');
    expect(dialog).toHaveTextContent('Change tier for Bravo Store from no tier to Premium?');
    expect(screen.getByTestId('tier-impact')).toHaveTextContent(
      'This door will receive 2 retail and 0 SPM SKUs (2 in total). Product line Makeup: SKUs of other axes are skipped.',
    );
    const save = screen.getByTestId('tier-dialog-save');
    expect(save).toBeDisabled();
    fireEvent.change(screen.getByLabelText(/Why is this change/), { target: { value: '   ' } });
    expect(save).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'New door opening' }));
    expect(save).toBeEnabled();
    fireEvent.click(save);
    expect(
      await screen.findByText(
        'Bravo Store moved to Premium. It now receives 2 SKUs (2 retail · 0 SPM).',
      ),
    ).toBeInTheDocument();
    expect(setDoorTier).toHaveBeenCalledWith('D2', 'T2');
    await waitFor(() => expect(screen.queryByTestId('tier-dialog')).not.toBeInTheDocument());
    await waitFor(() =>
      expect(screen.getByTestId('page-description')).toHaveTextContent('Every door has a tier.'),
    );
  });

  it('handles the same tier, a changed choice, a failure and cancel', async () => {
    vi.mocked(setDoorTier).mockResolvedValue({ ok: false, error: 'denied' });
    renderPage();
    await openDialogFor('Alpha Store', 'Premium');
    const dialog = screen.getByRole('dialog');
    fireEvent.mouseDown(within(dialog).getByRole('combobox'));
    const access = await screen.findAllByTitle('Access');
    fireEvent.click(access[access.length - 1]);
    await waitFor(() =>
      expect(screen.getByTestId('tier-impact')).toHaveTextContent('This door is already Access.'),
    );
    expect(dialog).toHaveTextContent('from Access to Access?');
    fireEvent.click(screen.getByRole('button', { name: 'Retailer request' }));
    expect(screen.getByTestId('tier-dialog-save')).toBeDisabled();

    fireEvent.mouseDown(within(dialog).getByRole('combobox'));
    const expertise = await screen.findAllByTitle('Expertise');
    fireEvent.click(expertise[expertise.length - 1]);
    await waitFor(() =>
      expect(screen.getByTestId('tier-impact')).toHaveTextContent('+1 against today'),
    );
    fireEvent.click(screen.getByTestId('tier-dialog-save'));
    expect(await screen.findByText('The tier could not be saved: denied')).toBeInTheDocument();
    expect(screen.getByTestId('tier-dialog')).toBeInTheDocument();
    fireEvent.click(within(dialog).getByRole('button', { name: 'Cancel' }));
    await waitFor(() => expect(screen.queryByTestId('tier-dialog')).not.toBeInTheDocument());
    expect(loadAssortmentRecords).not.toHaveBeenCalled();
  });
});

describe('DoorsPage', () => {
  it('renders the header, description and the default list without closed doors', () => {
    renderPage();
    expect(screen.getByTestId('page-eyebrow')).toHaveTextContent('Strategy');
    expect(screen.getByRole('heading', { level: 1, name: 'Doors' })).toBeInTheDocument();
    expect(document.title).toBe('Doors · Assortment tool');
    expect(screen.getByTestId('page-description')).toHaveTextContent(
      '3 doors match the current filters. 1 door needs a tier.',
    );
    expect(screen.getByRole('heading', { name: '3 doors' })).toBeInTheDocument();
    expect(gridRows()).toEqual(['D1', 'D2', 'D4']);
    expect(screen.queryByRole('navigation', { name: 'Breadcrumb' })).not.toBeInTheDocument();
  });

  it('shows the 13 prototype columns and per-row values', () => {
    renderPage();
    const grid = screen.getByTestId('doors-grid');
    const headers = [...grid.querySelectorAll('thead th')]
      .map((th) => th.textContent)
      .filter(Boolean);
    expect(headers).toEqual([
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
    ]);
    const bravo = grid.querySelector('tr[data-row-key="D2"]') as HTMLElement;
    expect(within(bravo).getByText('Needs tier')).toBeInTheDocument();
    expect(within(bravo).getByText('Pre-Trade')).toBeInTheDocument();
    const alpha = grid.querySelector('tr[data-row-key="D1"]') as HTMLElement;
    expect(within(alpha).getByText('Access')).toBeInTheDocument();
    expect(within(alpha).getByText('1 Sep 2026 · JD')).toBeInTheDocument();
    expect(screen.getByText('1–3 of 3')).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: 'Select Alpha Store' })).toBeInTheDocument();
  });

  it('reads filters from the URL and remembers the query for returning', () => {
    renderPage('/doors?saved=closed');
    expect(gridRows()).toEqual(['D3', 'D5']);
    expect(screen.getByTestId('saved-closed')).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByTestId('page-description')).toHaveTextContent(
      '2 doors match the current filters. 1 door needs a tier.',
    );
    expect(lastDoorsSearch.get()).toBe('?saved=closed');
    const charlie = screen.getByTestId('doors-grid').querySelector('tr[data-row-key="D3"]')!;
    expect(within(charlie as HTMLElement).getByText('Premium')).toBeInTheDocument();
  });

  it('toggles saved filters, one at a time, with mouse and keyboard', () => {
    renderPage();
    expect(screen.getByTestId('doors-saved-filters')).not.toHaveTextContent('Q3');
    fireEvent.click(screen.getByTestId('saved-needs-tier'));
    expect(gridRows()).toEqual(['D2']);
    fireEvent.keyDown(screen.getByTestId('saved-fragrance-only'), { key: ' ' });
    expect(screen.getByTestId('saved-needs-tier')).toHaveAttribute('aria-checked', 'false');
    expect(gridRows()).toEqual(['D1', 'D4']);
    fireEvent.keyDown(screen.getByTestId('saved-fragrance-only'), { key: 'Enter' });
    expect(gridRows()).toEqual(['D1', 'D2', 'D4']);
    fireEvent.keyDown(screen.getByTestId('saved-recent'), { key: 'a' });
    expect(gridRows()).toEqual(['D1', 'D2', 'D4']);
    fireEvent.click(screen.getByTestId('saved-recent'));
    expect(gridRows()).toEqual(['D2', 'D4']);
    fireEvent.click(screen.getByTestId('saved-recent'));
    expect(gridRows()).toEqual(['D1', 'D2', 'D4']);
  });

  it('searches, filters by distributor and tier, and clears filters', async () => {
    renderPage();
    expect(screen.queryByTestId('doors-clear-filters')).not.toBeInTheDocument();
    fireEvent.change(screen.getByTestId('doors-search'), { target: { value: 'us1004' } });
    await waitFor(() => expect(gridRows()).toEqual(['D4']));
    fireEvent.click(screen.getByTestId('doors-clear-filters'));
    await waitFor(() => expect(gridRows()).toEqual(['D1', 'D2', 'D4']));

    await pick('Distributor name', "Macy's");
    await waitFor(() => expect(gridRows()).toEqual(['D1']));
    await pick('Tier', 'Needs tier');
    await waitFor(() => expect(gridRows()).toEqual([]));
    expect(
      screen.getByText('No doors match these filters. Clear a filter to widen the list.'),
    ).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '0 doors' })).toBeInTheDocument();
  });

  it('expands More filters, counts set ones and clears them on collapse', async () => {
    renderPage('/doors?pl=Makeup');
    const more = screen.getByTestId('doors-more-filters');
    expect(more).toHaveTextContent('Fewer filters (1)');
    expect(more).toHaveAttribute('aria-expanded', 'true');
    expect(gridRows()).toEqual(['D2']);
    await pick('Online / offline', 'Online');
    await waitFor(() => expect(more).toHaveTextContent('Fewer filters (2)'));
    await pick('Door status', 'Closed');
    await waitFor(() => expect(gridRows()).toEqual([]));
    fireEvent.click(more);
    await waitFor(() => expect(more).toHaveTextContent('More filters'));
    expect(more).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('combobox', { name: 'Door type' })).not.toBeInTheDocument();
    expect(gridRows()).toEqual(['D1', 'D2', 'D4']);
    fireEvent.click(more);
    await pick('Door type', 'Specialty');
    await waitFor(() => expect(gridRows()).toEqual(['D2']));
  });

  it('selects rows, shows the selection bar and clears the selection', () => {
    renderPage();
    expect(screen.queryByTestId('doors-selection-bar')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('checkbox', { name: 'Select Alpha Store' }));
    expect(screen.getByTestId('doors-selection-bar')).toHaveTextContent('1 door selected');
    fireEvent.click(screen.getByRole('checkbox', { name: 'Select Delta Store' }));
    expect(screen.getByTestId('doors-selection-bar')).toHaveTextContent('2 doors selected');
    fireEvent.click(screen.getByRole('button', { name: 'Clear selection' }));
    expect(screen.queryByTestId('doors-selection-bar')).not.toBeInTheDocument();
  });

  it('opens a door on row activation', () => {
    renderPage();
    const row = screen.getByTestId('doors-grid').querySelector('tr[data-row-key="D4"]')!;
    fireEvent.keyDown(row, { key: 'Enter' });
    expect(location()).toBe('/doors/D4');
  });

  it('sorts by clicking a sortable header and keeps sort in the URL', async () => {
    renderPage();
    const header = () => screen.getAllByText('SKUs assorted')[0];
    fireEvent.click(header());
    await waitFor(() => expect(gridRows()).toEqual(['D2', 'D1', 'D4']));
    fireEvent.click(header());
    await waitFor(() => expect(gridRows()).toEqual(['D1', 'D4', 'D2']));
    fireEvent.click(header());
    await waitFor(() => expect(gridRows()).toEqual(['D1', 'D2', 'D4']));
    expect(lastDoorsSearch.get()).toBe('');
  });

  it('pages through more than 50 doors', async () => {
    const many = structuredClone(TEST_RECORDS);
    many.doors = Array.from({ length: 60 }, (_, i) => ({
      id: `M${String(i).padStart(2, '0')}`,
      name: `Door ${String(i).padStart(2, '0')}`,
      status: i === 0 ? undefined : 'Open',
    }));
    renderWithProviders(<DoorsPage />, { route: '/doors', path: '/doors', records: many });
    expect(screen.getByText('1–50 of 60')).toBeInTheDocument();
    expect(screen.getByTestId('page-description')).toHaveTextContent('60 doors need a tier.');
    fireEvent.click(screen.getByTitle('2'));
    await waitFor(() => expect(screen.getByText('51–60 of 60')).toBeInTheDocument());
    expect(lastDoorsSearch.get()).toBe('?page=2');
  });

  it('says every door has a tier when none is missing', () => {
    const tiered = structuredClone(TEST_RECORDS);
    tiered.doors = tiered.doors.filter((d) => d.tierId);
    renderWithProviders(<DoorsPage />, { route: '/doors', path: '/doors', records: tiered });
    expect(screen.getByTestId('page-description')).toHaveTextContent(
      '2 doors match the current filters. Every door has a tier.',
    );
  });

  it('shows loading, then an error with retry that keeps the filters', async () => {
    let reject!: (e: Error) => void;
    vi.mocked(loadAssortmentRecords).mockReturnValueOnce(
      new Promise((_, r) => {
        reject = r;
      }),
    );
    renderWithProviders(<DoorsPage />, { route: '/doors?saved=closed', path: '/doors' });
    expect(screen.getByLabelText('Loading content')).toBeInTheDocument();
    expect(screen.queryByTestId('page-description')).not.toBeInTheDocument();
    await act(async () => reject(new Error('down')));
    expect(
      await screen.findByText('Doors could not be loaded. Your filters are kept.'),
    ).toBeInTheDocument();
    vi.mocked(loadAssortmentRecords).mockResolvedValueOnce(TEST_RECORDS);
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
    await waitFor(() => expect(gridRows()).toEqual(['D3', 'D5']));
  });
});
