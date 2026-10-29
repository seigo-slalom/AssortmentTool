import type { SkuRecord, SkuType } from '../data';

/** Staged rule changes keyed `skuId|tierId`; `true` = add to the tier, `false` = remove. */
export type Staged = Readonly<Record<string, boolean>>;

export interface Membership {
  /** Tiers each SKU is in (enabled rules). */
  bySku: ReadonlyMap<string, ReadonlySet<string>>;
  /** Enabled rule id per `skuId|tierId`. */
  ruleId: ReadonlyMap<string, string>;
}

export interface DoorCounts {
  total: number;
  /** Active, tiered doors per product line. */
  byLine: ReadonlyMap<string, number>;
  online: number;
  offline: number;
}

export interface SkuCounts {
  retail: number;
  spm: number;
}

export type ShowMode = 'all' | 'in' | 'out';
export type Focus = 'fresh' | null;

export interface SkuFilters {
  search: string;
  axis?: string;
  types: readonly SkuType[];
  focus: Focus;
}

export interface SkuRow {
  sku: SkuRecord;
  label: string;
  sub: string;
  also: string;
  saved: boolean;
  checked: boolean;
  staged: 'add' | 'remove' | null;
  isNew: boolean;
}

export interface ProductGroup {
  key: string;
  axis: string;
  name: string;
  sub: string;
  total: number;
  inCount: number;
  pct: number;
  checked: boolean;
  indeterminate: boolean;
  disabled: boolean;
  /** Whether toggling the group adds (some SKUs are missing) or removes. */
  add: boolean;
  /** SKUs the group toggle changes. */
  toggleIds: string[];
  stagedCount: number;
  newCount: number;
  rows: SkuRow[];
}

export type TierFormMode = 'add' | 'edit' | 'retire';

export interface TierForm {
  mode: TierFormMode;
  tierId: string | null;
  name: string;
  description: string;
  /** Tier id the tier sits after; `''` = first (entry level). */
  after: string;
  start: 'copy' | 'empty';
  copyFrom: string | null;
  moveTo: string | null;
  reason: string;
}
