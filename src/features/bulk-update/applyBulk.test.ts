import { describe, expect, it, vi } from 'vitest';
import type { ExceptionRecord } from '../../lib/data';
import {
  applyBulk,
  doorCount,
  retryFailed,
  STALE_MESSAGE,
  undoBulk,
  type BulkDeps,
} from './applyBulk';
import type { CheckedRow } from './types';

const tierRow = (doorId: string, tierId: string, prevTierId?: string): CheckedRow => ({
  key: `r-${doorId}`,
  line: 2,
  doorKey: `K-${doorId}`,
  doorLabel: `Door ${doorId}`,
  doorId,
  change: '',
  status: 'ready',
  message: '',
  tierId,
  snapshot: { tierId: prevTierId, status: 'Open' },
});

const skuRow = (
  doorId: string,
  skuId: string,
  action: 'add' | 'remove',
  rowReason?: string,
): CheckedRow => ({
  ...tierRow(doorId, 'T1', 'T1'),
  key: `r-${doorId}-${skuId}`,
  tierId: undefined,
  skuId,
  skuKey: `k${skuId}`,
  action,
  rowReason,
});

function deps(overrides: Partial<BulkDeps> = {}): BulkDeps {
  return {
    setDoorTier: vi.fn(async () => ({ ok: true as const, value: undefined })),
    createDoorException: vi.fn(async (input) => ({
      ok: true as const,
      value: { id: `E-${input.doorId}-${input.skuId}` },
    })),
    cancelException: vi.fn(async () => ({ ok: true as const, value: undefined })),
    recheckDoors: vi.fn(
      async (ids: readonly string[]) =>
        new Map(ids.map((id) => [id, { tierId: id === 'D2' ? undefined : 'T1', status: 'Open' }])),
    ),
    recheckDoorExceptions: vi.fn(
      async (ids: readonly string[]) =>
        new Map<string, ExceptionRecord[]>(ids.map((id) => [id, []])),
    ),
    today: () => '2026-09-23',
    ...overrides,
  };
}

describe('applyBulk — re-tier', () => {
  it('re-checks, saves every fresh row and records the previous tier', async () => {
    const d = deps();
    const progress = vi.fn();
    const result = await applyBulk(
      [tierRow('D1', 'T2', 'T1'), tierRow('D2', 'T2')],
      'tier',
      'Review',
      d,
      progress,
    );
    expect(d.recheckDoors).toHaveBeenCalledWith(['D1', 'D2']);
    expect(d.recheckDoorExceptions).not.toHaveBeenCalled();
    expect(d.setDoorTier).toHaveBeenCalledWith('D1', 'T2');
    expect(result).toMatchObject({
      kind: 'applied',
      type: 'tier',
      total: 2,
      failed: [],
      stale: [],
    });
    expect(result.succeeded).toEqual([
      { kind: 'tier', doorId: 'D1', doorLabel: 'Door D1', prevTierId: 'T1', newTierId: 'T2' },
      { kind: 'tier', doorId: 'D2', doorLabel: 'Door D2', prevTierId: undefined, newTierId: 'T2' },
    ]);
    expect(progress).toHaveBeenLastCalledWith(2, 2);
    expect(doorCount(result)).toBe(2);
  });

  it('skips doors changed by someone else (tier, status, or gone)', async () => {
    const d = deps({
      recheckDoors: vi.fn(
        async () =>
          new Map([
            ['D1', { tierId: 'T3', status: 'Open' }],
            ['D3', { tierId: 'T1', status: 'Closed' }],
            ['D4', { tierId: 'T1', status: 'Open' }],
          ]),
      ),
    });
    const result = await applyBulk(
      [
        tierRow('D1', 'T2', 'T1'),
        tierRow('D3', 'T2', 'T1'),
        tierRow('D9', 'T2', 'T1'),
        tierRow('D4', 'T2', 'T1'),
      ],
      'tier',
      'r',
      d,
    );
    expect(result.stale.map((r) => r.doorId)).toEqual(['D1', 'D3', 'D9']);
    expect(result.succeeded.map((c) => c.doorId)).toEqual(['D4']);
    expect(STALE_MESSAGE).toBe('Changed by someone else — not updated');
  });

  it('reports write failures and thrown errors per row, and a failed re-check for all rows', async () => {
    const d = deps({
      setDoorTier: vi
        .fn()
        .mockResolvedValueOnce({ ok: false, error: '429 Too Many Requests' })
        .mockRejectedValueOnce(new Error('boom'))
        .mockResolvedValue({ ok: true, value: undefined }),
    });
    const result = await applyBulk(
      [tierRow('D1', 'T2', 'T1'), tierRow('D4', 'T2', 'T1'), tierRow('D5', 'T2', 'T1')],
      'tier',
      'r',
      d,
    );
    expect(result.failed.map((f) => [f.doorLabel, f.error])).toEqual([
      ['Door D1', '429 Too Many Requests'],
      ['Door D4', 'boom'],
    ]);
    expect(result.succeeded).toHaveLength(1);

    const down = await applyBulk(
      [tierRow('D1', 'T2', 'T1')],
      'tier',
      'r',
      deps({ recheckDoors: vi.fn().mockRejectedValue('offline') }),
    );
    expect(down.failed).toEqual([
      expect.objectContaining({ doorLabel: 'Door D1', error: 'offline' }),
    ]);
    expect(down.succeeded).toEqual([]);
    const err = await applyBulk(
      [tierRow('D1', 'T2', 'T1')],
      'tier',
      'r',
      deps({ recheckDoors: vi.fn().mockRejectedValue(new Error('timeout')) }),
    );
    expect(err.failed[0].error).toBe('timeout');
  });

  it('retries only the failed rows and merges the outcome', async () => {
    const d = deps({
      setDoorTier: vi
        .fn()
        .mockResolvedValueOnce({ ok: false, error: 'x' })
        .mockResolvedValue({ ok: true, value: undefined }),
    });
    const first = await applyBulk(
      [tierRow('D1', 'T2', 'T1'), tierRow('D4', 'T2', 'T1')],
      'tier',
      'r',
      d,
    );
    expect(first.failed).toHaveLength(1);
    const again = await retryFailed(first, d);
    expect(again.failed).toEqual([]);
    expect(again.succeeded.map((c) => c.doorId).sort()).toEqual(['D1', 'D4']);
  });
});

