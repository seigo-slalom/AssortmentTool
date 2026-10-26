# Tasks: Assortment Engine Core

**Input**: Design documents from `/specs/001-assortment-engine-core/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/engine-api.md](./contracts/engine-api.md), [quickstart.md](./quickstart.md)

**Tests**: REQUIRED (constitution Principles XIII/XIV: tests written before or alongside code; 100% coverage). Test tasks precede their implementation tasks and should fail first.

**Format**: `- [ ] T### [P?] [US#?] Description with file path` — `[P]` = different files, no dependency on incomplete tasks.

**Agent rules**: Do NOT edit `src/generated/**`; do NOT run `pa` commands. Engine `core/` must not import React, `antd`, `src/generated/**`, `@microsoft/power-apps*`, or `adapters/`. Run verification commands only for code changes (this file is Markdown-only).

## Phase 1: Setup

- [x] T001 Add dev dependencies `@vitest/coverage-v8@^5` and `fast-check` via `npm install -D @vitest/coverage-v8@^5 fast-check` (updates `package.json` and `package-lock.json`)
- [x] T002 Add script `"test:coverage": "vitest run --coverage"` to `package.json`
- [x] T003 [P] Create folders `src/features/engine/core/` and `src/features/engine/adapters/` (placeholder `index.ts` at `src/features/engine/index.ts` exporting nothing yet)
- [x] T004 [P] Add ESLint `no-restricted-imports` override for `src/features/engine/core/**` in `eslint.config.js` banning `react`, `react-dom`, `antd`, `@microsoft/power-apps*`, any path containing `generated`, and `**/adapters/**` (research R9)

---

## Phase 2: Foundational (blocks all user stories)

- [x] T005 [P] Create type-only file `src/features/engine/core/types.ts` with `EngineDoor`, `EngineTier`, `EngineSku`, `EngineTierRule`, `EngineException`, `EngineDataset`, `DoorAssortment`, `DoorLookup`, `Explanation`, `ExplainResult`, `ExceptionRef`, `AggregateCounts`, `Diagnostics`, `Engine` exactly as in `data-model.md` and `contracts/engine-api.md`
- [x] T006 [P] Create `src/features/engine/core/reasons.ts` exporting the 11 reason codes as a `const` object plus `ReasonCode` type (`IN_TIER_RULES`, `ADDED_BY_DOOR_EXCEPTION`, `ADDED_BY_RETAILER_EXCEPTION`, `TIER_MISSING`, `NOT_IN_TIER_RULES`, `RULE_DISABLED`, `SKU_INACTIVE`, `SKU_NOT_AVAILABLE`, `AXIS_MISMATCH`, `REMOVED_BY_DOOR_EXCEPTION`, `REMOVED_BY_RETAILER_EXCEPTION`) and `DOOR_NOT_FOUND`
- [x] T007 [P] Create test fixture builders in `src/features/engine/core/fixtures.testutil.ts` (helpers `door()`, `tier()`, `sku()`, `rule()`, `exception()` with sensible defaults, and `dataset()`), reused by all engine tests
- [x] T008 Create naive reference engine in `src/features/engine/core/referenceEngine.testutil.ts`: straightforward door × SKU loop implementing the full spec (tier missing, active/enabled filters, exact axis `===`, Door > Retailer, same-level Remove wins, exceptions ignored on tier-missing and unavailable SKUs) returning in/out + reason per SKU (depends on T005, T006)

**Checkpoint**: types, reasons, fixtures, reference engine ready.

---

## Phase 3: User Story 1 — Derive a door's base assortment with reasons (P1) 🎯 MVP

**Goal**: Per-door assortment from tier + product line with per-SKU reasons, no exceptions yet.

**Independent Test**: `npx vitest run src/features/engine/core/buildIndex.test.ts src/features/engine/core/baseAssortment.test.ts src/features/engine/core/deriveDoor.test.ts src/features/engine/core/explain.test.ts` passes against hand-computed expectations (spec US1 scenarios 1–6).

### Tests (write first)

