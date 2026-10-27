import type { AssortmentData } from '../../lib/data';
import { buildDoorRows, matchesSavedFilter } from '../../lib/doors';
import { cell, type TableRow } from '../../lib/excel';
import type { BulkState, ChangeType, RawRow } from './types';

/** Doors in scope for the selection or saved-filter source (closed doors are left out of filters). */
export function scopeDoors(state: BulkState, data: AssortmentData, today: Date) {
  if (state.source === 'selection') {
    return state.doorIds
      .map((id) => data.index.doorById.get(id))
      .filter((d): d is NonNullable<typeof d> => Boolean(d));
  }
  if (state.source === 'filter') {
    return buildDoorRows(data).filter(
      (row) => !row.isClosed && matchesSavedFilter(row, state.filter, today),
    );
  }
  return [];
}

/** Raw rows from the selection/filter scope or from the uploaded file (FR-036–FR-039). */
export function buildRawRows(state: BulkState, data: AssortmentData, today: Date): RawRow[] {
  if (state.source === 'upload') return state.upload?.rows ?? [];
  const doors = scopeDoors(state, data, today);
  if (state.type === 'tier') {
    const tier = state.tierId ? data.index.tierById.get(state.tierId) : undefined;
    if (!tier) return [];
    return doors.map((door, i) => ({
      line: i + 2,
      doorKey: door.doorKey ?? '',
      doorName: door.name,
      door,
      value: tier.name,
    }));
  }
  const rows: RawRow[] = [];
  for (const door of doors) {
    for (const skuId of state.skuIds) {
      rows.push({
        line: rows.length + 2,
        doorKey: door.doorKey ?? '',
        doorName: door.name,
        door,
        skuId,
        skuKey: data.index.skuById.get(skuId)?.key ?? skuId,
        action: state.skuAction === 'add' ? 'Add' : 'Remove',
      });
    }
  }
  return rows;
}

/** Turns uploaded table rows into raw rows for the chosen change type. */
export function rowsFromTable(rows: readonly TableRow[], type: ChangeType): RawRow[] {
  return rows.map(({ line, cells }) => {
    const base = {
      line,
      doorKey: cell(cells, 'Door key'),
      rowReason: cell(cells, 'Reason') || undefined,
    };
    return type === 'tier'
      ? { ...base, doorName: cell(cells, 'Door name') || undefined, value: cell(cells, 'New tier') }
      : { ...base, skuKey: cell(cells, 'SKU key'), action: cell(cells, 'Action') };
  });
}
