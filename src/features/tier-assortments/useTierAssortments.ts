import { useCallback, useEffect, useMemo, useState } from 'react';
import type { message } from 'antd';
import { useSearchParams } from 'react-router-dom';
import { useAssortmentData, type AssortmentData, type SkuType } from '../../lib/data';
import { plural } from '../../lib/format';
import {
  addExceptionSkuIds,
  applyShow,
  axisOptions,
  buildGroups,
  buildMembership,
  filterSkus,
  isEffective,
  isNewSku,
  showCounts,
  stagedForTier,
  stagedImpact,
  stageMany,
  stageOne,
  tierAxisCounts,
  tierDoorCounts,
  tierSkuCounts,
  type Focus,
  type ProductGroup,
  type ShowMode,
  type Staged,
  type TierForm,
} from '../../lib/tiers';

export type Notify = ReturnType<typeof message.useMessage>[0];

export const NARROW_BREAKPOINT = 1100;

export function deriveTierData(data: AssortmentData) {
  const membership = buildMembership(data.records.tierRules);
  const addExceptions = addExceptionSkuIds(data.records.exceptions);
  return {
    membership,
    addExceptions,
    doorCounts: tierDoorCounts(data.records.doors),
    skuCounts: tierSkuCounts(membership, data.index.skuById),
    axisCounts: tierAxisCounts(membership, data.index.skuById),
    axes: axisOptions(data.records.skus),
    isNew: (skuId: string) => isNewSku(membership, addExceptions, skuId),
  };
}
export type TierData = ReturnType<typeof deriveTierData>;

function useNarrow(): boolean {
  const query = `(max-width: ${NARROW_BREAKPOINT - 1}px)`;
  const [narrow, setNarrow] = useState(() => window.matchMedia?.(query).matches ?? false);
  useEffect(() => {
    const mql = window.matchMedia?.(query);
    if (!mql) return;
    const on = () => setNarrow(mql.matches);
    mql.addEventListener('change', on);
    return () => mql.removeEventListener('change', on);
  }, [query]);
  return narrow;
}

/** All screen state for Tier assortments (prototype `vAssortment`). */
export function useTierAssortments(notify: Notify) {
  const { status, data, refetch } = useAssortmentData();
  const [params, setParams] = useSearchParams();
  const [search, setSearchValue] = useState('');
  const [axis, setAxisValue] = useState<string | undefined>();
  const [types, setTypesValue] = useState<SkuType[]>([]);
  const [show, setShowValue] = useState<ShowMode>('all');
  const [focus, setFocus] = useState<Focus>(null);
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const [staged, setStaged] = useState<Staged>({});
  const [saveOpen, setSaveOpen] = useState(false);
  const [manageOpen, setManageOpen] = useState(false);
  const [tierForm, setTierForm] = useState<TierForm | null>(null);
  const [skuId, setSkuId] = useState<string | null>(null);
  const narrow = useNarrow();

  const derived = useMemo(() => (data ? deriveTierData(data) : undefined), [data]);
  const tiers = useMemo(() => data?.index.activeTiers ?? [], [data]);
  const requested = params.get('tier');
  const tier = tiers.find((t) => t.id === requested) ?? tiers[0];
  const tierId = tier?.id ?? '';

  const selectTier = useCallback(
    (id: string) => {
      setParams((p) => {
        const next = new URLSearchParams(p);
        next.set('tier', id);
        return next;
      });
      setOpen({});
      setFocus(null);
    },
    [setParams],
  );

  const reset =
    <T>(set: (v: T) => void) =>
    (v: T) => {
      set(v);
      setOpen({});
    };

  const view = useMemo(() => {
    if (!data || !derived || !tier) return undefined;
    const isIn = (id: string) => isEffective(staged, derived.membership, id, tier.id);
    const base = filterSkus(data.records.skus, { search, axis, types, focus }, derived.isNew);
    const visible = applyShow(base, show, isIn);
    const groups = buildGroups(visible, {
      tierId: tier.id,
      staged,
      membership: derived.membership,
      isNew: derived.isNew,
      otherTiers: tiers.filter((t) => t.id !== tier.id),
    });
    return { counts: showCounts(base, isIn), visible, groups };
  }, [data, derived, tier, tiers, staged, search, axis, types, focus, show]);

  const forceOpen = !!(search.trim() || focus);
  const isOpen = (key: string) => (key in open ? open[key] : forceOpen);
  const allOpen = !!view?.groups.length && view.groups.every((g) => isOpen(g.key));

  const stageRow = (id: string, checked: boolean) => {
    if (!derived) return;
    setStaged((s) => stageOne(s, derived.membership, id, tierId, checked));
  };

  const stageGroup = (g: ProductGroup) => {
    if (!derived || !tier) return;
    const { staged: next, changed } = stageMany(
      staged,
      derived.membership,
      g.toggleIds,
      tierId,
      g.add,
    );
    setStaged(next);
    if (changed) {
      notify.info(
        `${plural(changed, `${g.name} SKU`, `${g.name} SKUs`)} staged to ${g.add ? 'join' : 'leave'} ${tier.name}. Review and save below.`,
      );
    } else notify.info(`Nothing to change in ${g.name}.`);
  };

  const impact =
    data && derived ? stagedImpact(staged, derived.doorCounts, data.index.skuById) : undefined;

  return {
    status,
    refetch,
    data,
    derived,
    tiers,
    tier,
    tierId,
    narrow,
    selectTier,
    search,
    setSearch: reset(setSearchValue),
    axis,
    setAxis: reset(setAxisValue),
    types,
    setTypes: reset(setTypesValue),
    show,
    setShow: reset(setShowValue),
    focus,
    toggleFocus: () => {
      setFocus((f) => (f ? null : 'fresh'));
      setOpen({});
      setShowValue('all');
    },
    clearFocus: () => {
      setFocus(null);
      setOpen({});
    },
    view,
    isOpen,
    allOpen,
    toggleGroup: (key: string) => setOpen((o) => ({ ...o, [key]: !isOpen(key) })),
    toggleAll: () =>
      setOpen(Object.fromEntries((view?.groups ?? []).map((g) => [g.key, !allOpen]))),
    staged,
    setStaged,
    stagedFor: (id: string) => stagedForTier(staged, id),
    stageRow,
    stageGroup,
    impact,
    saveOpen,
    setSaveOpen,
    manageOpen,
    setManageOpen,
    tierForm,
    setTierForm,
    skuId,
    setSkuId,
  };
}

export type TierAssortmentsState = ReturnType<typeof useTierAssortments>;
