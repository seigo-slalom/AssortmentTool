import { describe, expect, it } from 'vitest';
import { buildDoorRows } from './doorRows';
import { filterOptions } from './filterOptions';
import { makeData } from './fixtures.testutil';

describe('filterOptions', () => {
  it('lists distinct, sorted values present in the data', () => {
    const data = makeData();
    const options = filterOptions(buildDoorRows(data), data.index.activeTiers);
    expect(options.distributors.map((o) => o.value)).toEqual(["Macy's", 'Nordstrom']);
    expect(options.tiers).toEqual([
      { value: 'T1', label: 'Access' },
      { value: 'T2', label: 'Premium' },
      { value: 'T3', label: 'Expertise' },
      { value: 'none', label: 'Needs tier' },
    ]);
    expect(options.onlineOffline.map((o) => o.label)).toEqual(['Offline', 'Online']);
    expect(options.doorTypes.map((o) => o.label)).toEqual(['Department store', 'Specialty']);
    expect(options.productLines.map((o) => o.label)).toEqual(['Fragrance', 'Makeup']);
    expect(options.statuses.map((o) => o.label)).toEqual([
      'Cancelled',
      'Closed',
      'Open',
      'Pre-Trade',
      'Project (MTP)',
    ]);
  });
});
