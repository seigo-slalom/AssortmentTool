import { describe, expect, it } from 'vitest';
import { makeData, TEST_TODAY } from '../../lib/doors/fixtures.testutil';
import { initialBulkState } from './bulkReducer';
import { buildRawRows, rowsFromTable, scopeDoors } from './rawRows';
import type { BulkState } from './types';

const data = makeData();
const state = (patch: Partial<BulkState>): BulkState => ({
  ...initialBulkState(undefined, []),
  ...patch,
});

describe('scope and raw rows', () => {
  it('uses the selection as given (closed doors are checked, not dropped)', () => {
    const s = state({ source: 'selection', doorIds: ['D3', 'D1', 'GONE'] });
    expect(scopeDoors(s, data, TEST_TODAY).map((d) => d.id)).toEqual(['D3', 'D1']);
  });

  it('uses a saved filter without closed doors', () => {
    expect(
      scopeDoors(state({ source: 'filter', filter: 'fragrance-only' }), data, TEST_TODAY).map(
        (d) => d.id,
      ),
    ).toEqual(['D1', 'D4']);
    expect(scopeDoors(state({ source: 'upload' }), data, TEST_TODAY)).toEqual([]);
  });

  it('builds one re-tier row per door with the tier name, or none without a tier', () => {
    const s = state({ type: 'tier', source: 'selection', doorIds: ['D1', 'D2'], tierId: 'T2' });
    expect(buildRawRows(s, data, TEST_TODAY)).toMatchObject([
      { line: 2, doorKey: 'US1001', doorName: 'Alpha Store', value: 'Premium' },
      { line: 3, doorKey: 'US1002', value: 'Premium' },
    ]);
    expect(buildRawRows({ ...s, tierId: undefined }, data, TEST_TODAY)).toEqual([]);
  });

  it('builds door × SKU rows with the action', () => {
    const s = state({
      type: 'sku',
      source: 'selection',
      doorIds: ['D1', 'D5'],
      skuIds: ['S5', 'S3'],
      skuAction: 'remove',
    });
    const rows = buildRawRows(s, data, TEST_TODAY);
    expect(rows.map((r) => [r.line, r.doorKey, r.skuKey, r.action])).toEqual([
      [2, 'US1001', '100005', 'Remove'],
      [3, 'US1001', '100003', 'Remove'],
      [4, 'US1005', '100005', 'Remove'],
      [5, 'US1005', '100003', 'Remove'],
    ]);
    const add = buildRawRows({ ...s, skuAction: 'add', skuIds: ['UNKNOWN'] }, data, TEST_TODAY);
    expect(add[0]).toMatchObject({ skuKey: 'UNKNOWN', action: 'Add' });
  });

  it('uses uploaded rows, and handles doors without a key', () => {
    const upload = { fileName: 'f.xlsx', rows: [{ line: 2, doorKey: 'US1' }] };
    expect(buildRawRows(state({ source: 'upload', upload }), data, TEST_TODAY)).toBe(upload.rows);
    expect(buildRawRows(state({ source: 'upload' }), data, TEST_TODAY)).toEqual([]);
    const keyless = makeData({
      ...data.records,
      doors: [{ id: 'K', name: 'Keyless', status: 'Open' }],
    });
    const s = state({ type: 'tier', source: 'selection', doorIds: ['K'], tierId: 'T1' });
    expect(buildRawRows(s, keyless, TEST_TODAY)[0].doorKey).toBe('');
    const sku = state({ type: 'sku', source: 'selection', doorIds: ['K'], skuIds: ['S1'] });
    expect(buildRawRows(sku, keyless, TEST_TODAY)[0].doorKey).toBe('');
  });

  it('maps uploaded table rows by header for each type', () => {
    const table = [
      {
        line: 2,
        cells: { 'door key': 'US1', 'Door name': 'A', 'New tier': 'Access', Reason: 'r' },
      },
      { line: 3, cells: { 'Door key': 'US2', 'SKU key': '100001', Action: 'Add' } },
    ];
    expect(rowsFromTable(table, 'tier')).toEqual([
      { line: 2, doorKey: 'US1', doorName: 'A', value: 'Access', rowReason: 'r' },
      { line: 3, doorKey: 'US2', doorName: undefined, value: '', rowReason: undefined },
    ]);
    expect(rowsFromTable(table, 'sku')[1]).toEqual({
      line: 3,
      doorKey: 'US2',
      skuKey: '100001',
      action: 'Add',
      rowReason: undefined,
    });
  });
});
