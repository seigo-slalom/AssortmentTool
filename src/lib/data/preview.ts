import type { EngineDataset, EngineException } from '../../features/engine';

/**
 * What-if datasets for previews (research R2). Previews are built from the public engine
 * API by changing the input, never persisted.
 */
export function withDoorTierOverrides(
  dataset: EngineDataset,
  overrides: ReadonlyMap<string, string | undefined>,
): EngineDataset {
  return {
    ...dataset,
    doors: dataset.doors.map((door) =>
      overrides.has(door.id) ? { ...door, tierId: overrides.get(door.id) } : door,
    ),
  };
}

export function withDoorExceptions(
  dataset: EngineDataset,
  extra: readonly EngineException[],
): EngineDataset {
  return { ...dataset, exceptions: [...dataset.exceptions, ...extra] };
}
