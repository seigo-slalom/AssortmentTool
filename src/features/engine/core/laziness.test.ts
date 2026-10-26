import { afterEach, describe, expect, it } from 'vitest';
import { buildIndex } from './buildIndex';
import { createEngine } from './createEngine';
import { deriveDoor } from './deriveDoor';
import { baseDataset, door } from './fixtures.testutil';

describe('lazy evaluation and reuse', () => {
  afterEach(() => {
    window.localStorage.clear();
  });

  it('computes no base assortment until a door is requested', () => {
    const index = buildIndex(baseDataset({ doors: [door('D1'), door('D2')] }));
    expect(index.baseCache.size).toBe(0);
  });

  it('reuses one base per (tier, product line) across doors and adds a new one per new pair', () => {
    const index = buildIndex(
      baseDataset({
        doors: [door('D1'), door('D2'), door('D3'), door('D4', { productLine: 'Makeup' })],
      }),
    );
    deriveDoor(index, 'D1');
    const first = index.baseCache.get('T1')?.get('Fragrance');
    deriveDoor(index, 'D2');
    deriveDoor(index, 'D3');
    expect(index.baseCache.get('T1')?.get('Fragrance')).toBe(first);
    expect(index.baseCache.get('T1')?.size).toBe(1);
    deriveDoor(index, 'D4');
    expect(index.baseCache.get('T1')?.size).toBe(2);
  });

  it('derives only requested doors, leaving other pairs uncomputed', () => {
    const index = buildIndex(
      baseDataset({ doors: [door('D1'), door('D2', { productLine: 'Makeup' })] }),
    );
    deriveDoor(index, 'D1');
    expect(index.baseCache.get('T1')?.has('Makeup')).toBe(false);
  });

  it('stores nothing in browser storage', () => {
    const engine = createEngine(baseDataset());
    engine.getDoorAssortment('D1');
    engine.getCounts();
    expect(window.localStorage.length).toBe(0);
    expect(window.sessionStorage.length).toBe(0);
  });
});