- [x] T009 [P] [US1] `src/features/engine/core/buildIndex.test.ts`: SKU GUID→int mapping and deterministic order; tier rules grouped per tier (enabled vs disabled sets, duplicate SKU in a tier counted once); door lookup; empty dataset
- [x] T010 [P] [US1] `src/features/engine/core/baseAssortment.test.ts`: exact-axis match; near misses (`fragrance`, `Fragrance `, ` Fragrance`, double space, look-alike char) do not match; absent/empty product line or axis never matches; disabled rule excluded; inactive SKU excluded; cache reuse (same instance returned for same tier+productLine, computed once)
- [x] T011 [P] [US1] `src/features/engine/core/deriveDoor.test.ts`: scenario 1 (SKUs 1,2 in; 3 out); missing tier (undefined and unknown id) → status `tier-missing`, empty; unknown door → `DOOR_NOT_FOUND`; stable SKU order; result holds IDs + reasons only
- [x] T012 [P] [US1] `src/features/engine/core/explain.test.ts`: reasons `AXIS_MISMATCH`, `NOT_IN_TIER_RULES`, `TIER_MISSING`, `RULE_DISABLED`, `SKU_INACTIVE`, `SKU_NOT_AVAILABLE`, `IN_TIER_RULES`; precedence order from research R4; unknown door

### Implementation

- [x] T013 [US1] Implement `src/features/engine/core/buildIndex.ts` (`buildIndex(dataset)` → `EngineIndex` with `skuIdxById`, `skuIds`, `axisByIdx`, active flags, `tierRuleSkus` enabled/disabled sets, `doorById`, tier set, empty exception maps and diagnostics placeholder); `skuIds` sorted by id for determinism
- [x] T014 [US1] Implement `src/features/engine/core/baseAssortment.ts` (`getBaseAssortment(index, tierId, productLine)` → `{bits: Uint32Array, count}` cached in `Map<tierId, Map<productLine, BaseAssortment>>`; strict `===` axis match)
- [x] T015 [US1] Implement `src/features/engine/core/deriveDoor.ts` (`deriveDoor(index, doorId)` → `DoorLookup`; walks the base bitset; reasons `IN_TIER_RULES`; tier-missing handling)
- [x] T016 [US1] Implement `src/features/engine/core/explain.ts` (`explainSku(index, doorId, skuId)` → `ExplainResult` using base reasons per research R4 precedence)
- [x] T017 [US1] Implement `src/features/engine/core/createEngine.ts` facade (`createEngine(dataset)` returning `getDoorAssortment`, `getDoorAssortments`, `explain`; `getCounts` and exceptions stubbed to be completed in US2/US3) and export from `src/features/engine/index.ts`
- [x] T018 [US1] Add `src/features/engine/core/engine.equivalence.test.ts` (fast-check): random datasets WITHOUT exceptions — optimized results/explanations equal `referenceEngine.testutil.ts`

**Checkpoint**: US1 independently functional and tested.

---

## Phase 4: User Story 2 — Door- and Retailer-level exceptions (P1)

**Goal**: Apply exceptions with Door > Retailer precedence, Remove wins at same level, retailer match on exact distributor name code, tier-missing ignores exceptions.

**Independent Test**: `npx vitest run src/features/engine/core/exceptions.test.ts` plus extended derive/explain tests cover spec US2 scenarios 1–8.

### Tests (write first)

- [x] T019 [P] [US2] `src/features/engine/core/exceptions.test.ts`: index build of exceptions — drops and counts inactive, non-Active status, missing level/action/SKU, door-level without door, retailer-level without code, unavailable SKU, duplicates; same-level Add+Remove → Remove wins with Add marked overridden; retailer match is case- and whitespace-sensitive; door without code matches no retailer exception
- [x] T020 [P] [US2] Extend `src/features/engine/core/deriveDoor.test.ts`: Door Add pulls in axis-mismatch SKU (`ADDED_BY_DOOR_EXCEPTION`); Retailer Remove (`REMOVED_BY_RETAILER_EXCEPTION`); Door Add beats Retailer Remove; Door Remove beats Retailer Add; exceptions never add inactive/unknown SKUs; tier-missing door ignores Add exceptions
- [x] T021 [P] [US2] Extend `src/features/engine/core/explain.test.ts`: `reason` vs `baseReason`; `applied`, `overridden`, `notApplied` (tier missing) refs populated

### Implementation

- [x] T022 [US2] Implement `src/features/engine/core/exceptions.ts` (normalize/validate exceptions into `doorExceptions` and `retailerExceptions` maps keyed by `skuIdx`, collapse duplicates, Remove-wins, diagnostics counts; `resolveEffective(index, door, skuIdx)` implementing Door > Retailer)
- [x] T023 [US2] Wire exceptions into `buildIndex.ts` (populate maps and `diagnostics`) and expose `engine.diagnostics` in `createEngine.ts`
- [x] T024 [US2] Update `deriveDoor.ts` to apply effective exceptions on top of the base bitset (adds appended in stable `skuIdx` order merged with base; removes dropped) with exception reason codes
- [x] T025 [US2] Update `explain.ts` to report final reason, `baseReason`, `applied`, `overridden`, `notApplied`
- [x] T026 [US2] Extend `engine.equivalence.test.ts` generators with exceptions (both levels, conflicts, malformed, inactive) and assert equality with the reference engine

