import { getBaseAssortment, hasBit } from './baseAssortment';
import { hasTier, type EngineIndex } from './buildIndex';
import { resolveAll } from './exceptions';
import type { AggregateCounts, PairCount } from './types';

export function computeCounts(index: EngineIndex): AggregateCounts {
  const byDoor = new Map<string, number>();
  const pairs = new Map<string, PairCount>();
  let total = 0;

  for (const door of index.doors) {
    if (!hasTier(index, door.tierId)) {
      byDoor.set(door.id, 0);
      continue;
    }
    const base = getBaseAssortment(index, door.tierId, door.productLine);
    let count = base.count;
    for (const [skuIdx, { applied }] of resolveAll(index, door)) {
      const inBase = hasBit(base.bits, skuIdx);
      if (applied.action === 'add' && !inBase) count += 1;
      if (applied.action === 'remove' && inBase) count -= 1;
    }
    byDoor.set(door.id, count);
    total += count;

    const key = `${door.tierId}\u0000${door.productLine ?? ''}`;
    const pair = pairs.get(key) ?? {
      tierId: door.tierId,
      productLine: door.productLine,
      baseCount: base.count,
      doorCount: 0,
    };
    pair.doorCount += 1;
    pairs.set(key, pair);
  }

  return { byPair: [...pairs.values()], byDoor, total };
}
