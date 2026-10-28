import { describe, expect, it } from 'vitest';
import { createEngine, type EngineDataset } from '../../features/engine';
import { withDoorExceptions, withDoorTierOverrides } from './preview';

const dataset: EngineDataset = {
  doors: [
    { id: 'D1', tierId: 'T1', productLine: 'Fragrance' },
    { id: 'D2', tierId: undefined, productLine: 'Fragrance' },
  ],
  tiers: [{ id: 'T1' }, { id: 'T2' }],
  skus: [
    { id: 'S1', axis: 'Fragrance', active: true },
    { id: 'S2', axis: 'Fragrance', active: true },
    { id: 'S3', axis: 'Makeup', active: true },
  ],
  tierRules: [
    { id: 'R1', tierId: 'T1', skuId: 'S1', enabled: true },
    { id: 'R2', tierId: 'T2', skuId: 'S1', enabled: true },
    { id: 'R3', tierId: 'T2', skuId: 'S2', enabled: true },
    { id: 'R4', tierId: 'T2', skuId: 'S3', enabled: true },
  ],
  exceptions: [],
};

const skus = (ds: EngineDataset, doorId: string) => {
  const lookup = createEngine(ds).getDoorAssortment(doorId);
  return lookup.found ? lookup.assortment.skuIds : null;
};

describe('preview datasets', () => {
  it('overrides only the given doors and leaves the input untouched', () => {
    const preview = withDoorTierOverrides(dataset, new Map([['D2', 'T2']]));
    expect(preview.doors[0]).toBe(dataset.doors[0]);
    expect(dataset.doors[1].tierId).toBeUndefined();

    const edited: EngineDataset = {
      ...dataset,
      doors: [dataset.doors[0], { ...dataset.doors[1], tierId: 'T2' }],
    };
    expect(skus(preview, 'D2')).toEqual(skus(edited, 'D2'));
    expect(skus(preview, 'D2')).toEqual(['S1', 'S2']);
  });

  it('can clear a tier', () => {
    expect(skus(withDoorTierOverrides(dataset, new Map([['D1', undefined]])), 'D1')).toEqual([]);
  });

  it('appends synthetic exceptions', () => {
    const preview = withDoorExceptions(dataset, [
      { id: 'X1', level: 'door', action: 'remove', doorId: 'D1', skuId: 'S1', active: true },
    ]);
    expect(dataset.exceptions).toHaveLength(0);
    expect(skus(preview, 'D1')).toEqual([]);
  });
});
