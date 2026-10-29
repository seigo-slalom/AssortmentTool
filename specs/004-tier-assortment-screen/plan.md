# Implementation Plan: Tier Assortments Screen

**Branch**: `004-tier-assortment-screen` | **Date**: 2026-10-28 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/004-tier-assortment-screen/spec.md`

## Summary

Replace the Tier assortments placeholder with the prototype's `vAssortment` screen: tier
rail, per-tier product-group list with staged SKU add/remove, staging bar and Save dialog,
"Needs attention" focus, SKU drawer, Manage tiers (add/edit/retire), and Excel export. Reads
reuse the shared `lib/data` cache (extended tier/SKU columns); writes add tier-rule and tier
mutations to `lib/data/mutations.ts`, orchestrated with `runPool` and cache invalidation.
Pure logic lives in a new `src/lib/tiers/` (unit tested); UI in
`src/features/tier-assortments/`. Testing is intentionally light per the user (R8).

## Technical Context

**Language/Version**: TypeScript ~6.0 (strict), React 19.3, Node 22+

**Primary Dependencies**: Ant Design 6.6 + icons, React Router 7 (HashRouter), TanStack
Query 5, `@microsoft/power-apps` generated services, exceljs (existing, lazy). No new deps.

**Storage**: Dataverse via generated services: read 5 tables; write `cr380_tierrules`
(create, enable/disable), `cr380_tiers` (create, update), `cr380_doors` (tier, retire only).
Staging and reasons are in memory only.

**Testing**: Vitest for `src/lib/tiers/**` and new mutations only; one Playwright spec
(+ axe) with the existing in-memory data stub; existing shell viewport matrix.

**Target Platform**: Power Apps web player, 320–2560 px.

**Project Type**: Single-project front-end (Power Platform code app).

**Performance Goals**: Tier switch / filter < 1 s for full catalogue (target < 100 ms);
group toggle and staging instant.

**Constraints**: Connector-first; tokens-only styling; WCAG 2.1 AA; prototype fidelity;
engine core unchanged.

**Scale/Scope**: ~5–15 tiers, a few thousand SKUs, 3–5k doors; 1 screen, 3 dialogs/drawers.

### Power Platform Code App Context

**Data sources & connectors**: existing Dataverse tables only; no `pa app add data-source`.
**Generated services required**: `Cr380_tiersService` (getAll, create, update),
`Cr380_tierrulesService` (getAll, create, update), `Cr380_doorsService` (update),
`Cr380_skusService`/`Cr380_assortmentexceptionsService` (getAll). `src/generated/` untouched.
**Connection IDs**: none. **Target environment**: unchanged. **Connector workarounds**: none
(`@odata.bind` to `cr380_tiers`/`cr380_skus`). **UI library**: Ant Design v6 themed from
`src/theme/token.ts`. **Accessibility**: WCAG 2.1 AA.

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-checked after Phase 1 design._

| #    | Principle                    | Pre | Post | Evidence                                                                                    |
| ---- | ---------------------------- | --- | ---- | ------------------------------------------------------------------------------------------- |
| I    | Code-app scope only          | ✅  | ✅   | Only `src/`, `e2e/`, config, docs change; no tables/columns created                         |
| II   | Connector-first              | ✅  | ✅   | All I/O through generated services (R2, R3)                                                 |
| III  | Generated services = truth   | ✅  | ✅   | Generated models for typing; `src/generated/` untouched                                     |
| IV   | Human-only deployment        | ✅  | ✅   | Quickstart §5 human-run                                                                     |
| V    | Strict TS, build before push | ✅  | ✅   | Quickstart §2                                                                               |
| VI   | SDD lifecycle                | ✅  | ✅   | specify → plan → tasks → implement                                                          |
| VII  | Public surface, states, a11y | ✅  | ✅   | Loading/error/empty via `RegionState`; ARIA in contract; axe in E2E                         |
| VIII | Placeholder hygiene          | ✅  | ✅   | Placeholder replaced; no links to excluded screens                                          |
| IX   | Prototype fidelity           | ✅  | ✅   | Contract mirrors `vAssortment` anatomy/copy; deviations listed in spec                      |
| X    | Tokens only                  | ✅  | ✅   | CSS Modules with `var(--…)`                                                                 |
| XI   | Responsive, Playwright       | ⚠️  | ⚠️   | Shell viewport matrix + 1 E2E spec; no new screenshot baselines — see Complexity Tracking   |
| XII  | Modular architecture         | ✅  | ✅   | `lib/tiers` (pure), `features/tier-assortments`, thin page                                  |
| XIII | Engine pure; derived only    | ✅  | ✅   | Engine untouched; assortments derived; only rules/tiers persisted                           |
| XIV  | 100% unit coverage           | ⚠️  | ⚠️   | 100% on `lib/tiers` + new mutations; UI excluded per user request — see Complexity Tracking |
| XV   | Data gaps flagged            | ✅  | ✅   | Spec Data Gaps (history, reasons, roles)                                                    |

**Gate result**: PASS with justified deviations (Complexity Tracking).

## Project Structure

### Documentation (this feature)

```text
specs/004-tier-assortment-screen/
├── plan.md · research.md · data-model.md · quickstart.md
├── contracts/ui-tier-assortments.md
├── checklists/requirements.md
└── tasks.md            # /speckit-tasks
```

### Source Code (repository root)

```text
src/
├── lib/
│   ├── data/records.ts            # MODIFY: tier description; extra SKU columns
│   ├── data/mutations.ts (+test)  # MODIFY: enableTierRule, disableTierRule, createTier, updateTier
│   └── tiers/                     # NEW (pure, unit tested)
│       ├── membership.ts · groups.ts · staging.ts · impact.ts
│       ├── tierForm.ts · ranks.ts · exportRows.ts · index.ts
│       └── *.test.ts
├── features/tier-assortments/     # NEW (coverage-excluded UI)
│   ├── TierRail.tsx · TierPanel.tsx · GroupList.tsx · AttentionRow.tsx
│   ├── StagingBar.tsx · SaveDialog.tsx · ManageTiersDrawer.tsx · TierFormDialog.tsx
│   ├── SkuDrawer.tsx · ExportTiersButton.tsx
│   ├── useTierAssortments.ts · saveStaged.ts · saveTierForm.ts
│   ├── TierAssortments.module.css · index.ts
└── pages/TierAssortmentsPage/TierAssortmentsPage.tsx   # REWRITE: compose feature

e2e/tier-assortments/tier-assortments.spec.ts            # NEW smoke + axe
e2e/fixtures/dataset.ts                                  # MODIFY if needed: tier descriptions, an unassorted SKU
vitest.config.ts                                         # MODIFY: exclude features/tier-assortments/** and pages/TierAssortmentsPage/**
```

**Structure Decision**: Single front-end project per constitution XII; pure logic in
`lib/tiers`, screen in `features/tier-assortments`, page stays thin.

## Implementation Approach (phased)

1. **Foundation**: extend records; add mutations; `lib/tiers` pure modules + tests.
2. **US1 view**: page, rail, panel, filters, group list, SKU rows, empty/loading states.
3. **US2 staging/save**: reducer, group/row toggles, staging bar, Save dialog, `saveStaged`.
4. **US3 attention**: chip, focus tag, new flags.
5. **US4 SKU drawer**.
6. **US5 Manage tiers**: drawer, Add/Edit/Retire dialog, `saveTierForm`.
7. **US6 export**.
8. **Close-out**: vitest exclude, E2E smoke + axe, build/lint/format; fill spec
   Verification & Known Limitations.

## Complexity Tracking

| Item                                                                                            | Why Needed                                                  | Simpler Alternative Rejected Because                                        |
| ----------------------------------------------------------------------------------------------- | ----------------------------------------------------------- | --------------------------------------------------------------------------- |
| XIV deviation: UI under `features/tier-assortments/**` and the page excluded from 100% coverage | Explicit user request to limit unit testing (prototype app) | Full component coverage contradicts the user's instruction and token budget |
| XI deviation: no new screenshot baselines; one E2E spec + existing viewport matrix              | Same user request; baselines need human recapture           | Full visual suite is disproportionate for a prototype iteration             |
| Re-enable-or-create for tier rules (extra read before write)                                    | Avoid duplicate rules (engine reads enabled rules only)     | Always-create would accumulate duplicates on re-add                         |
