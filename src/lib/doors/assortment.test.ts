import { describe, expect, it } from 'vitest';
import { doorSkuIds } from './assortment';
import { makeData } from './fixtures.testutil';

describe('doorSkuIds', () => {
  it('returns the derived SKUs, or none for an unknown door', () => {
    const { engine } = makeData();
    expect(doorSkuIds(engine, 'D1')).toEqual(['S1', 'S2']);
    expect(doorSkuIds(engine, 'NOPE')).toEqual([]);
  });
});