**Checkpoint**: US1 + US2 complete; full rule set correct.

---

## Phase 5: User Story 3 — Efficient, lazy evaluation at scale (P2)

**Goal**: Counts without lists, lazy per-door work, cached bases, performance budgets.

**Independent Test**: `npx vitest run src/features/engine/core/counts.test.ts src/features/engine/core/laziness.test.ts` passes and `npx vitest bench --run src/features/engine/core/engine.bench.ts` meets budgets.

### Tests (write first)

- [x] T027 [P] [US3] `src/features/engine/core/counts.test.ts`: `getCounts()` per-pair `baseCount`/`doorCount`, per-door counts, `total`; equals sum of `getDoorAssortment().count`; tier-missing doors count 0; empty dataset
- [x] T028 [P] [US3] `src/features/engine/core/laziness.test.ts`: index built once (spy on build via single `createEngine` call); base cache computes once per (tier, productLine) for many doors; `getDoorAssortments([ids])` touches only requested doors; no door × SKU structure retained (assert cache size equals distinct pairs); no `localStorage`/`sessionStorage`/`indexedDB` use
- [x] T029 [P] [US3] `src/features/engine/core/engine.perf.test.ts` (Vitest 5 no longer ships the `bench` API, so the benchmark is a timed test): synthetic medium dataset (3,000 doors, 5,000 SKUs, 6 tiers, 12 product lines, 18,000 rules, 20,000 exceptions); asserts index build ≤ 1 s, single door ≤ 200 ms, all-door counts ≤ 100 ms and logs the timings

### Implementation

