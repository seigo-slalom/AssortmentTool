import { describe, expect, it } from 'vitest';
import { baseDataset, door, exception, rule, sku, tier } from './fixtures.testutil';
import { createEngine } from './createEngine';
import { REASON } from './reasons';
import type { DoorAssortment, EngineDataset, EngineException } from './types';

const derive = (ds: EngineDataset, doorId = 'D1'): DoorAssortment => {
  const result = createEngine(ds).getDoorAssortment(doorId);
  if (!result.found) throw new Error('door not found');
  return result.assortment;
};

const retailer = (id: string, overrides: Partial<EngineException> = {}) =>
  exception(id, { level: 'retailer', doorId: undefined, distributorNameCode: 'R1', ...overrides });

describe('deriveDoor (base)', () => {
  it('assorts SKUs whose Axis equals the Product Line and returns IDs with reasons', () => {
    expect(derive(baseDataset())).toEqual({
      doorId: 'D1',
      status: 'ok',
      skuIds: ['S1', 'S2'],
      reasons: [REASON.IN_TIER_RULES, REASON.IN_TIER_RULES],
      count: 2,
    });
  });

  it('returns an empty tier-missing assortment for no tier or an unknown tier', () => {
    for (const tierId of [undefined, 'NOPE']) {
      expect(derive(baseDataset({ doors: [door('D1', { tierId })] }))).toEqual({
        doorId: 'D1',
        status: 'tier-missing',
        skuIds: [],
        reasons: [],
        count: 0,
      });
    }
  });

  it('reports an unknown door without throwing', () => {
    expect(createEngine(baseDataset()).getDoorAssortment('NOPE')).toEqual({
      found: false,
      reason: 'DOOR_NOT_FOUND',
    });
  });

  it('excludes near-miss product lines, disabled rules and inactive SKUs', () => {
    const ds = baseDataset({
      doors: [door('D1', { productLine: 'fragrance' }), door('D2')],
      skus: [
        sku('S1', 'Fragrance'),
        sku('S2', 'Fragrance', { active: false }),
        sku('S3', 'Fragrance'),
      ],
      tierRules: [rule('T1', 'S1'), rule('T1', 'S2'), rule('T1', 'S3', { enabled: false })],
    });
    expect(derive(ds, 'D1').skuIds).toEqual([]);
    expect(derive(ds, 'D2').skuIds).toEqual(['S1']);
  });

  it('returns stable SKU order regardless of input order', () => {
    const ds = baseDataset({
      skus: [sku('S2', 'Fragrance'), sku('S1', 'Fragrance')],
      tierRules: [rule('T1', 'S2'), rule('T1', 'S1')],
    });
    expect(derive(ds).skuIds).toEqual(['S1', 'S2']);
  });

  it('handles a tier without rules', () => {
    expect(derive(baseDataset({ tierRules: [], tiers: [tier('T1')] })).count).toBe(0);
  });
});

