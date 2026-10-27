import { useDeferredValue, useEffect, useMemo } from 'react';
import { today } from '../../lib/clock';
import { useAssortmentData, type AssortmentData } from '../../lib/data';
import {
  buildDoorRows,
  filterDoors,
  filterOptions,
  sortDoors,
  type DoorFilterOptions,
  type DoorQuery,
  type DoorRow,
} from '../../lib/doors';
import { doorSelection } from '../../lib/session';

export interface DoorsView {
  state: 'loading' | 'error' | 'ready';
  data?: AssortmentData;
  rows: DoorRow[];
  /** Filtered and sorted, all pages. */
  sorted: DoorRow[];
  /** Open doors without a tier, across all data. */
  needsTier: number;
  options: DoorFilterOptions;
  refetch: () => void;
}

/** Rows, filtering and sorting for the Doors screen, recomputed only when inputs change. */
export function useDoorsView(query: DoorQuery): DoorsView {
  const { status, data, refetch } = useAssortmentData();
  const rows = useMemo(() => (data ? buildDoorRows(data) : []), [data]);
  // Typing in search stays responsive; the list catches up a frame later (R11).
  const deferred = useDeferredValue(query);
  const sorted = useMemo(
    () => sortDoors(filterDoors(rows, deferred, today()), deferred.sort, deferred.dir),
    [rows, deferred],
  );
  const needsTier = useMemo(() => rows.filter((r) => !r.isClosed && !r.tierName).length, [rows]);
  const options = useMemo(() => filterOptions(rows, data?.index.activeTiers ?? []), [rows, data]);

  useEffect(() => {
    if (data) doorSelection.prune(new Set(data.records.doors.map((d) => d.id)));
  }, [data]);

  const state = status === 'pending' ? 'loading' : status === 'error' ? 'error' : 'ready';
  return { state, data, rows, sorted, needsTier, options, refetch };
}
