import { describe, expect, it } from 'vitest';
import { buildIndex, normalizeDoorKey, normalizeTierName } from './buildIndex';
import type { AssortmentRecords } from './records';

const records: AssortmentRecords = {
  doors: [
    { id: 'D1', name: 'One', doorKey: ' us1001 ' },
    { id: 'D2', name: 'Two' },
  ],
  tiers: [
    { id: 'T3', name: 'Zeta', active: true },
    { id: 'T2', name: 'Premium', rank: 2, active: true },
    { id: 'T1', name: 'Access', rank: 1, active: true },
    { id: 'T4', name: 'Alpha', active: true },
    { id: 'T0', name: 'Retired', rank: 0, active: false },
  ],
  skus: [{ id: 'S1', key: ' 100001 ' }, { id: 'S2' }],
  tierRules: [],
  exceptions: [
    { id: 'E1', level: 'door', doorId: 'D1', skuId: 'S1', action: 'add' },
    { id: 'E2', level: 'door', doorId: 'D1', skuId: 'S2', action: 'remove' },
    { id: 'E3', level: 'retailer', distributorNameCode: 'MAC', skuId: 'S1' },
    { id: 'E4', level: 'door' },
  ],
};

describe('buildIndex', () => {
  const index = buildIndex(records);

  it('indexes doors by id and normalized key', () => {
    expect(index.doorById.get('D2')?.name).toBe('Two');
    expect(index.doorByKey.get('US1001')?.id).toBe('D1');
    expect(index.doorByKey.size).toBe(1);
  });

  it('orders active tiers by rank then name and indexes names case-insensitively', () => {
    expect(index.activeTiers.map((t) => t.id)).toEqual(['T1', 'T2', 'T4', 'T3']);
    expect(index.tierByName.get('premium')?.id).toBe('T2');
    expect(index.tierByName.has('retired')).toBe(false);
    expect(index.tierById.get('T0')?.active).toBe(false);
  });

  it('indexes SKUs by id and trimmed key, and door-level exceptions per door', () => {
    expect(index.skuByKey.get('100001')?.id).toBe('S1');
    expect(index.skuById.get('S2')?.id).toBe('S2');
    expect(index.doorExceptions.get('D1')?.map((e) => e.id)).toEqual(['E1', 'E2']);
    expect(index.doorExceptions.size).toBe(1);
  });

  it('normalizes keys and tier names', () => {
    expect(normalizeDoorKey(' us9 ')).toBe('US9');
    expect(normalizeTierName(' Premium ')).toBe('premium');
  });
});
