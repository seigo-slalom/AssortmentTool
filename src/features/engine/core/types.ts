import type { ReasonCode } from './reasons';

export interface EngineDoor {
  id: string;
  tierId?: string;
  productLine?: string;
  distributorNameCode?: string;
}

export interface EngineTier {
  id: string;
}

export interface EngineSku {
  id: string;
  axis?: string;
  active: boolean;
}

export interface EngineTierRule {
  id: string;
  tierId: string;
  skuId: string;
  enabled: boolean;
}

export type ExceptionLevel = 'door' | 'retailer';
export type ExceptionAction = 'add' | 'remove';

export interface EngineException {
  id: string;
  level?: ExceptionLevel;
  action?: ExceptionAction;
  skuId?: string;
  doorId?: string;
  distributorNameCode?: string;
  active: boolean;
}

export interface EngineDataset {
  doors: readonly EngineDoor[];
  tiers: readonly EngineTier[];
  skus: readonly EngineSku[];
  tierRules: readonly EngineTierRule[];
  exceptions: readonly EngineException[];
}

export type DiagnosticCause =
  | 'inactive'
  | 'missing-level'
  | 'missing-action'
  | 'missing-sku'
  | 'door-level-without-door'
  | 'retailer-level-without-code'
  | 'unavailable-sku'
  | 'duplicate';

export interface Diagnostics {
  ignoredExceptions: Record<DiagnosticCause, number>;
}

export interface DoorAssortment {
  doorId: string;
  status: 'ok' | 'tier-missing';
  skuIds: string[];
  reasons: ReasonCode[];
  count: number;
}

export type DoorLookup =
  { found: true; assortment: DoorAssortment } | { found: false; reason: 'DOOR_NOT_FOUND' };

export interface ExceptionRef {
  id: string;
  level: ExceptionLevel;
  action: ExceptionAction;
}

export interface Explanation {
  found: true;
  doorId: string;
  skuId: string;
  inAssortment: boolean;
  reason: ReasonCode;
  baseReason: ReasonCode;
  applied?: ExceptionRef;
  overridden?: ExceptionRef[];
  notApplied?: ExceptionRef[];
}

export type ExplainResult = Explanation | { found: false; reason: 'DOOR_NOT_FOUND' };

export interface PairCount {
  tierId: string;
  productLine: string | undefined;
  baseCount: number;
  doorCount: number;
}

export interface AggregateCounts {
  byPair: PairCount[];
  byDoor: Map<string, number>;
  total: number;
}

export interface Engine {
  readonly diagnostics: Diagnostics;
  getDoorAssortment(doorId: string): DoorLookup;
  getDoorAssortments(doorIds: readonly string[]): DoorLookup[];
  explain(doorId: string, skuId: string): ExplainResult;
  getCounts(): AggregateCounts;
}