- [x] T030 [US3] Implement `src/features/engine/core/counts.ts` (`computeCounts(index)`: per door `base.count + effective adds not in base − effective removes in base` using only that door's exceptions; aggregate per pair) and wire `getCounts()` in `createEngine.ts`
- [x] T031 [US3] Add synthetic dataset generator `src/features/engine/core/syntheticDataset.testutil.ts` used by bench/perf tests
- [x] T032 [US3] Extend `engine.equivalence.test.ts`: counts equal reference counts on generated datasets

**Checkpoint**: US3 verified; budgets recorded for the spec's Verification section.

---

## Phase 6: User Story 4 — Load only what the engine needs (P2)

**Goal**: Adapters load engine inputs via generated services with minimal columns, server filters, full paging, all-or-nothing failure.

**Independent Test**: `npx vitest run src/features/engine/adapters` passes with generated services mocked (`vi.mock`).

### Tests (write first)

- [x] T033 [P] [US4] `src/features/engine/adapters/fetchAllPages.test.ts`: follows `skipToken` across 3 pages and concatenates; passes `maxPageSize: 5000`; stops when no token; throws on `success: false` page and on rejected promise (no partial return)
- [x] T034 [P] [US4] `src/features/engine/adapters/loaders.test.ts`: each loader passes exact `select` and `filter` from research R5 (doors `statecode eq 0`; tiers `statecode eq 0`; SKUs `statecode eq 0 and cr380_isactive eq true`; rules `statecode eq 0 and cr380_isenabled eq true`; exceptions `statecode eq 0 and cr380_exceptionstatus eq 860080000`); mapping of `_cr380_*_value` lookups, level/action enums (860080000/860080001), `active`/`enabled` flags; missing optional fields → `undefined` (not `''`)
- [x] T035 [P] [US4] `src/features/engine/adapters/loadEngineDataset.test.ts`: parallel load returns full `EngineDataset`; any source failure rejects with no partial dataset; medium-dataset mock issues ~11 requests (SC-008)

### Implementation

- [x] T036 [US4] Implement `src/features/engine/adapters/fetchAllPages.ts` (typed generic over `IOperationResult<T[]>` from `@microsoft/power-apps/data`, `skipToken` loop, throws `Error` with source name on failure)
- [x] T037 [US4] Implement `src/features/engine/adapters/loaders.ts` with five loaders using `Cr380_doorsService`, `Cr380_tiersService`, `Cr380_skusService`, `Cr380_tierrulesService`, `Cr380_assortmentexceptionsService` from `src/generated/services/` (type-only imports of generated models; use enum constants from generated models for 860080000/860080001 where exported)
- [x] T038 [US4] Implement `src/features/engine/adapters/loadEngineDataset.ts` (`Promise.all` of loaders) and export `loadEngineDataset` from `src/features/engine/index.ts`

**Checkpoint**: US4 complete; engine consumable from screens.

---

## Phase 7: User Story 5 — 100% coverage gate (P3)

**Goal**: Coverage thresholds enforced project-wide; template starter code cleaned and tested.

**Independent Test**: `npm run test:coverage` exits 0 at 100% for all metrics and fails when a branch is left uncovered.

### Tests (write first)

- [x] T039 [P] [US5] `src/lib/powerContext.test.ts` covering `usePowerContext` (read `src/lib/powerContext.ts` first; test with and without provider)
- [x] T040 [P] [US5] `src/PowerProvider.test.tsx` covering every branch of `src/PowerProvider.tsx` (mock `@microsoft/power-apps` initialization success/failure/loading)
- [x] T041 [P] [US5] `src/App.test.tsx` covering header with/without user name and the route fallback of the simplified `src/App.tsx`

### Implementation

- [x] T042 [US5] Delete unused starter files `src/hooks/useSampleItems.ts`, `src/lib/placeholderService.ts`, `src/pages/HomePage.tsx` (first grep to confirm nothing else imports them) and simplify `src/App.tsx`: remove the `HomePage` lazy import/route and render a `PlaceholderBanner` fallback route instead
- [x] T043 [US5] Add `coverage` block to `vitest.config.ts`: provider `v8`, `include: ['src/**/*.{ts,tsx}']`, `exclude: ['src/generated/**','src/main.tsx','**/*.test.{ts,tsx}','**/*.testutil.ts','**/*.bench.ts','src/test/**','**/*.d.ts','**/types.ts']`, thresholds `{ lines: 100, branches: 100, functions: 100, statements: 100 }`
- [x] T044 [US5] Run `npm run test:coverage`; add targeted tests for any uncovered line/branch until all four metrics are 100% (including existing `ErrorBoundary` and `PlaceholderBanner`); then deliberately add and remove an uncovered branch to confirm the gate fails (do not commit it)

**Checkpoint**: coverage gate green and enforced.

---

## Phase 8: Polish & Cross-Cutting

- [x] T045 [P] Run `npm run lint`, fix findings (verify the `core/` import restriction fires by temporarily importing `react` in a core file, then revert)
- [x] T046 [P] Run `npm run format:check` / `npm run format` for changed files, and `npm run build` (strict TS) until clean
- [x] T047 Fill the **Verification & Known Limitations** section in `specs/001-assortment-engine-core/spec.md` with test results, coverage figures, benchmark numbers (SC-002–SC-004), untested scenarios, data gaps, and limitations (Principle XIV)
- [x] T048 [P] README test instructions updated (`npm run test:coverage`); CHANGELOG.md left untouched because it documents the starter template only, not apps built from it
- [x] T049 Walk through `specs/001-assortment-engine-core/quickstart.md` end to end and confirm every step's expected outcome

---

## Dependencies & Execution Order

- Phase 1 → Phase 2 → user stories → Phase 8.
- **US1** depends only on Phase 2. **US2** depends on US1 (extends `buildIndex`, `deriveDoor`, `explain`). **US3** depends on US2 (counts use effective exceptions). **US4** depends only on Phase 2 types (can run in parallel with US1–US3). **US5** coverage run (T044) must come after all other code and tests exist; T039–T043 can start after Phase 1.
- Within a story: tests → implementation; tasks touching the same file are sequential.

```text
Setup → Foundational ─┬─ US1 → US2 → US3 ─┐
                      ├─ US4 ─────────────┼─ US5 (T044 final) → Polish
                      └─ US5 (T039–T043) ─┘
```

## Parallel Examples

- Phase 2: T005, T006, T007 together.
- US1 tests: T009, T010, T011, T012 together; US2 tests T019, T020, T021 together.
- US4 tests T033, T034, T035 together, and US4 as a whole alongside US1–US3 with a second developer.
- US5 tests T039, T040, T041 together.

## Implementation Strategy

- **MVP**: Phases 1–3 (US1) — base derivation and reasons. Add US2 immediately after since exceptions are required for correct results (both are P1).
- **Incremental**: US1 → US2 → US3 (scale) → US4 (loading) → US5 (gate), validating each checkpoint with its Independent Test command.
- Deployment (`pa app push`) is human-only; nothing here requires it.
