import { todayIso } from '../../lib/clock';
import {
  cancelException,
  createDoorException,
  recheckDoorExceptions,
  recheckDoors,
  setDoorTier,
  type WriteResult,
} from '../../lib/data';
import { isPoolError, runPool } from '../../lib/async/runPool';
import type { BulkFailure, BulkResult, Change, ChangeType, CheckedRow } from './types';

export interface BulkDeps {
  setDoorTier: typeof setDoorTier;
  createDoorException: typeof createDoorException;
  cancelException: typeof cancelException;
  recheckDoors: typeof recheckDoors;
  recheckDoorExceptions: typeof recheckDoorExceptions;
  /** `YYYY-MM-DD` for the exception's date reported. */
  today: () => string;
}

export const STALE_MESSAGE = 'Changed by someone else — not updated';

export const DEFAULT_DEPS: BulkDeps = {
  setDoorTier,
  createDoorException,
  cancelException,
  recheckDoors,
  recheckDoorExceptions,
  today: todayIso,
};

export type Progress = (done: number, total: number) => void;

const messageOf = (error: unknown) => (error instanceof Error ? error.message : String(error));

/** Rows whose door changed since the check are left out (FR-045, research R8). */
async function partitionStale(rows: readonly CheckedRow[], type: ChangeType, deps: BulkDeps) {
  const doorIds = [...new Set(rows.map((r) => r.doorId!))];
  const doors = await deps.recheckDoors(doorIds);
  const exceptions = type === 'sku' ? await deps.recheckDoorExceptions(doorIds) : undefined;
  const stale: CheckedRow[] = [];
  const fresh: CheckedRow[] = [];
  for (const row of rows) {
    const now = doors.get(row.doorId!);
    const changed =
      !now ||
      now.tierId !== row.snapshot?.tierId ||
      now.status !== row.snapshot?.status ||
      Boolean(exceptions?.get(row.doorId!)?.some((e) => e.skuId === row.skuId));
    (changed ? stale : fresh).push(row);
  }
  return { stale, fresh };
}

const fullReason = (reason: string, row: CheckedRow) =>
  row.rowReason ? `${reason} · ${row.rowReason}` : reason;

async function writeRow(
  row: CheckedRow,
  type: ChangeType,
  reason: string,
  deps: BulkDeps,
): Promise<WriteResult<Change>> {
  if (type === 'tier') {
    const result = await deps.setDoorTier(row.doorId!, row.tierId!);
    return result.ok
      ? {
          ok: true,
          value: {
            kind: 'tier',
            doorId: row.doorId!,
            doorLabel: row.doorLabel,
            prevTierId: row.snapshot?.tierId,
            newTierId: row.tierId!,
          },
        }
      : result;
  }
  const result = await deps.createDoorException({
    doorId: row.doorId!,
    doorKey: row.doorKey,
    skuId: row.skuId!,
    skuKey: row.skuKey ?? '',
    action: row.action!,
    reason: fullReason(reason, row),
    today: deps.today(),
  });
  return result.ok
    ? {
        ok: true,
        value: {
          kind: 'exception',
          doorId: row.doorId!,
          doorLabel: row.doorLabel,
          exceptionId: result.value.id,
        },
      }
    : result;
}

/** Re-checks, then saves the applicable rows four at a time; never throws (FR-045, FR-048). */
export async function applyBulk(
  rows: readonly CheckedRow[],
  type: ChangeType,
  reason: string,
  deps: BulkDeps,
  onProgress?: Progress,
): Promise<BulkResult> {
  const result: BulkResult = {
    kind: 'applied',
    type,
    reason,
    succeeded: [],
    failed: [],
    stale: [],
    total: rows.length,
  };
  let fresh: readonly CheckedRow[];
  try {
    const parts = await partitionStale(rows, type, deps);
    result.stale = parts.stale;
    fresh = parts.fresh;
  } catch (error) {
    result.failed = rows.map((row) => ({
      key: row.key,
      doorLabel: row.doorLabel,
      error: messageOf(error),
      row,
    }));
    return result;
  }
  const outcomes = await runPool(fresh, (row) => writeRow(row, type, reason, deps), { onProgress });
  outcomes.forEach((outcome, i) => {
    const row = fresh[i];
    if (isPoolError(outcome) || !outcome.ok) {
      const error = isPoolError(outcome) ? outcome.message : outcome.error;
      result.failed.push({ key: row.key, doorLabel: row.doorLabel, error, row });
    } else {
      result.succeeded.push(outcome.value);
    }
  });
  return result;
}

async function reverse(change: Change, deps: BulkDeps): Promise<WriteResult> {
  return change.kind === 'tier'
    ? deps.setDoorTier(change.doorId, change.prevTierId ?? null)
    : deps.cancelException(change.exceptionId);
}

async function reverseAll(changes: readonly Change[], deps: BulkDeps, onProgress?: Progress) {
  const outcomes = await runPool(changes, (change) => reverse(change, deps), { onProgress });
  const succeeded: Change[] = [];
  const failed: BulkFailure[] = [];
  outcomes.forEach((outcome, i) => {
    const change = changes[i];
    if (isPoolError(outcome) || !outcome.ok) {
      const error = isPoolError(outcome) ? outcome.message : outcome.error;
      failed.push({ key: `u${i}-${change.doorId}`, doorLabel: change.doorLabel, error, change });
    } else {
      succeeded.push(change);
    }
  });
  return { succeeded, failed };
}

/** Reverses the successful changes of the update just applied (FR-047). */
export async function undoBulk(
  applied: BulkResult,
  deps: BulkDeps,
  onProgress?: Progress,
): Promise<BulkResult> {
  const { succeeded, failed } = await reverseAll(applied.succeeded, deps, onProgress);
  return {
    kind: 'undone',
    type: applied.type,
    reason: applied.reason,
    succeeded,
    failed,
    stale: [],
    total: applied.succeeded.length,
    applied,
  };
}

/** Retries only the failed rows (apply) or changes (undo) and merges the outcome. */
export async function retryFailed(
  result: BulkResult,
  deps: BulkDeps,
  onProgress?: Progress,
): Promise<BulkResult> {
  if (result.kind === 'applied') {
    const again = await applyBulk(
      result.failed.map((f) => f.row!),
      result.type,
      result.reason,
      deps,
      onProgress,
    );
    return {
      ...result,
      succeeded: [...result.succeeded, ...again.succeeded],
      failed: again.failed,
      stale: [...result.stale, ...again.stale],
    };
  }
  const again = await reverseAll(
    result.failed.map((f) => f.change!),
    deps,
    onProgress,
  );
  return { ...result, succeeded: [...result.succeeded, ...again.succeeded], failed: again.failed };
}

/** Doors touched by the successful changes. */
export const doorCount = (result: BulkResult) =>
  new Set(result.succeeded.map((c) => c.doorId)).size;
