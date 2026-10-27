import {
  normalizeDoorKey,
  normalizeTierName,
  type AssortmentData,
  type DoorRecord,
} from '../../lib/data';
import { doorSkuIds, statusCategory, tierHasOtherAxes } from '../../lib/doors';
import type { ChangeType, CheckedRow, RawRow, RowStatus } from './types';

const DOOR_NOT_FOUND_TIER =
  'Door key not found in the door list. Check the key, for example US1542.';
const DOOR_NOT_FOUND_SKU = 'Door key not found in the door list.';

const findDoor = (raw: RawRow, data: AssortmentData): DoorRecord | undefined =>
  raw.door ?? (raw.doorKey ? data.index.doorByKey.get(normalizeDoorKey(raw.doorKey)) : undefined);

const tierLabel = (data: AssortmentData, door: DoorRecord) =>
  (door.tierId && data.index.tierById.get(door.tierId)?.name) || 'Needs tier';

const hasTier = (data: AssortmentData, door: DoorRecord) =>
  Boolean(door.tierId && data.index.tierById.has(door.tierId));

function base(raw: RawRow, index: number, door?: DoorRecord): CheckedRow {
  return {
    key: `r${index}`,
    line: raw.line,
    doorKey: raw.doorKey,
    doorLabel: door ? door.name : `${raw.doorName ?? raw.doorKey} (from file)`,
    doorId: door?.id,
    change: '',
    status: 'ready',
    message: '',
    rowReason: raw.rowReason,
    snapshot: door ? { tierId: door.tierId, status: door.status } : undefined,
  };
}

const mark = (row: CheckedRow, status: RowStatus, message: string): CheckedRow => ({
  ...row,
  status,
  message,
});

/** Re-tier checks, first matching rule wins (FR-040). The last row for a door wins. */
function checkTierRow(
  raw: RawRow,
  i: number,
  data: AssortmentData,
  lastForDoor: Map<string, number>,
) {
  const door = findDoor(raw, data);
  const target = data.index.tierByName.get(normalizeTierName(raw.value ?? ''));
  let row: CheckedRow = {
    ...base(raw, i, door),
    change: `${door ? tierLabel(data, door) : '—'} → ${raw.value ?? ''}`,
    tierId: target?.id,
  };
  if (!door) return mark(row, 'error', DOOR_NOT_FOUND_TIER);
  if (!target) {
    const names = data.index.activeTiers.map((t) => t.name).join(', ');
    return mark(row, 'error', `“${raw.value ?? ''}” is not a tier. Use ${names}.`);
  }
  row = { ...row, change: `${tierLabel(data, door)} → ${target.name}` };
  if (lastForDoor.get(door.id) !== i) {
    return mark(row, 'nochange', 'Replaced by a later row for this door.');
  }
  if (statusCategory(door.status) === 'closed') {
    return mark(
      row,
      'skipped',
      `${door.status}: tiers are not changed on closed or cancelled doors.`,
    );
  }
  if (door.tierId === target.id) return mark(row, 'nochange', `Already ${target.name}.`);
  if (tierHasOtherAxes(data, target.id, door.productLine)) {
    return mark(
      row,
      'warning',
      `Product line ${door.productLine ?? 'not set'}: it moves, but receives SKUs of those axes only.`,
    );
  }
  if (statusCategory(door.status) === 'project') {
    return mark(
      row,
      'warning',
      'Project door (MTP): the tier is saved; nothing goes to SAP until it is Pre-Trade.',
    );
  }
  return row;
}

/** SKU checks, first matching rule wins (FR-041). Repeated door × SKU rows change nothing. */
function checkSkuRow(
  raw: RawRow,
  i: number,
  data: AssortmentData,
  seen: Set<string>,
  receives: (doorId: string) => ReadonlySet<string>,
) {
  const door = findDoor(raw, data);
  const sku = raw.skuId
    ? data.index.skuById.get(raw.skuId)
    : data.index.skuByKey.get((raw.skuKey ?? '').trim());
  const actionText = (raw.action ?? '').trim().toLowerCase();
  const add = actionText === 'add';
  const label = add ? 'Add' : actionText === 'remove' ? 'Remove' : raw.action || '—';
  const row: CheckedRow = {
    ...base(raw, i, door),
    change: `${label} ${sku?.key ?? raw.skuKey ?? ''}${sku?.name ? ` · ${sku.name}` : ''}`,
    skuId: sku?.id,
    skuKey: sku?.key ?? raw.skuKey,
    action: add ? 'add' : 'remove',
  };
  if (!door) return mark(row, 'error', DOOR_NOT_FOUND_SKU);
  if (!sku) return mark(row, 'error', `SKU key ${raw.skuKey ?? ''} is not in the catalogue.`);
  if (actionText !== 'add' && actionText !== 'remove') {
    return mark(row, 'error', 'Action must be Add or Remove.');
  }
  const pair = `${door.id}|${sku.id}`;
  if (seen.has(pair)) return mark(row, 'nochange', 'Duplicate of an earlier row.');
  seen.add(pair);
  if (statusCategory(door.status) === 'closed') return mark(row, 'skipped', `${door.status}.`);
  if (!hasTier(data, door)) {
    return mark(row, 'skipped', 'The door has no tier yet, so it has no assortment to change.');
  }
  // Same rule as the engine: exact text, and an empty product line never matches.
  const eligible = Boolean(door.productLine) && sku.axis === door.productLine;
  if (add && !eligible) {
    return mark(
      row,
      'skipped',
      `Axis ${sku.axis ?? 'not set'} is not in the door’s product line (${door.productLine ?? 'not set'}).`,
    );
  }
  if ((data.index.doorExceptions.get(door.id) ?? []).some((e) => e.skuId === sku.id)) {
    return mark(
      row,
      'error',
      'This door already has an exception for this SKU. Change it on the door.',
    );
  }
  const has = receives(door.id).has(sku.id);
  if (add && has) return mark(row, 'nochange', 'Already receives this SKU.');
  if (!add && !has) return mark(row, 'nochange', 'Does not receive this SKU today.');
  return row;
}

/** Checks every row against the door list, catalogue, product line and assortment rules. */
export function checkRows(
  raw: readonly RawRow[],
  type: ChangeType,
  data: AssortmentData,
): CheckedRow[] {
  if (type === 'tier') {
    const lastForDoor = new Map<string, number>();
    raw.forEach((r, i) => {
      const door = findDoor(r, data);
      if (door) lastForDoor.set(door.id, i);
    });
    return raw.map((r, i) => checkTierRow(r, i, data, lastForDoor));
  }
  const seen = new Set<string>();
  const cache = new Map<string, ReadonlySet<string>>();
  const receives = (doorId: string) => {
    let set = cache.get(doorId);
    if (!set) {
      set = new Set(doorSkuIds(data.engine, doorId));
      cache.set(doorId, set);
    }
    return set;
  };
  return raw.map((r, i) => checkSkuRow(r, i, data, seen, receives));
}

export const STATUS_LABEL: Record<RowStatus, string> = {
  ready: 'Ready',
  warning: 'Warning',
  nochange: 'No change',
  skipped: 'Skipped',
  error: 'Error',
};

export const STATUS_TONE: Record<
  RowStatus,
  'success' | 'warning' | 'neutral' | 'unavailable' | 'critical'
> = {
  ready: 'success',
  warning: 'warning',
  nochange: 'neutral',
  skipped: 'unavailable',
  error: 'critical',
};
