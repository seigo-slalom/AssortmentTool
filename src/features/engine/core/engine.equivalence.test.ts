import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { createEngine } from './createEngine';
import { referenceAssortment, referenceOutcome } from './referenceEngine.testutil';
import type { EngineDataset, EngineException } from './types';

const pool = (prefix: string, n: number) => Array.from({ length: n }, (_, i) => `${prefix}${i}`);
const LINES = ['Fragrance', 'fragrance', 'Fragrance ', 'Makeup', ''];
const AXES = [...LINES, undefined];
const CODES = ['R1', 'r1', 'R2', '', undefined];

const dataSetArb = (withExceptions: boolean): fc.Arbitrary<EngineDataset> =>
  fc.record({
    tiers: fc.subarray(pool('T', 3)).map((ids) => ids.map((id) => ({ id }))),
    skus: fc
      .array(fc.record({ axis: fc.constantFrom(...AXES), active: fc.boolean() }), {
        minLength: 0,
        maxLength: 40,
      })
      .map((rows) => rows.map((row, i) => ({ id: `S${String(i).padStart(2, '0')}`, ...row }))),
    doors: fc
      .array(
        fc.record({
          tierId: fc.constantFrom(...pool('T', 4), undefined),
          productLine: fc.constantFrom(...LINES, undefined),
          distributorNameCode: fc.constantFrom(...CODES),
        }),
        { minLength: 1, maxLength: 6 },
      )
      .map((rows) => rows.map((row, i) => ({ id: `D${i}`, ...row }))),
    tierRules: fc
      .array(
        fc.record({
          tierId: fc.constantFrom(...pool('T', 3)),
          skuId: fc.integer({ min: 0, max: 45 }).map((n) => `S${String(n).padStart(2, '0')}`),
          enabled: fc.boolean(),
        }),
        { maxLength: 60 },
      )
      .map((rows) => rows.map((row, i) => ({ id: `TR${i}`, ...row }))),
    exceptions: withExceptions
      ? fc
          .array(
            fc.record({
              level: fc.constantFrom('door' as const, 'retailer' as const, undefined),
              action: fc.constantFrom('add' as const, 'remove' as const, undefined),
              skuId: fc.option(
                fc.integer({ min: 0, max: 45 }).map((n) => `S${String(n).padStart(2, '0')}`),
                { nil: undefined },
              ),
              doorId: fc.constantFrom(...pool('D', 7), undefined),
              distributorNameCode: fc.constantFrom(...CODES),
              active: fc.boolean(),
            }),
            { maxLength: 40 },
          )
          .map((rows): EngineException[] =>
            rows.map((row, i) => ({ id: `E${String(i).padStart(2, '0')}`, ...row })),
          )
      : fc.constant([]),
  });

function assertEquivalent(ds: EngineDataset) {
  const engine = createEngine(ds);
  let total = 0;
  for (const door of ds.doors) {
    const result = engine.getDoorAssortment(door.id);
    if (!result.found) throw new Error('door missing');
    const expected = referenceAssortment(ds, door.id);
    expect(result.assortment.skuIds).toEqual(expected);
    expect(result.assortment.count).toBe(expected.length);
    expect(engine.getCounts().byDoor.get(door.id)).toBe(expected.length);
    total += expected.length;
    for (const sku of ds.skus) {
      const ref = referenceOutcome(ds, door.id, sku.id);
      const actual = engine.explain(door.id, sku.id);
      if (!actual.found || !ref) throw new Error('explain mismatch');
      expect(actual.inAssortment).toBe(ref.inAssortment);
      expect(actual.reason).toBe(ref.reason);
      expect(actual.baseReason).toBe(ref.baseReason);
      expect(actual.applied?.id).toBe(ref.appliedId);
    }
  }
  expect(engine.getCounts().total).toBe(total);
}

describe('optimized engine equals the reference engine', () => {
  it('without exceptions', () => {
    fc.assert(fc.property(dataSetArb(false), assertEquivalent), { numRuns: 200 });
  });

  it('with exceptions (both levels, conflicts, malformed and inactive)', () => {
    fc.assert(fc.property(dataSetArb(true), assertEquivalent), { numRuns: 300 });
  });
});
