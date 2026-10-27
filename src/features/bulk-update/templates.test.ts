import { beforeEach, describe, expect, it, vi } from 'vitest';
import { makeData, TEST_TODAY } from '../../lib/doors/fixtures.testutil';
import { downloadWorkbook } from '../../lib/excel';
import { downloadIssues, downloadTemplate, REQUIRED_HEADERS, templateColumns } from './templates';
import type { CheckedRow } from './types';

vi.mock('../../lib/excel', () => ({ downloadWorkbook: vi.fn(() => Promise.resolve()) }));

const data = makeData();

beforeEach(() => {
  vi.mocked(downloadWorkbook).mockClear();
});

describe('templates', () => {
  it('describes the template columns for each type', () => {
    expect(templateColumns('tier', data).map((c) => [c.col, c.required])).toEqual([
      ['Door key', true],
      ['Door name', false],
      ['New tier', true],
      ['Reason', false],
    ]);
    expect(templateColumns('tier', data)[2].rule).toBe('Access, Premium, Expertise (dropdown).');
    expect(templateColumns('sku', data).map((c) => c.col)).toEqual([
      'Door key',
      'SKU key',
      'Action',
      'Reason',
    ]);
    expect(REQUIRED_HEADERS.sku).toEqual(['Door key', 'SKU key', 'Action']);
  });

  it('downloads the re-tier template with a tier dropdown and a Rules sheet', async () => {
    await downloadTemplate('tier', data);
    const [name, sheets] = vi.mocked(downloadWorkbook).mock.calls[0];
    expect(name).toBe('Re-tier_doors_template.xlsx');
    expect(sheets.map((s) => s.name)).toEqual(['Update', 'Rules']);
    expect(sheets[0].rows).toEqual([['US1542', 'Example door', 'Access', 'Cluster review']]);
    expect(sheets[0].validations).toEqual([
      { column: 3, list: ['Access', 'Premium', 'Expertise'], rows: 2500 },
    ]);
    expect(sheets[1].rows[0]).toEqual([
      'Door key',
      'Required',
      'Text, for example US1542. Matches the door.',
    ]);
  });

  it('downloads the SKU template with an Add/Remove dropdown', async () => {
    await downloadTemplate('sku', makeData({ ...data.records, tiers: [] }));
    const [name, sheets] = vi.mocked(downloadWorkbook).mock.calls[0];
    expect(name).toBe('Door_SKU_exceptions_template.xlsx');
    expect(sheets[0].validations).toEqual([{ column: 3, list: ['Add', 'Remove'], rows: 5000 }]);
    expect(sheets[1].rows[1][1]).toBe('Required');
    expect(sheets[1].rows[3][1]).toBe('Optional');
  });

  it('uses an empty tier name in the example when no tier exists', async () => {
    await downloadTemplate('tier', makeData({ ...data.records, tiers: [] }));
    expect(vi.mocked(downloadWorkbook).mock.calls[0][1][0].rows[0][2]).toBe('');
  });

  it('downloads the rows that need attention', async () => {
    const row: CheckedRow = {
      key: 'r0',
      line: 4,
      doorKey: 'US9',
      doorLabel: 'X (from file)',
      change: '— → Premium',
      status: 'error',
      message: 'Door key not found in the door list.',
    };
    await downloadIssues([row], TEST_TODAY);
    const [name, sheets] = vi.mocked(downloadWorkbook).mock.calls[0];
    expect(name).toBe('Rows_to_fix_2026-09-23.xlsx');
    expect(sheets[0].columns.map((c) => c.header)).toEqual([
      'Row',
      'Door key',
      'Door',
      'Change',
      'Status',
      'Details',
    ]);
    expect(sheets[0].rows).toEqual([
      [4, 'US9', 'X (from file)', '— → Premium', 'Error', 'Door key not found in the door list.'],
    ]);
  });
});
