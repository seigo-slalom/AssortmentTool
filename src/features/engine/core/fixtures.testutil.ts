import type {
  EngineDataset,
  EngineDoor,
  EngineException,
  EngineSku,
  EngineTier,
  EngineTierRule,
} from './types';

export const door = (id: string, overrides: Partial<EngineDoor> = {}): EngineDoor => ({
  id,
  tierId: 'T1',
  productLine: 'Fragrance',
  distributorNameCode: 'R1',
  ...overrides,
});

export const tier = (id: string): EngineTier => ({ id });

export const sku = (id: string, axis?: string, overrides: Partial<EngineSku> = {}): EngineSku => ({
  id,
  axis,
  active: true,
  ...overrides,
});

export const rule = (
  tierId: string,
  skuId: string,
  overrides: Partial<EngineTierRule> = {},
): EngineTierRule => ({ id: `${tierId}:${skuId}`, tierId, skuId, enabled: true, ...overrides });

export const exception = (
  id: string,
  overrides: Partial<EngineException> = {},
): EngineException => ({
  id,
  level: 'door',
  action: 'add',
  skuId: 'S1',
  doorId: 'D1',
  active: true,
  ...overrides,
});

export const dataset = (overrides: Partial<EngineDataset> = {}): EngineDataset => ({
  doors: [],
  tiers: [],
  skus: [],
  tierRules: [],
  exceptions: [],
  ...overrides,
});

// Tier T1 has rules for S1, S2 (Fragrance) and S3 (Makeup); door D1 is a Fragrance door on T1.
export const baseDataset = (overrides: Partial<EngineDataset> = {}): EngineDataset =>
  dataset({
    doors: [door('D1')],
    tiers: [tier('T1')],
    skus: [sku('S1', 'Fragrance'), sku('S2', 'Fragrance'), sku('S3', 'Makeup')],
    tierRules: [rule('T1', 'S1'), rule('T1', 'S2'), rule('T1', 'S3')],
    ...overrides,
  });
