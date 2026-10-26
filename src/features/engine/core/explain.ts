import { axisMatches } from './baseAssortment';
import { hasTier, type EngineIndex } from './buildIndex';
import { exceptionReason, resolveException } from './exceptions';
import { DOOR_NOT_FOUND, REASON, type ReasonCode } from './reasons';
import type { EngineDoor, ExplainResult } from './types';

function baseReasonFor(index: EngineIndex, door: EngineDoor, skuIdx: number): ReasonCode {
  if (!index.skuActive[skuIdx]) return REASON.SKU_INACTIVE;
  const rules = index.tierRules.get(door.tierId as string);
  if (rules?.enabled.has(skuIdx)) {
    return axisMatches(index, skuIdx, door.productLine)
      ? REASON.IN_TIER_RULES
      : REASON.AXIS_MISMATCH;
  }
  return rules?.disabled.has(skuIdx) ? REASON.RULE_DISABLED : REASON.NOT_IN_TIER_RULES;
}

export function explainSku(index: EngineIndex, doorId: string, skuId: string): ExplainResult {
  const door = index.doorById.get(doorId);
  if (!door) return { found: false, reason: DOOR_NOT_FOUND };

  const skuIdx = index.skuIdxById.get(skuId);
  const resolution = skuIdx === undefined ? undefined : resolveException(index, door, skuIdx);
  const identity = { found: true, doorId, skuId } as const;

  if (!hasTier(index, door.tierId)) {
    return {
      ...identity,
      inAssortment: false,
      reason: REASON.TIER_MISSING,
      baseReason: REASON.TIER_MISSING,
      ...(resolution && { notApplied: [resolution.applied, ...resolution.overridden] }),
    };
  }

  const baseReason =
    skuIdx === undefined ? REASON.SKU_NOT_AVAILABLE : baseReasonFor(index, door, skuIdx);
  if (!resolution) {
    return {
      ...identity,
      inAssortment: baseReason === REASON.IN_TIER_RULES,
      reason: baseReason,
      baseReason,
    };
  }
  return {
    ...identity,
    inAssortment: resolution.applied.action === 'add',
    reason: exceptionReason(resolution.applied),
    baseReason,
    applied: resolution.applied,
    ...(resolution.overridden.length > 0 && { overridden: resolution.overridden }),
  };
}
