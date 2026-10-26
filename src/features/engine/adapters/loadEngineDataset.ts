import type { EngineDataset } from '../core/types';
import { loadDoors, loadExceptions, loadSkus, loadTierRules, loadTiers } from './loaders';

// All-or-nothing: Promise.all rejects on the first failing source, so no partial dataset escapes.
export async function loadEngineDataset(): Promise<EngineDataset> {
  const [doors, tiers, skus, tierRules, exceptions] = await Promise.all([
    loadDoors(),
    loadTiers(),
    loadSkus(),
    loadTierRules(),
    loadExceptions(),
  ]);
  return { doors, tiers, skus, tierRules, exceptions };
}