describe('deriveDoor (exceptions)', () => {
  it('adds an axis-mismatched SKU through a Door-level Add', () => {
    const result = derive(baseDataset({ exceptions: [exception('e1', { skuId: 'S3' })] }));
    expect(result.skuIds).toEqual(['S1', 'S2', 'S3']);
    expect(result.reasons[2]).toBe(REASON.ADDED_BY_DOOR_EXCEPTION);
  });

  it('merges added SKUs in SKU order before, between and after base SKUs', () => {
    const all = ['S0', 'S1', 'S2', 'S3', 'S4'];
    const ds = baseDataset({
      doors: [door('D1', { productLine: 'Makeup' })],
      skus: all.map((id) => sku(id, ['S1', 'S3'].includes(id) ? 'Makeup' : 'Other')),
      tierRules: all.map((id) => rule('T1', id)),
      exceptions: ['S0', 'S2', 'S4'].map((skuId) => exception(`e${skuId}`, { skuId })),
    });
    const result = derive(ds);
    expect(result.skuIds).toEqual(all);
    expect(result.reasons).toEqual([
      REASON.ADDED_BY_DOOR_EXCEPTION,
      REASON.IN_TIER_RULES,
      REASON.ADDED_BY_DOOR_EXCEPTION,
      REASON.IN_TIER_RULES,
      REASON.ADDED_BY_DOOR_EXCEPTION,
    ]);
  });

  it('labels a redundant Add on a base SKU with the exception reason', () => {
    const result = derive(baseDataset({ exceptions: [exception('e1', { skuId: 'S1' })] }));
    expect(result.skuIds).toEqual(['S1', 'S2']);
    expect(result.reasons[0]).toBe(REASON.ADDED_BY_DOOR_EXCEPTION);
  });

  it('removes a SKU through a Retailer-level Remove', () => {
    const ds = baseDataset({ exceptions: [retailer('e1', { action: 'remove' })] });
    expect(derive(ds).skuIds).toEqual(['S2']);
  });

  it('adds through a Retailer-level Add only for doors with that code', () => {
    const ds = baseDataset({
      doors: [door('D1'), door('D2'), door('D3', { distributorNameCode: 'R2' })],
      exceptions: [retailer('e1', { skuId: 'S3' })],
    });
    expect(derive(ds, 'D1').reasons[2]).toBe(REASON.ADDED_BY_RETAILER_EXCEPTION);
    expect(derive(ds, 'D2').skuIds).toContain('S3');
    expect(derive(ds, 'D3').skuIds).not.toContain('S3');
  });

  it('lets a Door-level Add beat a Retailer-level Remove', () => {
    const ds = baseDataset({
      exceptions: [
        exception('d', { skuId: 'S1' }),
        retailer('r', { action: 'remove', skuId: 'S1' }),
      ],
    });
    expect(derive(ds).skuIds).toContain('S1');
  });

  it('lets a Door-level Remove beat a Retailer-level Add', () => {
    const ds = baseDataset({
      exceptions: [
        exception('d', { action: 'remove', skuId: 'S3' }),
        retailer('r', { skuId: 'S3' }),
      ],
    });
    expect(derive(ds).skuIds).not.toContain('S3');
  });

  it('lets Remove win over Add at the same level', () => {
    const ds = baseDataset({
      exceptions: [
        exception('a', { skuId: 'S1' }),
        exception('b', { skuId: 'S1', action: 'remove' }),
      ],
    });
    expect(derive(ds).skuIds).toEqual(['S2']);
  });

  it('does not match retailer codes that differ by case or whitespace', () => {
    for (const distributorNameCode of ['r1', 'R1 ', ' R1']) {
      const ds = baseDataset({
        exceptions: [retailer('e', { action: 'remove', distributorNameCode })],
      });
      expect(derive(ds).skuIds).toEqual(['S1', 'S2']);
    }
  });

  it('applies no retailer exception to a door without a distributor name code', () => {
    const ds = baseDataset({
      doors: [door('D1', { distributorNameCode: undefined })],
      exceptions: [retailer('e', { action: 'remove' })],
    });
    expect(derive(ds).skuIds).toEqual(['S1', 'S2']);
  });

  it('never assorts inactive or unknown SKUs through exceptions', () => {
    const ds = baseDataset({
      skus: [sku('S1', 'Fragrance'), sku('S4', 'Fragrance', { active: false })],
      tierRules: [rule('T1', 'S1'), rule('T1', 'S4')],
      exceptions: [exception('a', { skuId: 'S4' }), exception('b', { skuId: 'GHOST' })],
    });
    expect(derive(ds).skuIds).toEqual(['S1']);
  });

  it('ignores exceptions for a door with a missing tier', () => {
    const ds = baseDataset({
      doors: [door('D1', { tierId: undefined })],
      exceptions: [exception('e', { skuId: 'S3' })],
    });
    expect(derive(ds).skuIds).toEqual([]);
  });

  it('derives only the requested doors', () => {
    const engine = createEngine(baseDataset({ doors: [door('D1'), door('D2'), door('D3')] }));
    const results = engine.getDoorAssortments(['D3', 'NOPE', 'D1']);
    expect(results.map((r) => (r.found ? r.assortment.doorId : 'missing'))).toEqual([
      'D3',
      'missing',
      'D1',
    ]);
  });
});
