import type { DoorRecord } from '../../lib/data';
import type { SavedFilterId } from '../../lib/doors';

export type ChangeType = 'tier' | 'sku';
export type DoorSource = 'selection' | 'filter' | 'upload';
export type SkuAction = 'add' | 'remove';
export type RowStatus = 'ready' | 'warning' | 'nochange' | 'skipped' | 'error';
export type Step = 0 | 1 | 2 | 3;

/** How Bulk Update was opened (router location state). */
export interface BulkIntent {
  type?: ChangeType;
  startStep?: 1;
}

/** A row as a file or a selection gives it, before any check. */
export interface RawRow {
  line: number;
  doorKey: string;
  doorName?: string;
  /** Set when the row comes from the selection or a saved filter. */
  door?: DoorRecord;
  /** New tier name (re-tier). */
  value?: string;
  /** SKU key from a file, or the SKU id when chosen in the form. */
  skuKey?: string;
  skuId?: string;
  action?: string;
  rowReason?: string;
}

export interface RowSnapshot {
  tierId?: string;
  status?: string;
}

export interface CheckedRow {
  key: string;
  line: number;
  doorKey: string;
  doorLabel: string;
  doorId?: string;
  change: string;
  status: RowStatus;
  message: string;
  tierId?: string;
  skuId?: string;
  skuKey?: string;
  action?: SkuAction;
  rowReason?: string;
  /** What the door looked like when checked; compared again just before saving (FR-045). */
  snapshot?: RowSnapshot;
}

export interface UploadedFile {
  fileName: string;
  rows: RawRow[];
}

export interface BulkState {
  step: Step;
  type?: ChangeType;
  source: DoorSource;
  doorIds: string[];
  filter: SavedFilterId;
  tierId?: string;
  skuAction: SkuAction;
  skuIds: string[];
  upload?: UploadedFile;
  rowView: 'all' | 'issues';
  reason: string;
  checked: CheckedRow[];
  result?: BulkResult;
}

export type Change =
  | { kind: 'tier'; doorId: string; doorLabel: string; prevTierId?: string; newTierId: string }
  | { kind: 'exception'; doorId: string; doorLabel: string; exceptionId: string };

export interface BulkFailure {
  key: string;
  doorLabel: string;
  error: string;
  /** For a failed apply: the row to retry. */
  row?: CheckedRow;
  /** For a failed undo: the change to retry reversing. */
  change?: Change;
}

export interface BulkResult {
  kind: 'applied' | 'undone';
  type: ChangeType;
  reason: string;
  succeeded: Change[];
  failed: BulkFailure[];
  /** Rows skipped at apply because someone else changed the door after the check. */
  stale: CheckedRow[];
  /** Rows sent to apply (or changes sent to undo). */
  total: number;
  /** For an undo: the update that was undone. */
  applied?: BulkResult;
}

export interface ImpactRow {
  key: string;
  doorId: string;
  door: string;
  doorKey: string;
  beforeLabel: string;
  afterLabel: string;
  skusBefore: number;
  skusAfter: number;
  delta: number;
  note: string;
}

export interface Impact {
  rows: ImpactRow[];
  doorsChanging: number;
  /** Re-tier: average net SKU change per door (rounded). */
  avgNetDelta: number;
  /** SKU update: exceptions to create. */
  exceptionsCreated: number;
  /** Σ SKUs added + removed across doors. */
  skuChanges: number;
  rowsLeftOut: number;
  sentence: string;
}
