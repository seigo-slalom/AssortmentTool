# Phase 0 Research: Doors Screen & Bulk Update

**Feature**: [spec.md](./spec.md) · **Plan**: [plan.md](./plan.md) · **Date**: 2026-10-27

Each decision resolves an unknown from the plan's Technical Context. Sources: the spec and
its Clarifications, the constitution, `docs/Assortment-Tool-Prototype.html` (`vDoors`,
`doorFilterList`, `vTierModal`, `vMass`, `muRows`, `muImpact`, `applyMass`, `undoMass`,
`REASONS`, `skuGroups`), the generated models/services, and
`.power/schemas/dataverse/*.Schema.json`.

---

## R1 — Shared data layer for screens (one load, engine built from the same records)

- **Decision**: Add `src/lib/data/` holding (a) `fetchAllPages` (moved from
  `features/engine/adapters/`, re-imported by the engine adapters), (b) record loaders
  that select the **display** fields each screen needs (doors, tiers, SKUs, tier rules,
  exceptions) into plain typed records, (c) `toEngineDataset(records)`, which maps those
  records to `EngineDataset` with the same rules as the engine loaders (active filters,
  exception choice maps, `null` becomes absent), and (d) a TanStack Query hook
  `useAssortmentData()` (key `['assortment-data']`). The hook returns `{ records, engine,
indexes }`, where `engine = createEngine(toEngineDataset(records))` is memoized per
  data version.
- **Rationale**: The Doors grid needs about 20 door fields plus tier names, SKU
  key/name/type/franchise/line and exception counts. The engine loaders select only the
  four fields the engine needs. Loading the same tables twice doubles the Dataverse calls
  (constitution SC-008 spirit) and can produce two versions of the data that disagree.
  Keeping the mapping rules identical to `loaders.ts` is enforced by a shared
  equivalence test (records → `toEngineDataset` equals the engine loaders' output on
  the same mocked rows).
- **Alternatives considered**:
  - Widen the engine adapters' `select` lists. Rejected: it puts UI concerns into the
    engine feature, and other features would have to import engine internals.
  - Load twice. Rejected for the reasons above.
  - Put the hook in `features/doors`. Rejected: Bulk Update (and later Overview,
    Exceptions) needs the same data, and features must not import each other's internals
    (constitution XII).

## R2 — "What-if" assortments for the tier dialog and the Bulk Update impact

- **Decision**: Build a preview engine with the **public** engine API. Copy the dataset
  with the affected doors' `tierId` replaced (`withDoorTierOverrides(dataset,
Map<doorId, tierId>)` in `src/lib/data/`), call `createEngine`, then read
  `getDoorAssortment` for only the affected doors. For SKU updates, append synthetic
  door-level exceptions to the copy in the same way (`withDoorExceptions`).
- **Rationale**: No change to the engine core is needed (constitution XIII stays
  untouched). The engine is lazy, so only the (tier, product line) pairs that are
  touched are computed. The measured index build is about 22 ms for the medium dataset
  (spec 001), which is well inside interaction budgets even for 2,500-door previews.
  Previews are never persisted, so "derived, never persisted" holds.
- **Alternatives considered**: Add `previewDoor(door, overrides)` to the engine core.
  Rejected for now because it widens the core API and needs a new test-first cycle; the
  rebuild approach gives identical results (asserted by test against a reloaded
  dataset).

## R3 — Retail vs SPM counts (tier dialog impact)

- **Decision**: Classify the assorted SKU ids by `cr380_skutype` (860080000 Retail,
  860080001 SPM) from the SKU records. SKUs with no type count toward the total only.
- **Rationale**: The constitution flags SKU Type as "verify availability". The column is
  present in the generated model and schema (`cr380_skutype`, `cr380_skutypename`), so
  it is read-only and available. If it turns out to be empty in the environment, the
  dialog shows totals only (unit-tested fallback). This is listed in Data Gaps as
  "verify".

## R4 — Excel export, templates, upload parsing (exceljs)

- **Decision**: Add **`exceljs` 4.4.0 (MIT)** as a runtime dependency. Load it **only on
  demand** through `await import('exceljs')` inside `src/lib/excel/` so it lands in its
  own lazy chunk (add a `vendor-exceljs` code-splitting group). Exports call
  `workbook.xlsx.writeBuffer()`, then create a `Blob` and an object URL and click a
  temporary anchor. No network is involved, so connector-first is unaffected.
  - **Templates** (re-tier and SKU): an _Update_ sheet with the header row and one
    example row, list data validations (dropdowns) for _New tier_ (active tier names) and
    _Action_ (Add/Remove), and a _Rules_ sheet listing the column rules from FR-039.
  - **Upload `.xlsx`**: `workbook.xlsx.load(arrayBuffer)`, reading the first sheet and
    matching headers by name (case-insensitive, trimmed). Header order does not matter.
  - **Upload `.csv`**: a small pure RFC 4180 parser (`parseCsv.ts`). The exceljs CSV
    reader depends on Node streams and is not part of its browser build.
  - Column widths and a bold header row are set through exceljs. No cell colours are
    used, so no brand colours leak outside `token.ts`.
- **Rationale**: exceljs is the library the user named. Lazy loading keeps the initial
  bundle unchanged (its minified browser build is about 1 MB) and limits the cost to the
  first export or upload.
- **Alternatives considered**: SheetJS. Rejected because the user mandated exceljs and
  the current SheetJS licence/distribution is outside npm. CSV-only export was rejected
  because the user asked for Excel.

## R5 — Routing and deep links

- **Decision**: Rename the screen id `mass-update` to `bulk-update`, with path
  `/doors/bulk-update`, title "Bulk Update" and breadcrumb `Doors`. Register a
  redirect route `/doors/mass-update` that renders `<Navigate replace
