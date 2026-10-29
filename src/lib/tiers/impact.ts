import type { SkuRecord } from '../data';
import { parseKey } from './membership';
import type { DoorCounts, Staged } from './types';

/** Active doors in the tier that receive the SKU: the door's product line equals its axis. */
export const eligibleTierDoors = (
  counts: ReadonlyMap<string, DoorCounts>,
  tierId: string,
  sku: SkuRecord | undefined,
): number => (sku?.axis ? (counts.get(tierId)?.byLine.get(sku.axis) ?? 0) : 0);

export interface StagedImpact {
  changes: number;
  tiers: number;
  doorDelta: number;
}

export function stagedImpact(
  staged: Staged,
  counts: ReadonlyMap<string, DoorCounts>,
  skuById: ReadonlyMap<string, SkuRecord>,
): StagedImpact {
  const tiers = new Set<string>();
  let doorDelta = 0;
  const keys = Object.keys(staged);
  for (const key of keys) {
    const { skuId, tierId } = parseKey(key);
    tiers.add(tierId);
    doorDelta += (staged[key] ? 1 : -1) * eligibleTierDoors(counts, tierId, skuById.get(skuId));
  }
  return { changes: keys.length, tiers: tiers.size, doorDelta };
}
