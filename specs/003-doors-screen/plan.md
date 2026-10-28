# Implementation Plan: Doors Screen & Bulk Update

**Branch**: `003-doors-screen` | **Date**: 2026-10-27 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/003-doors-screen/spec.md`

## Summary

Replace the Doors and Mass update placeholders with the prototype's Doors screen and a
renamed, four-step **Bulk Update** workflow, backed by the five generated Dataverse
services and the Assortment Engine. A new shared data layer (`src/lib/data/`) loads full
records once through TanStack Query and builds the engine from the same records. Pure,
unit-tested modules handle filtering, saved filters, URL-query state, row checks, impact
previews (a preview engine rebuilt with tier and exception overrides) and writes
(generated `update`/`create` with `@odata.bind`, a stale-row re-check, and a
concurrency-limited pool with partial-failure reporting and session undo). Excel export,
templates and upload parsing use **exceljs**, loaded on demand. The UI is composed from
Ant Design and new token-styled ChanelUI replica components (DataGrid, StatusIndicator,
KpiTile, Field, FormGrid, WorkflowSection, FormActions, ConfirmAction). Routes gain
`#/doors/bulk-update`, with a redirect from the old Mass update address. Quality is proven
by 100%-coverage Vitest suites, Playwright E2E with an in-memory data stub, axe checks and
masked screenshot comparisons against the prototype.

## Technical Context

**Language/Version**: TypeScript ~6.0 (strict), React 19.3, Node.js 22.22.2+ / 24.15+

**Primary Dependencies**: Ant Design 6.6 + `@ant-design/icons` 6.3, React Router 7.18
(`HashRouter`, `useSearchParams`, `Navigate`), TanStack Query 5, `@microsoft/power-apps`
1.4 (generated services). **New runtime dependency**: `exceljs` 4.4.0 (MIT), lazily
imported (R4).

**Storage**: Dataverse through generated services only: reads of all 5 tables; writes to
`cr380_doors` (tier lookup) and `cr380_assortmentexceptions` (create, cancel). UI state
lives in the URL query plus an in-memory session store. No browser storage and no
persisted assortments.

**Testing**: Vitest 5 + Testing Library + jsdom (100% thresholds), fast-check for filter
and check-rule properties; Playwright 1.63 (`e2e`, `visual`, `prototype-baseline`
projects) with `@axe-core/playwright`.

**Target Platform**: Power Apps code app in the Power Apps web player, 320 px to 2560+ px.

**Project Type**: Single-project front-end web app (Power Platform code app).

**Performance Goals**: Filter or sort over 5,000 doors in under 50 ms (SC-002 ≤ 1 s);
input latency ≤ 100 ms; tier-dialog impact ≤ 200 ms; Bulk Update preview for 2,500 doors
≤ 1 s; apply 100 doors in well under 3 min (SC-004) at concurrency 4.

**Constraints**: Connector-first (no fetch/axios); tokens-only styling; WCAG 2.1 AA;
prototype fidelity (masked screenshots ≤ 1% diff); the engine core is unchanged; exceljs
is kept out of the initial bundle; E2E never touches a live environment.

**Scale/Scope**: About 3,000 to 5,000 doors (medium band), up to 2,500 re-tier rows and
5,000 SKU rows per update; 2 screens and 1 dialog; 8 new shared components; about 6 new
lib modules.

### Power Platform Code App Context

**Data sources & connectors**: Dataverse tables `cr380_doors`, `cr380_tiers`,
`cr380_skus`, `cr380_tierrules`, `cr380_assortmentexceptions`. These already exist and are
already generated; no `pa app add data-source` is needed.

**Generated services required**: the existing 5 services (getAll, update, create).
`src/generated/` is not edited.

**Connection IDs needed**: none (Dataverse only).

**Target environment**: unchanged; one human-configured environment in `power.config.json`.

**Connector workarounds**: none. Lookups are written through `@odata.bind` with the
entity sets from `.power/schemas` (`cr380_tiers`, `cr380_doors`, `cr380_skus`).

