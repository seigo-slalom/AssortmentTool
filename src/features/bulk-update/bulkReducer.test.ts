import { describe, expect, it } from 'vitest';
import {
  applicableRows,
  bulkReducer,
  canApply,
  canCheck,
  defaultSource,
  initialBulkState,
} from './bulkReducer';
import type { BulkState, CheckedRow } from './types';

const row = (status: CheckedRow['status']): CheckedRow => ({
  key: status,
  line: 2,
  doorKey: 'US1',
  doorLabel: 'A',
  change: '',
  status,
  message: '',
});

describe('bulkReducer', () => {
  it('starts at step 1 for a typed entry with a selection, else at step 0', () => {
    expect(initialBulkState({ type: 'tier', startStep: 1 }, ['D1'])).toMatchObject({
      step: 1,
      type: 'tier',
      source: 'selection',
      doorIds: ['D1'],
      filter: 'needs-tier',
      skuAction: 'add',
    });
    expect(initialBulkState({ type: 'sku' }, [])).toMatchObject({ step: 0, source: 'upload' });
    expect(initialBulkState(undefined, [])).toMatchObject({
      step: 0,
      type: undefined,
      source: 'filter',
    });
  });

  it('picks the default source', () => {
    expect(defaultSource(['D1'], 'sku')).toBe('selection');
    expect(defaultSource([], 'sku')).toBe('upload');
    expect(defaultSource([], 'tier')).toBe('filter');
    expect(defaultSource([])).toBe('filter');
  });

  it('changing the type resets the values and source; picking the same type keeps them', () => {
    let s = initialBulkState(undefined, []);
    s = bulkReducer(s, { type: 'pickType', changeType: 'tier' });
    s = bulkReducer(s, { type: 'setTier', tierId: 'T1' });
    expect(bulkReducer(s, { type: 'pickType', changeType: 'tier' })).toBe(s);
    s = bulkReducer(s, { type: 'pickType', changeType: 'sku' });
    expect(s).toMatchObject({ type: 'sku', tierId: undefined, skuIds: [], source: 'upload' });
  });

  it('moves between steps within bounds and keeps choices on Back', () => {
    let s: BulkState = { ...initialBulkState(undefined, []), type: 'tier', tierId: 'T2' };
    s = bulkReducer(s, { type: 'continue' });
    s = bulkReducer(s, { type: 'continue' });
    s = bulkReducer(s, { type: 'continue' });
    s = bulkReducer(s, { type: 'continue' });
    expect(s.step).toBe(3);
    s = bulkReducer(s, { type: 'back' });
    expect(s).toMatchObject({ step: 2, tierId: 'T2' });
    s = bulkReducer(bulkReducer(bulkReducer(s, { type: 'back' }), { type: 'back' }), {
      type: 'back',
    });
    expect(s.step).toBe(0);
  });

  it('sets every field and resets', () => {
    let s = initialBulkState(undefined, ['D1']);
    s = bulkReducer(s, { type: 'setSource', source: 'upload' });
    s = bulkReducer(s, { type: 'setFilter', filter: 'recent' });
    s = bulkReducer(s, { type: 'setSkuAction', action: 'remove' });
    s = bulkReducer(s, { type: 'setSkuIds', skuIds: ['S1'] });
    s = bulkReducer(s, { type: 'setUpload', upload: { fileName: 'f.xlsx', rows: [] } });
    s = bulkReducer(s, { type: 'setReason', reason: 'Why' });
    s = bulkReducer(s, { type: 'setChecked', rows: [row('ready')] });
    expect(s).toMatchObject({ step: 2, rowView: 'all', source: 'upload', filter: 'recent' });
    s = bulkReducer(s, { type: 'setRowView', view: 'issues' });
    const result = {
      kind: 'applied',
      type: 'tier',
      reason: '',
      succeeded: [],
      failed: [],
      stale: [],
      total: 0,
    } as const;
    s = bulkReducer(s, { type: 'setResult', result });
    expect(s).toMatchObject({
      rowView: 'issues',
      skuAction: 'remove',
      skuIds: ['S1'],
      reason: 'Why',
      result,
    });
    expect(s.upload?.fileName).toBe('f.xlsx');
    expect(bulkReducer(s, { type: 'reset' })).toEqual(initialBulkState(undefined, []));
  });

  it('guards Check the rows and Apply', () => {
    const base = initialBulkState(undefined, []);
    expect(canCheck(base, 3)).toBe(false);
    const tier = { ...base, type: 'tier' as const };
    expect(canCheck(tier, 3)).toBe(false);
    expect(canCheck({ ...tier, tierId: 'T1' }, 0)).toBe(false);
    expect(canCheck({ ...tier, tierId: 'T1' }, 3)).toBe(true);
    const sku = { ...base, type: 'sku' as const };
    expect(canCheck({ ...sku, skuIds: ['S1'] }, 1)).toBe(true);
    expect(canCheck({ ...sku, source: 'upload' }, 0)).toBe(false);
    expect(
      canCheck(
        { ...sku, source: 'upload', upload: { fileName: 'f', rows: [{ line: 2, doorKey: 'x' }] } },
        0,
      ),
    ).toBe(true);

    expect(applicableRows([row('ready'), row('warning'), row('error')])).toHaveLength(2);
    expect(canApply({ ...base, checked: [row('ready')], reason: ' ' })).toBe(false);
    expect(canApply({ ...base, checked: [row('error')], reason: 'x' })).toBe(false);
    expect(canApply({ ...base, checked: [row('warning')], reason: 'x' })).toBe(true);
  });
});
