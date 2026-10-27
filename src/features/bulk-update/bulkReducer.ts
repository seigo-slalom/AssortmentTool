import type { SavedFilterId } from '../../lib/doors';
import type {
  BulkIntent,
  BulkResult,
  BulkState,
  ChangeType,
  CheckedRow,
  DoorSource,
  SkuAction,
  UploadedFile,
} from './types';

export type BulkAction =
  | { type: 'pickType'; changeType: ChangeType }
  | { type: 'continue' }
  | { type: 'back' }
  | { type: 'setSource'; source: DoorSource }
  | { type: 'setFilter'; filter: SavedFilterId }
  | { type: 'setTier'; tierId?: string }
  | { type: 'setSkuAction'; action: SkuAction }
  | { type: 'setSkuIds'; skuIds: string[] }
  | { type: 'setUpload'; upload?: UploadedFile }
  | { type: 'setRowView'; view: 'all' | 'issues' }
  | { type: 'setReason'; reason: string }
  | { type: 'setChecked'; rows: CheckedRow[] }
  | { type: 'setResult'; result: BulkResult }
  | { type: 'reset' };

export const BULK_LIMITS: Record<ChangeType, number> = { tier: 2500, sku: 5000 };

/** Default source: the selection when there is one, else a saved filter (tier) or a file (SKU). */
export function defaultSource(doorIds: readonly string[], type?: ChangeType): DoorSource {
  if (doorIds.length) return 'selection';
  return type === 'sku' ? 'upload' : 'filter';
}

export function initialBulkState(
  intent: BulkIntent | undefined,
  doorIds: readonly string[],
): BulkState {
  const type = intent?.type;
  return {
    step: type && intent?.startStep === 1 ? 1 : 0,
    type,
    source: defaultSource(doorIds, type),
    doorIds: [...doorIds],
    filter: 'needs-tier',
    skuAction: 'add',
    skuIds: [],
    rowView: 'all',
    reason: '',
    checked: [],
  };
}

export function bulkReducer(state: BulkState, action: BulkAction): BulkState {
  switch (action.type) {
    case 'pickType':
      if (state.type === action.changeType) return state;
      return {
        ...state,
        type: action.changeType,
        tierId: undefined,
        skuIds: [],
        upload: undefined,
        source: defaultSource(state.doorIds, action.changeType),
      };
    case 'continue':
      return { ...state, step: Math.min(3, state.step + 1) as BulkState['step'] };
    case 'back':
      return { ...state, step: Math.max(0, state.step - 1) as BulkState['step'] };
    case 'setSource':
      return { ...state, source: action.source };
    case 'setFilter':
      return { ...state, filter: action.filter };
    case 'setTier':
      return { ...state, tierId: action.tierId };
    case 'setSkuAction':
      return { ...state, skuAction: action.action };
    case 'setSkuIds':
      return { ...state, skuIds: action.skuIds };
    case 'setUpload':
      return { ...state, upload: action.upload };
    case 'setRowView':
      return { ...state, rowView: action.view };
    case 'setReason':
      return { ...state, reason: action.reason };
    case 'setChecked':
      return { ...state, checked: action.rows, step: 2, rowView: 'all' };
    case 'setResult':
      return { ...state, result: action.result };
    case 'reset':
      return initialBulkState(undefined, []);
  }
}

export const applicableRows = (rows: readonly CheckedRow[]) =>
  rows.filter((r) => r.status === 'ready' || r.status === 'warning');

/** Step 2 is complete: a file was read, or doors are in scope and the value is chosen. */
export function canCheck(state: BulkState, scopeCount: number): boolean {
  if (!state.type) return false;
  if (state.source === 'upload') return Boolean(state.upload?.rows.length);
  const valueChosen = state.type === 'tier' ? Boolean(state.tierId) : state.skuIds.length > 0;
  return scopeCount > 0 && valueChosen;
}

export function canApply(state: BulkState): boolean {
  return state.reason.trim().length > 0 && applicableRows(state.checked).length > 0;
}
