import { describe, expect, it } from 'vitest';
import { tierHasOtherAxes } from '../../lib/doors';
import { makeData } from '../../lib/doors/fixtures.testutil';
import { impactText, tierImpact } from './tierImpact';

const data = makeData();

describe('tierImpact', () => {
  it('previews a door that already has a tier, with the delta against today', () => {
    // D1 (Fragrance, Access): today S1 + door add S2 = 2. Under Expertise: S1, S2, S5 = 3.
    const impact = tierImpact(data, 'D1', 'T3');
    expect(impact).toEqual({
      total: 3,
      retail: 2,
      spm: 1,
      delta: 1,
      axesLimited: false,
      isProject: false,
    });
    expect(impactText(impact, { productLine: 'Fragrance' })).toBe(
      'This door will receive 2 retail and 1 SPM SKUs (3 in total, +1 against today).',
    );
  });

  it('omits the delta for a door without a tier and notes skipped axes', () => {
    // D2 (Makeup, Nordstrom, no tier) under Premium: S3 (Makeup) + Nordstrom retailer add S5.
    const impact = tierImpact(data, 'D2', 'T2');
    expect(impact.total).toBe(2);
    expect(impact.delta).toBeUndefined();
    expect(impact.axesLimited).toBe(true);
    expect(impactText(impact, { productLine: 'Makeup' })).toBe(
      'This door will receive 2 retail and 0 SPM SKUs (2 in total). Product line Makeup: SKUs of other axes are skipped.',
    );
  });

  it('notes project doors and counts untyped SKUs in the total only', () => {
    const impact = tierImpact(data, 'D4', 'T1');
    expect(impact.isProject).toBe(true);
    expect(impact.delta).toBe(0);
    const text = impactText({ ...impact, delta: -1, axesLimited: true }, {});
    expect(text).toContain('−1 against today');
    expect(text).toContain('Product line not set');
    expect(text).toContain(
      'Project door (MTP): a preview until it is Pre-Trade; nothing goes to SAP yet.',
    );
  });

  it('detects tiers whose rules carry other axes', () => {
    expect(tierHasOtherAxes(data, 'T1', 'Fragrance')).toBe(false);
    expect(tierHasOtherAxes(data, 'T2', 'Fragrance')).toBe(true);
    const unknownSku = makeData({
      ...data.records,
      tierRules: [{ id: 'R', tierId: 'T1', skuId: 'GONE' }],
    });
    expect(tierHasOtherAxes(unknownSku, 'T1', '')).toBe(false);
  });

  it('handles a door whose tier is unknown (no delta)', () => {
    const odd = makeData();
    odd.records.doors[0].tierId = 'GONE';
    const rebuilt = makeData(odd.records);
    expect(tierImpact(rebuilt, 'D1', 'T1').delta).toBeUndefined();
  });
});
