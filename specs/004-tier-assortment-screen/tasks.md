# Tasks: Tier Assortments Screen

**Input**: Design documents from `specs/004-tier-assortment-screen/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/ui-tier-assortments.md, quickstart.md

**Tests**: Deliberately light (user request, plan R8): unit tests for `src/lib/tiers/**` and
new mutations only, plus one Playwright smoke + axe spec. UI files are excluded from coverage.

**Reference**: Port layout, copy and behaviour from `docs/Assortment-Tool-Prototype.html`
— markup lines ~1769–1985 (`is.assortment`) and logic `vAssortment`, `stageRule`,
`stageMany`, `stagedImpact`, `saveRules`, `openTierForm`, `tierRetireImpact`, `vTierForm`,
`saveTierForm`, `skuDrawer` (lines ~3791–4085). Drop role locks, "Last changes", Activity/SAP
wording; replace "Mass update" with "Bulk Update".

## Format: `[ID] [P?] [Story] Description`

## Phase 1: Setup

- [x] T001 Exclude `src/features/tier-assortments/**` and `src/pages/TierAssortmentsPage/**` from coverage thresholds in `vitest.config.ts` (add a comment citing plan Complexity Tracking / XIV deviation)
- [x] T002 [P] Create folders and barrel files `src/lib/tiers/index.ts` and `src/features/tier-assortments/index.ts`

---

## Phase 2: Foundational (blocks all stories)

- [x] T003 Extend `TierRecord` with `description` and `SkuRecord` with `barcode, masterProductName, masterProductBaseline, masterFranchise, masterCategory, category, subcategory, lastSeenInSunrise` (add columns to `RECORD_SOURCES` selects and row mappers) in `src/lib/data/records.ts`; update affected expectations in `src/lib/data/records.test.ts`
- [x] T004 Add `enableTierRule(tierId, skuId)` (query `Cr380_tierrulesService.getAll` for an existing rule for the pair incl. disabled → update `cr380_isenabled=true`, else create with `@odata.bind` to `cr380_tiers`/`cr380_skus`), `disableTierRule(ruleId)`, `createTier({name, description, rank})` (status `TIER_STATUS_ACTIVE`), `updateTier(id, {name?, description?, rank?, active?})` (inactive = `860080001`) returning `WriteResult` in `src/lib/data/mutations.ts`; add tests to `src/lib/data/mutations.test.ts` (mock generated services as existing tests do); export from `src/lib/data/index.ts`
- [x] T005 [P] Implement `buildMembership(rules)`, `isNewSku(sku, membership, addExceptionSkuIds)`, `tierDoorCounts(doors)` (active, tiered doors per tier, split by product line and online/offline), `tierSkuCounts(membership, skus)` in `src/lib/tiers/membership.ts` + `membership.test.ts`
- [x] T006 [P] Implement staging helpers `stageOne`, `stageMany` (returns `{ staged, changed }`), `effectiveIn`, `stagedCountForTier`, `stagedTierCount` keyed `"skuId|tierId"` in `src/lib/tiers/staging.ts` + `staging.test.ts`
- [x] T007 [P] Implement `eligibleTierDoors(counts, tierId, sku)` (axis = door product line; Multi-axis = all) and `stagedImpact(staged, ctx)` → `{ changes, tiers, doorDelta }` in `src/lib/tiers/impact.ts` + `impact.test.ts`
- [x] T008 [P] Implement `filterSkus(skus, {search, axis, types, focus}, ctx)`, `showCounts`, `applyShow`, and `buildGroups(skus, tierId, ctx)` (group key `axis|franchise`, sort axis then name; sub-label with retail/SPM split; coverage/pct; checked/indeterminate/disabled; add-vs-remove; staged/new counts; rows sorted type then name with `alsoIn` and flags) in `src/lib/tiers/groups.ts` + `groups.test.ts`
- [x] T009 Create the screen state hook `useTierAssortments()` (wraps `useAssortmentData`, derives membership/counts/summaries memoised by data version; reducer for `tierId` (synced to `?tier=`), search, axis, types, show, focus, open map, staged, dialog/drawer state; selection falls back to first active tier) in `src/features/tier-assortments/useTierAssortments.ts`

**Checkpoint**: data + pure logic ready.

---

## Phase 3: User Story 1 - Review a tier's assortment (P1) 🎯 MVP

**Goal**: Rail + panel + grouped SKU list exactly as prototype.
**Independent Test**: Select each tier; group coverage and SKU membership match stored rules; filters/switch/empty text behave per spec US1.

- [x] T010 [P] [US1] Create `src/features/tier-assortments/TierAssortments.module.css` with layout grid (`232px minmax(0,1fr)`, single column < 1100px), rail, panel, sticky ink list header, shared 5-column row grid, group/sku row padding, coverage bar, sticky staging bar — tokens only (`var(--…)`)
- [x] T011 [P] [US1] Build `TierRail.tsx` (`<nav aria-label="Cluster tiers">`, "Tiers · N", buttons with name/rank "01"/"N doors · N SKUs"/"● N unsaved changes", `aria-current="page"`, "Manage tiers" text button with `SettingOutlined`) in `src/features/tier-assortments/TierRail.tsx`
- [x] T012 [P] [US1] Build `GroupList.tsx` (sticky header "Product group / In <Tier> / Flags / SKUs", group rows with labelled Checkbox, name/sub, coverage text + bar, `StatusIndicator` flags, "Show N"/"Hide" link with `aria-expanded`; expanded SKU rows with labelled Checkbox, underlined SKU button, sub, "Also in …"/"Only here", flags, Adding/Removing indicator; empty text per show mode) in `src/features/tier-assortments/GroupList.tsx`
- [x] T013 [US1] Build `TierPanel.tsx` (h2 `id="as-tier-title"`, summary line, Edit tier button with `EditOutlined`, filter row: search 210px, Axis Select 130px, SKU type multi-select 170px, Segmented with counts `aria-label="Which SKUs to show"`; Expand/Collapse all link; footnote text) in `src/features/tier-assortments/TierPanel.tsx`
- [x] T014 [US1] Rewrite `src/pages/TierAssortmentsPage/TierAssortmentsPage.tsx` to compose `PageHeader` (eyebrow "Strategy", title "Tier assortments", prototype description) + `RegionState` loading/error/empty ("Add a tier" when no tiers) + rail + panel; delete placeholder test `src/pages/TierAssortmentsPage/TierAssortmentsPage.test.tsx`; drop the `placeholder` entry for `tier-assortments` in `src/lib/screens.ts` (fix `src/lib/screens.test.ts` if it asserts it)
- [x] T015 [US1] Update `e2e/shell/structure.spec.ts` placeholder exclusion list to include `'tier-assortments'`

---

## Phase 4: User Story 2 - Stage and save SKU changes (P1)

**Goal**: Toggle SKUs/groups → staging bar → Save dialog with reason → persisted.
**Independent Test**: Stage adds/removes across two tiers, save, counts update; Discard restores.

- [x] T016 [US2] Wire row and group checkbox handlers to `stageOne`/`stageMany` with prototype toasts ("N <Group> SKUs staged to join|leave <Tier>. Review and save below." / "Nothing to change in <Group>.") via Ant `message` in `src/features/tier-assortments/useTierAssortments.ts` and `GroupList.tsx`
- [x] T017 [P] [US2] Build `StagingBar.tsx` (sticky bottom, ink border, shadow; "N unsaved changes across N tiers · ±N door assortments when saved"; Discard, primary "Review and save") in `src/features/tier-assortments/StagingBar.tsx`
- [x] T018 [P] [US2] Build `SaveDialog.tsx` (Modal 560, title "Save N tier changes", intro "These changes update N door assortments right away.", `DataGrid` SKU/Tier/Change(StatusIndicator Add|Remove)/Doors max-height 240, `ReasonField` label "Why is this change being made?" required max 280 placeholder "For example: Sublimage La Crème Fine launch"; ok "Save changes" disabled until reason, cancel "Keep editing") in `src/features/tier-assortments/SaveDialog.tsx`
- [x] T019 [US2] Implement `saveStaged(staged, membership, ruleIndex)` using `runPool` (concurrency 4) with `enableTierRule`/`disableTierRule`, skipping no-ops; return successes/failures; on finish invalidate data (`useInvalidateAssortmentData`), clear succeeded keys only, toast "N changes saved · ±N door assortments, shown everywhere straight away." or an error listing failures, in `src/features/tier-assortments/saveStaged.ts`; wire into page

---

## Phase 5: User Story 3 - Needs attention (P2)

**Goal**: Chip filters to new SKUs in no tier.
**Independent Test**: With an unassorted SKU, chip appears, filters, focus tag clears.

- [x] T020 [US3] Build `AttentionRow` (implemented inside `TierPanel.tsx`) ("Needs attention" label, chip button `aria-pressed` with `StatusIndicator` info "N new SKUs from Sunrise in no tier yet", closable Tag "Showing: New SKUs in no tier yet"; pressing sets focus, resets show to all and open map) and place it with the Expand/Collapse link in `src/features/tier-assortments/AttentionRow.tsx`; integrate in `TierPanel.tsx`

---

## Phase 6: User Story 4 - Inspect a SKU (P2)

**Goal**: SKU drawer.
**Independent Test**: Open a SKU; attributes, reach, exceptions shown.

- [x] T021 [US4] Build `SkuDrawer.tsx` (Drawer 560 titled SKU name; bordered 1-column `Descriptions` with SKU key, name, barcode, master product name, baseline, axis with "· every door" for Multi-axis else "· doors with product line <axis>", master franchise, franchise, line, master category, category, subcategory, SKU type, tier rules or warning "Not yet assorted", last seen in Sunrise; "Where it's distributed" `DataGrid` per active tier Brick & Mortar/E-business counts from engine assortments; "Exceptions" `DataGrid` Applies to / Action / Reason, empty "No exceptions for this SKU.") in `src/features/tier-assortments/SkuDrawer.tsx`; open from SKU name buttons

---

## Phase 7: User Story 5 - Manage tiers (P3)

**Goal**: Add / edit / retire tiers.
**Independent Test**: Add (copy), edit name/position, retire with door move; rail/counts/doors update.

- [x] T022 [P] [US5] Implement `validateTierForm(form, tiers)` (name 1–30, unique case-insensitive, reason required, mode rules incl. edit-has-changes, retire needs moveTo when doors, ≥2 tiers), `tierFormImpact(form, ctx)` (prototype "What happens" lines minus Activity/SAP; "Bulk Update → Re-tier doors"), `retireImpact(tier, moveTo, ctx)` (avg SKU delta per door via base assortments), `rewriteRanks(tiers, tierId|null, after)` → `{id, rank}[]` in `src/lib/tiers/tierForm.ts` + `tierForm.test.ts`
- [x] T023 [P] [US5] Build `ManageTiersDrawer.tsx` (Drawer 560 "Manage tiers", intro text, `DataGrid` Rank/Tier/Doors/SKUs/actions Edit · Retire (Retire hidden when 1 tier), footer Close + primary "Add a tier") in `src/features/tier-assortments/ManageTiersDrawer.tsx`
- [x] T024 [US5] Build `TierFormDialog.tsx` (Modal 560; titles "Add a cluster tier"/"Edit <name>"/"Retire <name>"; ok "Add tier"/"Save tier"/"Retire tier" (danger); define fields: Tier name (help "Shown on doors, filters, exports and the SAP file." → drop SAP wording), Description, Position Select ("First (entry level)"/"After <tier>"), Start (copy from tier / empty) for add; retire: intro + "Move its doors to" Select; "What happens" box; `ReasonField`) in `src/features/tier-assortments/TierFormDialog.tsx`
- [x] T025 [US5] Implement `saveTierForm(form, ctx)` (add: `createTier` + `rewriteRanks` updates + copy rules via `enableTierRule`; edit: `updateTier` + rank updates; retire: `setDoorTier` per door via `runPool`, `disableTierRule` per rule, `updateTier(active:false)`, drop staged keys for that tier), then invalidate, select tier, toast with prototype wording, in `src/features/tier-assortments/saveTierForm.ts`; wire Edit tier (panel), Manage tiers (rail)

---

## Phase 8: User Story 6 - Export (P3)

- [x] T026 [P] [US6] Implement `exportRows(skus, tiers, membership)` (header SKU key, SKU name, Franchise, Line, Axis, SKU type, …tier names; "Yes"/"") in `src/lib/tiers/exportRows.ts` + `exportRows.test.ts`
- [x] T027 [US6] Add Export header action (`DownloadOutlined`, same pattern as `src/features/doors/ExportButton.tsx`) using `lib/excel` `downloadWorkbook` → `Tier_assortments_<YYYY-MM-DD>.xlsx`, toast "Tier assortments exported · N SKUs × N tiers", in `src/features/tier-assortments/ExportTiersButton.tsx`

---

## Phase 9: Polish & Cross-Cutting

- [x] T028 (tier descriptions + extra SKU columns added; no unassorted SKU added to avoid changing Doors/Bulk Update expectations) Ensure `e2e/fixtures/dataset.ts` has tier descriptions, ≥2 tiers, and ≥1 active SKU with no rule; make the data stub support tier-rule/tier create/update if not already
- [x] T029 Add `e2e/tier-assortments/tier-assortments.spec.ts`: load, switch tier, expand a group, toggle a SKU → staging bar, save with reason → bar gone and count updated; axe 0 violations on screen and Save dialog
- [x] T030 Run `npm run build`, `npm run lint`, `npm run format:check`, `npm test -- --coverage`, `npx playwright test e2e/tier-assortments e2e/shell`; fix failures
- [x] T031 Add "Verification & Known Limitations" section to `specs/004-tier-assortment-screen/spec.md` (test results, untested items, data gaps, coverage/visual deviations)

---

## Dependencies & Execution Order

- Setup (T001–T002) → Foundational (T003–T009) → stories.
- US1 (T010–T015) is required by all other stories (they render inside its panel).
- US2 depends on US1. US3, US4, US6 depend only on US1 and can run in parallel. US5 depends on US1 (and reuses `saveStaged` patterns from US2).
- Polish after desired stories.

### Parallel Opportunities

- T005, T006, T007, T008 (separate pure modules).
- T010, T011, T012 (separate files).
- T017, T018; T022, T023; T026 alongside other stories.

## Parallel Example: User Story 1

```text
T010 TierAssortments.module.css
T011 TierRail.tsx
T012 GroupList.tsx
```

## Implementation Strategy

- **MVP**: Phases 1–3 (view-only screen) + Phase 4 (save) — the core value.
- Then US3 → US4 → US5 → US6, verifying each against the prototype.
- Keep tests limited to the listed pure-logic tests and the single E2E spec.

## Notes

- [P] = different files, no incomplete dependencies.
- No `src/generated/**` edits; all I/O via generated services.
