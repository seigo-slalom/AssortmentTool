import type {
  AssortmentRecords,
  DoorRecord,
  ExceptionRecord,
  SkuRecord,
  TierRecord,
} from './records';

export interface AssortmentIndex {
  doorById: ReadonlyMap<string, DoorRecord>;
  /** Door key trimmed and upper-cased (upload files match on it). */
  doorByKey: ReadonlyMap<string, DoorRecord>;
  tierById: ReadonlyMap<string, TierRecord>;
  /** Active tiers by lower-cased, trimmed name. */
  tierByName: ReadonlyMap<string, TierRecord>;
  /** Active tiers ordered by rank, then name. */
  activeTiers: readonly TierRecord[];
  skuById: ReadonlyMap<string, SkuRecord>;
  /** SKU key trimmed. */
  skuByKey: ReadonlyMap<string, SkuRecord>;
  /** Active door-level exceptions per door. */
  doorExceptions: ReadonlyMap<string, readonly ExceptionRecord[]>;
}

export const normalizeDoorKey = (key: string): string => key.trim().toUpperCase();
export const normalizeTierName = (name: string): string => name.trim().toLowerCase();

const byRankThenName = (a: TierRecord, b: TierRecord) =>
  (a.rank ?? Number.MAX_SAFE_INTEGER) - (b.rank ?? Number.MAX_SAFE_INTEGER) ||
  a.name.localeCompare(b.name);

export function buildIndex(records: AssortmentRecords): AssortmentIndex {
  const activeTiers = records.tiers.filter((t) => t.active).sort(byRankThenName);
  const doorExceptions = new Map<string, ExceptionRecord[]>();
  for (const e of records.exceptions) {
    if (e.level !== 'door' || !e.doorId) continue;
    const list = doorExceptions.get(e.doorId) ?? [];
    list.push(e);
    doorExceptions.set(e.doorId, list);
  }
  return {
    doorById: new Map(records.doors.map((d) => [d.id, d])),
    doorByKey: new Map(
      records.doors.filter((d) => d.doorKey).map((d) => [normalizeDoorKey(d.doorKey!), d]),
    ),
    tierById: new Map(records.tiers.map((t) => [t.id, t])),
    tierByName: new Map(activeTiers.map((t) => [normalizeTierName(t.name), t])),
    activeTiers,
    skuById: new Map(records.skus.map((s) => [s.id, s])),
    skuByKey: new Map(records.skus.filter((s) => s.key).map((s) => [s.key!.trim(), s])),
    doorExceptions,
  };
}
