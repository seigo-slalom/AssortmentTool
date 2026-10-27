---
description: 'Task list for 003-doors-screen'
---

# Tasks: Doors Screen & Bulk Update

**Input**: Design documents from `specs/003-doors-screen/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md),
[data-model.md](./data-model.md), [contracts/ui-doors.md](./contracts/ui-doors.md),
[contracts/ui-bulk-update.md](./contracts/ui-bulk-update.md),
[contracts/data-and-logic.md](./contracts/data-and-logic.md), [quickstart.md](./quickstart.md)

**Tests**: REQUIRED. Constitution XIV requires Vitest at 100% coverage. Constitution XI
requires Playwright viewport-matrix and screenshot tests with deterministic fixtures.
Write each test before or alongside its implementation; a test listed before its
implementation should fail first.

**Organization**: Tasks are grouped by user story (spec.md US1–US6) so each story can be
built and verified on its own.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependency on an incomplete task)
- **[Story]**: User story from spec.md (US1–US6)

## Global rules for every task (from constitution + plan)

- **Data access**: only through `src/generated/services/*` (never `fetch`/`axios`). Never
  edit `src/generated/`. Lookups are read from `_x_value` and written with `@odata.bind`
  (`/cr380_tiers(id)`, `/cr380_doors(id)`, `/cr380_skus(id)`). Choice values are integers
  (research R7).
- **Styling**: there are no literal style values outside `src/theme/token.ts`. CSS
  Modules use only `var(--…)`, `0`, keywords, `%`, `fr` and `calc()` over variables. Do
  not pass numeric `gap`/`size`/`width`/`height` props. The existing
  `src/theme/noHardcodedStyles.test.ts` and ESLint rules MUST stay green.
- **Structure**: one exported component per file. Shared components go in
  `src/components/<Name>/` (with `.tsx`, `.module.css`, `.test.tsx` and `index.ts`).
  Feature code goes in `src/features/doors/` and `src/features/bulk-update/`, and
  features MUST NOT import each other. Shared logic goes in `src/lib/`. Pages stay thin.
- **Engine**: do not modify `src/features/engine/core/**`. Use only the public
  `src/features/engine/index.ts` exports. Never persist Door × SKU results.
- **Copy**: follow the prototype (`docs/Assortment-Tool-Prototype.html`, functions
  `vDoors`, `vTierModal`, `vMass`, `muRows`, `muImpact`) as adapted by spec.md (no Q3
  cluster review, no "Not tiered (internal)", no Activity/Exports actions, no sample
  file, no role locks, and "Bulk Update" instead of "Mass update"). Never render
  prototype sample data.
- **Today**: always comes from `src/lib/clock.ts` and never `new Date()` directly in
  logic.
- **Forbidden commands**: never run `pa app push`, `pa app add data-source`, or any
  deploy skill.
- **Allowed commands**: verification commands (`npm run build|lint|test|test:coverage|
test:e2e|format:check`) are allowed because these tasks change `src/**`, `e2e/**` and
  config.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Add the dependency, configure the build, and provide a deterministic data
stub so every later phase can be built and tested without a live environment.

- [x] T001 Add the runtime dependency with `npm install exceljs@4.4.0` (updates package.json and package-lock.json); verify `npm ls exceljs` shows 4.4.0 (MIT)
- [x] T002 Modify vite.config.ts: (a) add a code-splitting group `{ name: 'vendor-exceljs', test: /[\\/]node_modules[\\/]exceljs[\\/]/ }` to `build.rolldownOptions.output.codeSplitting.groups`; (b) in the `mode === 'e2e'` alias map add `'@microsoft/power-apps/data': fileURLToPath(new URL('./e2e/fixtures/power-apps-data.stub.ts', import.meta.url))` alongside the existing `@microsoft/power-apps/app` alias (research R4, R16)
- [x] T003 [P] Create e2e/fixtures/dataset.ts exporting deterministic raw Dataverse-shaped rows (same property names as the generated models, incl. `_cr380_tierid_value`, `modifiedbyname`, `cr380_tierstatus`, `cr380_skutype`):
  - **Tiers**: 4 tiers with ids `T-1`…`T-4`, names Access, Premium, Expertise, Prestige, and ranks 1–4. All are active (`cr380_tierstatus` 860080000).
  - **SKUs**: 60 SKUs with 6-digit `cr380_skukey` values `100001`…`100060`. Axes are Fragrance, Makeup and Skincare. Franchises are N°5, Coco and Sublimage, and lines are L1–L3. Both `cr380_skutype` values are used.
  - **Tier rules**: about 120 rules spread over the tiers.
  - **Doors**: 120 doors with ids `D-001`…`D-120` and keys `US1001`…`US1120`. Use 6 distributor names. Each door has a single product line of `Fragrance`, `Makeup` or `Skincare`, written exactly like the SKU axis text because the engine requires an exact match. At least 15 doors are `Fragrance`. Statuses are Open, Pre-Trade, Project (MTP), Closed and Cancelled, with at least 8 of the closed statuses. At least 10 doors have no tier. At least 6 doors have an opening date within 90 days of `FIXTURE_TODAY`, plus one exactly at today−90 and one at today−91.
  - **Exceptions**: about 30 exceptions at door and retailer level, Add and Remove, with some Cancelled.
  - Export `FIXTURE_TODAY = '2026-09-23'` and an `EXPECTED` object holding the precomputed counts the E2E tests assert: open doors, needs-tier, fragrance-only, recent, closed, and per-distributor counts.
- [x] T004 Create e2e/fixtures/power-apps-data.stub.ts exporting `getClient()` with the same shape the generated services use (`retrieveMultipleRecordsAsync`, `retrieveRecordAsync`, `createRecordAsync`, `updateRecordAsync`, `deleteRecordAsync`, `executeAsync`), backed by an in-memory deep copy of e2e/fixtures/dataset.ts keyed by data source name (`cr380_doors`, `cr380_tiers`, `cr380_skus`, `cr380_tierrules`, `cr380_assortmentexceptions`):
  - **Reads**: support `select`, `top`, `skipToken`, and `filter` expressions made of `eq` / `ne null` / `and` / `or` / parentheses over string, number, boolean and GUID literals. This is exactly what src/lib/data uses.
  - **Writes**: `@odata.bind` values `/entityset(id)` set the matching `_x_value`. `null` clears it. A create assigns a new id `NEW-<n>` and fills `modifiedon` and `modifiedbyname`.
  - **Flags** read from `new URLSearchParams(location.search).get('data')`:
    - `error`: every read rejects `{ success: false, error: { message: 'Stubbed data failure' } }`.
    - `slow`: reads are delayed by 1500 ms.
    - `empty`: doors are returned empty.
    - `writefail`: every update and create returns `success: false`.
    - `throttle`: every 3rd write returns `success: false` with message `'429 Too Many Requests'`.
  - Also export `getClock()` returning `FIXTURE_TODAY` for the clock alias in T005.
- [x] T005 [P] Create src/lib/clock.ts exporting `today(): Date` (local midnight) and `setClockForTests(fn: () => Date): void` / `resetClock()`; in `vite --mode e2e` the app must use `FIXTURE_TODAY` — implement by reading `import.meta.env.MODE === 'e2e'` and a `?today=YYYY-MM-DD` query param fallback (default `2026-09-23` in e2e); add src/lib/clock.test.ts covering default, override, reset, and e2e branch (stub `import.meta.env`)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared data layer, shared logic, shared components, and the renamed route that
every story depends on.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

### Shared data layer (`src/lib/data/`, research R1, R2, R7–R9)

- [x] T006 Move src/features/engine/adapters/fetchAllPages.ts and its test to src/lib/data/fetchAllPages.ts and src/lib/data/fetchAllPages.test.ts (git mv), update the import in src/features/engine/adapters/loaders.ts to `../../../lib/data/fetchAllPages`, and run `npm test -- src/features/engine src/lib/data` to confirm engine tests still pass unchanged
- [x] T007 [P] Write src/lib/data/records.test.ts (mock the 5 generated services with `vi.mock`) asserting each loader's `select`/`filter` strings and row mapping per data-model.md §1 (`null` → `undefined`; `cr380_skutype` 860080000→'retail', 860080001→'spm', other→undefined; tier `active` from `cr380_tierstatus === 860080000`; exception level/action choice maps; door fields incl. `modifiedOn`, `modifiedByName`, `openingDate`, `status`), and that `loadAssortmentRecords()` rejects if any table fails
- [x] T008 Implement src/lib/data/records.ts: types `DoorRecord`, `TierRecord`, `SkuRecord`, `TierRuleRecord`, `ExceptionRecord`, `AssortmentRecords` and loaders `loadDoorRecords/loadTierRecords/loadSkuRecords/loadTierRuleRecords/loadExceptionRecords/loadAssortmentRecords` via `fetchAllPages` and the generated services; filters: doors/tiers `statecode eq 0`; SKUs `statecode eq 0 and cr380_isactive eq true`; tier rules `statecode eq 0 and cr380_isenabled eq true`; exceptions `statecode eq 0 and cr380_exceptionstatus eq 860080000`; export named choice constants `EXCEPTION_LEVEL_DOOR=860080000`, `EXCEPTION_ACTION_ADD=860080000`, `EXCEPTION_ACTION_REMOVE=860080001`, `EXCEPTION_STATUS_ACTIVE=860080000`, `EXCEPTION_STATUS_CANCELLED=860080001`, `SKU_TYPE_RETAIL=860080000`, `SKU_TYPE_SPM=860080001`, `TIER_STATUS_ACTIVE=860080000`
- [x] T009 [P] Write src/lib/data/toEngineDataset.test.ts: (a) unit mapping; (b) **equivalence**: feed the same mocked service rows to engine `loadEngineDataset()` and to `toEngineDataset(await loadAssortmentRecords())` and assert deep-equal `EngineDataset` (sorted by id)
- [x] T010 Implement src/lib/data/toEngineDataset.ts mapping `AssortmentRecords` → `EngineDataset` (doors: id, tierId, productLine, distributorNameCode; tiers: id; skus: id, axis, active true; tier rules: id, tierId, skuId, enabled true; exceptions: id, level, action, skuId, doorId, distributorNameCode, active true) importing types only from `src/features/engine` (public index)
- [x] T011 [P] Write src/lib/data/buildIndex.test.ts and implement src/lib/data/buildIndex.ts returning `AssortmentIndex` { doorById, doorByKey (key trimmed+upper-cased), tierById, tierByName (lower-cased, active only), activeTiers (sorted rank then name), skuById, skuByKey (trimmed), doorExceptions: Map<doorId, ExceptionRecord[]> (door-level only) }
- [x] T012 [P] Write src/lib/data/preview.test.ts and implement src/lib/data/preview.ts: `withDoorTierOverrides(ds, Map<doorId, tierId|undefined>)` returns a new dataset with only those doors' `tierId` replaced (original untouched) and `withDoorExceptions(ds, extra: EngineException[])` appends; test asserts `createEngine(withDoorTierOverrides(...)).getDoorAssortment(id)` equals an engine built from a dataset where the door was edited directly
- [x] T013 Write src/lib/data/useAssortmentData.test.tsx (QueryClientProvider wrapper; mocked `loadAssortmentRecords`) and implement src/lib/data/useAssortmentData.ts: `useQuery({ queryKey: ['assortment-data'], queryFn })` whose `select`/memo yields `AssortmentData { version, records, dataset, engine: createEngine(dataset), index }` (engine built once per data version via `useMemo` keyed on `dataUpdatedAt`), plus `useInvalidateAssortmentData()` calling `queryClient.invalidateQueries({ queryKey: ['assortment-data'] })`; tests cover loading, error, success, and invalidation refetch
- [x] T014 [P] Write src/lib/data/mutations.test.ts (mock services) and implement src/lib/data/mutations.ts per contracts/data-and-logic.md: `bindTo(set, id)`; `setDoorTier(doorId, tierId|null)` → `Cr380_doorsService.update(doorId, { 'cr380_TierID@odata.bind': tierId ? '/cr380_tiers(id)' : null })`; `createDoorException({ doorId, doorKey, skuId, skuKey, action, reason, today })` → create with Door level, action choice, Active status, `cr380_reason`, `cr380_exceptionname = '<doorKey> · <skuKey> · Add|Remove'`, `cr380_datereported` ISO date, door & SKU binds, returning `{ ok:true, value:{ id } }`; `cancelException(id)` → update `{ cr380_exceptionstatus: 860080001 }`; `recheckDoors(ids)` and `recheckDoorExceptions(doorIds)` using `getAll` with `or` filters in chunks of 50 ids (`cr380_doorid eq <id> or …`, `_cr380_doorid_value eq <id> or …` plus active door-level filter); every function returns `WriteResult` and never throws (catch → `{ ok:false, error: message }`); test asserts exact payloads, chunk counts for 0/1/50/51/120 ids, and error mapping from `IOperationResult.error`
- [x] T015 [P] Write src/lib/async/runPool.test.ts and implement src/lib/async/runPool.ts: `runPool(items, worker, { concurrency = 4, onProgress })` returning results in input order; tests: never exceeds concurrency (track in-flight), progress called `total` times with monotonic `done`, a rejecting worker becomes a rejected result without stopping others (wrap as `{ ok:false }` inside), empty input resolves `[]`
- [x] T016 Create src/lib/data/index.ts re-exporting the public surface of records, toEngineDataset, buildIndex, preview, mutations, useAssortmentData, fetchAllPages

### Shared doors logic (`src/lib/doors/`, research R11, R12)

- [x] T017 [P] Write src/lib/doors/status.test.ts and implement src/lib/doors/status.ts: `statusCategory(text)` (trim, case-insensitive: `open`→open, `pre-trade`→pre-trade, `project (mtp)`/`project`→project, `closed`/`cancelled`→closed, else other) and `statusTone(cat)` (open→success, pre-trade→info, project→neutral, closed→unavailable, other→neutral) per data-model.md §3
- [x] T018 [P] Write src/lib/doors/savedFilters.test.ts and implement src/lib/doors/savedFilters.ts: `SavedFilterId = 'needs-tier'|'fragrance-only'|'recent'|'closed'`; `SAVED_FILTERS` in Doors order with labels "Needs tier", "Fragrance-only product line", "Opened in last 90 days", "Closed"; `BULK_SAVED_FILTERS = ['needs-tier','recent','fragrance-only']`; `matchesSavedFilter(row, id, today)`: needs-tier ⇔ no tierId; fragrance-only ⇔ `productLine === 'Fragrance'` (exact; `'fragrance'` and `' Fragrance'` do NOT match); recent ⇔ openingDate (local date) within [today−90 days, today] inclusive, missing date ⇒ false; closed ⇔ statusCategory closed. Tests include boundaries today−90 (in), today−91 (out), today (in), today+1 (out), and a fast-check property that `recent` never matches future dates. Assert there is no `q3` id
- [x] T019 Write src/lib/doors/doorRows.test.ts and implement src/lib/doors/doorRows.ts: `buildDoorRows(data: AssortmentData): DoorRow[]` per data-model.md §2 (tierName/tierRank from index; `statusCategory`, `statusTone`, `isClosed`; `skuCount = engine.getCounts().byDoor.get(id)` only when tierId set and not closed, else undefined; `exceptionCount` = active door-level exceptions; `searchKey` = lower-cased `name|doorKey|shipTo`; `lastChangedLabel` = `D Mon YYYY · XX` from modifiedOn + initials of modifiedByName, `—` when missing); rows sorted by name
- [x] T020 [P] Write src/lib/doors/columns.test.ts and implement src/lib/doors/columns.ts: `DOOR_COLUMNS` (keys/titles in FR-011 order: name "Door name", doorKey "Door key", tier "Tier", skus "SKUs assorted", distributor "Distributor name", productLine "Product line", doorType "Door type", onlineOffline "Online / offline", salesChannel "Sales channel", exceptions "Exceptions", status "Door status", shipTo "SAP Ship To", lastChanged "Last changed on") and `doorCellText(row, key)` returning displayed values (tier → name | "Needs tier" (open) | "—" (closed, no tier); skus → number | ''; exceptions → number; status → original text)

### Session store (`src/lib/session/`, research R6)

- [x] T021 [P] Write src/lib/session/store.test.ts + doorSelection.test.tsx and implement src/lib/session/store.ts (tiny `createStore<T>(initial)` with get/set/subscribe) and src/lib/session/doorSelection.ts exporting `doorSelection` (Set<string> store with `set`, `clear`, `toggle`, `prune(validIds)`), `useDoorSelection()`, `lastDoorsSearch` store + `useLastDoorsSearch()`, `bulkIntroHidden` store + `useBulkIntroHidden()` (all via `useSyncExternalStore`); plus src/lib/session/index.ts

### Shared ChanelUI components (research R10) — each folder: `.tsx`, `.module.css` (tokens only), `.test.tsx`, `index.ts`

- [x] T022 [P] Create src/components/StatusIndicator/: props `{ tone: 'success'|'info'|'warning'|'critical'|'neutral'|'unavailable'; label: string; iconOnly?: boolean }`; renders a token-colored dot/icon + label (iconOnly ⇒ visually hidden label, `aria-label`); tests for every tone class and iconOnly accessibility name
- [x] T023 [P] Create src/components/KpiTile/: props `{ label; value: ReactNode; status?: { tone; label } }` (display-face uppercase value per prototype `KpiTile`); tests
- [x] T024 [P] Create src/components/Field/: props `{ label; required?; help?: ReactNode; error?: string; children }` using Ant Design `Form.Item`-like markup without a Form (label `htmlFor` wiring via `useId` + cloneElement id, required mark, help below); tests for label association, required mark, help/error rendering
- [x] T025 [P] Create src/components/FormGrid/ (`columns?: 1|2`, responsive single column in compact via CSS var) and src/components/FormActions/ (right-aligned button row, wraps on compact); tests
- [x] T026 [P] Create src/components/WorkflowSection/: props `{ number: number; title: string; children }` rendering `section[aria-labelledby]` with a numbered display-face badge and `h2` (tabIndex -1, exposes `focusHeading()` via ref for step changes); tests
- [x] T027 [P] Create src/components/ConfirmAction/: props `{ label; title; description; confirmLabel; onConfirm; danger?; disabled? }` wrapping Ant Design `Popconfirm` + `Button`; tests for confirm and cancel paths
- [x] T028 Create src/components/DataGrid/: generic `DataGrid<T>` wrapping Ant Design `Table` with props `{ rowKey, columns: DataGridColumn<T>[] (title, key, dataIndex?, render?, width: 'wide'|'medium'|'narrow'|number token key, align?, pinned?, truncate?, sorter?), dataSource, pagination?, rowSelection?, onRowActivate?, maxHeight token, emptyText, zebra?, testId }`; width presets and maxHeight map to tokens (add any missing size tokens to src/theme/token.ts + token.test.ts parity if needed: `grid-col-wide`, `grid-col-medium`, `grid-col-narrow`, `grid-max-height`), `pinned` ⇒ `fixed: 'left'`, horizontal scroll inside the region, small size, zebra rows; `onRowActivate` on row click (ignoring clicks from `button, a, input, .ant-select, .ant-checkbox-wrapper`) and on Enter when the row (`tabIndex=0`) is focused; `data-row-key` on rows; tests for sorting callback, selection, activation by click/Enter, ignored interactive clicks, pagination showTotal, empty text

### Screen registry & routing rename

- [x] T029 Modify src/lib/screens.ts: rename `ScreenId` `'mass-update'` → `'bulk-update'` with `path: '/doors/bulk-update'`, `title: 'Bulk Update'`, `eyebrow: 'Strategy'`, `breadcrumb: DOORS_CRUMB`, `navKey: 'doors'`; remove the `placeholder` from `doors` and `bulk-update` (keep door-detail's); update src/lib/screens.test.ts expectations accordingly
- [x] T030 Delete src/pages/MassUpdatePage/ (git rm) and create src/pages/BulkUpdatePage/BulkUpdatePage.tsx (temporarily `ScreenScaffold` with `screenById('bulk-update')` and an empty `ScreenRegion` until US4), src/pages/BulkUpdatePage/index.ts, src/pages/BulkUpdatePage/BulkUpdatePage.test.tsx; update src/App.tsx `PAGES` key `'bulk-update': lazy(() => import('./pages/BulkUpdatePage'))`; update src/App.test.tsx route table (`/doors/bulk-update`, title "Bulk Update", current "Doors"); update e2e/fixtures/screens.ts entry id `bulk-update`, hash `#/doors/bulk-update`, title `Bulk Update`
- [x] T031 Run `npm run build && npm run lint && npm test` and fix any breakage from the rename/move before starting user stories

**Checkpoint**: Foundation ready — data loads into `useAssortmentData`, shared components exist, Bulk Update route renders.

---

## Phase 3: User Story 1 - Find and review doors (Priority: P1) 🎯 MVP

**Goal**: The Doors screen shows real doors with the 13 prototype columns, search, Distributor/Tier filters, More filters, the 4 saved filters, Clear filters, sorting, paging, selection, and row navigation to Door detail.

**Independent Test**: With the e2e fixture, each filter and saved filter yields `EXPECTED` counts; the header description and region label match; Enter on a row opens `#/doors/{id}`; breadcrumb back restores the query.

### Tests for User Story 1

- [x] T032 [P] [US1] Write src/lib/doors/filterDoors.test.ts: status gate (default hides closed; `st` replaces gate; `saved=closed` shows only closed), each saved filter, `dist`/`tier` (incl. `none`) multi-select, `oo/dt/pl`, search over name/key/shipTo case-insensitive, AND across all; fast-check property: adding any filter never increases the result size; a perf test that filtering 5,000 generated rows takes < 50 ms
- [x] T033 [P] [US1] Write src/lib/doors/doorQuery.test.ts: `parseDoorQuery`/`stringifyDoorQuery` round-trip for every key in data-model.md §2, unknown keys/values dropped, defaults (sort name asc, page 1), `more` derived true when any of `oo/dt/pl/st` set, `hasFilters`
- [x] T034 [P] [US1] Write src/lib/doors/sortDoors.test.ts: sort by name (locale), tier (rank; no tier last asc), skus (undefined last), distributor, changed (modifiedOn), asc/desc, stable ties by name
- [x] T035 [P] [US1] Write src/features/doors/DoorsFilters.test.tsx, SavedFilters.test.tsx, DoorsGrid.test.tsx, SelectionBar.test.tsx (Testing Library; render with a fixture `AssortmentData` built from a small in-test dataset): More/Fewer filters label with count and clearing on collapse; Clear filters visibility/reset; only one saved tag checked; no "Q3 cluster review"; columns in order with pinned name/key; "Needs tier" warning in Tier cell for open doors without tier (read-only text for this story); SKUs assorted empty for no-tier/closed; Exceptions count; status indicator tone; pagination "1–50 of N"; checkbox aria-label "Select {name}"; selection bar "N door(s) selected" with "Export selection" and "Clear selection"
- [x] T036 [P] [US1] Write src/pages/DoorsPage/DoorsPage.test.tsx (mock `useAssortmentData`): loading/error(Retry calls refetch)/empty states with exact copy; header eyebrow/title; description "N doors match the current filters. M doors need a tier." and "Every door has a tier." variant; region label "N doors"; URL query drives filters (render under `MemoryRouter initialEntries={['/doors?saved=needs-tier']}`); row Enter navigates to `/doors/{id}`

### Implementation for User Story 1

- [x] T037 [P] [US1] Implement src/lib/doors/filterDoors.ts (`filterDoors(rows, query, today)` per data-model.md §2 Filter semantics, using `matchesSavedFilter`)
- [x] T038 [P] [US1] Implement src/lib/doors/doorQuery.ts (`DoorQuery` type, `parseDoorQuery(URLSearchParams)`, `stringifyDoorQuery(q)`, `hasFilters(q)`, `moreFilterCount(q)`)
- [x] T039 [P] [US1] Implement src/lib/doors/sortDoors.ts and src/lib/doors/filterOptions.ts (`filterOptions(rows)` → distinct sorted distributors, onlineOffline, doorTypes, productLines, statuses; tier options = `index.activeTiers` + `{ value: 'none', label: 'Needs tier' }`), and create src/lib/doors/index.ts barrel
- [x] T040 [US1] Implement src/features/doors/useDoorsQuery.ts: wraps `useSearchParams` with `parseDoorQuery`/`stringifyDoorQuery`, exposes `query` and `update(patch)` (resets `page` to 1 on any filter change; collapsing "more" clears `oo/dt/pl/st`; `clear()` resets all filters and `more`), and writes the current search string to `lastDoorsSearch` session store on every change
- [x] T041 [US1] Implement src/features/doors/useDoorsView.ts: from `useAssortmentData()` + query + `today()` returns `{ state: 'loading'|'error'|'empty'|'ready', rows (memoized `buildDoorRows`), filtered (via `useDeferredValue(query.q)`), sorted, pageRows, total, needsTierCount (open doors without tier across all data), options, refetch }`; prunes selection to existing ids when data version changes
- [x] T042 [P] [US1] Implement src/features/doors/DoorsFilters.tsx (+ DoorsFilters.module.css): `div[role=search][aria-label="Filter doors"] data-testid="doors-filters"` with Ant Design `Input` (allowClear, placeholder/aria-label "Search door name, Door key or SAP Ship To", `data-testid="doors-search"`), multi `Select`s "Distributor name" (`filter-distributor`) and "Tier" (`filter-tier`) with `maxTagCount` responsive, `Button` [FilterOutlined] `doors-more-filters` with `aria-expanded` and label "More filters|Fewer filters (n)", when expanded single `Select`s "Online / offline", "Door type", "Product line", "Door status", and link `Button` `doors-clear-filters` "Clear filters" when `hasFilters` (contracts/ui-doors.md)
- [x] T043 [P] [US1] Implement src/features/doors/SavedFilters.tsx (+ .module.css): `div[role=group][aria-label="Saved filters"] data-testid="doors-saved-filters"` with muted "Saved filters" label and four Ant Design `Tag.CheckableTag` from `SAVED_FILTERS`; checking one sets `saved` (unsetting others), unchecking clears it; keyboard Space/Enter toggles
- [x] T044 [US1] Implement src/features/doors/DoorsGrid.tsx using `DataGrid` with `DOOR_COLUMNS` (name & doorKey pinned; tier cell = tier name, or `StatusIndicator` warning "Needs tier" for open doors without tier, or "—" for closed — editable picker comes in US3 via a `renderTier` prop), sorters wired to query `sort/dir`, controlled pagination (50/page, showTotal `{a}–{b} of {total}` with `toLocaleString('en-US')`), `rowSelection` bound to `useDoorSelection()` with `preserveSelectedRowKeys` and checkbox aria-label "Select {name}", `onRowActivate` → `navigate('/doors/' + id)`, emptyText "No doors match these filters. Clear a filter to widen the list."
- [x] T045 [P] [US1] Implement src/features/doors/SelectionBar.tsx (+ .module.css): shown when selection > 0, `data-testid="doors-selection-bar"`, text "{n} door(s) selected" and an actions `Flex` accepting extra action slots (US2–US5 add buttons) plus "Clear selection" (text button)
- [x] T046 [US1] Create src/features/doors/index.ts and rewrite src/pages/DoorsPage/DoorsPage.tsx: `ScreenScaffold`-equivalent layout with `PageHeader` (eyebrow "Strategy", title "Doors", description with `aria-live="polite"`, `actions` slot), `DoorsFilters`, `SavedFilters`, and `ScreenRegion` label "{n} door(s)" `data-testid="doors-region"` `visualMask` containing loading/error(onRetry=refetch, description "Doors could not be loaded. Your filters are kept.")/empty RegionState or `SelectionBar` + `DoorsGrid`; `useDocumentTitle('Doors')`
- [x] T047 [US1] Write e2e/doors/doors.spec.ts (project `e2e`, base `#/doors`): default list count = `EXPECTED.open`; each saved filter count; "Q3 cluster review" not present; distributor + tier filter AND; More filters reveal/count/collapse-clears; Clear filters; search by key; pagination text; select 2 rows across pages keeps "2 doors selected"; Enter on a row → `#/doors/D-…` with "Doors" breadcrumb; breadcrumb back restores `?saved=…`; `?data=error` shows Retry and keeps filters; `?data=empty` shows empty copy

**Checkpoint**: US1 independently functional (MVP).

---

## Phase 4: User Story 2 - Export the current grid (Priority: P1)

**Goal**: "Export" (download icon) downloads an .xlsx of the full filtered/sorted list with exactly the grid's columns; "Export selection" exports selected doors.

**Independent Test**: Apply a filter, click Export, read the downloaded workbook: headers = 13 grid titles; rows = filtered list in sort order; toast "Door list exported · N doors".

### Tests for User Story 2

- [x] T048 [P] [US2] Write src/lib/excel/workbook.test.ts (real exceljs in Node): `downloadWorkbook` builds sheets with given headers (bold), widths, rows, and list validations; mock `URL.createObjectURL`/anchor click and assert file name; assert exceljs is loaded via dynamic import (spy on module factory) only when called
- [x] T049 [P] [US2] Write src/features/doors/exportDoors.test.ts: `exportDoors(rows, kind, today)` produces file `Doors_filtered_YYYY-MM-DD.xlsx` / `Doors_selection_YYYY-MM-DD.xlsx`, sheet "Doors", header = `DOOR_COLUMNS` titles, cell values = `doorCellText`, zero rows ⇒ header only; returns count for toast

### Implementation for User Story 2

- [x] T050 [US2] Implement src/lib/excel/workbook.ts (`SheetSpec`, `downloadWorkbook(fileName, sheets)` with `const ExcelJS = (await import('exceljs')).default`, `writeBuffer` → `Blob` (`application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`) → object URL → temporary anchor click → revoke; header row bold, `dataValidations` list type for `validations`; no fills/colors) and src/lib/excel/index.ts
- [x] T051 [US2] Implement src/features/doors/exportDoors.ts (uses `DOOR_COLUMNS`, `doorCellText`, `downloadWorkbook`, date from `today()` formatted `YYYY-MM-DD`)
- [x] T052 [US2] Wire export in src/pages/DoorsPage/DoorsPage.tsx and src/features/doors/SelectionBar.tsx: header action `Button` `data-testid="doors-export"` icon `<DownloadOutlined />` "Export" exporting the full `sorted` list (all pages); selection bar "Export selection" exporting selected rows (in current sort order, including selected rows hidden by filters); on success `message.success('Door list exported · {n} door(s)')`, on failure `message.error('The door list could not be exported. Try again.')`; buttons show loading while exporting; update DoorsPage.test.tsx / SelectionBar.test.tsx
- [x] T053 [US2] Extend e2e/doors/doors.spec.ts with export tests: `page.waitForEvent('download')`, assert suggested file name pattern, save to temp and read with exceljs in the test: header row equals the 13 titles; row count equals filtered count; first row equals first grid row texts; Export selection exports only selected doors

**Checkpoint**: US1 + US2 work independently.

---

## Phase 5: User Story 3 - Change one door's tier inline (Priority: P2)

**Goal**: Inline tier picker per open door opens a confirmation dialog with engine-derived impact and a required reason; confirming saves the tier and refreshes counts.

**Independent Test**: Pick a new tier for a fixture door; impact equals preview-engine counts; Save disabled until reason; after save, row tier/SKUs and header count update.

### Tests for User Story 3

- [x] T054 [P] [US3] Write src/features/doors/tierImpact.test.ts: `tierImpact(data, doorId, toTierId)` returns `{ total, retail, spm, delta?, axesLimited, isProject, sameTier }` using `withDoorTierOverrides` + `createEngine`; delta only when door had a tier; `axesLimited` when the door's product line excludes some axes present in the target tier's rules; `isProject` for Project (MTP); text builder `impactText(...)` produces FR-026 sentences ("This door will receive {r} retail and {s} SPM SKUs ({t} in total, +{d} against today)." + product line and project notes; "Choose the new tier to see the impact."; "This door is already {tier}.")
- [x] T055 [P] [US3] Write src/features/doors/TierChangeDialog.test.tsx, src/components/ReasonField/ReasonField.test.tsx and src/features/doors/TierCell.test.tsx: dialog title "Change tier", question text, Save disabled for no tier/same tier/empty reason/whitespace reason, reason picks fill the textarea and show selected as primary, 280 max length, help text "Pick a reason or type your own. Tier-change reasons are not saved.", Save calls `setDoorTier` then invalidates data and shows success message "{door} moved to {tier}. It now receives {n} SKUs ({r} retail · {s} SPM)."; failed save keeps dialog open with error Alert and no invalidation; TierCell: select aria-label "Tier for {name}", placeholder "Assign tier", warning icon when no tier, click/keydown do not trigger row activation, closed doors read-only

### Implementation for User Story 3

- [x] T056 [P] [US3] Implement src/features/doors/tierImpact.ts (pure; SKU type split via `index.skuById`; untyped SKUs counted in total only)
- [x] T057 [P] [US3] Create src/lib/doors/reasons.ts exporting `TIER_REASONS = ['New door opening','Sales above tier threshold','Sales below tier threshold','Retailer request']` and `SKU_REASONS = ['Launch distribution','Fixture constraint','Retailer agreement','Limited edition allocation']` (shared with Bulk Update; re-export from src/lib/doors/index.ts). Move ReasonField to the shared component src/components/ReasonField/ (ReasonField.tsx, .module.css, .test.tsx, index.ts) so both features can use it: `Field` "Why is this change being made?" required with Ant Design `Input.TextArea` (maxLength 280, showCount), a `Button size="small"` pick for each item in the `reasons` prop (the selected one is primary, clicking sets the text), and a `help` prop. Move the ReasonField test from T055 to src/components/ReasonField/ReasonField.test.tsx
- [x] T058 [US3] Implement src/features/doors/TierChangeDialog.tsx: Ant Design `Modal` (title "Change tier", okText "Save change", cancelText "Cancel", `data-testid="tier-dialog"`, width token) with question "Change tier for {door} from {tier|no tier} to {new}?", `Field` "New tier" (Select of active tiers), impact box `data-testid="tier-impact"`, `ReasonField` (TIER_REASONS, help per FR-055), `okButtonProps.disabled` per data-model.md §4, `confirmLoading` during save, inline `Alert type="error"` on failure; on success: `useInvalidateAssortmentData()`, close, `message.success(...)`
- [x] T059 [US3] Implement src/features/doors/TierCell.tsx (small Ant Design `Select`, width token, wrapper `span` stopping click/keydown propagation, `StatusIndicator` warning iconOnly when no tier; closed doors render text) and pass it to `DoorsGrid` via `renderTier`; manage dialog state (`{ doorId, toTierId }`) in DoorsPage
- [x] T060 [US3] Write e2e/doors/tier-dialog.spec.ts: assign a tier to a Needs-tier fixture door → dialog impact text present → Save disabled until a reason pick → after save row shows new tier and SKU count, header "need a tier" count decreases by 1; `?data=writefail` → error inside dialog, row unchanged; closed door has no picker

**Checkpoint**: US1–US3 work independently.

---

## Phase 6: User Story 4 - Bulk Update: re-tier many doors (Priority: P2)

**Goal**: Four-step guided Bulk Update for re-tiering (selection / saved filter / upload), row checks, impact review, apply with re-check, result with undo and partial-failure retry.

**Independent Test**: Select fixture doors → Change tier → step 2 preselected → check → review → apply → result; Undo restores tiers; upload with mixed rows yields exact status counts.

### Tests for User Story 4

- [x] T061 [P] [US4] Write src/features/bulk-update/bulkReducer.test.ts: initial state from entry intent (data-model.md §5 + contracts/ui-bulk-update.md Entry points), all transitions and guards (`canContinue0/1/2`, `canApply`), Back keeps fields, changing type resets tierId/skuIds/upload/source, default source rules (selection if doorIds, else filter for tier / upload for sku)
- [x] T062 [P] [US4] Write src/features/bulk-update/checkRows.test.ts (tier): every FR-040 rule in first-match order with exact messages — Error "Door key not found in the door list. Check the key, for example US1542."; Error "“{value}” is not a tier. Use {Access, Premium, …}."; Skipped "{status}: tiers are not changed on closed or cancelled doors."; No change "Already {tier}."; Warning "Product line {pl}: it moves, but receives SKUs of those axes only." (when door product line lacks some axis present in the rules of the target tier); Warning "Project door (MTP): the tier is saved; nothing goes to SAP until it is Pre-Trade."; Ready; duplicate door rows → last wins (earlier ones "No change" with message "Replaced by a later row for this door."); `change` text "{before|Needs tier} → {value}"; snapshot captured
- [x] T063 [P] [US4] Write src/features/bulk-update/rawRows.test.ts: selection/filter sources produce one row per scope door (filter uses `BULK_SAVED_FILTERS` and excludes closed) with `value` = chosen tier name, `line` = index+2; upload rows map headers "Door key", "Door name", "New tier", "Reason" case-insensitively
- [x] T064 [P] [US4] Write src/lib/excel/parseCsv.test.ts, readTable.test.ts, validateUpload.test.ts: RFC 4180 quotes/escaped quotes/CRLF/LF/BOM/trailing newline; xlsx read via exceljs of a workbook generated in-test (first sheet, header row 1, `line` numbers, blank rows skipped); validation messages from contracts/data-and-logic.md for wrong extension, empty, too many rows (2,500 / 5,000), missing required header
- [x] T065 [P] [US4] Write src/features/bulk-update/impact.test.ts (tier): per-door before/after counts from preview engine, delta, note for warnings, KPIs (doorsChanging, avgNetDelta rounded, skuChanges = Σ(added+removed SKU ids), rowsLeftOut), sentence "{n} doors move to {tier|new tiers} ({a} from {X}, {b} from no tier). On average each gains|loses {k} SKUs." + " {m} rows are left out: …"
- [x] T066 [P] [US4] Write src/features/bulk-update/applyBulk.test.ts (inject fake deps): re-check skips rows whose tier/status changed (reported as stale "Changed by someone else — not updated"), writes via runPool concurrency 4, collects failures with door names, succeeded list stores prevTierId, progress callback; `undoBulk` restores prevTierId (null when none) only for succeeded, reports its own failures; `retryFailed` re-runs only failed rows
- [x] T067 [P] [US4] Write component tests src/features/bulk-update/BulkIntro.test.tsx, BulkSteps.test.tsx, StepChooseChange.test.tsx, StepChooseDoors.test.tsx, UploadPanel.test.tsx, StepCheckRows.test.tsx, StepReview.test.tsx, BulkResult.test.tsx covering contracts/ui-bulk-update.md copy, testids, enable/disable rules, focus moving to the step heading on step change, Hide intro persisting in session, Segmented "All rows (n)"/"Needs attention (n)", "Download rows that need attention" producing `Rows_to_fix_YYYY-MM-DD.xlsx` (mock downloadWorkbook), apply label "Re-tier N doors", result actions and ConfirmAction undo
- [x] T068 [P] [US4] Write src/pages/BulkUpdatePage/BulkUpdatePage.test.tsx: header breadcrumb "Doors" linking to `/doors?{lastDoorsSearch}`, title "Bulk Update", description variants (before/after apply), loading/error states of data

### Implementation for User Story 4

- [x] T069 [P] [US4] Implement src/features/bulk-update/bulkReducer.ts (`BulkState`, `BulkAction` union: pickType, continue, back, setSource, setFilter, setTier, setSkuAction, setSkuIds, setUpload, clearUpload, setRowView, setReason, setChecked, setResult, reset; selectors `canContinue0/1/2`, `canApply`; `initialBulkState(intent, selectedIds)`)
- [x] T070 [P] [US4] Implement src/lib/excel/parseCsv.ts, src/lib/excel/readTable.ts (dynamic `import('exceljs')` for .xlsx; `parseCsv` for .csv via `file.text()`), src/lib/excel/validateUpload.ts; export from src/lib/excel/index.ts
- [x] T071 [P] [US4] Implement src/features/bulk-update/templates.ts: `TEMPLATE_COLUMNS.tier` (Door key Required "Text, for example US1542. Matches the door."; Door name Optional "For your reference only; not saved."; New tier Required "{active tier names} (dropdown)."; Reason Optional "Per-row note, added to your comment.") and `.sku` (Door key, SKU key "6-digit SKU key from the catalogue.", Action "Add or Remove (dropdown).", Reason); `downloadTemplate(type, data)` → `Re-tier_doors_template.xlsx` / `Door_SKU_exceptions_template.xlsx` with sheet "Update" (header + one example row using a real active tier name / Add), list validations (New tier = active tier names; Action = Add, Remove) on rows 2–2501/5001, and sheet "Rules" (Column, Required, Rule)
- [x] T072 [US4] Implement src/features/bulk-update/rawRows.ts (`buildRawRows(state, data, today)`; scope doors from selection (non-closed kept as-is for checking), saved filter via `matchesSavedFilter` excluding closed, or upload rows) and src/features/bulk-update/checkRows.ts (tier rules per T062; SKU branch stub returning [] until US5)
- [x] T073 [US4] Implement src/features/bulk-update/impact.ts (tier: preview engine with all overrides at once; per-door rows; KPIs; sentence builder incl. left-out clause)
- [x] T074 [US4] Implement src/features/bulk-update/applyBulk.ts: `applyBulk(rows, 'tier', reason, deps, onProgress)` → `recheckDoors` (chunked) → partition stale vs writable → `runPool(writable, r => deps.setDoorTier(r.doorId, r.tierId))` → `BulkResult`; `undoBulk(result, deps, onProgress)`; `retryFailed(result, deps, onProgress)`; `deps` defaults to `src/lib/data` functions
- [x] T075 [P] [US4] Implement src/features/bulk-update/BulkIntro.tsx (+ .module.css) and BulkSteps.tsx: intro section "How bulk update works" with 4 items (prototype copy, "Bulk update" wording) and "Hide" (sets `bulkIntroHidden`); Ant Design `Steps size="small"` with titles Choose the change · Choose the doors · Check the rows · Review and apply and descriptions per FR-032
- [x] T076 [P] [US4] Implement src/features/bulk-update/StepChooseChange.tsx (+ .module.css): `WorkflowSection number={1} title="Choose the change"`, intro sentence, two card `button[aria-pressed]` (`bulk-card-tier`, `bulk-card-sku`) with prototype descriptions and facts (Changes / Who→"Everyone" / Limit "Up to 2,500 doors per file"|"Up to 5,000 rows per file" / Afterwards "New assortment shows at once"), "Selected" StatusIndicator, redirect panel `bulk-redirect` (copy per prototype; buttons navigate to `/tier-assortments` and `/exceptions`), FormActions Cancel (→ `/doors?{lastDoorsSearch}`) / Continue
- [x] T077 [US4] Implement src/features/bulk-update/UploadPanel.tsx (+ .module.css): two panels — "1 · Download the {re-tier|SKU exception} template" with template-columns `DataGrid` and `Button` [DownloadOutlined] "Download template"; "2 · Upload the completed file" with Ant Design `Upload.Dragger` (`accept=".xlsx,.csv"`, `beforeUpload` → `validateUpload` + `readTable` → dispatch `setUpload`, return `Upload.LIST_IGNORE`), copy "Drop the file here or click to browse" / ".xlsx or .csv · {limit text}", error `Alert` for validation messages, success state `StatusIndicator` "{file} · {n} rows read" + link "Replace file" + note "Every row is checked in the next step. Nothing is saved yet."
- [x] T078 [US4] Implement src/features/bulk-update/StepChooseDoors.tsx (+ .module.css) for type tier: `WorkflowSection number={2}` "Choose the doors and the new tier", `Radio.Group` (aria-label "Where the doors come from") with options per contracts (selection disabled when 0), selection text (first 4 names "and N more"), saved filter `Field` with `BULK_SAVED_FILTERS` labels "{label} · {n} doors" (non-closed counts) and help text, `Field` "New tier" with help, `UploadPanel` for upload source, scope text, FormActions Back / "Check the rows"
- [x] T079 [US4] Implement src/features/bulk-update/StepCheckRows.tsx (+ .module.css): `WorkflowSection number={3}` "Check the rows", intro copy, status totals (`StatusIndicator` per status with count > 0: "{n} ready", "{n} warning(s)", "{n} no change", "{n} skipped", "{n} error(s)"), left-out panel (tone critical if errors; text per prototype incl. upload vs non-upload advice), `Segmented` "Rows to show", "Download rows that need attention" (Row, Door key, Door, Change, Status, Details → `Rows_to_fix_YYYY-MM-DD.xlsx`), `DataGrid` `bulk-rows` (100/page when > 100, emptyText "Every row is ready."), FormActions Back / "Review impact ({n} rows)" | disabled "No rows to apply"
- [x] T080 [US4] Implement src/features/bulk-update/StepReview.tsx (+ .module.css): `WorkflowSection number={4}` "Review and apply", sentence `p`, 4 `KpiTile`s, `ScreenRegion` "Before and after, per door" with `DataGrid` `bulk-impact`, "What happens when you apply" list (3 items per contracts), `ReasonField` (TIER_REASONS, help "Saved once for the whole update. Tier-change reasons are not saved."), FormActions Back / "Re-tier {n} door(s)" (disabled until reason)
- [x] T081 [US4] Implement src/features/bulk-update/BulkResult.tsx (+ .module.css): Ant Design `Result` (success | warning when any failed/stale | info when undone) with titles/sub-titles per contracts Result copy, `Steps size="small"` Saved · Assortment updated, `span[aria-live=polite] data-testid="bulk-progress"` ("Applying {done} of {total}…" during work), failures list `bulk-failures` with "Retry failed rows", actions "View doors" (primary; clears selection; → `/doors?{lastDoorsSearch}`), `ConfirmAction` "Undo this update" (title "Undo this bulk update?", description "Every change from this update is reversed.", confirmLabel "Undo update"), "Start another update" (text; reset)
- [x] T082 [US4] Implement src/features/bulk-update/BulkUpdateWorkflow.tsx composing intro, steps, panels via `useReducer(bulkReducer, …)`; reads `useLocation().state` intent and `useDoorSelection()` at mount; computes raw/checked rows on entering step 2 (`setChecked`), impact on step 3; runs apply/undo/retry with progress state; calls `useInvalidateAssortmentData()` after apply/undo/retry; moves focus to the active `WorkflowSection` heading on step change; create src/features/bulk-update/index.ts
- [x] T083 [US4] Rewrite src/pages/BulkUpdatePage/BulkUpdatePage.tsx: `PageHeader` (breadcrumb `[{ label: 'Doors', to: '/doors' + lastDoorsSearch }]`, eyebrow "Strategy", title "Bulk Update", description per state) + loading/error `ScreenRegion` from `useAssortmentData`, else `BulkUpdateWorkflow`; `useDocumentTitle('Bulk Update')`
- [x] T084 [US4] Add Doors entry points in src/pages/DoorsPage/DoorsPage.tsx and SelectionBar.tsx: header `Button` `data-testid="doors-bulk-update"` icon `<SyncOutlined />` "Bulk Update" (`type="primary"` only when selection is empty) → `navigate('/doors/bulk-update')`; selection bar "Change tier" (primary) → `navigate('/doors/bulk-update', { state: { type: 'tier', startStep: 1 } })`; update tests
- [x] T085 [US4] Write e2e/bulk-update/bulk-update.spec.ts (tier): (a) select 3 open tiered fixture doors → Change tier → step 2 with selection preselected → choose Premium → Check the rows → statuses/counts → Review → reason pick → "Re-tier 3 doors" → result title "3 doors moved to Premium." → click "Undo this update" and confirm → result "Update undone" → "View doors" → the 3 doors show their original tiers. In a second run, apply without undo, then "View doors" → the 3 doors show Premium and the selection is cleared; (b) saved filter "Needs tier" source count label; (c) upload an .xlsx generated in-test with rows: valid, unknown key `US9999`, bad tier "Premium Plus", closed door, same-tier → exact counts 1 ready / 1 no change / 1 skipped / 2 errors, Needs attention view, download rows that need attention; (d) `?data=throttle` → warning result with failures and "Retry failed rows" succeeding

**Checkpoint**: US1–US4 work independently.

---

## Phase 7: User Story 5 - Bulk Update: add or remove SKUs at many doors (Priority: P3)

**Goal**: SKU change type: doors × SKUs (or upload) → FR-041 checks → impact → create door-level exceptions with reason → undo cancels them.

**Independent Test**: 3 fixture doors × 2 SKUs Add → 6 rows checked → apply → 6 active door-level Add exceptions with the reason; Undo → all Cancelled.

### Tests for User Story 5

- [x] T086 [P] [US5] Extend src/features/bulk-update/checkRows.test.ts (sku): every FR-041 rule in order with exact messages — door not found; "SKU key {key} is not in the catalogue."; Skipped "{status}." for closed; Skipped "The door has no tier yet, so it has no assortment to change."; Skipped (Add only) "Axis {axis} is not in the door’s product line ({pl})."; Error "This door already has an exception for this SKU. Change it on the door."; No change "Already receives this SKU." / "Does not receive this SKU today."; Ready; duplicate door×SKU rows → later ones "No change"; invalid Action value → Error "Action must be Add or Remove."
- [x] T087 [P] [US5] Extend src/features/bulk-update/impact.test.ts and applyBulk.test.ts (sku): impact via `withDoorExceptions` (SKUs after = before ± rows), KPI "Door exceptions created", sentence "{n} door exceptions will be created at {d} doors: {a} to add a SKU, {r} to remove one."; apply re-check marks stale when the door's active exceptions for that SKU or its tier changed; writes `createDoorException` with reason; undo calls `cancelException` for created ids only
- [x] T088 [P] [US5] Write src/features/bulk-update/SkuFields.test.tsx: Action radio "Add the SKUs"/"Remove the SKUs", "Add SKUs by group" (Franchise/Line option groups "{name} · {n} SKUs") merges ids and shows message "{n} SKUs from {group} added. Remove any you don’t want.", "SKUs" multi-select search by key or name with `maxTagCount` 10 and "+ N more", help text

### Implementation for User Story 5

- [x] T089 [US5] Implement the SKU branch in src/features/bulk-update/rawRows.ts (scope doors × skuIds with action; upload headers "Door key", "SKU key", "Action", "Reason") and src/features/bulk-update/checkRows.ts (FR-041; "receives today" from `engine.getDoorAssortment(doorId).assortment.skuIds`; axis eligibility = engine exact match: SKU axis ∈ door product line values as the engine defines)
- [x] T090 [US5] Implement SKU impact in src/features/bulk-update/impact.ts and SKU apply/undo in src/features/bulk-update/applyBulk.ts (`recheckDoorExceptions` + `recheckDoors`; `createDoorException` with doorKey/skuKey/action/reason/today; undo → `cancelException`)
- [x] T091 [US5] Implement src/features/bulk-update/SkuFields.tsx (+ .module.css) and use it in StepChooseDoors.tsx for type sku (title "Choose the doors and the SKUs"); StepReview.tsx shows KPI "Door exceptions created", impact columns "Tier" / "Change" ("{n} exception(s)"), apply label "Create {n} exception(s)", `ReasonField` with SKU_REASONS and help "Saved on each exception."; BulkResult title "{n} door exceptions created at {d} doors."
- [x] T092 [US5] Add "Add exception" to src/features/doors/SelectionBar.tsx → `navigate('/doors/bulk-update', { state: { type: 'sku', startStep: 1 } })` (for 1 or many doors); update SelectionBar.test.tsx
- [x] T093 [US5] Extend e2e/bulk-update/bulk-update.spec.ts (sku): select 3 doors → Add exception → pick 2 SKUs (one via group) → check → review → reason → "Create N exceptions" → result; assert the stub now has N active door-level exceptions with that reason (expose via `window.__e2eData` from the stub in e2e mode) and Exceptions column counts increased; Undo → exceptions Cancelled and counts restored

**Checkpoint**: All Bulk Update flows work.

---

## Phase 8: User Story 6 - Navigate with deep links and breadcrumbs (Priority: P3)

**Goal**: Each sub-screen has its own address; Doors highlighted; breadcrumbs/Cancel/View doors restore prior Doors query; old Mass update address redirects; direct open of Bulk Update behaves per spec.

**Independent Test**: Open `#/doors/mass-update` → lands on Bulk Update; reload mid-workflow; back/forward; breadcrumb restores `?query`.

- [x] T094 [P] [US6] Write src/App.test.tsx cases: `/doors/mass-update` redirects (replace) to `/doors/bulk-update`; `/doors/bulk-update` not captured by `/doors/:doorId`; Doors nav item has `aria-current="page"` on both sub-screens
- [x] T095 [US6] Modify src/App.tsx: add `<Route path="/doors/mass-update" element={<Navigate replace to="/doors/bulk-update" />} />` before the registry routes
- [x] T096 [US6] Ensure every return path uses the stored query: breadcrumb in src/pages/BulkUpdatePage/BulkUpdatePage.tsx, Cancel in StepChooseChange.tsx, "View doors" in BulkResult.tsx (clears selection first), and Door detail breadcrumb — modify src/pages/DoorDetailPage/DoorDetailPage.tsx to pass `breadcrumb=[{ label: 'Doors', to: '/doors' + lastDoorsSearch }]` to its scaffold (extend `ScreenScaffold` with an optional `breadcrumb` override prop + test in src/components/ScreenScaffold/ScreenScaffold.test.tsx)
- [x] T097 [US6] Direct-open behavior in src/features/bulk-update/bulkReducer.ts / BulkUpdateWorkflow.tsx: with no selection, selection option disabled and labeled "(none selected)", default source filter (tier) / upload (sku); add tests
- [x] T098 [US6] Write e2e/bulk-update/navigation.spec.ts: `#/doors/mass-update` → URL becomes `#/doors/bulk-update`, title "Bulk Update"; direct open with no selection → step 0, then tier → selection radio disabled; breadcrumb from Bulk Update returns to `#/doors?saved=…&page=2` previously set; browser back/forward between Doors and Bulk Update keeps Doors filters; reload on `#/doors?…` preserves filters

**Checkpoint**: All user stories complete.

---

## Phase 9: Polish & Cross-Cutting Concerns

- [x] T099 Update e2e/shell/structure.spec.ts (sub-screen hashes `#/doors/bulk-update`, titles), e2e/shell/responsive.spec.ts (matrix includes Doors with data, Bulk Update steps 0–3 and result, tier dialog open; assert no document horizontal overflow and grid scrolls inside its region; 44 px targets in compact for filters, tags, step buttons), e2e/shell/accessibility.spec.ts (axe 0 WCAG 2.1 AA violations on Doors, each Bulk Update step, result, tier dialog at 390 px and 1366 px)
- [x] T100 Update e2e/visual/prototype.capture.ts and e2e/visual/normalize.ts: rename `mass-update` capture to `bulk-update` (click prototype "Mass update" then rewrite visible "Mass update"/"Mass update" wording to "Bulk Update"/"bulk update" and swap the button icon area via mask), hide the prototype "Q3 cluster review" tag, mask data regions (`[data-visual-mask]`, grid bodies, description counts, selection bar, rows/impact grids); update e2e/visual/app.visual.spec.ts ids; delete e2e/visual/**baselines**/mass-update-_.png (git rm). HUMAN step (do not run automatically): `npx playwright test --project=prototype-baseline --update-snapshots` to recapture doors-_ and bulk-update-* baselines, then `npx playwright test --project=visual`
- [x] T101 [P] Run `npm run build` and confirm in `dist/` that exceljs is only in the `vendor-exceljs` lazy chunk (not referenced from the entry chunk); if the chunk exceeds `chunkSizeWarningLimit`, document it in vite.config.ts comment like the antd note (do not raise the limit globally without noting why)
- [x] T102 [P] Update .specify/memory/frontend-standards.md: `src/lib/data` (single load + engine from same records, mutations via generated services, recheck + runPool), `src/lib/excel` (exceljs dynamic import only; CSV via parseCsv), `src/lib/session` (URL query vs session store), feature folder `bulk-update`
- [x] T103 [P] Add a "Proposed constitution amendment" note (do not edit the constitution) to specs/003-doors-screen/plan.md Complexity Tracking follow-up: rename `mass-update` → `bulk-update` in Principle XII and "In-scope screens"
- [x] T104 Run `npm run lint`, `npm run format:check`, `npm run test:coverage` (must be 100% statements/branches/functions/lines), `npm run test:e2e -- --project=e2e`; fix all failures
- [x] T105 Fill specs/003-doors-screen/spec.md "Verification & Known Limitations": test results table (build, lint, format, unit counts + coverage, E2E per suite, axe, visual), untested items (real Power Apps host, live Dataverse writes incl. null-tier undo (research R7), SKU Type availability (R3), throttling at 5,000 rows, non-Chromium browsers), known limitations (single caps-only font; session-only undo and tier reasons; "Last changed on" is record-level; prototype deviations list), and confirm Data Gaps table is current
- [x] T106 Walk through specs/003-doors-screen/quickstart.md sections 1–4 end to end and record any deviation in the spec's Verification section; leave section 5 (manual live smoke) for a human

