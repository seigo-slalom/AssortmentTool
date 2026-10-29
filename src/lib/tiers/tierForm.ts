import type { DoorRecord, TierRecord } from '../data';
import { fmt, plural } from '../format';
import type { SkuCounts, TierForm, TierFormMode } from './types';

export const TIER_NAME_MAX = 30;
export const TIER_DESCRIPTION_MAX = 160;

/** Id of the tier ranked just before `tierId`, or `''` when it is first. */
export function previousTierId(tiers: readonly TierRecord[], tierId: string): string {
  const i = tiers.findIndex((t) => t.id === tierId);
  return i > 0 ? tiers[i - 1].id : '';
}

export function newTierForm(
  mode: TierFormMode,
  tiers: readonly TierRecord[],
  tierId: string | null = null,
): TierForm {
  const tier = tierId ? tiers.find((t) => t.id === tierId) : undefined;
  const top = tiers.at(-1);
  return {
    mode,
    tierId,
    name: mode === 'edit' ? (tier?.name ?? '') : '',
    description: mode === 'edit' ? (tier?.description ?? '') : '',
    after: mode === 'add' ? (top?.id ?? '') : previousTierId(tiers, tierId ?? ''),
    start: 'copy',
    copyFrom: top?.id ?? null,
    moveTo: null,
    reason: '',
  };
}

export function isDuplicateName(form: TierForm, tiers: readonly TierRecord[]): boolean {
  const name = form.name.trim().toLowerCase();
  return !!name && tiers.some((t) => t.name.toLowerCase() === name && t.id !== form.tierId);
}

/** Whether the dialog's OK button is enabled. `doorCount` = doors in the tier being retired. */
export function isTierFormValid(
  form: TierForm,
  tiers: readonly TierRecord[],
  doorCount: number,
): boolean {
  const name = form.name.trim();
  const reason = form.reason.trim().length > 0;
  const nameOk = !!name && name.length <= TIER_NAME_MAX && !isDuplicateName(form, tiers);
  if (form.mode === 'add') return nameOk && reason && (form.start === 'empty' || !!form.copyFrom);
  if (form.mode === 'edit') {
    const tier = tiers.find((t) => t.id === form.tierId);
    const changed =
      !!tier &&
      (name !== tier.name ||
        form.description.trim() !== (tier.description ?? '') ||
        form.after !== previousTierId(tiers, tier.id));
    return nameOk && reason && changed;
  }
  return reason && tiers.length > 1 && (doorCount === 0 || !!form.moveTo);
}

/** Tier ids in their new order after placing `movedId` after `after` (`''` = first). */
export function placeTier(order: readonly string[], movedId: string, after: string): string[] {
  const rest = order.filter((id) => id !== movedId);
  const at = after ? rest.indexOf(after) + 1 : 0;
  return [...rest.slice(0, at), movedId, ...rest.slice(at)];
}

/** Ranks 1..N for the order; only tiers whose rank changes are returned. */
export function rankChanges(
  order: readonly string[],
  rankOf: (id: string) => number | undefined,
): { id: string; rank: number }[] {
  return order.map((id, i) => ({ id, rank: i + 1 })).filter(({ id, rank }) => rankOf(id) !== rank);
}

/** Average SKU change per door when its doors move from one tier to another. */
export function retireAvgDelta(
  doors: readonly DoorRecord[],
  fromTierId: string,
  toTierId: string,
  axisCounts: ReadonlyMap<string, ReadonlyMap<string, number>>,
): number {
  if (!doors.length) return 0;
  const size = (tierId: string, line?: string) => axisCounts.get(tierId)?.get(line ?? '') ?? 0;
  const total = doors.reduce(
    (sum, d) => sum + size(toTierId, d.productLine) - size(fromTierId, d.productLine),
    0,
  );
  return Math.round(total / doors.length);
}

export interface TierImpactContext {
  tierName: (tierId: string) => string;
  copyCounts?: SkuCounts;
  retire?: { doors: number; avgDelta: number; skuAssignments: number };
}

/** "What happens" lines (prototype `vTierForm`, without Activity/SAP references). */
export function tierFormImpact(form: TierForm, ctx: TierImpactContext): string[] {
  if (form.mode === 'add') {
    const c = ctx.copyCounts ?? { retail: 0, spm: 0 };
    return [
      form.start === 'copy' && form.copyFrom
        ? `Starts with ${fmt(c.retail + c.spm)} SKUs copied from ${ctx.tierName(form.copyFrom)} (${fmt(c.retail)} retail · ${fmt(c.spm)} SPM). Brand Management and Trade Marketing then adjust them here.`
        : 'Starts empty. Brand Management and Trade Marketing assign SKUs to it here.',
      'No doors are in it yet, so no door assortment changes. Move doors into it on Doors or with Bulk Update → Re-tier doors.',
      'It appears straight away in every tier list, filter and export.',
    ];
  }
  if (form.mode === 'edit') {
    return [
      'Renaming or re-ranking changes the label and order everywhere, including exports. Doors and SKUs are not changed.',
    ];
  }
  const r = ctx.retire ?? { doors: 0, avgDelta: 0, skuAssignments: 0 };
  const first = !r.doors
    ? 'No doors are in this tier, so no door assortment changes.'
    : form.moveTo
      ? `${plural(r.doors, 'door moves', 'doors move')} to ${ctx.tierName(form.moveTo)}. On average each ${r.avgDelta >= 0 ? 'gains' : 'loses'} ${plural(Math.abs(r.avgDelta), 'SKU', 'SKUs')}.`
      : `Choose where its ${plural(r.doors, 'door goes', 'doors go')} to see the impact.`;
  return [
    first,
    `Its ${plural(r.skuAssignments, 'SKU assignment is', 'SKU assignments are')} removed. Door and retailer exceptions stay in place.`,
  ];
}
