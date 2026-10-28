import type { AssortmentData } from '../../lib/data';
import { plural } from '../../lib/format';
import type { ChangeType } from './types';

export const TYPE_NAME: Record<ChangeType, string> = {
  tier: 'Re-tier doors',
  sku: 'Add or remove SKUs at specific doors',
};

/** Every SKU of a franchise or line, as "f|Name" / "l|Name" keys (prototype `skuGroups`). */
export function skuGroups(data: AssortmentData) {
  const ids = new Map<string, string[]>();
  const add = (key: string, id: string) => ids.set(key, [...(ids.get(key) ?? []), id]);
  for (const sku of data.records.skus) {
    if (sku.franchise) add(`f|${sku.franchise}`, sku.id);
    if (sku.line) add(`l|${sku.line}`, sku.id);
  }
  const options = (prefix: string) =>
    [...ids.keys()]
      .filter((key) => key.startsWith(prefix))
      .sort()
      .map((key) => ({
        value: key,
        label: `${key.slice(2)} · ${plural(ids.get(key)!.length, 'SKU', 'SKUs')}`,
      }));
  return {
    ids,
    options: [
      { label: 'Franchise', options: options('f|') },
      { label: 'Line', options: options('l|') },
    ].filter((group) => group.options.length),
  };
}

/** SKU multi-select options: "key · name", falling back to the id. */
export function skuOptions(data: AssortmentData) {
  return data.records.skus.map((s) => ({
    value: s.id,
    label: [s.key, s.name].filter(Boolean).join(' · ') || s.id,
  }));
}