---

## Dependencies & Execution Order

### Phase dependencies

- **Setup (Phase 1)**: none. T002 depends on T001; T004 depends on T003.
- **Foundational (Phase 2)**: depends on Setup and blocks all stories. T006 comes first,
  then T007–T016 (T008 before T009/T010/T011/T013). T017–T021 can run in parallel with the
  data layer. T022–T028 are parallel (T028 may touch tokens). T029 → T030 → T031 last.
- **US1 (Phase 3)**: depends on Foundational. This is the MVP.
- **US2 (Phase 4)**: depends on US1 (it uses the DoorsPage header, `sorted`, and the
  SelectionBar).
- **US3 (Phase 5)**: depends on US1 (grid tier cell slot). Independent of US2.
- **US4 (Phase 6)**: depends on Foundational and on US1 for the entry points (T084).
  Steps T061–T083 can be built against the route alone. Independent of US2 and US3.
- **US5 (Phase 7)**: depends on US4 (shared workflow, reducer, steps).
- **US6 (Phase 8)**: depends on US1 and US4.
- **Polish (Phase 9)**: depends on all the stories it covers.

### Story completion order (graph)

```text
Setup → Foundational ─┬─> US1 (MVP) ─┬─> US2
                      │              ├─> US3
                      └──────────────┴─> US4 ──> US5
                                         US1 + US4 ──> US6 ──> Polish
```

