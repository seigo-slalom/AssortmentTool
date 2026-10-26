import { forEachBit, getBaseAssortment, hasBit } from './baseAssortment';
import { hasTier, type EngineIndex } from './buildIndex';
import { exceptionReason, resolveAll } from './exceptions';
import { DOOR_NOT_FOUND, REASON, type ReasonCode } from './reasons';
import type { DoorLookup, ExceptionRef } from './types';

export function deriveDoor(index: EngineIndex, doorId: string): DoorLookup {
  const door = index.doorById.get(doorId);
  if (!door) return { found: false, reason: DOOR_NOT_FOUND };
  if (!hasTier(index, door.tierId)) {
    return {
      found: true,
      assortment: { doorId, status: 'tier-missing', skuIds: [], reasons: [], count: 0 },
    };
  }

  const base = getBaseAssortment(index, door.tierId, door.productLine);
  const resolved = resolveAll(index, door);
  const extras: [number, ExceptionRef][] = [];
  for (const [skuIdx, { applied }] of resolved) {
    if (applied.action === 'add' && !hasBit(base.bits, skuIdx)) extras.push([skuIdx, applied]);
  }
  extras.sort((a, b) => a[0] - b[0]);

  const skuIds: string[] = [];
  const reasons: ReasonCode[] = [];
  const push = (skuIdx: number, reason: ReasonCode) => {
    skuIds.push(index.skuIds[skuIdx]);
    reasons.push(reason);
  };
  let next = 0;
  // Exception-added SKUs outside the base are merged in SKU order.
  const flushExtrasBefore = (limit: number) => {
    while (next < extras.length && extras[next][0] < limit) {
      push(extras[next][0], exceptionReason(extras[next][1]));
      next += 1;
    }
  };

  forEachBit(base.bits, (skuIdx) => {
    flushExtrasBefore(skuIdx);
    const entry = resolved.get(skuIdx);
    if (!entry) push(skuIdx, REASON.IN_TIER_RULES);
    else if (entry.applied.action === 'add') push(skuIdx, exceptionReason(entry.applied));
  });
  flushExtrasBefore(Infinity);

  return {
    found: true,
    assortment: { doorId, status: 'ok', skuIds, reasons, count: skuIds.length },
  };
}
