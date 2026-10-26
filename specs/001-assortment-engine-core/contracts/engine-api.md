# Contract: Engine Public API (`src/features/engine/index.ts`)

Consumers (later screen specs) import only from `src/features/engine`. Types are defined in
[data-model.md](../data-model.md). All functions are synchronous, pure, and deterministic
except the adapter loader, which is async.

## Core

```ts
createEngine(dataset: EngineDataset): Engine
```

Builds the index once and returns a facade that reuses it and its per-(Tier, Product Line)
base cache.

```ts
interface Engine {
  readonly diagnostics: Diagnostics;
  getDoorAssortment(doorId: string): DoorLookup; // lazy; one door
  getDoorAssortments(doorIds: readonly string[]): DoorLookup[]; // lazy; selected/visible only
  explain(doorId: string, skuId: string): ExplainResult; // { found:false } for unknown door
  getCounts(): AggregateCounts; // no per-door SKU lists built
}
```

Guarantees:

- Unknown door → `{ found: false, reason: 'DOOR_NOT_FOUND' }` (never throws).
- `skuIds` ordered deterministically; `reasons[i]` belongs to `skuIds[i]`.
- Repeated calls reuse the index and cached base bitsets; only requested doors are computed.
- Results contain SKU IDs and reason codes only (no SKU copies).
- Inputs are never mutated.

## Adapters

```ts
loadEngineDataset(): Promise<EngineDataset>
```

Loads doors, tiers, SKUs, tier rules, and exceptions via the generated services
(`getAll` with `select`, server `filter`, `maxPageSize`, `skipToken` paging). Rejects
with an `Error` if any page of any source fails; never returns a partial dataset.
Callers (e.g., a future TanStack Query hook) own caching/refresh.

```ts
fetchAllPages<T>(getPage: (opts) => Promise<IOperationResult<T[]>>, opts): Promise<T[]>
```

Internal helper, exported for testing.

## Non-goals

No UI, no persistence, no Web Worker, no incremental recalculation.
