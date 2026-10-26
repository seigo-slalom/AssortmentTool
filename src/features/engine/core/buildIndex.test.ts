import { describe, expect, it } from 'vitest';
import { buildIndex, compareIds, hasTier } from './buildIndex';
import { baseDataset, dataset, door, exception, rule, sku, tier } from './fixtures.testutil';

describe('compareIds', () => {
  it('orders ids and reports equality', () => {
    expect(compareIds('a', 'b')).toBe(-1);
    expect(compareIds('b', 'a')).toBe(1);
    expect(compareIds('a', 'a')).toBe(0);
  });
});

describe('buildIndex', () => {
  it('handles an empty dataset', () => {
    const index = buildIndex(dataset());
    expect(index.doors).toEqual([]);
    expect(index.skuIds).toEqual([]);
    expect(index.wordCount).toBe(0);
    expect(index.tierRules.size).toBe(0);
  });

  it('sorts and de-duplicates SKUs and doors by id and maps SKUs to integers', () => {
    const index = buildIndex(
      dataset({
        skus: [sku('S2', 'B'), sku('S1', 'A'), sku('S1', 'A2')],
        doors: [door('D2'), door('D1'), door('D1')],
      }),
    );
    expect(index.skuIds).toEqual(['S1', 'S2']);
    expect(index.skuIdxById.get('S2')).toBe(1);
    expect(index.skuAxis).toEqual(['A2', 'B']);
    expect(index.doors.map((d) => d.id)).toEqual(['D1', 'D2']);
    expect(index.doorById.get('D2')?.id).toBe('D2');
  });

  it('sizes the bitset words for more than 32 SKUs', () => {
    const skus = Array.from({ length: 33 }, (_, i) => sku(`S${String(i).padStart(2, '0')}`));
    expect(buildIndex(dataset({ skus })).wordCount).toBe(2);
  });

  it('groups rules per tier into enabled and disabled sets and ignores unknown SKUs', () => {
    const index = buildIndex(
      baseDataset({
        tierRules: [
          rule('T1', 'S1'),
          rule('T1', 'S1', { id: 'dup' }),
          rule('T1', 'S2', { enabled: false }),
          rule('T1', 'GHOST'),
        ],
      }),
    );
    const rules = index.tierRules.get('T1');
    expect([...(rules?.enabled ?? [])]).toEqual([0]);
    expect([...(rules?.disabled ?? [])]).toEqual([1]);
  });

  it('keeps inactive SKUs indexed with their active flag', () => {
    const index = buildIndex(dataset({ skus: [sku('S1', 'A', { active: false })] }));
    expect(index.skuActive).toEqual([false]);
  });
});

describe('hasTier', () => {
  const index = buildIndex(baseDataset());
  it('is true only for a defined, known tier', () => {
    expect(hasTier(index, 'T1')).toBe(true);
    expect(hasTier(index, 'NOPE')).toBe(false);
    expect(hasTier(index, undefined)).toBe(false);
  });
});

describe('exception indexing diagnostics', () => {
  it('drops malformed, inactive, unavailable and duplicate exceptions with a cause', () => {
    const index = buildIndex(
      baseDataset({
        skus: [sku('S1', 'Fragrance'), sku('S4', 'Fragrance', { active: false })],
        exceptions: [
          exception('e01', { active: false }),
          exception('e02', { level: undefined }),
          exception('e03', { action: undefined }),
          exception('e04', { skuId: undefined }),
          exception('e05', { doorId: undefined }),
          exception('e06', { level: 'retailer', doorId: undefined, distributorNameCode: '' }),
          exception('e07', { skuId: 'GHOST' }),
          exception('e08', { skuId: 'S4' }),
          exception('e09'),
          exception('e10'),
          exception('e11', { action: 'remove' }),
        ],
      }),
    );
    expect(index.diagnostics.ignoredExceptions).toEqual({
      inactive: 1,
      'missing-level': 1,
      'missing-action': 1,
      'missing-sku': 1,
      'door-level-without-door': 1,
      'retailer-level-without-code': 1,
      'unavailable-sku': 2,
      duplicate: 1,
    });
    expect(index.doorExceptions.get('D1')?.get(0)).toEqual({
      effective: { id: 'e11', level: 'door', action: 'remove' },
      overridden: [{ id: 'e09', level: 'door', action: 'add' }],
    });
  });

  it('indexes retailer exceptions by distributor name code', () => {
    const index = buildIndex(
      baseDataset({
        exceptions: [
          exception('r1', { level: 'retailer', doorId: undefined, distributorNameCode: 'R1' }),
        ],
      }),
    );
    expect(index.retailerExceptions.get('R1')?.get(0)?.effective.id).toBe('r1');
    expect(index.doorExceptions.size).toBe(0);
  });

  it('keeps a lone add as effective with nothing overridden', () => {
    const index = buildIndex(baseDataset({ exceptions: [exception('a1')] }));
    expect(index.doorExceptions.get('D1')?.get(0)).toEqual({
      effective: { id: 'a1', level: 'door', action: 'add' },
      overridden: [],
    });
  });

  it('keeps a lone remove as effective with nothing overridden', () => {
    const index = buildIndex(baseDataset({ exceptions: [exception('x1', { action: 'remove' })] }));
    expect(index.doorExceptions.get('D1')?.get(0)?.overridden).toEqual([]);
  });
});

describe('tier fixtures', () => {
  it('builds tiers by id', () => {
    expect(tier('T9')).toEqual({ id: 'T9' });
  });
});
