import { buildIndex } from './buildIndex';
import { computeCounts } from './counts';
import { deriveDoor } from './deriveDoor';
import { explainSku } from './explain';
import type { Engine, EngineDataset } from './types';

export function createEngine(dataset: EngineDataset): Engine {
  const index = buildIndex(dataset);
  return {
    diagnostics: index.diagnostics,
    getDoorAssortment: (doorId) => deriveDoor(index, doorId),
    getDoorAssortments: (doorIds) => doorIds.map((doorId) => deriveDoor(index, doorId)),
    explain: (doorId, skuId) => explainSku(index, doorId, skuId),
    getCounts: () => computeCounts(index),
  };
}
