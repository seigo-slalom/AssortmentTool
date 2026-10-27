import { beforeEach, describe, expect, it, vi } from 'vitest';
import { buildDoorRows } from '../../lib/doors';
import { makeData, TEST_TODAY } from '../../lib/doors/fixtures.testutil';
import { downloadWorkbook } from '../../lib/excel';
import { exportDoors } from './exportDoors';

vi.mock('../../lib/excel', () => ({ downloadWorkbook: vi.fn(() => Promise.resolve()) }));

const rows = buildDoorRows(makeData());

beforeEach(() => {
  vi.mocked(downloadWorkbook).mockClear();
});

describe('exportDoors', () => {
  it('exports the grid columns and displayed values of every given row', async () => {
    await expect(exportDoors(rows, 'filtered', TEST_TODAY)).resolves.toBe(5);
    const [fileName, sheets] = vi.mocked(downloadWorkbook).mock.calls[0];
    expect(fileName).toBe('Doors_filtered_2026-09-23.xlsx');
    expect(sheets[0].name).toBe('Doors');
    expect(sheets[0].columns.map((c) => c.header)).toEqual([
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
    expect(sheets[0].rows[0]).toEqual([
      'Alpha Store',
      'US1001',
      'Access',
      2,
      "Macy's",
      'Fragrance',
      'Department store',
      'Offline',
      'Wholesale',
      1,
      'Open',
      '0040001',
      '1 Sep 2026 · JD',
    ]);
    expect(sheets[0].rows[1][2]).toBe('Needs tier');
    expect(sheets[0].rows[2][2]).toBe('Premium');
  });

  it('names selection exports and writes only the header for no rows', async () => {
    await expect(exportDoors([], 'selection', TEST_TODAY)).resolves.toBe(0);
    const [fileName, sheets] = vi.mocked(downloadWorkbook).mock.calls[0];
    expect(fileName).toBe('Doors_selection_2026-09-23.xlsx');
    expect(sheets[0].rows).toEqual([]);
  });
});
