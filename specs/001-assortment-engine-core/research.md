# Research: Assortment Engine Core

All Technical Context unknowns resolved; no NEEDS CLARIFICATION remain.

## R1. Index representation

- **Decision**: Map each active SKU GUID to a dense integer (`skuIdx`) at index build.
  Store a (Tier, Product Line) base list as a `Uint32Array` bitset over `skuIdx`, plus a
  precomputed population count.
- **Rationale**: ~100× smaller than per-door sets (see
  `docs/Assortment-Engine-Data-Volume-Consideration.md`); O(1) membership; counts without
  lists.
- **Alternatives**: `Set<string>` per door (too large); object per door × SKU (hundreds of
  MB); Roaring bitmaps (Apache-2.0, violates MIT-only rule).

## R2. Base assortment computation and caching

- **Decision**: For a pair `(tierId, productLine)`: take the tier's enabled rules
  (deduped by SKU), keep SKUs that exist in the active-SKU index and whose `axis ===
productLine` (strict `===`; absent/empty Product Line or Axis never matches). Compute on
  first request and cache in a `Map` keyed by tier index and a per-tier
  `Map<productLine, base>`.
- **Rationale**: Satisfies FR-017/018/019; K pairs ≪ doors.
- **Alternatives**: eager precompute of all pairs (wasted work for unseen pairs).

## R3. Exception resolution

- **Decision**: Index active, well-formed exceptions into `doorExceptions:
Map<doorId, Map<skuIdx, Entry>>` and `retailerExceptions: Map<distributorNameCode,
Map<skuIdx, Entry>>`. Per (level, door|retailer, SKU) collapse duplicates; if both Add
  and Remove exist at the same level, **Remove wins** and the Add is kept as "overridden".
  At lookup: Door-level entry beats Retailer-level; the loser is reported as overridden.
  Door with unresolved tier: exceptions not applied (spec FR-009).
- **Exceptions on unavailable SKUs** (inactive or unknown): ignored for membership
  (FR-008); counted in diagnostics.
- **Rationale**: Matches spec clarifications; sparse; constant-time lookup.
- **Alternatives**: copy retailer exceptions onto doors (explodes row counts).

## R4. Result shapes and reasons

- **Decision**: Results contain `skuIds` (stable order: ascending `skuIdx`, which follows
  SKU load order sorted by SKU id for determinism) and a compact reason code per SKU;
  base reason is exposed through `explain`. Reasons are string-literal constants:
  `IN_TIER_RULES`, `ADDED_BY_DOOR_EXCEPTION`, `ADDED_BY_RETAILER_EXCEPTION`,
  `TIER_MISSING`, `NOT_IN_TIER_RULES`, `RULE_DISABLED`, `SKU_INACTIVE`,
  `SKU_NOT_AVAILABLE`, `AXIS_MISMATCH`, `REMOVED_BY_DOOR_EXCEPTION`,
  `REMOVED_BY_RETAILER_EXCEPTION`.
- **Rationale**: Reasons for "in" SKUs are derived without storage: base members are
  `IN_TIER_RULES`, exception-added ones carry the exception reason. "Out" reasons are
  produced by `explain` on demand (FR-014).
- **Reason precedence for "out" in explain**: tier missing → SKU not available (unknown id)
  → SKU inactive → rule disabled → not in tier rules → axis mismatch. Inactive SKUs and
  disabled rules can only be seen if the caller supplies them (adapters filter them out),
  so the index keeps minimal metadata (id → active flag, tier → rule flags) solely to
  report these reasons.

## R5. Data loading

- **Decision**: `fetchAllPages(getAll, options)` loops while `result.skipToken` is set,
  passing `maxPageSize: 5000`; throws if any page has `success === false` (all-or-nothing,
  FR-024). Five loaders run in parallel (`Promise.all`). `select` lists only needed
  columns; server filters (OData):
  - Doors: `statecode eq 0`; select `cr380_doorid, _cr380_tierid_value, cr380_productline,
cr380_distributornamecode`.
  - Tiers: `statecode eq 0`; select `cr380_tierid`.
  - SKUs: `statecode eq 0 and cr380_isactive eq true`; select `cr380_skuid, cr380_axis`.
  - Tier rules: `statecode eq 0 and cr380_isenabled eq true`; select `cr380_tierruleid,
_cr380_tierid_value, _cr380_sku_value`.
  - Exceptions: `statecode eq 0 and cr380_exceptionstatus eq 860080000`; select
    `cr380_assortmentexceptionid, cr380_exceptionlevel, cr380_exceptionaction,
_cr380_doorid_value, _cr380_skuid_value, cr380_distributornamecode`.
    Filter constants reference the generated enum values rather than magic numbers where
    possible.
- **Rationale**: Minimizes rows and bytes; ~11 requests for the medium dataset.
- **Alternatives**: client-side filtering (more rows); `count:true` preflight (capped at
  5000, unnecessary for medium band).

## R6. Coverage gate

- **Decision**: Add `@vitest/coverage-v8` (^5) and a `coverage` block in
  `vitest.config.ts`: provider `v8`, `include: ['src/**/*.{ts,tsx}']`, `exclude`:
  `src/generated/**`, `src/main.tsx`, `**/*.test.{ts,tsx}`, `**/*.testutil.ts`,
  `**/*.bench.ts`, `src/test/**`, `**/*.d.ts`, `**/types.ts` (type-only files), and
  thresholds `100` for lines, branches, functions, statements (`all: true` behavior via
  `include`). Add script `test:coverage` = `vitest run --coverage`.
- **Rationale**: Constitution Principle XIV.
- **Alternatives**: istanbul provider (slower; v8 is sufficient).

## R7. Existing template files vs the gate

- **Decision**: Delete the unused starter demo (`useSampleItems.ts`, `placeholderService.ts`,
  `HomePage.tsx`) and reduce `App.tsx` to shell + router + placeholder route; add tests for
  `App.tsx`, `PowerProvider.tsx`, `powerContext.ts`.
- **Rationale**: Spec clarification Q3 (remove unused, test the rest).
- **Alternatives**: keep and test the demo (adds tests for code slated for replacement).

## R8. Test strategy

- **Decision**: Example-based tests for every acceptance scenario and edge case; a naive
  reference engine (`referenceEngine.testutil.ts`) plus `fast-check` property tests
  asserting optimized ≡ reference for results, counts, and explanations; `vitest bench`
  for SC-002/003; a memory sanity test asserting the cache holds only base bitsets.
- **Rationale**: FR-027/028, SC-005.

## R9. Purity enforcement

- **Decision**: ESLint `no-restricted-imports` scoped to `src/features/engine/core/**`
  banning `react*`, `antd`, `../generated/*`, `**/adapters/*`, and
  `@microsoft/power-apps*`.
- **Rationale**: Principle XIII isolation made mechanical.
