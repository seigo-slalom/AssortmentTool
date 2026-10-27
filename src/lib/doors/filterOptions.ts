import type { TierRecord } from '../data';
import { NO_TIER } from './doorQuery';
import type { DoorRow } from './doorRows';

export interface FilterOption {
  value: string;
  label: string;
}

export interface DoorFilterOptions {
  distributors: FilterOption[];
  tiers: FilterOption[];
  onlineOffline: FilterOption[];
  doorTypes: FilterOption[];
  productLines: FilterOption[];
  statuses: FilterOption[];
}

const distinct = (rows: readonly DoorRow[], pick: (row: DoorRow) => string | undefined) =>
  [...new Set(rows.map(pick).filter((v): v is string => Boolean(v)))]
    .sort((a, b) => a.localeCompare(b))
    .map((value) => ({ value, label: value }));

/** Filter options come from the values present in the data (FR-004, FR-005). */
export function filterOptions(
  rows: readonly DoorRow[],
  activeTiers: readonly TierRecord[],
): DoorFilterOptions {
  return {
    distributors: distinct(rows, (r) => r.distributorName),
    tiers: [
      ...activeTiers.map((t) => ({ value: t.id, label: t.name })),
      { value: NO_TIER, label: 'Needs tier' },
    ],
    onlineOffline: distinct(rows, (r) => r.onlineOffline),
    doorTypes: distinct(rows, (r) => r.doorType),
    productLines: distinct(rows, (r) => r.productLine),
    statuses: distinct(rows, (r) => r.status),
  };
}
