import { formatIsoDate } from '../clock';
import type { DoorRow } from './doorRows';

export type SavedFilterId = 'needs-tier' | 'fragrance-only' | 'recent' | 'closed';

/** Doors screen order (FR-006). "Q3 cluster review" is intentionally absent (data gap). */
export const SAVED_FILTERS: readonly { id: SavedFilterId; label: string }[] = [
  { id: 'needs-tier', label: 'Needs tier' },
  { id: 'fragrance-only', label: 'Fragrance-only product line' },
  { id: 'recent', label: 'Opened in last 90 days' },
  { id: 'closed', label: 'Closed' },
];

/** Saved filters offered as a Bulk Update source; closed doors are always left out there. */
export const BULK_SAVED_FILTERS: readonly SavedFilterId[] = [
  'needs-tier',
  'recent',
  'fragrance-only',
];

export const FRAGRANCE_ONLY_PRODUCT_LINE = 'Fragrance';
export const RECENT_DAYS = 90;

export const savedFilterLabel = (id: SavedFilterId): string =>
  SAVED_FILTERS.find((f) => f.id === id)!.label;

export const isSavedFilterId = (value: unknown): value is SavedFilterId =>
  SAVED_FILTERS.some((f) => f.id === value);

const daysBefore = (date: Date, days: number) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate() - days);

/** FR-007 definitions. Dates compare by calendar day; a missing opening date never matches. */
export function matchesSavedFilter(row: DoorRow, id: SavedFilterId, today: Date): boolean {
  switch (id) {
    case 'needs-tier':
      return !row.tierName;
    case 'fragrance-only':
      return row.productLine === FRAGRANCE_ONLY_PRODUCT_LINE;
    case 'recent': {
      if (!row.openingDate) return false;
      const day = row.openingDate.slice(0, 10);
      return day >= formatIsoDate(daysBefore(today, RECENT_DAYS)) && day <= formatIsoDate(today);
    }
    case 'closed':
      return row.isClosed;
  }
}
