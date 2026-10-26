import { describe, expect, it } from 'vitest';
import { buildIndex } from './buildIndex';
import { computeCounts } from './counts';
import { deriveDoor } from './deriveDoor';
import { MEDIUM, syntheticDataset } from './syntheticDataset.testutil';

const time = <T>(label: string, run: () => T): { value: T; ms: number } => {
  const start = performance.now();
  const value = run();
  const ms = performance.now() - start;
  console.info(`[perf] ${label}: ${ms.toFixed(2)} ms`);
  return { value, ms };
};

// Asserts the SC-002/SC-003 budgets on the medium dataset and logs the measured timings.
describe('medium dataset performance', () => {
  const data = syntheticDataset(MEDIUM);

  it('builds the index in at most 1 s', () => {
    expect(time('build index', () => buildIndex(data)).ms).toBeLessThanOrEqual(1000);
  });

  it('derives a single door in at most 200 ms (cold base cache)', () => {
    const index = buildIndex(data);
    const { value, ms } = time('single door (cold)', () => deriveDoor(index, data.doors[0].id));
    expect(ms).toBeLessThanOrEqual(200);
    expect(value.found).toBe(true);
  });

  it('derives a warm door in at most 200 ms', () => {
    const index = buildIndex(data);
    deriveDoor(index, data.doors[0].id);
    expect(
      time('single door (warm)', () => deriveDoor(index, data.doors[1].id)).ms,
    ).toBeLessThanOrEqual(200);
  });

  it('counts every door in at most 100 ms once the base assortments exist', () => {
    const index = buildIndex(data);
    computeCounts(index);
    const { value, ms } = time('counts for all doors', () => computeCounts(index));
    expect(ms).toBeLessThanOrEqual(100);
    expect(value.byDoor.size).toBe(MEDIUM.doors);
  });
});
