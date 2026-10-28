import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { DEFAULT_DOOR_QUERY, type DoorQuery } from './doorQuery';
import { buildDoorRows, type DoorRow } from './doorRows';
import { filterDoors } from './filterDoors';
import { makeData, makeRow, TEST_TODAY } from './fixtures.testutil';

const rows = buildDoorRows(makeData());
const q = (patch: Partial<DoorQuery> = {}): DoorQuery => ({ ...DEFAULT_DOOR_QUERY, ...patch });
const ids = (patch: Partial<DoorQuery>) => filterDoors(rows, q(patch), TEST_TODAY).map((r) => r.id);

describe('filterDoors', () => {
  it('hides Closed and Cancelled doors by default', () => {
    expect(ids({})).toEqual(['D1', 'D2', 'D4']);
  });

  it('a Door status filter replaces the default status gate', () => {
    expect(ids({ st: 'Closed' })).toEqual(['D3']);
    expect(ids({ st: 'Open' })).toEqual(['D1']);
  });

  it('the Closed saved filter shows only Closed and Cancelled doors', () => {
    expect(ids({ saved: 'closed' })).toEqual(['D3', 'D5']);
    expect(ids({ saved: 'closed', dist: ["Macy's"] })).toEqual(['D3']);
  });

  it('applies each saved filter', () => {
    expect(ids({ saved: 'needs-tier' })).toEqual(['D2']);
    expect(ids({ saved: 'fragrance-only' })).toEqual(['D1', 'D4']);
    expect(ids({ saved: 'recent' })).toEqual(['D2', 'D4']);
  });

  it('applies distributor and tier multi-selects, including Needs tier', () => {
    expect(ids({ dist: ["Macy's"] })).toEqual(['D1']);
    expect(ids({ dist: ["Macy's", 'Nordstrom'] })).toEqual(['D1', 'D2', 'D4']);
    expect(ids({ tier: ['T2'] })).toEqual(['D4']);
    expect(ids({ tier: ['none', 'T1'] })).toEqual(['D1', 'D2']);
  });

  it('applies the More filters', () => {
    expect(ids({ oo: 'Online' })).toEqual(['D2']);
    expect(ids({ dt: 'Department store' })).toEqual(['D1', 'D4']);
    expect(ids({ pl: 'Makeup' })).toEqual(['D2']);
  });

  it('searches name, Door key and SAP Ship To case-insensitively', () => {
    expect(ids({ q: 'ALPHA' })).toEqual(['D1']);
    expect(ids({ q: ' us1004 ' })).toEqual(['D4']);
    expect(ids({ q: '0040002' })).toEqual(['D2']);
  });

  it('combines everything with AND', () => {
    expect(ids({ dist: ['Nordstrom'], saved: 'fragrance-only', q: 'delta' })).toEqual(['D4']);
    expect(ids({ dist: ['Nordstrom'], saved: 'fragrance-only', q: 'bravo' })).toEqual([]);
  });

  it('adding a filter never widens the result', () => {
    const extra = fc.record({
      q: fc.constantFrom('', 'a', 'store', 'us10'),
      dist: fc.subarray(["Macy's", 'Nordstrom']),
      tier: fc.subarray(['T1', 'T2', 'none']),
      saved: fc.constantFrom(undefined, 'needs-tier', 'fragrance-only', 'recent'),
    });
    fc.assert(
      fc.property(extra, fc.constantFrom('Offline', 'Online'), (base, oo) => {
        const before = filterDoors(rows, q(base as Partial<DoorQuery>), TEST_TODAY).length;
        const after = filterDoors(
          rows,
          q({ ...(base as Partial<DoorQuery>), oo }),
          TEST_TODAY,
        ).length;
        return after <= before;
      }),
    );
  });

  it('filters 5,000 doors in under 50 ms', () => {
    const many: DoorRow[] = Array.from({ length: 5000 }, (_, i) =>
      makeRow({
        id: `D${i}`,
        name: `Door ${i}`,
        searchKey: `door ${i}|us${i}|00${i}`,
        distributorName: i % 2 ? "Macy's" : 'Nordstrom',
        tierId: i % 3 ? 'T1' : undefined,
        tierName: i % 3 ? 'Access' : undefined,
        productLine: i % 4 ? 'Makeup' : 'Fragrance',
        isClosed: i % 10 === 0,
      }),
    );
    const start = performance.now();
    filterDoors(many, q({ q: 'door 4', dist: ["Macy's"], saved: 'fragrance-only' }), TEST_TODAY);
    expect(performance.now() - start).toBeLessThan(50);
  });
});
