import { describe, expect, it } from 'vitest';
import { DOOR_COLUMNS, doorCellText, tierText } from './columns';
import { makeRow } from './fixtures.testutil';

describe('door columns', () => {
  it('lists the 13 grid columns in prototype order', () => {
    expect(DOOR_COLUMNS.map((c) => c.title)).toEqual([
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
  });

  it('returns displayed values for every column', () => {
    const full = makeRow({
      name: 'Alpha',
      doorKey: 'US1',
      tierName: 'Access',
      skuCount: 12,
      distributorName: "Macy's",
      productLine: 'Fragrance',
      doorType: 'Specialty',
      onlineOffline: 'Offline',
      salesChannel: 'Wholesale',
      exceptionCount: 2,
      status: 'Open',
      shipTo: '004',
      lastChangedLabel: '1 Sep 2026 · JD',
    });
    expect(DOOR_COLUMNS.map((c) => doorCellText(full, c.key))).toEqual([
      'Alpha',
      'US1',
      'Access',
      12,
      "Macy's",
      'Fragrance',
      'Specialty',
      'Offline',
      'Wholesale',
      2,
      'Open',
      '004',
      '1 Sep 2026 · JD',
    ]);
    const empty = makeRow({ name: 'Empty' });
    expect(DOOR_COLUMNS.map((c) => doorCellText(empty, c.key))).toEqual([
      'Empty',
      '',
      'Needs tier',
      '',
      '',
      '',
      '',
      '',
      '',
      0,
      '',
      '',
      '—',
    ]);
  });

  it('shows "—" as the tier of closed doors without a tier', () => {
    expect(tierText(makeRow({ isClosed: true }))).toBe('—');
  });
});
