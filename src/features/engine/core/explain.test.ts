import { describe, expect, it } from 'vitest';
import { baseDataset, door, exception, rule, sku } from './fixtures.testutil';
import { createEngine } from './createEngine';
import { REASON } from './reasons';
import type { EngineDataset, EngineException, Explanation } from './types';

const explain = (ds: EngineDataset, skuId: string, doorId = 'D1'): Explanation => {
  const result = createEngine(ds).explain(doorId, skuId);
  if (!result.found) throw new Error('door not found');
  return result;
};

const retailer = (id: string, overrides: Partial<EngineException> = {}) =>
  exception(id, { level: 'retailer', doorId: undefined, distributorNameCode: 'R1', ...overrides });

describe('explain (base reasons)', () => {
  it('explains in-tier SKUs', () => {
    expect(explain(baseDataset(), 'S1')).toEqual({
      found: true,
      doorId: 'D1',
      skuId: 'S1',
      inAssortment: true,
      reason: REASON.IN_TIER_RULES,
      baseReason: REASON.IN_TIER_RULES,
    });
  });

  it('explains axis mismatch', () => {
    const result = explain(baseDataset(), 'S3');
    expect(result.inAssortment).toBe(false);
    expect(result.reason).toBe(REASON.AXIS_MISMATCH);
  });

  it('explains SKUs outside the tier rules', () => {
    const ds = baseDataset({ skus: [sku('S1', 'Fragrance'), sku('S9', 'Fragrance')] });
    expect(explain(ds, 'S9').reason).toBe(REASON.NOT_IN_TIER_RULES);
  });

  it('explains SKUs of a tier that has no rules at all', () => {
    expect(explain(baseDataset({ tierRules: [] }), 'S1').reason).toBe(REASON.NOT_IN_TIER_RULES);
  });

  it('explains disabled rules', () => {
    const ds = baseDataset({ tierRules: [rule('T1', 'S1', { enabled: false })] });
    expect(explain(ds, 'S1').reason).toBe(REASON.RULE_DISABLED);
  });

  it('explains inactive SKUs ahead of rule state', () => {
    const ds = baseDataset({ skus: [sku('S1', 'Fragrance', { active: false })] });
    expect(explain(ds, 'S1').reason).toBe(REASON.SKU_INACTIVE);
  });

  it('explains unknown SKUs', () => {
    expect(explain(baseDataset(), 'GHOST').reason).toBe(REASON.SKU_NOT_AVAILABLE);
  });

  it('explains a missing tier ahead of everything else', () => {
    const result = explain(baseDataset({ doors: [door('D1', { tierId: undefined })] }), 'S1');
    expect(result.reason).toBe(REASON.TIER_MISSING);
    expect(result.baseReason).toBe(REASON.TIER_MISSING);
    expect(result.notApplied).toBeUndefined();
  });

  it('reports an unknown door', () => {
    expect(createEngine(baseDataset()).explain('NOPE', 'S1')).toEqual({
      found: false,
      reason: 'DOOR_NOT_FOUND',
    });
  });
});

describe('explain (exceptions)', () => {
  it('reports the final reason, base reason and applied exception', () => {
    const ds = baseDataset({ exceptions: [exception('e1', { skuId: 'S3' })] });
    expect(explain(ds, 'S3')).toEqual({
      found: true,
      doorId: 'D1',
      skuId: 'S3',
      inAssortment: true,
      reason: REASON.ADDED_BY_DOOR_EXCEPTION,
      baseReason: REASON.AXIS_MISMATCH,
      applied: { id: 'e1', level: 'door', action: 'add' },
    });
  });

  it('reports a retailer removal', () => {
    const result = explain(
      baseDataset({ exceptions: [retailer('r1', { action: 'remove' })] }),
      'S1',
    );
    expect(result.reason).toBe(REASON.REMOVED_BY_RETAILER_EXCEPTION);
    expect(result.inAssortment).toBe(false);
  });

  it('lists overridden retailer exceptions when the door level wins', () => {
    const ds = baseDataset({
      exceptions: [
        exception('d1', { skuId: 'S1' }),
        retailer('r1', { action: 'remove', skuId: 'S1' }),
      ],
    });
    const result = explain(ds, 'S1');
    expect(result.applied?.id).toBe('d1');
    expect(result.overridden).toEqual([{ id: 'r1', level: 'retailer', action: 'remove' }]);
  });

  it('lists the losing Add when Remove wins at the same level', () => {
    const ds = baseDataset({
      exceptions: [
        exception('a', { skuId: 'S1' }),
        exception('b', { skuId: 'S1', action: 'remove' }),
      ],
    });
    const result = explain(ds, 'S1');
    expect(result.reason).toBe(REASON.REMOVED_BY_DOOR_EXCEPTION);
    expect(result.overridden).toEqual([{ id: 'a', level: 'door', action: 'add' }]);
  });

  it('reports exceptions as not applied when the tier is missing', () => {
    const ds = baseDataset({
      doors: [door('D1', { tierId: undefined })],
      exceptions: [exception('d1', { skuId: 'S3' }), retailer('r1', { skuId: 'S3' })],
    });
    const result = explain(ds, 'S3');
    expect(result.reason).toBe(REASON.TIER_MISSING);
    expect(result.inAssortment).toBe(false);
    expect(result.notApplied?.map((ref) => ref.id)).toEqual(['d1', 'r1']);
  });

  it('applies a retailer exception only to its own SKU', () => {
    const ds = baseDataset({ exceptions: [retailer('r1', { skuId: 'S3' })] });
    expect(explain(ds, 'S1').applied).toBeUndefined();
    expect(explain(ds, 'S3').applied?.level).toBe('retailer');
  });
});
