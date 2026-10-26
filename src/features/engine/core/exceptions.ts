import type { EngineIndex, SkuExceptions } from './buildIndex';
import { REASON, type ReasonCode } from './reasons';
import type { EngineDoor, ExceptionRef } from './types';

export interface Resolution {
  applied: ExceptionRef;
  overridden: ExceptionRef[];
}

const EXCEPTION_REASON = {
  door: { add: REASON.ADDED_BY_DOOR_EXCEPTION, remove: REASON.REMOVED_BY_DOOR_EXCEPTION },
  retailer: {
    add: REASON.ADDED_BY_RETAILER_EXCEPTION,
    remove: REASON.REMOVED_BY_RETAILER_EXCEPTION,
  },
} as const;

export const exceptionReason = (ref: ExceptionRef): ReasonCode =>
  EXCEPTION_REASON[ref.level][ref.action];

// The primary (finer-grained) entry wins; the secondary one is reported as overridden.
const combine = (primary: SkuExceptions, secondary?: SkuExceptions): Resolution => ({
  applied: primary.effective,
  overridden: secondary
    ? [...primary.overridden, secondary.effective, ...secondary.overridden]
    : primary.overridden,
});

const retailerEntries = (index: EngineIndex, door: EngineDoor) =>
  index.retailerExceptions.get(door.distributorNameCode ?? '');

export function resolveException(
  index: EngineIndex,
  door: EngineDoor,
  skuIdx: number,
): Resolution | undefined {
  const byDoor = index.doorExceptions.get(door.id)?.get(skuIdx);
  const byRetailer = retailerEntries(index, door)?.get(skuIdx);
  if (byDoor) return combine(byDoor, byRetailer);
  return byRetailer && combine(byRetailer);
}

export function resolveAll(index: EngineIndex, door: EngineDoor): Map<number, Resolution> {
  const resolved = new Map<number, Resolution>();
  const byDoor = index.doorExceptions.get(door.id);
  const byRetailer = retailerEntries(index, door);
  for (const [skuIdx, entry] of byDoor ?? []) {
    resolved.set(skuIdx, combine(entry, byRetailer?.get(skuIdx)));
  }
  for (const [skuIdx, entry] of byRetailer ?? []) {
    if (!resolved.has(skuIdx)) resolved.set(skuIdx, combine(entry));
  }
  return resolved;
}
