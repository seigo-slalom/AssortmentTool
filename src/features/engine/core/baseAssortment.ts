import type { BaseAssortment, EngineIndex } from './buildIndex';

const NO_SKUS: ReadonlySet<number> = new Set();

export const hasBit = (bits: Uint32Array, idx: number): boolean =>
  (bits[idx >>> 5] & (1 << (idx & 31))) !== 0;

export function forEachBit(bits: Uint32Array, visit: (idx: number) => void): void {
  for (let word = 0; word < bits.length; word += 1) {
    let value = bits[word];
    while (value !== 0) {
      const low = value & -value;
      visit(word * 32 + 31 - Math.clz32(low));
      value ^= low;
    }
  }
}

// Exact, case-sensitive, untrimmed text comparison; an empty Product Line never matches.
export const axisMatches = (
  index: EngineIndex,
  skuIdx: number,
  productLine: string | undefined,
): boolean =>
  productLine !== undefined && productLine !== '' && index.skuAxis[skuIdx] === productLine;

export function getBaseAssortment(
  index: EngineIndex,
  tierId: string,
  productLine: string | undefined,
): BaseAssortment {
  const key = productLine ?? '';
  const byLine = index.baseCache.get(tierId) ?? new Map<string, BaseAssortment>();
  index.baseCache.set(tierId, byLine);
  const cached = byLine.get(key);
  if (cached) return cached;

  const bits = new Uint32Array(index.wordCount);
  let count = 0;
  for (const skuIdx of index.tierRules.get(tierId)?.enabled ?? NO_SKUS) {
    if (index.skuActive[skuIdx] && axisMatches(index, skuIdx, productLine)) {
      bits[skuIdx >>> 5] |= 1 << (skuIdx & 31);
      count += 1;
    }
  }
  const base = { bits, count };
  byLine.set(key, base);
  return base;
}
