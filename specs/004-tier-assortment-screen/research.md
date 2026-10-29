# Research: Tier Assortments Screen

All Technical Context unknowns are resolved below. No external research was needed; the
decisions reuse the patterns delivered in spec 003.

## R1 — Data loading

- **Decision**: Reuse `useAssortmentData` (shared `lib/data` records + engine). Extend the
  `tiers` and `skus` record loaders with the extra columns the screen needs (tier
  description; SKU barcode, master product name/baseline, master franchise, master/product
  category, subcategory, last seen in Sunrise). Door channel for the drawer reach grid uses
  the existing `onlineOffline` field.
- **Rationale**: One cache, one engine; invalidation after writes already refreshes every
  screen (SC-003).
- **Alternatives**: A screen-specific loader — rejected (duplicate fetch, stale counts on
  other screens).

## R2 — Tier rule writes (add / remove)

- **Decision**: Add = re-enable an existing disabled rule for the (tier, SKU) pair if one
  exists, else `create` a new enabled rule with `@odata.bind` to `cr380_tiers` and
  `cr380_skus`. Remove = `update` the enabled rule to `cr380_isenabled = false`. Before
  writing, one re-check query per chunk reads current rules for the staged pairs so no-op
  changes are skipped (edge case: concurrent edits). Writes run through `runPool`
  (concurrency 4) with partial-failure reporting; failed items stay staged.
- **Rationale**: Matches the engine's "enabled rules only" loader filter; avoids deletes;
  avoids duplicate rules.
- **Alternatives**: Delete on remove — rejected (loses record; spec assumption says disable).

## R3 — Tier structure writes

- **Decision**: Add = `create` tier (name, description, status Active `860080000`, rank),
  then optionally create enabled rules copied from the source tier. Edit = `update` name,
  description; re-rank = `update` `cr380_rank` on every active tier whose position changed
  (ranks rewritten as 1..N). Retire = move doors with existing `setDoorTier`, disable all
  the tier's rules, then set `cr380_tierstatus = 860080001` (Inactive).
- **Rationale**: Uses only generated services and existing fields.
- **Alternatives**: Fractional ranks — rejected (rank is shown as 01..NN; rewrite is cheap
  at < 20 tiers).

## R4 — Staging state

- **Decision**: A reducer in `features/tier-assortments` holding
  `Record<"skuId|tierId", boolean>`; pure helpers `stageOne`, `stageMany`, `stagedImpact`
  in `lib/tiers`. Staging is in-memory only; switching tiers keeps it; leaving the screen
  discards it.
- **Rationale**: Mirrors the prototype exactly; pure helpers are cheap to unit test.

## R5 — Door impact

- **Decision**: `eligibleTierDoors(tierId, sku)` = count of active, tiered doors in the tier
  whose product line equals the SKU axis (engine rule), or all of them for Multi-axis SKUs.
  Precomputed per (tier, product line) once per data version.
- **Rationale**: Same eligibility rule as the engine; O(1) per staged change.

## R6 — Export

- **Decision**: Reuse `lib/excel` `downloadWorkbook` (lazy exceljs) and the Doors
  `ExportButton` pattern (download icon). File `Tier_assortments_<YYYY-MM-DD>.xlsx`.

## R7 — UI composition

- **Decision**: Ant Design (`Checkbox`, `Input`, `Select`, `Segmented`, `Tag`, `Button`,
  `Modal`, `Drawer`, `Descriptions`, `message`) via existing ChanelUI wrappers
  (`PageHeader`, `DataGrid`, `StatusIndicator`, `Field`, `ReasonField`, `RegionState`).
  Grouped list is a custom CSS-grid list (prototype grid template), virtualisation not
  needed (groups collapsed by default).
- **Rationale**: Prototype fidelity (IX) and token styling (X).

## R8 — Testing scope (user request: limit unit testing)

- **Decision**: Unit tests only for the pure `lib/tiers` modules (grouping/filtering,
  staging, impact, export rows, tier form validation, rank rewrite) at 100% for those files.
  UI components/hooks and the write orchestration under `features/tier-assortments/**` and
  `pages/TierAssortmentsPage/**` are excluded from coverage thresholds. One Playwright spec
  (load, stage, save, axe) plus the existing shell viewport matrix, which already visits the
  Tier assortments route.
- **Rationale**: Explicit user instruction for a prototype app; recorded as a deviation from
  constitution XIV/XI in plan Complexity Tracking.
- **Alternatives**: Full 100% component coverage — rejected per user.
