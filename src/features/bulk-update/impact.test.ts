import { describe, expect, it } from 'vitest';
import { makeData } from '../../lib/doors/fixtures.testutil';
import { checkRows } from './checkRows';
import { computeImpact, leftOutClause } from './impact';
import type { RawRow } from './types';

const data = makeData();
const door = (id: string) => data.index.doorById.get(id)!;
const raw = (id: string, extra: Partial<RawRow>): RawRow => ({
  line: 2,
  doorKey: door(id).doorKey!,
  door: door(id),
  ...extra,
});

describe('computeImpact — re-tier', () => {
  it('previews each door, the KPIs and the sentence', () => {
    const checked = checkRows(
      [
        raw('D1', { value: 'Expertise' }),
        raw('D4', { value: 'Expertise' }),
        raw('D3', { value: 'Expertise' }),
      ],
      'tier',
      data,
    );
    const impact = computeImpact(checked, 'tier', data);
    expect(impact.rows).toEqual([
      {
        key: 'i-D1',
        doorId: 'D1',
        door: 'Alpha Store',
        doorKey: 'US1001',
        beforeLabel: 'Access',
        afterLabel: 'Expertise',
        skusBefore: 2,
        skusAfter: 3,
        delta: 1,
        note: '',
      },
      expect.objectContaining({
        doorId: 'D4',
        beforeLabel: 'Premium',
        skusBefore: 2,
        skusAfter: 2,
        delta: 0,
        note: 'Project door (MTP): the tier is saved; nothing goes to SAP until it is Pre-Trade.',
      }),
    ]);
    // D1 gains S5 under Expertise; D4 stays at 2 (Expertise adds S2, which its door exception removes).
    expect(impact).toMatchObject({
      doorsChanging: 2,
      avgNetDelta: 1,
      rowsLeftOut: 1,
      exceptionsCreated: 2,
    });
    expect(impact.skuChanges).toBe(1);
    expect(impact.sentence).toBe(
      '2 doors move to Expertise (1 from Access, 1 from Premium). On average each gains 1 SKU. 1 row is left out: 1 skipped.',
    );
  });

  it('names mixed targets, doors without a tier and losses', () => {
    const checked = checkRows(
      [
        raw('D1', { value: 'Access' }),
        raw('D2', { value: 'Premium' }),
        raw('D4', { value: 'Access' }),
      ],
      'tier',
      data,
    );
    const impact = computeImpact(checked, 'tier', data);
    expect(impact.sentence).toMatch(
      /^2 doors move to new tiers \(1 from no tier, 1 from Premium\)\. On average each (gains|loses) /,
    );
    expect(impact.sentence).toContain('1 row is left out: 1 with no change.');
  });

  it('handles nothing to apply', () => {
    const impact = computeImpact([], 'tier', data);
    expect(impact).toMatchObject({ doorsChanging: 0, avgNetDelta: 0, skuChanges: 0 });
  });

  it('reports average losses and doors without a key', () => {
    const losing = makeData({
      ...data.records,
      doors: [{ id: 'L', name: 'Lima', status: 'Open', productLine: 'Fragrance', tierId: 'T3' }],
      exceptions: [],
    });
    const lima = losing.index.doorById.get('L')!;
    const checked = checkRows(
      [{ line: 2, doorKey: '', door: lima, value: 'Access' }],
      'tier',
      losing,
    );
    const impact = computeImpact(checked, 'tier', losing);
    expect(impact.rows[0]).toMatchObject({ doorKey: '', skusBefore: 3, skusAfter: 1, delta: -2 });
    expect(impact.sentence).toContain('On average each loses 2 SKUs.');
  });
});

describe('computeImpact — SKUs', () => {
  it('previews door exceptions and summarises adds and removes', () => {
    const checked = checkRows(
      [
        raw('D1', { skuId: 'S5', skuKey: '100005', action: 'Add' }),
        raw('D4', { skuId: 'S1', skuKey: '100001', action: 'Remove' }),
        raw('D2', { skuId: 'S5', skuKey: '100005', action: 'Add' }),
      ],
      'sku',
      data,
    );
    const impact = computeImpact(checked, 'sku', data);
    expect(
      impact.rows.map((r) => [r.doorId, r.afterLabel, r.skusBefore, r.skusAfter, r.delta]),
    ).toEqual([
      ['D1', '1 exception', 2, 3, 1],
      ['D4', '1 exception', 2, 1, -1],
    ]);
    expect(impact).toMatchObject({ exceptionsCreated: 2, skuChanges: 2, rowsLeftOut: 1 });
    expect(impact.sentence).toBe(
      '2 door exceptions will be created at 2 doors: 1 to add a SKU, 1 to remove one. 1 row is left out: 1 skipped.',
    );
  });
});

describe('leftOutClause', () => {
  it('lists errors, skipped and unchanged rows', () => {
    const rows = [
      { status: 'error' },
      { status: 'error' },
      { status: 'skipped' },
      { status: 'nochange' },
      { status: 'ready' },
    ] as Parameters<typeof leftOutClause>[0];
    expect(leftOutClause(rows)).toBe(
      ' 4 rows are left out: 2 with errors, 1 skipped, 1 with no change.',
    );
    expect(leftOutClause([{ status: 'error' }] as never)).toBe(
      ' 1 row is left out: 1 with an error.',
    );
    expect(leftOutClause([])).toBe('');
  });
});