to="/doors/bulk-update">`. Static segments outrank `/doors/:doorId` in React Router 7,
  so neither path is captured as a door id. Rows navigate to `/doors/{cr380_doorid}`.
  `HashRouter` is unchanged.
- **Rationale**: FR-030, FR-051 and US6 scenario 4. The breadcrumb and the highlighted
  navigation item come from the existing `ScreenDefinition` registry.

## R6 — Where screen state lives (FR-052, FR-033)

- **Decision**:
  - **Doors filters, search, saved filter, sort and page** go in the **URL query** of
    `#/doors?…` (`useSearchParams`), serialized by a pure `doorQuery.ts` (parse and
    stringify, with unknown values dropped). The query is deep-linkable and survives a
    reload.
  - **Selection** (door ids) goes in a session-scoped in-memory store
    (`src/lib/session/doorSelection.ts`, built on `useSyncExternalStore`). It is too large
    for a URL and is shared by Doors and Bulk Update.
  - **Bulk Update entry intent** (`{ type?: 'tier' | 'sku'; startStep?: 1 }`) travels in
    router `location.state`. The workflow state itself lives in a reducer inside
    `features/bulk-update`. The "Hide intro" flag is kept in the session store.
  - The breadcrumb, Cancel and "View doors" links rebuild `#/doors?…` from the last
    Doors query, which the session store keeps.
- **Rationale**: This matches the prototype, which keeps filters and selection when you
  return. Nothing derived from the assortment is stored (constitution XIII), and no
  browser storage is used.
- **Alternatives considered**: `sessionStorage`. Not needed and adds a reload-semantics
  question. A global state library. Not installed and not needed.

## R7 — Dataverse writes (generated services only)

- **Decision**:
  - **Set tier**: `Cr380_doorsService.update(id, { 'cr380_TierID@odata.bind':
'/cr380_tiers(<tierId>)' })`. The entity set `cr380_tiers` comes from the schema's
    `x-ms-dataverse-entityset`.
  - **Undo to "no tier"**: `{ 'cr380_TierID@odata.bind': null }`. The schema marks
    `cr380_tierid` as `required`, so the environment may reject this. That door is then
    reported as an undo failure (FR-048) and listed in Known Limitations. The doors
    themselves prove the field is nullable in practice, since "Needs tier" doors exist.
  - **Create exception**: `Cr380_assortmentexceptionsService.create({
'cr380_DoorID@odata.bind': '/cr380_doors(<doorId>)', 'cr380_SKUID@odata.bind':
'/cr380_skus(<skuId>)', cr380_exceptionlevel: 860080000 /* Door */,
cr380_exceptionaction: 860080000 | 860080001, cr380_exceptionstatus: 860080000 /*
Active */, cr380_reason, cr380_exceptionname: '<Door key> · <SKU key> · <Add|Remove>',
cr380_datereported: <today ISO> })`. `statecode` is left to the server default.
  - **Undo of an exception** (clarified): `update(id, { cr380_exceptionstatus: 860080001
/* Cancelled */ })`. The engine and the loaders already ignore non-Active status.
  - The `@odata.bind` key types the generated model requires are satisfied through a
    typed helper `bindTo(entitySet, id)`. Choice values are named constants next to the
    generated enums.
