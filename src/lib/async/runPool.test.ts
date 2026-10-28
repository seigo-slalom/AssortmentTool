import { describe, expect, it, vi } from 'vitest';
import { isPoolError, PoolError, runPool } from './runPool';

const tick = () => new Promise((r) => setTimeout(r, 0));

describe('runPool', () => {
  it('returns results in input order and never exceeds the concurrency cap', async () => {
    let inFlight = 0;
    let peak = 0;
    const results = await runPool(
      [5, 1, 4, 2, 3, 0, 6],
      async (n) => {
        inFlight += 1;
        peak = Math.max(peak, inFlight);
        for (let i = 0; i < n; i += 1) await tick();
        inFlight -= 1;
        return n * 10;
      },
      { concurrency: 3 },
    );
    expect(results).toEqual([50, 10, 40, 20, 30, 0, 60]);
    expect(peak).toBe(3);
  });

  it('defaults to 4 lanes and reports monotonic progress', async () => {
    let peak = 0;
    let inFlight = 0;
    const progress = vi.fn();
    await runPool(
      Array.from({ length: 10 }, (_, i) => i),
      async () => {
        inFlight += 1;
        peak = Math.max(peak, inFlight);
        await tick();
        inFlight -= 1;
      },
      { onProgress: progress },
    );
    expect(peak).toBe(4);
    expect(progress.mock.calls.map((c) => c[0])).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    expect(progress).toHaveBeenLastCalledWith(10, 10);
  });

  it('isolates failures', async () => {
    const results = await runPool([1, 2, 3], async (n) => {
      if (n === 2) throw new Error('nope');
      if (n === 3) throw 'plain';
      return n;
    });
    expect(results[0]).toBe(1);
    expect(isPoolError(results[1])).toBe(true);
    expect((results[1] as PoolError).message).toBe('nope');
    expect((results[2] as PoolError).message).toBe('plain');
    expect(isPoolError(1)).toBe(false);
  });

  it('resolves an empty input immediately', async () => {
    await expect(runPool([], async () => 1)).resolves.toEqual([]);
  });
});
