import type {
  DiagnosticCause,
  Diagnostics,
  EngineDataset,
  EngineDoor,
  EngineException,
  ExceptionAction,
  ExceptionLevel,
  ExceptionRef,
} from './types';

export interface SkuExceptions {
  effective: ExceptionRef;
  overridden: ExceptionRef[];
}

export interface RuleSkus {
  enabled: Set<number>;
  disabled: Set<number>;
}

export interface BaseAssortment {
  bits: Uint32Array;
  count: number;
}

type ExceptionStore = Map<string, Map<number, SkuExceptions>>;

export interface EngineIndex {
  doors: EngineDoor[];
  doorById: Map<string, EngineDoor>;
  tierIds: Set<string>;
  skuIds: string[];
  skuIdxById: Map<string, number>;
  skuAxis: (string | undefined)[];
  skuActive: boolean[];
  tierRules: Map<string, RuleSkus>;
  doorExceptions: ExceptionStore;
  retailerExceptions: ExceptionStore;
  baseCache: Map<string, Map<string, BaseAssortment>>;
  wordCount: number;
  diagnostics: Diagnostics;
}

interface Pending {
  add?: ExceptionRef;
  remove?: ExceptionRef;
}

export const compareIds = (a: string, b: string): number => (a < b ? -1 : a > b ? 1 : 0);

const byId = <T extends { id: string }>(items: readonly T[]): T[] =>
  [...new Map(items.map((item): [string, T] => [item.id, item])).values()].sort((a, b) =>
    compareIds(a.id, b.id),
  );

const emptyDiagnostics = (): Diagnostics => ({
  ignoredExceptions: {
    inactive: 0,
    'missing-level': 0,
    'missing-action': 0,
    'missing-sku': 0,
    'door-level-without-door': 0,
    'retailer-level-without-code': 0,
    'unavailable-sku': 0,
    duplicate: 0,
  },
});

interface Accepted {
  skuIdx: number;
  level: ExceptionLevel;
  action: ExceptionAction;
  scope: string;
}

function classify(
  ex: EngineException,
  skuIdxById: Map<string, number>,
  skuActive: boolean[],
): DiagnosticCause | Accepted {
  if (!ex.active) return 'inactive';
  if (!ex.level) return 'missing-level';
  if (!ex.action) return 'missing-action';
  if (!ex.skuId) return 'missing-sku';
  if (ex.level === 'door' && !ex.doorId) return 'door-level-without-door';
  if (ex.level === 'retailer' && !ex.distributorNameCode) return 'retailer-level-without-code';
  const skuIdx = skuIdxById.get(ex.skuId);
  if (skuIdx === undefined || !skuActive[skuIdx]) return 'unavailable-sku';
  const scope = (ex.level === 'door' ? ex.doorId : ex.distributorNameCode) as string;
  return { skuIdx, level: ex.level, action: ex.action, scope };
}

function finalize(pending: Map<string, Map<number, Pending>>): ExceptionStore {
  const store: ExceptionStore = new Map();
  for (const [scope, bySku] of pending) {
    const resolved = new Map<number, SkuExceptions>();
    for (const [skuIdx, { add, remove }] of bySku) {
      // Same level, same SKU: Remove wins and the Add is reported as overridden.
      resolved.set(
        skuIdx,
        remove
          ? { effective: remove, overridden: add ? [add] : [] }
          : { effective: add as ExceptionRef, overridden: [] },
      );
    }
    store.set(scope, resolved);
  }
  return store;
}

function indexExceptions(
  exceptions: readonly EngineException[],
  skuIdxById: Map<string, number>,
  skuActive: boolean[],
  diagnostics: Diagnostics,
): { doorExceptions: ExceptionStore; retailerExceptions: ExceptionStore } {
  const door = new Map<string, Map<number, Pending>>();
  const retailer = new Map<string, Map<number, Pending>>();
  for (const ex of byId(exceptions)) {
    const result = classify(ex, skuIdxById, skuActive);
    if (typeof result === 'string') {
      diagnostics.ignoredExceptions[result] += 1;
      continue;
    }
    const target = result.level === 'door' ? door : retailer;
    const bySku = target.get(result.scope) ?? new Map<number, Pending>();
    target.set(result.scope, bySku);
    const pending = bySku.get(result.skuIdx) ?? {};
    bySku.set(result.skuIdx, pending);
    if (pending[result.action]) {
      diagnostics.ignoredExceptions.duplicate += 1;
    } else {
      pending[result.action] = { id: ex.id, level: result.level, action: result.action };
    }
  }
  return { doorExceptions: finalize(door), retailerExceptions: finalize(retailer) };
}

export function buildIndex(dataset: EngineDataset): EngineIndex {
  const skus = byId(dataset.skus);
  const skuIds = skus.map((sku) => sku.id);
  const skuIdxById = new Map(skuIds.map((id, idx) => [id, idx]));
  const skuActive = skus.map((sku) => sku.active);

  const tierRules = new Map<string, RuleSkus>();
  for (const rule of dataset.tierRules) {
    const skuIdx = skuIdxById.get(rule.skuId);
    if (skuIdx === undefined) continue;
    const entry = tierRules.get(rule.tierId) ?? { enabled: new Set(), disabled: new Set() };
    tierRules.set(rule.tierId, entry);
    (rule.enabled ? entry.enabled : entry.disabled).add(skuIdx);
  }

  const doors = byId(dataset.doors);
  const diagnostics = emptyDiagnostics();
  return {
    doors,
    doorById: new Map(doors.map((door) => [door.id, door])),
    tierIds: new Set(dataset.tiers.map((tier) => tier.id)),
    skuIds,
    skuIdxById,
    skuAxis: skus.map((sku) => sku.axis),
    skuActive,
    tierRules,
    ...indexExceptions(dataset.exceptions, skuIdxById, skuActive, diagnostics),
    baseCache: new Map(),
    wordCount: Math.ceil(skuIds.length / 32),
    diagnostics,
  };
}

export const hasTier = (index: EngineIndex, tierId: string | undefined): tierId is string =>
  tierId !== undefined && index.tierIds.has(tierId);