### Within each story

Write the tests first (they should fail), then pure logic in `lib/` or the feature, then
components, then the page wiring, then E2E.

---

## Parallel Execution Examples

**Foundational** (after T006 and T008):

```text
T009 toEngineDataset tests   | T011 buildIndex     | T012 preview      | T014 mutations
T015 runPool                 | T017 status         | T018 savedFilters | T020 columns
T021 session store           | T022–T027 shared components
```

**US1**:

```text
T032 filterDoors tests | T033 doorQuery tests | T034 sortDoors tests | T035 component tests | T036 page tests
then: T037 | T038 | T039 in parallel → T040 → T041 → T042 | T043 | T045 in parallel → T044 → T046 → T047
```

**US2**: T048 ‖ T049 → T050 → T051 → T052 → T053

**US3**: T054 ‖ T055 → T056 ‖ T057 → T058 → T059 → T060

**US4**:

```text
T061 | T062 | T063 | T064 | T065 | T066 | T067 | T068   (all tests in parallel)
T069 | T070 | T071 | T075 | T076                         (independent files)
→ T072 → T073 → T074 → T077 → T078 → T079 → T080 → T081 → T082 → T083 → T084 → T085
```

**US5**: T086 ‖ T087 ‖ T088 → T089 → T090 → T091 → T092 → T093

---

## Implementation Strategy

### MVP first (US1 only)

1. Phase 1 Setup → Phase 2 Foundational.
2. Phase 3 (US1): Doors grid, filters, saved filters, selection, row navigation.
3. **Stop and validate**: run the US1 unit tests plus e2e/doors/doors.spec.ts, then demo.

### Incremental delivery

1. Add US2 (Export) to complete the P1 scope.
2. Add US3 (inline tier) and US4 (Bulk re-tier) in either order; they are independent.
3. Add US5 (Bulk SKU exceptions), then US6 (deep-link polish).
4. Polish: shell E2E, visual baselines (human recapture), coverage, then the spec's
   Verification section.

### Notes

- Tasks marked [P] touch different files and have no dependency on an incomplete task.
- Commit after each task or logical group. Stop at each checkpoint to validate the story
  on its own.
- Never run deploy or data-source commands. Visual baseline recapture is human-only
  (T100).
