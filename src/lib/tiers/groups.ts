import type { SkuRecord, SkuType } from '../data';
import { fmt, plural } from '../format';
import { isEffective, isSaved, ruleKey } from './membership';
import type { Membership, ProductGroup, ShowMode, SkuFilters, SkuRow, Staged } from './types';

export const SKU_TYPE_LABEL: Record<SkuType, string> = { retail: 'Retail', spm: 'SPM' };
export const skuTypeLabel = (type?: SkuType): string => (type ? SKU_TYPE_LABEL[type] : '—');

export function filterSkus(
  skus: readonly SkuRecord[],
  f: SkuFilters,
  isNew: (skuId: string) => boolean,
): SkuRecord[] {
  const q = f.search.trim().toLowerCase();
  return skus.filter(
    (k) =>
      (!f.axis || k.axis === f.axis) &&
      (!f.types.length || (!!k.type && f.types.includes(k.type))) &&
      (!q || [k.key, k.name, k.franchise].some((v) => v?.toLowerCase().includes(q))) &&
      (!f.focus || isNew(k.id)),
  );
}

export function showCounts(skus: readonly SkuRecord[], isIn: (skuId: string) => boolean) {
  const inCount = skus.filter((k) => isIn(k.id)).length;
  return { all: skus.length, in: inCount, out: skus.length - inCount };
}

export const applyShow = (
  skus: readonly SkuRecord[],
  show: ShowMode,
  isIn: (skuId: string) => boolean,
): SkuRecord[] => (show === 'all' ? [...skus] : skus.filter((k) => isIn(k.id) === (show === 'in')));

/** Distinct SKU axes for the Axis filter, sorted. */
export const axisOptions = (skus: readonly SkuRecord[]): string[] =>
  [...new Set(skus.map((k) => k.axis).filter((a): a is string => !!a))].sort((a, b) =>
    a.localeCompare(b),
  );

export interface GroupContext {
  tierId: string;
  staged: Staged;
  membership: Membership;
  isNew: (skuId: string) => boolean;
  /** Other active tiers (id, name) in rank order, for "Also in". */
  otherTiers: readonly { id: string; name: string }[];
}

const groupSub = (axis: string, skus: readonly SkuRecord[]): string => {
  const n = skus.length;
  const retail = skus.filter((k) => k.type !== 'spm').length;
  const split =
    retail && retail < n
      ? ` (${fmt(retail)} retail, ${fmt(n - retail)} SPM)`
      : retail
        ? ' · retail'
        : ' · SPM';
  return `${axis} · ${plural(n, 'SKU', 'SKUs')}${split}`;
};

const byTypeThenName = (a: SkuRecord, b: SkuRecord) =>
  (a.type ?? '').localeCompare(b.type ?? '') || (a.name ?? '').localeCompare(b.name ?? '');

function toRow(k: SkuRecord, ctx: GroupContext): SkuRow {
  const saved = isSaved(ctx.membership, k.id, ctx.tierId);
  const key = ruleKey(k.id, ctx.tierId);
  const isStaged = key in ctx.staged;
  const checked = isStaged ? ctx.staged[key] : saved;
  const also = ctx.otherTiers.filter((t) => isSaved(ctx.membership, k.id, t.id)).map((t) => t.name);
  return {
    sku: k,
    label: `${k.key ?? '—'} · ${k.name ?? '—'}`,
    sub: [skuTypeLabel(k.type), k.line, k.category].filter(Boolean).join(' · '),
    also: also.length ? `Also in ${also.join(', ')}` : 'In no other tier',
    saved,
    checked,
    staged: isStaged ? (checked ? 'add' : 'remove') : null,
    isNew: ctx.isNew(k.id),
  };
}

/** Product groups (axis + franchise) for one tier, sorted by axis then name. */
export function buildGroups(skus: readonly SkuRecord[], ctx: GroupContext): ProductGroup[] {
  const map = new Map<string, { axis: string; name: string; skus: SkuRecord[] }>();
  for (const k of skus) {
    const axis = k.axis ?? '—';
    const name = k.franchise ?? '—';
    const key = `${axis}|${name}`;
    const g = map.get(key) ?? { axis, name, skus: [] };
    g.skus.push(k);
    map.set(key, g);
  }
  const eff = (id: string) => isEffective(ctx.staged, ctx.membership, id, ctx.tierId);
  return [...map.entries()]
    .sort(([, a], [, b]) => a.axis.localeCompare(b.axis) || a.name.localeCompare(b.name))
    .map(([key, g]) => {
      const total = g.skus.length;
      const inIds = g.skus.filter((k) => eff(k.id)).map((k) => k.id);
      const outIds = g.skus.filter((k) => !eff(k.id)).map((k) => k.id);
      const add = outIds.length > 0;
      return {
        key,
        axis: g.axis,
        name: g.name,
        sub: groupSub(g.axis, g.skus),
        total,
        inCount: inIds.length,
        pct: Math.round((inIds.length / total) * 100),
        checked: inIds.length === total,
        indeterminate: inIds.length > 0 && inIds.length < total,
        disabled: false,
        add,
        toggleIds: add ? outIds : inIds,
        stagedCount: g.skus.filter((k) => ruleKey(k.id, ctx.tierId) in ctx.staged).length,
        newCount: g.skus.filter((k) => ctx.isNew(k.id)).length,
        rows: [...g.skus].sort(byTypeThenName).map((k) => toRow(k, ctx)),
      };
    });
}
