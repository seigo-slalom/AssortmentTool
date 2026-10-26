import { compareIds } from './buildIndex';
import { REASON, type ReasonCode } from './reasons';
import type { EngineDataset, EngineException } from './types';

export interface ReferenceOutcome {
  inAssortment: boolean;
  reason: ReasonCode;
  baseReason: ReasonCode;
  appliedId?: string;
}

const EXCEPTION_REASON = {
  door: { add: REASON.ADDED_BY_DOOR_EXCEPTION, remove: REASON.REMOVED_BY_DOOR_EXCEPTION },
  retailer: {
    add: REASON.ADDED_BY_RETAILER_EXCEPTION,
    remove: REASON.REMOVED_BY_RETAILER_EXCEPTION,
  },
} as const;

// Deliberately naive door × SKU derivation used only to cross-check the optimized engine.
export function referenceOutcome(
  ds: EngineDataset,
  doorId: string,
  skuId: string,
): ReferenceOutcome | undefined {
  const door = ds.doors.find((d) => d.id === doorId);
  if (!door) return undefined;
  const sku = ds.skus.find((s) => s.id === skuId);
  const tierOk = door.tierId !== undefined && ds.tiers.some((t) => t.id === door.tierId);
  if (!tierOk) {
    return { inAssortment: false, reason: REASON.TIER_MISSING, baseReason: REASON.TIER_MISSING };
  }

  let baseReason: ReasonCode;
  if (!sku) baseReason = REASON.SKU_NOT_AVAILABLE;
  else if (!sku.active) baseReason = REASON.SKU_INACTIVE;
  else {
    const rules = ds.tierRules.filter((r) => r.tierId === door.tierId && r.skuId === skuId);
    if (rules.some((r) => r.enabled)) {
      const match = !!door.productLine && sku.axis === door.productLine;
      baseReason = match ? REASON.IN_TIER_RULES : REASON.AXIS_MISMATCH;
    } else baseReason = rules.length > 0 ? REASON.RULE_DISABLED : REASON.NOT_IN_TIER_RULES;
  }

  const valid = (e: EngineException) =>
    e.active &&
    !!e.level &&
    !!e.action &&
    e.skuId === skuId &&
    !!sku?.active &&
    (e.level === 'door' ? !!e.doorId : !!e.distributorNameCode);
  const pick = (level: 'door' | 'retailer') => {
    const matching = ds.exceptions
      .filter(valid)
      .filter((e) =>
        e.level !== level
          ? false
          : level === 'door'
            ? e.doorId === door.id
            : e.distributorNameCode === door.distributorNameCode,
      )
      .sort((a, b) => compareIds(a.id, b.id));
    return matching.find((e) => e.action === 'remove') ?? matching[0];
  };
  const applied = pick('door') ?? pick('retailer');
  if (!applied) {
    return {
      inAssortment: baseReason === REASON.IN_TIER_RULES,
      reason: baseReason,
      baseReason,
    };
  }
  return {
    inAssortment: applied.action === 'add',
    reason: EXCEPTION_REASON[applied.level as 'door' | 'retailer'][applied.action as 'add'],
    baseReason,
    appliedId: applied.id,
  };
}

export function referenceAssortment(ds: EngineDataset, doorId: string): string[] {
  return [...ds.skus]
    .map((s) => s.id)
    .sort(compareIds)
    .filter((skuId) => referenceOutcome(ds, doorId, skuId)?.inAssortment);
}