**UI library**: Ant Design v6 (as pinned), themed only from `src/theme/token.ts`.

**Accessibility target**: WCAG 2.1 AA.

**Constraints check**: connector-first ✅, no secrets ✅, Node 22+ ✅, `npm run build`
clean before a human `pa app push` ✅.

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-checked after Phase 1 design._

| #    | Principle                                          | Pre-research | Post-design | Evidence                                                                                                                                                                      |
| ---- | -------------------------------------------------- | ------------ | ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| I    | Code-app scope only                                | ✅           | ✅          | Only `src/`, `e2e/`, config, and docs change; no tables or columns are created                                                                                                |
| II   | Connector-first                                    | ✅           | ✅          | All reads and writes go through `src/generated/services/*` (R7, R8); E2E data stub is a build-time alias (R16)                                                                |
| III  | Generated services are the source of truth         | ✅           | ✅          | Generated models are used for typing; `src/generated/` is untouched                                                                                                           |
| IV   | Human-only deployment                              | ✅           | ✅          | Quickstart step 5 is human-run; no push or data-source commands                                                                                                               |
| V    | Strict TS, build before push                       | ✅           | ✅          | Build, lint and format gates in the quickstart                                                                                                                                |
| VI   | SDD lifecycle                                      | ✅           | ✅          | specify → clarify → plan (this) → tasks → implement                                                                                                                           |
| VII  | Public surface, states, a11y                       | ✅           | ✅          | Loading, error and empty states for the grid, previews, rows and result; keyboard and ARIA contracts in `contracts/ui-*.md`; no secrets                                       |
| VIII | Placeholder hygiene                                | ✅           | ✅          | Doors and Mass update placeholders replaced; Door detail placeholder kept (own spec); no excluded screen linked (Activity and Exports actions dropped)                        |
| IX   | Prototype fidelity                                 | ✅           | ✅          | Layout, copy and anatomy are ported from `vDoors`/`vMass`; deviations are approved in the spec and listed in Complexity Tracking                                              |
| X    | Tokens are the single styling source               | ✅           | ✅          | New components use CSS Modules with `var(--…)` only; `noHardcodedStyles` scan covers new files; workbooks use no colours                                                      |
| XI   | Responsive, Playwright, screenshots                | ✅           | ✅          | 7-viewport matrix for Doors, Bulk Update steps, result and dialog; recaptured masked baselines (R17); deterministic data stub                                                 |
| XII  | Modular architecture                               | ✅           | ✅          | `features/doors`, `features/bulk-update`; shared logic in `lib/` and components in `components/`; no cross-feature internal imports (lib uses only the engine's public index) |
| XIII | Engine pure and isolated; derived, never persisted | ✅           | ✅          | Engine core unchanged; previews are rebuilt from public `createEngine` (R2); no stored Door × SKU results; only `fetchAllPages` moves from adapters to `lib/data`             |
| XIV  | Tests and limitations                              | ✅           | ✅          | 100% coverage plan (quickstart §2); spec Verification section completed at implement                                                                                          |
| XV   | Data gaps flagged                                  | ✅           | ✅          | Spec Data Gaps (Q3, internal territory, tier-change date and reason, roles, batch tracking); SKU Type marked "verify" (R3); null-tier undo risk (R7)                          |

**Gate result**: PASS. The justified items are in Complexity Tracking.

## Project Structure

### Documentation (this feature)

```text
specs/003-doors-screen/
├── plan.md                       # This file
├── research.md                   # Phase 0 decisions R1–R18
├── data-model.md                 # Records, view models, query, workflow state, writes
├── quickstart.md                 # Validation guide
├── contracts/
│   ├── ui-doors.md               # Routes, DOM, dialog, export contract
│   ├── ui-bulk-update.md         # Entry points, 4 steps, result, a11y
│   └── data-and-logic.md         # lib/data, lib/doors, lib/excel, lib/session, bulk-update API
├── checklists/requirements.md
└── tasks.md                      # /speckit-tasks (not created here)
```

### Source Code (repository root)

```text
src/
├── App.tsx                                   # MODIFY: bulk-update page; /doors/mass-update → Navigate redirect
├── lib/
│   ├── screens.ts (+ test)                   # MODIFY: id 'bulk-update', path /doors/bulk-update, title "Bulk Update"; drop Doors/Mass update placeholders
│   ├── clock.ts (+ test)                     # NEW: injectable today()
│   ├── data/                                 # NEW (R1, R2, R7–R9)
│   │   ├── fetchAllPages.ts (+ test)         # MOVED from features/engine/adapters
│   │   ├── records.ts (+ test)               # record loaders + types
│   │   ├── toEngineDataset.ts (+ test)       # incl. equivalence with engine loaders
│   │   ├── buildIndex.ts (+ test)
│   │   ├── preview.ts (+ test)               # withDoorTierOverrides / withDoorExceptions
│   │   ├── mutations.ts (+ test)             # setDoorTier, createDoorException, cancelException, recheck*
│   │   ├── useAssortmentData.ts (+ test)
│   │   └── index.ts
│   ├── async/runPool.ts (+ test)             # NEW
│   ├── doors/                                # NEW (R11, R12) — shared by Doors and Bulk Update
│   │   ├── status.ts · savedFilters.ts · doorRows.ts · filterDoors.ts · sortDoors.ts
│   │   ├── doorQuery.ts · filterOptions.ts · columns.ts   (each + test)
│   │   └── index.ts
│   ├── session/                              # NEW (R6)
│   │   ├── store.ts · doorSelection.ts (+ tests) · index.ts
│   └── excel/                                # NEW (R4, R13)
│       ├── workbook.ts (+ test)              # downloadWorkbook (dynamic import('exceljs'))
│       ├── readTable.ts (+ test) · parseCsv.ts (+ test) · validateUpload.ts (+ test)
│       └── index.ts
├── features/
│   ├── engine/adapters/loaders.ts            # MODIFY: import fetchAllPages from lib/data (tests moved)
│   ├── doors/                                # NEW
│   │   ├── DoorsFilters.tsx · SavedFilters.tsx · DoorsGrid.tsx · TierCell.tsx
│   │   ├── SelectionBar.tsx · TierChangeDialog.tsx · ReasonField.tsx
│   │   ├── useDoorsQuery.ts · useDoorsView.ts · tierImpact.ts · exportDoors.ts
│   │   ├── *.module.css · *.test.ts(x) · index.ts
│   └── bulk-update/                          # NEW
│       ├── bulkReducer.ts · rawRows.ts · checkRows.ts · impact.ts · applyBulk.ts · templates.ts
│       ├── BulkIntro.tsx · BulkSteps.tsx · StepChooseChange.tsx · StepChooseDoors.tsx
│       ├── UploadPanel.tsx · StepCheckRows.tsx · StepReview.tsx · BulkResult.tsx
│       ├── *.module.css · *.test.ts(x) · index.ts
├── components/                               # NEW ChanelUI replicas (each: .tsx · .module.css · .test.tsx · index.ts)
│   ├── DataGrid/ · StatusIndicator/ · KpiTile/ · Field/ · FormGrid/
│   └── WorkflowSection/ · FormActions/ · ConfirmAction/
└── pages/
    ├── DoorsPage/DoorsPage.tsx (+ test)      # REWRITE: compose features/doors
    ├── MassUpdatePage/                       # DELETE (renamed)
    └── BulkUpdatePage/BulkUpdatePage.tsx (+ test) · index.ts   # NEW: compose features/bulk-update

e2e/
├── fixtures/
│   ├── power-apps-data.stub.ts               # NEW: in-memory getClient (R16)
│   ├── dataset.ts                            # NEW: deterministic fixture records
│   └── screens.ts                            # MODIFY: bulk-update route
├── doors/doors.spec.ts · doors/tier-dialog.spec.ts            # NEW
├── bulk-update/bulk-update.spec.ts                            # NEW
├── shell/*.spec.ts                                            # MODIFY: new route/title; matrix incl. new screens
└── visual/  normalize.ts (MODIFY: Bulk Update wording, Q3 chip hide, masks) · app.visual.spec.ts (MODIFY) · __baselines__/ (doors-*, bulk-update-* recaptured; mass-update-* removed)

vite.config.ts        # MODIFY: e2e alias for @microsoft/power-apps/data; vendor-exceljs chunk group
package.json          # MODIFY: + exceljs
.specify/memory/frontend-standards.md   # MODIFY: lib/data, lib/excel (lazy exceljs) conventions
```

**Structure Decision**: Single front-end project following constitution XII. Screen
logic lives in `src/features/doors` and `src/features/bulk-update`. Logic both use (saved
filters, door rows, data access, Excel, session state) lives in `src/lib/`, so neither
feature imports the other's internals. Pages stay thin.

## Implementation Approach (phased)

1. **Foundation**: add `exceljs`; move `fetchAllPages` to `lib/data`; add records,
   `toEngineDataset` (equivalence test), index, `useAssortmentData`, preview, mutations,
   `runPool`, clock, and the session store.
2. **Shared components**: DataGrid, StatusIndicator, KpiTile, Field, FormGrid,
   WorkflowSection, FormActions, ConfirmAction (tokens only, unit tests, axe).
3. **Doors (US1, US2, P1)**: `lib/doors` (status, saved filters, rows, filter, sort,
   query, options, columns) → filters, saved filters, grid, selection bar → export via
   `lib/excel`.
4. **Inline tier change (US3)**: TierCell, TierChangeDialog, ReasonField, tierImpact
   (preview engine).
5. **Bulk Update (US4, US5)**: reducer, raw rows, check rules, templates, upload, impact,
   apply/recheck/pool, undo, the 4 step components and the result; routes and redirect
   (US6).
6. **E2E and visual**: data stub and fixtures, Doors / tier / Bulk Update suites, shell
   suite updates, baseline recapture (human) and comparison.
7. **Close-out**: build, lint, format, 100% coverage, E2E and visual green; fill the
   spec's Verification & Known Limitations; update `frontend-standards.md`; propose the
   constitution wording update (`mass-update` → `bulk-update`).

## Complexity Tracking

| Item                                                                                                                                                                                                                                                          | Why Needed                                                                                                            | Simpler Alternative Rejected Because                                                                                                                  |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| New runtime dependency `exceljs` (MIT, about 1 MB min)                                                                                                                                                                                                        | The user requires exceljs for the .xlsx export; templates with dropdowns and xlsx upload need a full workbook library | CSV-only export does not meet the request; the dependency is lazy-loaded so the initial bundle is unchanged                                           |
| `src/lib/data` imports the engine's **public** index (`createEngine`, types)                                                                                                                                                                                  | One load serves both the grid and the engine (R1)                                                                     | A second engine-only load doubles Dataverse calls and risks the two copies disagreeing; widening engine adapters leaks UI concerns into the engine    |
| Feature folder `bulk-update` instead of the constitution's `mass-update`                                                                                                                                                                                      | The user renamed the screen to "Bulk Update"                                                                          | Keeping the old name would create a code/UI terminology split; a constitution wording update is proposed at close-out                                 |
| Prototype deviations: no "Q3 cluster review" or "Not tiered (internal)"; no role locks; no Activity/Exports actions; no sample file; KPI "SKU changes across doors"; Bulk Update progress has 2 steps (no SAP export step); "Last changed on" is record-level | Data limitations and excluded screens (spec Overview table, Data Gaps)                                                | Showing them would require invented data (constitution XV) or excluded screens (VIII)                                                                 |
| Undo to "no tier" writes a null lookup on a schema-`required` column                                                                                                                                                                                          | Restoring the prior state of "Needs tier" doors (FR-047)                                                              | Skipping undo for those doors silently breaks FR-047; instead the attempt is made and any rejection is reported (FR-048) and recorded as a limitation |

**Follow-up (proposed constitution amendment, not applied):** rename `mass-update` to
`bulk-update` in Principle XII's feature list and "Mass update" to "Bulk Update" in the
in-scope screens, to match the renamed screen. Requires the constitution's amendment process.
