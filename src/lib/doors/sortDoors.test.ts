import { describe, expect, it } from 'vitest';
import { makeRow } from './fixtures.testutil';
import { sortDoors } from './sortDoors';

const rows = [
  makeRow({
    id: 'a',
    name: 'Bravo',
    tierName: 'Premium',
    tierRank: 2,
    skuCount: 5,
    distributorName: 'Saks',
    modifiedOn: '2026-09-02',
  }),
  makeRow({
    id: 'b',
    name: 'Alpha',
    tierName: 'Access',
    tierRank: 1,
    skuCount: 9,
    distributorName: "Macy's",
    modifiedOn: '2026-09-03',
  }),
  makeRow({ id: 'c', name: 'Charlie' }),
  makeRow({ id: 'd', name: 'Delta', tierName: 'Unranked' }),
];

const order = (sort: Parameters<typeof sortDoors>[1], dir: 'asc' | 'desc' = 'asc') =>
  sortDoors(rows, sort, dir).map((r) => r.id);

describe('sortDoors', () => {
  it('sorts by name by default order and reverses for desc', () => {
    expect(order('name')).toEqual(['b', 'a', 'c', 'd']);
    expect(order('name', 'desc')).toEqual(['d', 'c', 'a', 'b']);
  });

  it('sorts by tier rank with no tier (and unranked) first, ties by name', () => {
    expect(order('tier')).toEqual(['c', 'd', 'b', 'a']);
  });

  it('sorts by SKU count with empty counts first', () => {
    expect(order('skus')).toEqual(['c', 'd', 'a', 'b']);
    expect(order('skus', 'desc')).toEqual(['b', 'a', 'c', 'd']);
  });

  it('sorts by distributor and by last change', () => {
    expect(order('distributor')).toEqual(['c', 'd', 'b', 'a']);
    expect(order('changed')).toEqual(['c', 'd', 'a', 'b']);
  });

  it('does not mutate the input', () => {
    const copy = [...rows];
    sortDoors(rows, 'skus', 'desc');
    expect(rows).toEqual(copy);
  });
});
