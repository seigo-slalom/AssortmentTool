import { describe, expect, it } from 'vitest';
import { makeData, TEST_RECORDS } from '../../lib/doors/fixtures.testutil';
import { skuGroups, skuOptions } from './options';

const data = makeData({
  ...TEST_RECORDS,
  skus: [
    { id: 'A', key: '1', name: 'One', franchise: 'Coco', line: 'L1' },
    { id: 'B', key: '2', franchise: 'Coco' },
    { id: 'C', line: 'L2' },
    { id: 'D' },
  ],
});

describe('SKU pickers', () => {
  it('groups SKUs by franchise and line, skipping missing values', () => {
    const groups = skuGroups(data);
    expect(groups.options).toEqual([
      { label: 'Franchise', options: [{ value: 'f|Coco', label: 'Coco · 2 SKUs' }] },
      {
        label: 'Line',
        options: [
          { value: 'l|L1', label: 'L1 · 1 SKU' },
          { value: 'l|L2', label: 'L2 · 1 SKU' },
        ],
      },
    ]);
    expect(groups.ids.get('f|Coco')).toEqual(['A', 'B']);
    expect(skuGroups(makeData({ ...TEST_RECORDS, skus: [{ id: 'X' }] })).options).toEqual([]);
  });

  it('labels SKUs by key and name, falling back to the id', () => {
    expect(skuOptions(data).map((o) => o.label)).toEqual(['1 · One', '2', 'C', 'D']);
  });
});
