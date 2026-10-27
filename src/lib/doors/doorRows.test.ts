import { describe, expect, it } from 'vitest';
import { buildDoorRows, formatDay, initials, lastChangedLabel } from './doorRows';
import { makeData } from './fixtures.testutil';

describe('buildDoorRows', () => {
  const rows = buildDoorRows(makeData());
  const byId = Object.fromEntries(rows.map((r) => [r.id, r]));

  it('sorts by name and derives tier, status and counts', () => {
    expect(rows.map((r) => r.id)).toEqual(['D1', 'D2', 'D3', 'D4', 'D5']);
    expect(byId.D1).toMatchObject({
      tierName: 'Access',
      tierRank: 1,
      statusCategory: 'open',
      statusTone: 'success',
      isClosed: false,
      skuCount: 2,
      exceptionCount: 1,
      searchKey: 'alpha store|us1001|0040001',
    });
  });

  it('leaves the SKU count empty for doors without a tier or closed doors', () => {
    expect(byId.D2.tierName).toBeUndefined();
    expect(byId.D2.skuCount).toBeUndefined();
    expect(byId.D3.isClosed).toBe(true);
    expect(byId.D3.skuCount).toBeUndefined();
    // T2 Fragrance base {S1,S2} − door remove S2 + Nordstrom retailer add S5.
    expect(byId.D4.skuCount).toBe(2);
    expect(byId.D5.statusTone).toBe('unavailable');
  });

  it('treats a tier id that is not in the data as no tier', () => {
    const data = makeData();
    data.records.doors[0].tierId = 'GONE';
    expect(buildDoorRows(data).find((r) => r.id === 'D1')?.tierName).toBeUndefined();
  });
});

describe('labels', () => {
  it('formats the last change as "D Mon YYYY · XX"', () => {
    expect(lastChangedLabel('2026-09-01T10:00:00Z', 'Jane Doe')).toBe('1 Sep 2026 · JD');
    expect(lastChangedLabel('2026-09-01T10:00:00Z', undefined)).toBe('1 Sep 2026');
    expect(lastChangedLabel(undefined, 'Jane Doe')).toBe('—');
    expect(formatDay('not a date')).toBe('—');
    expect(initials('j.r. smith')).toBe('JRS');
  });
});
