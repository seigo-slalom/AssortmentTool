import type { SkuRecord, TierRecord } from '../data';
import type { SheetSpec } from '../excel';
import { skuTypeLabel } from './groups';
import { isSaved } from './membership';
import type { Membership } from './types';

/** One row per SKU, one "Yes" column per active tier (prototype export). */
export function tierAssortmentSheet(
  skus: readonly SkuRecord[],
  tiers: readonly TierRecord[],
  m: Membership,
): SheetSpec {
  const fixed = ['SKU key', 'SKU name', 'Franchise', 'Line', 'Axis', 'SKU type'];
  return {
    name: 'Tier assortments',
    columns: [...fixed, ...tiers.map((t) => t.name)].map((header) => ({ header })),
    rows: skus.map((k) => [
      k.key ?? '',
      k.name ?? '',
      k.franchise ?? '',
      k.line ?? '',
      k.axis ?? '',
      skuTypeLabel(k.type),
      ...tiers.map((t) => (isSaved(m, k.id, t.id) ? 'Yes' : '')),
    ]),
  };
}
