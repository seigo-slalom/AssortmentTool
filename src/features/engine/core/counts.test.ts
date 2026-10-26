import { describe, expect, it } from 'vitest';
import { baseDataset, dataset, door, exception, rule, sku } from './fixtures.testutil';
import { createEngine } from './createEngine';

describe('getCounts', () => {
  it('returns empty counts for an empty dataset', () => {
    expect(createEngine(dataset()).getCounts()).toEqual({
      byPair: [],
      byDoor: new Map(),
      total: 0,
    });
  });

  it('counts per pair, per door and in total, adjusted by exceptions', () => {
    const ds = baseDataset({
      doors: [
        door('D1'),
        door('D2'),
        door('D3', { tierId: undefined }),
        door('D4', { productLine: undefined }),
        door('D5', { productLine: 'Makeup' }),
      ],
      exceptions: [
        exception('add-new', { doorId: 'D1', skuId: 'S3' }),
        exception('add-existing', { doorId: 'D1', skuId: 'S1' }),
        exception('remove-existing', { doorId: 'D2', skuId: 'S1', action: 'remove' }),
        exception('remove-absent', { doorId: 'D2', skuId: 'S3', action: 'remove' }),
        exception('retail-remove', {
          level: 'retailer',
          action: 'remove',
          doorId: undefined,
          distributorNameCode: 'R1',
          skuId: 'S2',
        }),
      ],
    });
    const counts = createEngine(ds).getCounts();
    expect([...counts.byDoor]).toEqual([
      ['D1', 2],
      ['D2', 0],
      ['D3', 0],
      ['D4', 0],
      ['D5', 1],
    ]);
    expect(counts.total).toBe(3);
    expect(counts.byPair).toEqual([
      { tierId: 'T1', productLine: 'Fragrance', baseCount: 2, doorCount: 2 },
      { tierId: 'T1', productLine: undefined, baseCount: 0, doorCount: 1 },
      { tierId: 'T1', productLine: 'Makeup', baseCount: 1, doorCount: 1 },
    ]);
  });

  it('equals the sum of per-door derivations', () => {
    const ds = baseDataset({
      doors: [door('D1'), door('D2')],
      skus: [sku('S1', 'Fragrance'), sku('S2', 'Fragrance'), sku('S3', 'Makeup')],
      tierRules: [rule('T1', 'S1'), rule('T1', 'S2'), rule('T1', 'S3')],
      exceptions: [exception('e1', { skuId: 'S3' })],
    });
    const engine = createEngine(ds);
    const counts = engine.getCounts();
    for (const id of ['D1', 'D2']) {
      const result = engine.getDoorAssortment(id);
      expect(result.found && result.assortment.count).toBe(counts.byDoor.get(id));
    }
  });
});