describe('applyBulk — SKUs', () => {
  it('creates one exception per row with the reason and per-row note', async () => {
    const d = deps();
    const result = await applyBulk(
      [skuRow('D1', 'S5', 'add', 'Flagship'), skuRow('D4', 'S1', 'remove')],
      'sku',
      'Retailer agreement',
      d,
    );
    expect(d.createDoorException).toHaveBeenCalledWith({
      doorId: 'D1',
      doorKey: 'K-D1',
      skuId: 'S5',
      skuKey: 'kS5',
      action: 'add',
      reason: 'Retailer agreement · Flagship',
      today: '2026-09-23',
    });
    expect(vi.mocked(d.createDoorException).mock.calls[1][0].reason).toBe('Retailer agreement');
    expect(result.succeeded).toEqual([
      { kind: 'exception', doorId: 'D1', doorLabel: 'Door D1', exceptionId: 'E-D1-S5' },
      { kind: 'exception', doorId: 'D4', doorLabel: 'Door D4', exceptionId: 'E-D4-S1' },
    ]);
  });

  it('treats a new exception for the same door and SKU as stale, and reports failures', async () => {
    const d = deps({
      recheckDoorExceptions: vi.fn(
        async () =>
          new Map([
            ['D1', [{ id: 'X', skuId: 'S5' }]],
            ['D4', []],
          ]),
      ),
      createDoorException: vi.fn(async () => ({ ok: false as const, error: 'denied' })),
    });
    const result = await applyBulk(
      [
        skuRow('D1', 'S5', 'add'),
        skuRow('D4', 'S1', 'remove'),
        { ...skuRow('D6', 'S1', 'remove'), skuKey: undefined },
      ],
      'sku',
      'r',
      d,
    );
    expect(result.stale.map((r) => r.doorId)).toEqual(['D1']);
    expect(result.failed.map((f) => f.error)).toEqual(['denied', 'denied']);
    expect(vi.mocked(d.createDoorException).mock.calls[1][0].skuKey).toBe('');
  });
});

describe('undoBulk', () => {
  it('restores previous tiers (null when none) and cancels created exceptions', async () => {
    const d = deps();
    const applied = await applyBulk(
      [tierRow('D1', 'T2', 'T1'), tierRow('D2', 'T2')],
      'tier',
      'r',
      d,
    );
    const undone = await undoBulk(applied, d);
    expect(d.setDoorTier).toHaveBeenCalledWith('D1', 'T1');
    expect(d.setDoorTier).toHaveBeenCalledWith('D2', null);
    expect(undone).toMatchObject({ kind: 'undone', total: 2, failed: [], applied });

    const skus = await applyBulk([skuRow('D1', 'S5', 'add')], 'sku', 'r', d);
    await undoBulk(skus, d);
    expect(d.cancelException).toHaveBeenCalledWith('E-D1-S5');
  });

  it('reports undo failures and retries them', async () => {
    const d = deps({
      setDoorTier: vi
        .fn()
        .mockResolvedValueOnce({ ok: true, value: undefined })
        .mockResolvedValueOnce({ ok: true, value: undefined })
        .mockResolvedValueOnce({ ok: false, error: 'required' })
        .mockRejectedValueOnce(new Error('gone'))
        .mockResolvedValue({ ok: true, value: undefined }),
    });
    const applied = await applyBulk(
      [tierRow('D1', 'T2', 'T1'), tierRow('D2', 'T2')],
      'tier',
      'r',
      d,
    );
    const undone = await undoBulk(applied, d);
    expect(undone.failed.map((f) => f.error)).toEqual(['required', 'gone']);
    expect(undone.succeeded).toEqual([]);
    const again = await retryFailed(undone, d);
    expect(again.failed).toEqual([]);
    expect(again.succeeded).toHaveLength(2);
  });
});
