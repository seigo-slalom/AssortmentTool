import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { makeRow, TEST_TODAY } from './fixtures.testutil';
import {
  BULK_SAVED_FILTERS,
  isSavedFilterId,
  matchesSavedFilter,
  SAVED_FILTERS,
  savedFilterLabel,
} from './savedFilters';

describe('saved filters', () => {
  it('lists exactly the four supported filters in Doors order, without Q3 cluster review', () => {
    expect(SAVED_FILTERS.map((f) => f.label)).toEqual([
      'Needs tier',
      'Fragrance-only product line',
      'Opened in last 90 days',
      'Closed',
    ]);
    expect(SAVED_FILTERS.some((f) => /q3/i.test(f.id) || /Q3/.test(f.label))).toBe(false);
    expect(BULK_SAVED_FILTERS).toEqual(['needs-tier', 'recent', 'fragrance-only']);
    expect(savedFilterLabel('recent')).toBe('Opened in last 90 days');
    expect(isSavedFilterId('closed')).toBe(true);
    expect(isSavedFilterId('q3')).toBe(false);
  });

  it('needs-tier matches doors without a tier', () => {
    expect(matchesSavedFilter(makeRow(), 'needs-tier', TEST_TODAY)).toBe(true);
    expect(matchesSavedFilter(makeRow({ tierName: 'Access' }), 'needs-tier', TEST_TODAY)).toBe(
      false,
    );
  });

  it('fragrance-only matches the exact product line "Fragrance"', () => {
    const match = (productLine?: string) =>
      matchesSavedFilter(makeRow({ productLine }), 'fragrance-only', TEST_TODAY);
    expect(match('Fragrance')).toBe(true);
    expect(match('fragrance')).toBe(false);
    expect(match(' Fragrance')).toBe(false);
    expect(match(undefined)).toBe(false);
  });

  it.each([
    ['2026-06-25', true],
    ['2026-06-24', false],
    ['2026-09-23', true],
    ['2026-09-24', false],
    ['2026-08-01T00:00:00Z', true],
    [undefined, false],
  ])('recent: opening date %s → %s (today 2026-09-23)', (openingDate, expected) => {
    expect(matchesSavedFilter(makeRow({ openingDate }), 'recent', TEST_TODAY)).toBe(expected);
  });

  it('recent never matches a future opening date', () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 4000 }), (days) => {
        const d = new Date(2026, 8, 23 + days);
        const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        return !matchesSavedFilter(makeRow({ openingDate: iso }), 'recent', TEST_TODAY);
      }),
    );
  });

  it('closed matches Closed and Cancelled doors', () => {
    expect(matchesSavedFilter(makeRow({ isClosed: true }), 'closed', TEST_TODAY)).toBe(true);
    expect(matchesSavedFilter(makeRow(), 'closed', TEST_TODAY)).toBe(false);
  });
});
