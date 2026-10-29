import type { DoorRecord, ExceptionRecord, SkuRecord, TierRuleRecord } from '../data';
import { statusCategory } from '../doors';
import type { DoorCounts, Membership, SkuCounts, Staged } from './types';

export const ruleKey = (skuId: string, tierId: string): string => `${skuId}|${tierId}`;

export const parseKey = (key: string): { skuId: string; tierId: string } => {
  const [skuId, tierId] = key.split('|');
  return { skuId, tierId };
};

export function buildMembership(rules: readonly TierRuleRecord[]): Membership {
  const bySku = new Map<string, Set<string>>();
  const ruleId = new Map<string, string>();
  for (const rule of rules) {
    const set = bySku.get(rule.skuId) ?? new Set<string>();
    set.add(rule.tierId);
    bySku.set(rule.skuId, set);
    ruleId.set(ruleKey(rule.skuId, rule.tierId), rule.id);
  }
  return { bySku, ruleId };
}

export const isSaved = (m: Membership, skuId: string, tierId: string): boolean =>
  m.bySku.get(skuId)?.has(tierId) ?? false;

export const isEffective = (
  staged: Staged,
  m: Membership,
  skuId: string,
  tierId: string,
): boolean => {
  const key = ruleKey(skuId, tierId);
  return key in staged ? staged[key] : isSaved(m, skuId, tierId);
};

/** SKUs with an active add exception (they reach doors without a tier rule). */
export const addExceptionSkuIds = (exceptions: readonly ExceptionRecord[]): Set<string> =>
  new Set(exceptions.filter((e) => e.action === 'add' && e.skuId).map((e) => e.skuId!));

/** A SKU in no tier and with no add exception (prototype "New · in no tier"). */
export const isNewSku = (m: Membership, addExceptions: ReadonlySet<string>, skuId: string) =>
  !(m.bySku.get(skuId)?.size ?? 0) && !addExceptions.has(skuId);

export const isActiveTieredDoor = (door: DoorRecord): boolean =>
  !!door.tierId && statusCategory(door.status) !== 'closed';

interface MutableDoorCounts {
  total: number;
  byLine: Map<string, number>;
  online: number;
  offline: number;
}

export function tierDoorCounts(doors: readonly DoorRecord[]): Map<string, DoorCounts> {
  const out = new Map<string, MutableDoorCounts>();
  for (const door of doors) {
    if (!isActiveTieredDoor(door)) continue;
    const c = out.get(door.tierId!) ?? { total: 0, byLine: new Map(), online: 0, offline: 0 };
    c.total += 1;
    const line = door.productLine ?? '';
    c.byLine.set(line, (c.byLine.get(line) ?? 0) + 1);
    if (door.onlineOffline?.toLowerCase() === 'online') c.online += 1;
    else c.offline += 1;
    out.set(door.tierId!, c);
  }
  return out;
}

export function tierSkuCounts(
  m: Membership,
  skuById: ReadonlyMap<string, SkuRecord>,
): Map<string, SkuCounts> {
  const out = new Map<string, SkuCounts>();
  for (const [skuId, tiers] of m.bySku) {
    const sku = skuById.get(skuId);
    if (!sku) continue;
    for (const tierId of tiers) {
      const c = out.get(tierId) ?? { retail: 0, spm: 0 };
      if (sku.type === 'spm') c.spm += 1;
      else c.retail += 1;
      out.set(tierId, c);
    }
  }
  return out;
}

/** SKUs per (tier, axis); a door's base assortment size is the count for its product line. */
export function tierAxisCounts(
  m: Membership,
  skuById: ReadonlyMap<string, SkuRecord>,
): Map<string, Map<string, number>> {
  const out = new Map<string, Map<string, number>>();
  for (const [skuId, tiers] of m.bySku) {
    const axis = skuById.get(skuId)?.axis;
    if (!axis) continue;
    for (const tierId of tiers) {
      const byAxis = out.get(tierId) ?? new Map<string, number>();
      byAxis.set(axis, (byAxis.get(axis) ?? 0) + 1);
      out.set(tierId, byAxis);
    }
  }
  return out;
}
