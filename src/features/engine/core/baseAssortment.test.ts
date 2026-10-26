import { describe, expect, it } from 'vitest';
import { axisMatches, forEachBit, getBaseAssortment, hasBit } from './baseAssortment';
import { buildIndex } from './buildIndex';
import { baseDataset, dataset, door, rule, sku, tier } from './fixtures.testutil';

const baseIds = (ds = baseDataset(), productLine: string | undefined = 'Fragrance') => {
  const index = buildIndex(ds);
  const base = getBaseAssortment(index, 'T1', productLine);
  const ids: string[] = [];
  forEachBit(base.bits, (idx) => ids.push(index.skuIds[idx]));
  return { ids, base, index };
};

describe('bit helpers', () => {
  it('walk set bits across words including bit 31', () => {
    const bits = new Uint32Array(2);
    for (const idx of [0, 31, 32, 63]) bits[idx >>> 5] |= 1 << (idx & 31);
    const seen: number[] = [];
    forEachBit(bits, (idx) => seen.push(idx));
    expect(seen).toEqual([0, 31, 32, 63]);
    expect([0, 31, 32, 63, 1, 40].map((idx) => hasBit(bits, idx))).toEqual([
      true,
      true,
      true,
      true,
      false,
      false,
    ]);
  });
});

describe('getBaseAssortment', () => {
  it('keeps only SKUs whose Axis exactly equals the Product Line', () => {
    const { ids, base } = baseIds();
    expect(ids).toEqual(['S1', 'S2']);
    expect(base.count).toBe(2);
  });

  it.each(['fragrance', 'Fragrance ', ' Fragrance', 'Fra grance', 'Fragrance\u00a0'])(
    'does not match near-miss Product Line %j',
    (nearMiss) => {
      expect(baseIds(baseDataset(), nearMiss).base.count).toBe(0);
    },
  );

  it('does not match near-miss Axis values', () => {
    const ds = baseDataset({
      skus: [
        sku('S1', 'Fragrance'),
        sku('S2', 'fragrance'),
        sku('S3', 'Fragrance '),
        sku('S4', ' Fragrance'),
        sku('S5'),
      ],
      tierRules: ['S1', 'S2', 'S3', 'S4', 'S5'].map((id) => rule('T1', id)),
    });
    expect(baseIds(ds).ids).toEqual(['S1']);
  });

  it('never matches an absent or empty Product Line', () => {
    const ds = baseDataset({
      skus: [sku('S1', ''), sku('S2')],
      tierRules: [rule('T1', 'S1'), rule('T1', 'S2')],
    });
    expect(baseIds(ds, undefined).base.count).toBe(0);
    expect(baseIds(ds, '').base.count).toBe(0);
  });

  it('excludes disabled rules and inactive SKUs', () => {
    const ds = baseDataset({
      skus: [
        sku('S1', 'Fragrance'),
        sku('S2', 'Fragrance', { active: false }),
        sku('S3', 'Fragrance'),
      ],
      tierRules: [rule('T1', 'S1'), rule('T1', 'S2'), rule('T1', 'S3', { enabled: false })],
    });
    expect(baseIds(ds).ids).toEqual(['S1']);
  });

  it('is empty for a tier without rules', () => {
    const index = buildIndex(dataset({ tiers: [tier('T2')], doors: [door('D1')] }));
    expect(getBaseAssortment(index, 'T2', 'Fragrance').count).toBe(0);
  });

  it('computes once per (tier, product line) pair and reuses the result', () => {
    const index = buildIndex(baseDataset());
    const first = getBaseAssortment(index, 'T1', 'Fragrance');
    expect(getBaseAssortment(index, 'T1', 'Fragrance')).toBe(first);
    expect(getBaseAssortment(index, 'T1', 'Makeup')).not.toBe(first);
    expect(index.baseCache.get('T1')?.size).toBe(2);
  });

  it('spans multiple bitset words', () => {
    const ids = Array.from({ length: 70 }, (_, i) => `S${String(i).padStart(2, '0')}`);
    const ds = baseDataset({
      skus: ids.map((id) => sku(id, 'Fragrance')),
      tierRules: ids.map((id) => rule('T1', id)),
    });
    expect(baseIds(ds).ids).toEqual(ids);
  });
});

describe('axisMatches', () => {
  it('compares strictly', () => {
    const index = buildIndex(dataset({ skus: [sku('S1', 'A')] }));
    expect(axisMatches(index, 0, 'A')).toBe(true);
    expect(axisMatches(index, 0, 'a')).toBe(false);
    expect(axisMatches(index, 0, undefined)).toBe(false);
  });
});
