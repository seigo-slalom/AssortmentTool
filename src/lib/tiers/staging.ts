import { isSaved, parseKey, ruleKey } from './membership';
import type { Membership, Staged } from './types';

/** Stages one change; setting a SKU back to its saved state un-stages it. */
export function stageOne(
  staged: Staged,
  m: Membership,
  skuId: string,
  tierId: string,
  checked: boolean,
): Staged {
  const key = ruleKey(skuId, tierId);
  const next = { ...staged };
  if (checked === isSaved(m, skuId, tierId)) delete next[key];
  else next[key] = checked;
  return next;
}

/** Stages many SKUs at once (group toggle); `changed` counts keys that actually moved. */
export function stageMany(
  staged: Staged,
  m: Membership,
  skuIds: readonly string[],
  tierId: string,
  checked: boolean,
): { staged: Staged; changed: number } {
  const next: Record<string, boolean> = { ...staged };
  let changed = 0;
  for (const skuId of skuIds) {
    const key = ruleKey(skuId, tierId);
    if (checked === isSaved(m, skuId, tierId)) {
      if (key in next) {
        delete next[key];
        changed += 1;
      }
    } else if (next[key] !== checked) {
      next[key] = checked;
      changed += 1;
    }
  }
  return { staged: next, changed };
}

export const stagedForTier = (staged: Staged, tierId: string): number =>
  Object.keys(staged).filter((k) => parseKey(k).tierId === tierId).length;

export const stagedTierCount = (staged: Staged): number =>
  new Set(Object.keys(staged).map((k) => parseKey(k).tierId)).size;

export function dropTier(staged: Staged, tierId: string): Staged {
  const next: Record<string, boolean> = {};
  for (const [key, value] of Object.entries(staged)) {
    if (parseKey(key).tierId !== tierId) next[key] = value;
  }
  return next;
}

export function withoutKeys(staged: Staged, keys: readonly string[]): Staged {
  const next: Record<string, boolean> = { ...staged };
  for (const key of keys) delete next[key];
  return next;
}
