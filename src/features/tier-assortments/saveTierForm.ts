import { isPoolError, runPool } from '../../lib/async/runPool';
import {
  createTier,
  disableTierRule,
  enableTierRule,
  setDoorTier,
  updateTier,
  type AssortmentData,
  type TierRecord,
  type WriteResult,
} from '../../lib/data';
import { plural } from '../../lib/format';
import { placeTier, rankChanges, type TierForm } from '../../lib/tiers';
import type { TierData } from './useTierAssortments';

export interface TierSaveResult {
  ok: boolean;
  message: string;
  selectTierId?: string;
}

const firstError = (results: readonly (WriteResult<unknown> | { message: string })[]) => {
  for (const r of results) {
    if (isPoolError(r)) return r.message;
    if ('ok' in r && !r.ok) return r.error;
  }
  return null;
};

async function rerank(order: string[], rankOf: (id: string) => number | undefined) {
  const changes = rankChanges(order, rankOf);
  return runPool(changes, (c) => updateTier(c.id, { rank: c.rank }));
}

/** Add / edit / retire a tier (prototype `saveTierForm`, research R3). */
export async function saveTierForm(
  form: TierForm,
  data: AssortmentData,
  derived: TierData,
  tiers: readonly TierRecord[],
): Promise<TierSaveResult> {
  const name = form.name.trim();
  const description = form.description.trim();
  const ids = tiers.map((t) => t.id);
  const rankOf = (id: string) => data.index.tierById.get(id)?.rank;
  const tierName = (id: string | null) => (id ? (data.index.tierById.get(id)?.name ?? '') : '');

  if (form.mode === 'add') {
    const rank = tiers.length + 1;
    const created = await createTier({ name, description, rank });
    if (!created.ok)
      return { ok: false, message: `${name} could not be added (${created.error}).` };
    const id = created.value.id;
    const ranks = await rerank(placeTier([...ids, id], id, form.after), (x) =>
      x === id ? rank : rankOf(x),
    );
    const copy =
      form.start === 'copy' && form.copyFrom
        ? [...derived.membership.bySku].filter(([, set]) => set.has(form.copyFrom!)).map(([s]) => s)
        : [];
    const copied = await runPool(copy, (skuId) => enableTierRule(id, skuId));
    const error = firstError([...ranks, ...copied]);
    const n = copied.length;
    return {
      ok: !error,
      selectTierId: id,
      message: error
        ? `${name} was added, but some changes failed (${error}).`
        : `${name} added${n ? ` with ${plural(n, 'SKU', 'SKUs')} copied from ${tierName(form.copyFrom)}` : ''}. Move doors into it on Doors or with Bulk Update.`,
    };
  }

  const id = form.tierId!;
  const old = tierName(id);
  if (form.mode === 'edit') {
    const updated = await updateTier(id, { name, description });
    if (!updated.ok)
      return { ok: false, message: `${old} could not be updated (${updated.error}).` };
    const error = firstError(await rerank(placeTier(ids, id, form.after), rankOf));
    if (error)
      return { ok: false, message: `${name} was renamed, but re-ranking failed (${error}).` };
    return {
      ok: true,
      message: old === name ? `${name} updated.` : `${old} is now ${name} everywhere.`,
    };
  }

  const doors = data.records.doors.filter((d) => d.tierId === id);
  const moved = form.moveTo ? await runPool(doors, (d) => setDoorTier(d.id, form.moveTo)) : [];
  const rules = data.records.tierRules.filter((r) => r.tierId === id);
  const disabled = await runPool(rules, (r) => disableTierRule(r.id));
  const retired = await updateTier(id, { active: false });
  const error = firstError([...moved, ...disabled, retired]);
  if (error) return { ok: false, message: `${old} could not be fully retired (${error}).` };
  return {
    ok: true,
    selectTierId: form.moveTo ?? tiers.find((t) => t.id !== id)?.id,
    message: `${old} retired.${doors.length ? ` ${plural(doors.length, 'door', 'doors')} moved to ${tierName(form.moveTo)}.` : ''}`,
  };
}
