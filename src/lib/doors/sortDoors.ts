import type { DoorSort, SortDir } from './doorQuery';
import type { DoorRow } from './doorRows';

type Compare = (a: DoorRow, b: DoorRow) => number;

const text = (value?: string) => value ?? '';
const tierRank = (row: DoorRow) => (row.tierName ? (row.tierRank ?? 0) : 0);

// Prototype comparators: no tier sorts as rank 0, no SKU count as −1 (both first ascending).
const COMPARE: Record<DoorSort, Compare> = {
  name: (a, b) => a.name.localeCompare(b.name),
  tier: (a, b) => tierRank(a) - tierRank(b),
  skus: (a, b) => (a.skuCount ?? -1) - (b.skuCount ?? -1),
  distributor: (a, b) => text(a.distributorName).localeCompare(text(b.distributorName)),
  changed: (a, b) => text(a.modifiedOn).localeCompare(text(b.modifiedOn)),
};

/** Sorts a copy; ties fall back to door name so the order is stable. */
export function sortDoors(rows: readonly DoorRow[], sort: DoorSort, dir: SortDir): DoorRow[] {
  const sign = dir === 'desc' ? -1 : 1;
  const compare = COMPARE[sort];
  return [...rows].sort((a, b) => sign * compare(a, b) || a.name.localeCompare(b.name));
}