- **Rationale**: These are the instructions-file patterns ("lookups read `_field_value`
  and write `@odata.bind`; choices are integers"). No raw HTTP is used.

## R8 — Re-check before saving (clarified FR-045)

- **Decision**: Immediately before writing, re-read **only the scope** in chunks of 50
  ids per request: doors with `select=[cr380_doorid,_cr380_tierid_value,cr380_doorstatus]`
  and an `or` filter on `cr380_doorid`, and active door-level exceptions with an `or`
  filter on `_cr380_doorid_value`. Compare each row with the snapshot taken at step 3.
  For re-tier, the row is stale when the door's tier or status changed. For SKU rows, it
  is stale when the door's set of active exceptions for that SKU changed or the door's
  tier changed. Stale rows are skipped and reported as "Changed by someone else — not
  updated".
- **Rationale**: This is about 2 × ⌈n/50⌉ reads instead of n reads, and it bounds the
  window between check and write to seconds.

## R9 — Write throughput, progress and partial failure

- **Decision**: A pure `runPool(tasks, concurrency = 4)` in `src/lib/async/`. Each task
  resolves to `{ ok: true, id } | { ok: false, error }`. Progress (`done/total`) is shown
  in the result area's polite live region while applying. The result summarizes
  succeeded, failed (with door names and the error text from `IOperationResult.error`)
  and stale rows, and offers **Retry failed rows**, which re-runs only the failures with
  the same re-check. The undo log records only successful writes.
- **Rationale**: The generated services expose no batch operation. A small concurrency
  cap avoids Dataverse service-protection throttling (429) on 2,500 to 5,000 writes. A
  429 response surfaces as a failure that can be retried.
- **Alternatives considered**: Sequential writes, which would take several minutes for
  5,000 rows (fails SC-004 in spirit). Unbounded `Promise.all`, which risks throttling.

## R10 — Grid and shared prototype components

- **Decision**: Add the missing ChanelUI replicas listed in constitution XII as
  `src/components/<Name>/`, each a thin, token-styled wrapper over Ant Design:
  `DataGrid` (Table: zebra rows, small size, `fixed: 'left'` pinned columns, width
  presets wide/medium/narrow from tokens, keyboard row activation, `rowSelection`,
  pagination with `showTotal`), `StatusIndicator` (tone + label, icon-only variant),
  `KpiTile`, `Field` (label, required mark, help, control), `FormGrid`,
  `WorkflowSection` (numbered section), `FormActions`, and `ConfirmAction`
  (Popconfirm-style). Ant Design components are used directly for Input, Select,
  Tag.CheckableTag, Button, Modal, Steps, Radio.Group, Segmented, Upload.Dragger, Result,
  Flex and message.
- **Rationale**: FR-050 and constitution XII. Prototype anatomy is reproduced
  one-to-one.
- **Grid size**: 5,000 doors paged at 50 needs no virtualization. Sorting and filtering
  are client-side over memoized arrays.

## R11 — Filtering performance (SC-002)

- **Decision**: Use a pure `filterDoors(rows, query, today)` in `src/lib/doors/` over
  pre-computed **view rows** (`DoorRow`, built once per data version with lower-cased
  search keys, a status category, a "closed" flag, the tier rank and the SKU count from
  `engine.getCounts().byDoor`). Search input goes through `useDeferredValue`. A unit
  performance test asserts under 50 ms for 5,000 rows.
- **Rationale**: This keeps input latency at or below 100 ms (constitution target) and
  makes the filter logic testable without React.

## R12 — Saved filters and status semantics (clarified)

- **Decision**: The definitions live in `src/lib/doors/savedFilters.ts` (shared by Doors
  and Bulk Update):
  - `needs-tier`: no `_cr380_tierid_value`.
  - `fragrance-only`: `cr380_productline === 'Fragrance'`, an exact match consistent with
    the engine's exact Axis ↔ Product Line rule.
  - `recent`: `cr380_openingdate` is set and falls in `[today − 90 d, today]` (calendar
    days, local date). `cr380_lastopeningdate` is ignored.
  - `closed`: status category `closed`.

  **Status category** is computed from `cr380_doorstatus` text (trimmed,
  case-insensitive): `open` (Open) maps to success, `pre-trade` (Pre-Trade) to info,
  `project` (Project (MTP) / Project) to neutral, `closed` (Closed or Cancelled) to
  unavailable, and any other value to neutral. The label shown is the original text.
  **Bulk Update saved-filter source** offers `needs-tier`, `recent` and `fragrance-only`,
  always excluding closed doors.

- **"Today"** comes from an injectable clock (`src/lib/clock.ts`) so tests are
  deterministic.

## R13 — Upload matching and validation rules

- **Decision**: Door key is matched trimmed and upper-cased against `cr380_doorkey`
  (also upper-cased). Tier name is matched trimmed and case-insensitive against active
  tier names. SKU key is matched trimmed against `cr380_skukey`. Action is matched
  case-insensitive against `add` or `remove`. Row numbers are the sheet row numbers
  (header = 1). Row-limit and extension checks run before parsing (`.xlsx`/`.csv`,
  at most 2,500 data rows for tier and 5,000 for SKU, empty files rejected). Duplicate
  handling follows the spec Edge Cases. The rules are a pure
  `checkRows(rawRows, context)` in `features/bulk-update/`, mirroring the prototype's
  `muRows` order (FR-040 and FR-041 first-match-wins).

## R14 — Suggested reasons

- **Decision**: Use the prototype's `REASONS` lists. For tier: "New door opening",
  "Sales above tier threshold", "Sales below tier threshold" and "Retailer request"
  (**"Q3 cluster review" removed** for consistency with the dropped filter). For SKU:
  "Launch distribution", "Fixture constraint", "Retailer agreement" and "Limited
  edition allocation". The picks are shown as small buttons under the reason field;
  the selected one is primary. Help text for tier reasons states that the reason is not
  saved (FR-055).

## R15 — Icons

- **Decision**: Export uses `DownloadOutlined`, Bulk Update uses `SyncOutlined` (the
  "update" icon; `@ant-design/icons` has no dedicated "Update" glyph), More filters uses
  `FilterOutlined`, and Download template / Download rows that need attention use
  `DownloadOutlined`.

## R16 — Deterministic E2E data

- **Decision**: In `vite --mode e2e`, also alias `@microsoft/power-apps/data` to
  `e2e/fixtures/power-apps-data.stub.ts`. Its `getClient()` serves an in-memory fixture
  dataset (`e2e/fixtures/dataset.ts`: about 120 doors across all statuses and product
  lines including "Fragrance", 4 tiers, 60 SKUs of both types, rules, and door and
  retailer exceptions). It supports the subset of `select`, `filter` (`eq`, `and`, `or`,
  `ne null`) and `top`/`skipToken` that the loaders and re-checks use, plus
  `createRecordAsync` and `updateRecordAsync`, which mutate the in-memory set. Query
  flags `?data=error|slow|empty|throttle` exercise the region states and failure paths.
  Unit tests mock the generated services directly (existing pattern).
- **Rationale**: Constitution XI requires fixtures injected at the data-access layer and
  no live Dataverse.

## R17 — Visual baselines

- **Decision**: Recapture the `doors` baselines from the prototype, and rename the
  `mass-update` baselines to `bulk-update`. Both are captured by the human-run
  `prototype-baseline` project. The capture's normalize step masks all data-bearing
  regions (grid, description counts, selection bar, rows and impact grids) and rewrites
  the prototype's "Mass update" title and button labels to "Bulk Update" so that wording
  is not counted as a diff. The prototype's "Q3 cluster review" chip is hidden in the
  baseline. Bulk Update baselines are captured at step 1 (intro, steps, cards).
- **Rationale**: Constitution XI (masking, `maxDiffPixelRatio` 0.01, human-approved
  baselines).

## R18 — Last changed on

- **Decision**: Show `modifiedon` (local date "D Mon YYYY") and the initials of
  `modifiedbyname`. Sort by `modifiedon`. Recorded in Data Gaps as record-level rather
  than tier-specific (spec).
