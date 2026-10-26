import type { EngineDataset } from './types';

export interface SyntheticSize {
  doors: number;
  skus: number;
  tiers: number;
  productLines: number;
  rules: number;
  exceptions: number;
}

export const MEDIUM: SyntheticSize = {
  doors: 3000,
  skus: 5000,
  tiers: 6,
  productLines: 12,
  rules: 18000,
  exceptions: 20000,
};

const mulberry32 = (seed: number) => () => {
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

const pad = (prefix: string, n: number) => `${prefix}${String(n).padStart(6, '0')}`;

export function syntheticDataset(size: SyntheticSize, seed = 1): EngineDataset {
  const random = mulberry32(seed);
  const pick = (n: number) => Math.floor(random() * n);
  const line = (n: number) => `Line ${n}`;
  const retailers = Math.max(1, Math.floor(size.doors / 10));

  return {
    tiers: Array.from({ length: size.tiers }, (_, i) => ({ id: pad('T', i) })),
    skus: Array.from({ length: size.skus }, (_, i) => ({
      id: pad('S', i),
      axis: line(pick(size.productLines)),
      active: true,
    })),
    doors: Array.from({ length: size.doors }, (_, i) => ({
      id: pad('D', i),
      tierId: pad('T', pick(size.tiers)),
      productLine: line(pick(size.productLines)),
      distributorNameCode: pad('R', pick(retailers)),
    })),
    tierRules: Array.from({ length: size.rules }, (_, i) => ({
      id: pad('TR', i),
      tierId: pad('T', pick(size.tiers)),
      skuId: pad('S', pick(size.skus)),
      enabled: true,
    })),
    exceptions: Array.from({ length: size.exceptions }, (_, i) => {
      const doorLevel = random() < 0.5;
      return {
        id: pad('E', i),
        level: doorLevel ? ('door' as const) : ('retailer' as const),
        action: random() < 0.5 ? ('add' as const) : ('remove' as const),
        skuId: pad('S', pick(size.skus)),
        doorId: doorLevel ? pad('D', pick(size.doors)) : undefined,
        distributorNameCode: doorLevel ? undefined : pad('R', pick(retailers)),
        active: true,
      };
    }),
  };
}
