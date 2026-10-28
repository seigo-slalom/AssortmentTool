import type { AssortmentData } from '../data';

/**
 * Whether a tier's rules include SKUs whose axis differs from the door's product line, i.e.
 * the door would receive only part of that tier (exact Axis ↔ Product Line rule).
 */
export function tierHasOtherAxes(
  data: AssortmentData,
  tierId: string,
  productLine?: string,
): boolean {
  return data.records.tierRules.some(
    (rule) =>
      rule.tierId === tierId && (data.index.skuById.get(rule.skuId)?.axis ?? '') !== productLine,
  );
}
