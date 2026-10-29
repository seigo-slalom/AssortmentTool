import type { IOperationResult } from '@microsoft/power-apps/data';
import { Cr380_assortmentexceptionsService } from '../../generated/services/Cr380_assortmentexceptionsService';
import { Cr380_doorsService } from '../../generated/services/Cr380_doorsService';
import { Cr380_tierrulesService } from '../../generated/services/Cr380_tierrulesService';
import { Cr380_tiersService } from '../../generated/services/Cr380_tiersService';
import {
  EXCEPTION_ACTION_ADD,
  EXCEPTION_ACTION_REMOVE,
  EXCEPTION_LEVEL_DOOR,
  EXCEPTION_STATUS_ACTIVE,
  EXCEPTION_STATUS_CANCELLED,
  mapExceptionRow,
  TIER_STATUS_ACTIVE,
  TIER_STATUS_INACTIVE,
  type ExceptionRecord,
} from './records';

// Writes go through the generated services only (research R7). None of these throw: every
// failure becomes `{ ok: false, error }` so a bulk run can report it per row.

export type WriteResult<T = void> = { ok: true; value: T } | { ok: false; error: string };

export const RECHECK_CHUNK = 50;

/** `@odata.bind` value for a lookup, e.g. `/cr380_tiers(<id>)`. */
export const bindTo = (entitySet: string, id: string): string => `/${entitySet}(${id})`;

const messageOf = (error: unknown): string => {
  if (typeof error === 'string') return error;
  const message = (error as { message?: unknown } | undefined)?.message;
  return typeof message === 'string' && message ? message : 'Unknown error';
};

async function attempt<T, R>(
  call: () => Promise<IOperationResult<T>>,
  map: (data: T) => R,
): Promise<WriteResult<R>> {
  try {
    const result = await call();
    if (!result.success) return { ok: false, error: messageOf(result.error) };
    return { ok: true, value: map(result.data) };
  } catch (error) {
    return { ok: false, error: messageOf(error) };
  }
}

const nothing = () => undefined;

/** Sets a door's tier; `null` clears it (used when undoing a door that had no tier). */
export function setDoorTier(doorId: string, tierId: string | null): Promise<WriteResult> {
  const changes = {
    'cr380_TierID@odata.bind': tierId ? bindTo('cr380_tiers', tierId) : null,
  } as unknown as Parameters<typeof Cr380_doorsService.update>[1];
  return attempt(() => Cr380_doorsService.update(doorId, changes), nothing);
}

export interface NewDoorException {
  doorId: string;
  doorKey: string;
  skuId: string;
  skuKey: string;
  action: 'add' | 'remove';
  reason: string;
  /** `YYYY-MM-DD` */
  today: string;
}

export function createDoorException(input: NewDoorException): Promise<WriteResult<{ id: string }>> {
  const add = input.action === 'add';
  return attempt(
    () =>
      Cr380_assortmentexceptionsService.create({
        'cr380_DoorID@odata.bind': bindTo('cr380_doors', input.doorId),
        'cr380_SKUID@odata.bind': bindTo('cr380_skus', input.skuId),
        cr380_exceptionlevel: EXCEPTION_LEVEL_DOOR,
        cr380_exceptionaction: add ? EXCEPTION_ACTION_ADD : EXCEPTION_ACTION_REMOVE,
        cr380_exceptionstatus: EXCEPTION_STATUS_ACTIVE,
        cr380_exceptionname: `${input.doorKey} · ${input.skuKey} · ${add ? 'Add' : 'Remove'}`,
        cr380_reason: input.reason,
        cr380_datereported: input.today,
        statecode: 0,
      }),
    (row) => ({ id: row.cr380_assortmentexceptionid }),
  );
}

/** Cancels an exception (status Cancelled); the record is kept (spec Clarifications). */
export function cancelException(exceptionId: string): Promise<WriteResult> {
  return attempt(
    () =>
      Cr380_assortmentexceptionsService.update(exceptionId, {
        cr380_exceptionstatus: EXCEPTION_STATUS_CANCELLED,
      }),
    nothing,
  );
}

/**
 * Puts a SKU in a tier: re-enables an existing (disabled) rule for the pair, otherwise creates
 * one, so re-adding never duplicates rules (spec 004 research R2).
 */
