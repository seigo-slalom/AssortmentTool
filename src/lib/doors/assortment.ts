import type { Engine } from '../../features/engine';

/** SKU ids a door receives today; empty when the engine does not know the door. */
export function doorSkuIds(engine: Engine, doorId: string): string[] {
  const lookup = engine.getDoorAssortment(doorId);
  return lookup.found ? lookup.assortment.skuIds : [];
}
