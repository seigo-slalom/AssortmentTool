# Implementation Plan: Assortment Engine Core

**Branch**: `001-assortment-engine-core` (spec directory; no git branch created) | **Date**: 2026-10-26 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-assortment-engine-core/spec.md`

## Summary

Deliver a pure, UI-free TypeScript engine (`src/features/engine/core/`) that derives a
door's assortment as `base(tier, productLine) ⊕ exceptions(door)` and explains every
SKU's in/out outcome with a reason code, plus data-source adapters
(`src/features/engine/adapters/`) that load only engine-required, server-filtered columns
through the generated services with `skipToken` paging, plus a 100% Vitest coverage gate.
Approach: map SKU GUIDs to dense integers once per dataset, store each (Tier, Product Line)
base list as a `Uint32Array` bitset (cached lazily), hold exceptions in sparse maps, and
resolve effective outcomes at lookup time. Nothing door × SKU is ever stored. See
[research.md](./research.md) for decisions.

## Technical Context

**Language/Version**: TypeScript ~6.0 (strict), Node 22.22.2+/24.15+

**Primary Dependencies**: none new at runtime. Dev: `@vitest/coverage-v8` (^5, matching
Vitest 5.0.5; MIT) and `fast-check` (MIT) for equivalence tests.

**Storage**: N/A — derived in memory only; no Dataverse table, no browser storage.

**Testing**: Vitest 5 (+ coverage-v8) with 100% lines/branches/functions/statements;
reference (naive) engine used only by tests; `vitest bench` for performance budgets.

**Target Platform**: Browser inside the Power Apps host (main thread; no Web Worker in
this spec).

**Project Type**: Single web project (Power Platform code app); this feature is a
library-style module with no UI.

**Performance Goals**: single door ≤ 200 ms after index build (target: well under 5 ms);
index build ≤ 1 s and all-door counts ≤ 100 ms on the medium dataset (3,000 doors, 5,000
SKUs, 6 tiers, 12 product lines, 18,000 rules, 20,000 exceptions).

**Constraints**: engine core has no React, I/O, or generated-service imports (enforced by
lint); memory ∝ (Tier, Product Line) pairs × SKUs + exceptions (< 5 MB beyond inputs).

**Scale/Scope**: "Medium" band (≤ ~200k input rows); ~11 data-source requests per load.

### Power Platform Code App Context

**Data sources & connectors**: Dataverse tables already generated: `cr380_doors`,
`cr380_tiers`, `cr380_skus`, `cr380_tierrules`, `cr380_assortmentexceptions`.

**Generated services required**: `Cr380_doorsService`, `Cr380_tiersService`,
`Cr380_skusService`, `Cr380_tierrulesService`, `Cr380_assortmentexceptionsService` — all
exist; `getAll` supports `select`, `filter`, `maxPageSize`, `skipToken`. No new data
source needed (agents never add one).

**Connection IDs needed**: none (Dataverse only).

**Target environment**: unchanged; configured in `power.config.json`, not in source.

**Connector workarounds**: none.

**UI library**: N/A (no UI in this spec).

**Accessibility target**: N/A (no UI); WCAG 2.1 AA applies to later screen specs.

**Constraints check**: connector-first (adapters call generated services only; no
fetch/axios); no secrets; `npm run build`, `lint`, and `test:coverage` clean before
completion.

## Constitution Check

_GATE: passed before Phase 0; re-checked after Phase 1 design — still passes._

| Principle                               | Status         | Notes                                                                                                                                              |
| --------------------------------------- | -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| I Code-app scope only                   | PASS           | No tables/flows created; only src code.                                                                                                            |
| II Connector-first                      | PASS           | Adapters use generated services only.                                                                                                              |
| III Generated services are truth        | PASS           | No edits to `src/generated/`; `_cr380_*_value` lookup fields read as generated.                                                                    |
| IV Human-only deployment                | PASS           | No `pa` commands run or planned.                                                                                                                   |
| V–VIII (template/quality)               | PASS           | Placeholder sample files removed per spec FR-026; no hardcoded secrets.                                                                            |
| IX–XI UI/brand/responsive               | N/A            | No UI delivered.                                                                                                                                   |
| XII Modular architecture                | PASS           | Code under `src/features/engine/`; no cross-feature internal imports; public surface via `index.ts`.                                               |
| XIII Pure, isolated, test-first engine  | PASS           | `core/` pure; tests alongside; exact Axis ↔ Product Line match; Door beats Retailer; derived-never-persisted; base per (Tier, Product Line); lazy. |
| XIV Tests + 100% coverage + limitations | PASS (planned) | Coverage thresholds configured; spec's Verification section filled at implement time.                                                              |
| XV Data gaps flagged                    | PASS           | Data Gaps section in spec (Retailer, multi-valued Product Line).                                                                                   |

Constitution note: Principle XIII says the engine has "no generated-service imports", and
Principle XII lists `engine` as one feature folder. Adapters therefore live in a sibling
subfolder (`adapters/`) and `core/` is lint-restricted from importing them or generated
code.

**Complexity Tracking**: one deviation — a test-only reference engine file must be
excluded from coverage. It is named `*.testutil.ts` and treated as a "test file" under
Principle XIV's exclusion list; no other exclusions are added.

## Project Structure

### Documentation (this feature)

```text
specs/001-assortment-engine-core/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── engine-api.md
├── checklists/requirements.md
└── tasks.md             # /speckit-tasks (not created here)
```

### Source Code (repository root)

```text
src/features/engine/
├── index.ts                      # public API (re-exports only)
├── core/                         # PURE — no React / I/O / generated imports
│   ├── types.ts                  # input + result types (type-only, coverage-excluded)
│   ├── reasons.ts                # reason-code constants
│   ├── buildIndex.ts             # one-time dataset index + diagnostics
│   ├── baseAssortment.ts         # per-(Tier, Product Line) bitset, cached
│   ├── exceptions.ts             # effective-exception resolution (Door > Retailer; Remove wins)
│   ├── deriveDoor.ts             # lazy per-door results (SKU IDs + reasons)
│   ├── explain.ts                # on-demand door × SKU explanation
│   ├── counts.ts                 # per-pair and per-door counts
│   ├── createEngine.ts           # facade: index once, reuse caches
│   └── *.test.ts, referenceEngine.testutil.ts, engine.bench.ts
└── adapters/                     # impure edge: generated services → core input types
    ├── fetchAllPages.ts          # skipToken paging, all-or-nothing
    ├── loaders.ts                # five loaders: select + server filter + mapping
    ├── loadEngineDataset.ts      # parallel load → EngineDataset
    └── *.test.ts                 # services mocked

vitest.config.ts                  # + coverage block (100% thresholds, exclusions)
package.json                      # + test:coverage script, dev deps
eslint.config.js                  # + no-restricted-imports for core/
```

Template cleanup for the coverage gate (FR-026): remove `src/hooks/useSampleItems.ts`,
`src/lib/placeholderService.ts`, and `src/pages/HomePage.tsx` (they only serve the starter
demo; confirmed by import scan) and simplify `src/App.tsx`; add tests for `App.tsx`,
`PowerProvider.tsx`, and `lib/powerContext.ts`. `src/main.tsx` and `src/generated/**` stay
excluded.

**Structure Decision**: single project; feature-scoped engine module split into a pure
`core/` and an `adapters/` edge, per Principles XII and XIII.
