import { NO_TIER, type DoorQuery } from './doorQuery';
import type { DoorRow } from './doorRows';
import { matchesSavedFilter } from './savedFilters';

/** FR-007–FR-009: status gate, saved filter, then every other filter, combined with AND. */
export function filterDoors(rows: readonly DoorRow[], query: DoorQuery, today: Date): DoorRow[] {
  const search = query.q.trim().toLowerCase();
  const dist = new Set(query.dist);
  const tiers = new Set(query.tier);
  return rows.filter((row) => {
    if (query.saved === 'closed') {
      if (!row.isClosed) return false;
    } else if (query.st) {
      if (row.status !== query.st) return false;
    } else if (row.isClosed) {
      return false;
    }
    if (query.saved && query.saved !== 'closed' && !matchesSavedFilter(row, query.saved, today)) {
      return false;
    }
    if (dist.size && !dist.has(row.distributorName ?? '')) return false;
    if (tiers.size && !tiers.has(row.tierName ? row.tierId! : NO_TIER)) return false;
    if (query.oo && row.onlineOffline !== query.oo) return false;
    if (query.dt && row.doorType !== query.dt) return false;
    if (query.pl && row.productLine !== query.pl) return false;
    if (search && !row.searchKey.includes(search)) return false;
    return true;
  });
}