export async function enableTierRule(tierId: string, skuId: string): Promise<WriteResult> {
  try {
    const found = await Cr380_tierrulesService.getAll({
      select: ['cr380_tierruleid', 'cr380_isenabled'],
      filter: `statecode eq 0 and _cr380_tierid_value eq ${tierId} and _cr380_sku_value eq ${skuId}`,
      top: 1,
    });
    if (!found.success) return { ok: false, error: messageOf(found.error) };
    const existing = found.data[0];
    if (existing?.cr380_isenabled) return { ok: true, value: undefined };
    if (existing) {
      return attempt(
        () => Cr380_tierrulesService.update(existing.cr380_tierruleid, { cr380_isenabled: true }),
        nothing,
      );
    }
  } catch (error) {
    return { ok: false, error: messageOf(error) };
  }
  const record = {
    'cr380_TierID@odata.bind': bindTo('cr380_tiers', tierId),
    'cr380_SKU@odata.bind': bindTo('cr380_skus', skuId),
    cr380_isenabled: true,
    statecode: 0,
  } as unknown as Parameters<typeof Cr380_tierrulesService.create>[0];
  return attempt(() => Cr380_tierrulesService.create(record), nothing);
}

/** Takes a SKU out of a tier by disabling its rule; the record is kept. */
export function disableTierRule(ruleId: string): Promise<WriteResult> {
  return attempt(() => Cr380_tierrulesService.update(ruleId, { cr380_isenabled: false }), nothing);
}

export interface NewTier {
  name: string;
  description: string;
  rank: number;
}

export function createTier(input: NewTier): Promise<WriteResult<{ id: string }>> {
  const record = {
    cr380_tiername: input.name,
    cr380_description: input.description,
    cr380_rank: input.rank,
    cr380_tierstatus: TIER_STATUS_ACTIVE,
    statecode: 0,
  } as unknown as Parameters<typeof Cr380_tiersService.create>[0];
  return attempt(
    () => Cr380_tiersService.create(record),
    (row) => ({ id: row.cr380_tierid }),
  );
}

export interface TierPatch {
  name?: string;
  description?: string;
  rank?: number;
  active?: boolean;
}

export function updateTier(tierId: string, patch: TierPatch): Promise<WriteResult> {
  const changes: Record<string, unknown> = {};
  if (patch.name !== undefined) changes.cr380_tiername = patch.name;
  if (patch.description !== undefined) changes.cr380_description = patch.description;
  if (patch.rank !== undefined) changes.cr380_rank = patch.rank;
  if (patch.active !== undefined) {
    changes.cr380_tierstatus = patch.active ? TIER_STATUS_ACTIVE : TIER_STATUS_INACTIVE;
  }
  return attempt(
    () =>
      Cr380_tiersService.update(tierId, changes as Parameters<typeof Cr380_tiersService.update>[1]),
    nothing,
  );
}
const chunks = <T>(items: readonly T[], size: number): T[][] => {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
};

const anyOf = (field: string, ids: readonly string[]) =>
  `(${ids.map((id) => `${field} eq ${id}`).join(' or ')})`;

async function readAll<T>(call: () => Promise<IOperationResult<T[]>>, label: string) {
  const result = await call();
  if (!result.success) throw new Error(`Could not re-check ${label}: ${messageOf(result.error)}`);
  return result.data;
}

export interface DoorSnapshot {
  tierId?: string;
  status?: string;
}

/** Re-reads the current tier and status of the given doors, 50 ids per request (R8). */
export async function recheckDoors(ids: readonly string[]): Promise<Map<string, DoorSnapshot>> {
  const out = new Map<string, DoorSnapshot>();
  for (const part of chunks([...new Set(ids)], RECHECK_CHUNK)) {
    const rows = await readAll(
      () =>
        Cr380_doorsService.getAll({
          select: ['cr380_doorid', '_cr380_tierid_value', 'cr380_doorstatus'],
          filter: anyOf('cr380_doorid', part),
        }),
      'doors',
    );
    for (const row of rows) {
      out.set(row.cr380_doorid, {
        tierId: row._cr380_tierid_value || undefined,
        status: row.cr380_doorstatus || undefined,
      });
    }
  }
  return out;
}

/** Re-reads the active door-level exceptions of the given doors, 50 doors per request (R8). */
export async function recheckDoorExceptions(
  doorIds: readonly string[],
): Promise<Map<string, ExceptionRecord[]>> {
  const unique = [...new Set(doorIds)];
  const out = new Map<string, ExceptionRecord[]>(unique.map((id) => [id, []]));
  for (const part of chunks(unique, RECHECK_CHUNK)) {
    const rows = await readAll(
      () =>
        Cr380_assortmentexceptionsService.getAll({
          select: [
            'cr380_assortmentexceptionid',
            'cr380_exceptionlevel',
            'cr380_exceptionaction',
            '_cr380_doorid_value',
            '_cr380_skuid_value',
          ],
          filter: `statecode eq 0 and cr380_exceptionstatus eq ${EXCEPTION_STATUS_ACTIVE} and cr380_exceptionlevel eq ${EXCEPTION_LEVEL_DOOR} and ${anyOf('_cr380_doorid_value', part)}`,
        }),
      'door exceptions',
    );
    for (const row of rows) {
      const record = mapExceptionRow(row);
      out.get(record.doorId!)?.push(record);
    }
  }
  return out;
}
