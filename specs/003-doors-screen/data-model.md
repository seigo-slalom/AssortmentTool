# Data Model: Doors Screen & Bulk Update

**Feature**: [spec.md](./spec.md) · **Research**: [research.md](./research.md)

All persisted data lives in the five generated Dataverse tables (constitution III). The
types below are **client-side** records and view models. Door × SKU assortments are
derived by the engine and never stored (constitution XIII).

## 1. Source records (`src/lib/data/records.ts`)

Mapped from generated models; `null` → `undefined`. Loaded once per data version by
`useAssortmentData()` (R1).

### DoorRecord ← `cr380_doors` (filter `statecode eq 0`)

| Field                                     | Source column                                         | Notes                                                                  |
| ----------------------------------------- | ----------------------------------------------------- | ---------------------------------------------------------------------- |
| `id`                                      | `cr380_doorid`                                        | GUID; route param for Door detail                                      |
| `name`                                    | `cr380_doorname`                                      | primary name; default sort                                             |
| `doorKey`                                 | `cr380_doorkey`                                       | upload match key (trim + upper-case)                                   |
| `shipTo` / `soldTo`                       | `cr380_sapshipto` / `cr380_sapsoldto`                 |                                                                        |
| `distributorName` / `distributorNameCode` | `cr380_distributorname` / `cr380_distributornamecode` | filter options; engine retailer match                                  |
| `onlineOffline`                           | `cr380_dooronlineoffline`                             | filter "Online / offline"                                              |
| `doorType`                                | `cr380_doortype`                                      | filter "Door type"                                                     |
| `productLine`                             | `cr380_productline`                                   | filter "Product line"; engine axis match; "Fragrance" = fragrance-only |
| `salesChannel`                            | `cr380_saleschannel`                                  | column "Sales channel"                                                 |
| `status`                                  | `cr380_doorstatus`                                    | display text; → `statusCategory` (§3)                                  |
| `openingDate`                             | `cr380_openingdate`                                   | "Opened in last 90 days"                                               |
| `tierId`                                  | `_cr380_tierid_value`                                 | `undefined` ⇒ Needs tier                                               |
| `modifiedOn` / `modifiedByName`           | `modifiedon` / `modifiedbyname`                       | "Last changed on"                                                      |

### TierRecord ← `cr380_tiers` (`statecode eq 0`)

`id` (`cr380_tierid`), `name` (`cr380_tiername`), `rank` (`cr380_rank`),
`active` (`cr380_tierstatus === 860080000`). Pickers/filters list active tiers by `rank`
then `name`.

### SkuRecord ← `cr380_skus` (`statecode eq 0 and cr380_isactive eq true`)

`id`, `key` (`cr380_skukey`), `name` (`cr380_skuname`), `axis` (`cr380_axis`),
`franchise`, `line`, `type` (`cr380_skutype`: `'retail'` 860080000 | `'spm'` 860080001 |
`undefined`).

### TierRuleRecord ← `cr380_tierrules` (`statecode eq 0 and cr380_isenabled eq true`)

`id`, `tierId`, `skuId` — engine input only.

### ExceptionRecord ← `cr380_assortmentexceptions` (`statecode eq 0 and cr380_exceptionstatus eq 860080000`)

`id`, `level` (`door`|`retailer`), `action` (`add`|`remove`), `doorId`, `skuId`,
`distributorNameCode`, `reason`. Door-level ones feed the grid's **Exceptions** count and
the SKU "already has an exception" check.

### AssortmentData (hook result)

```text
{ version, records: { doors, tiers, skus, tierRules, exceptions },
  engine: Engine,                      // createEngine(toEngineDataset(records))
  dataset: EngineDataset,              // for previews (R2)
  index: { doorById, doorByKey, tierById, tierByName, skuById, skuByKey,
           doorExceptions: Map<doorId, ExceptionRecord[]> } }
```

Invalidated (refetched) after any successful write, apply, or undo (FR-049).

## 2. Doors screen view models (`src/lib/doors/`)

### DoorRow (built once per data version)

`DoorRecord` + `tierName` (or `undefined`), `tierRank`, `statusCategory`, `statusTone`,
`isClosed`, `skuCount` (engine `getCounts().byDoor`, only when tier set and not closed),
`exceptionCount` (active door-level), `searchKey` (lower-cased `name|doorKey|shipTo`),
`lastChangedLabel` (`D Mon YYYY · XX`).

### DoorQuery (URL query of `#/doors`, R6)

| Key                    | Type                                                                  | Default | Validation                                   |
| ---------------------- | --------------------------------------------------------------------- | ------- | -------------------------------------------- |
| `q`                    | string                                                                | `''`    | trimmed for matching                         |
| `dist`                 | string[]                                                              | `[]`    | distributor names present in data            |
| `tier`                 | string[]                                                              | `[]`    | tier ids or `none` (Needs tier)              |
| `oo`, `dt`, `pl`, `st` | string \| undefined                                                   | —       | values present in data                       |
| `saved`                | `needs-tier` \| `fragrance-only` \| `recent` \| `closed` \| undefined | —       | single value                                 |
| `more`                 | boolean                                                               | derived | true if `more=1` or any of `oo/dt/pl/st` set |
| `sort`                 | `name` \| `tier` \| `skus` \| `distributor` \| `changed`              | `name`  |                                              |
| `dir`                  | `asc` \| `desc`                                                       | `asc`   |                                              |
| `page`                 | integer ≥ 1                                                           | 1       | clamped to page count                        |

Unknown keys/values are dropped on parse. `hasFilters` = any of `q, dist, tier, oo, dt,
pl, st, saved` set.

### Filter semantics (`filterDoors`, FR-007–FR-009)

1. Status gate: `saved = closed` ⇒ `isClosed`; else if `st` set ⇒ `status === st`; else
   ⇒ `!isClosed`.
2. Saved filter: `needs-tier` ⇒ `!tierId`; `fragrance-only` ⇒ `productLine ===
'Fragrance'`; `recent` ⇒ `openingDate ∈ [today−90d, today]`.
3. `dist`, `tier` (`none` ⇔ `!tierId`), `oo`, `dt`, `pl` — AND.
4. `q` ⇒ `searchKey.includes(q.toLowerCase())`.

### DoorSelection (session store `src/lib/session/doorSelection.ts`)

`Set<doorId>`; survives route changes in the session; `clear()`, `set(ids)`; ids not in
current data are pruned on data refresh. Also stores `lastDoorsSearch` (string) and
`bulkIntroHidden` (boolean).

## 3. Status category

| `cr380_doorstatus` (trim, case-insensitive) | Category  | Tone        |
| ------------------------------------------- | --------- | ----------- |
| `open`                                      | open      | success     |
| `pre-trade`                                 | pre-trade | info        |
| `project (mtp)`, `project`                  | project   | neutral     |
| `closed`, `cancelled`                       | closed    | unavailable |
| anything else / empty                       | other     | neutral     |

## 4. Tier change dialog (US3)

`TierChangeDraft { doorId, toTierId?, reason }` — `canConfirm = toTierId && toTierId !==
door.tierId && reason.trim().length > 0 && reason.length ≤ 280`. Impact = preview engine
(R2) → `{ total, retail, spm, delta? , axesLimited, isProject }`. Reason is session-only
(shown in success message; not persisted — FR-055).

## 5. Bulk Update workflow (`src/features/bulk-update/`)

### BulkState (reducer)

| Field       | Type                                         | Notes                         |
| ----------- | -------------------------------------------- | ----------------------------- |
| `step`      | 0 \| 1 \| 2 \| 3 \| `'done'`                 | 0 = Choose the change         |
| `type`      | `'tier'` \| `'sku'` \| undefined             |                               |
| `source`    | `'selection'` \| `'filter'` \| `'upload'`    | default per FR/US6-2          |
| `doorIds`   | string[]                                     | from selection store at entry |
| `filter`    | `needs-tier` \| `recent` \| `fragrance-only` | default `needs-tier`          |
| `tierId`    | string \| undefined                          | tier, non-upload              |
| `skuAction` | `'add'` \| `'remove'`                        | default `add`                 |
| `skuIds`    | string[]                                     |                               |
| `upload`    | `{ fileName, rows: RawRow[] }` \| undefined  |                               |
| `rowView`   | `'all'` \| `'issues'`                        |                               |
| `reason`    | string                                       | ≤ 280                         |
| `checked`   | `CheckedRow[]` (snapshot at step 3)          |                               |
| `result`    | `BulkResult` \| undefined                    |                               |

**Transitions**: `0 → 1` requires `type`; `1 → 2` requires (`upload` ? rows > 0 :
scope > 0 ∧ (tier ? `tierId` : `skuIds.length`)); `2 → 3` requires ≥ 1 applicable row;
`3 → done` requires `reason.trim()` and runs apply; `Back` decrements keeping fields;
changing `type` resets `tierId, skuIds, upload, source`. Entering with intent
`{ type, startStep: 1 }` and a selection ⇒ `step 1, source 'selection'`.

### RawRow

`{ line, doorKey, doorName?, value?  /* tier name */, skuKey?, action?, rowReason? }`
— built from scope doors (non-upload) or parsed file (R4/R13).

### CheckedRow

`{ key, line, doorKey, doorLabel, doorId?, change, status: 'ready'|'warning'|'nochange'|
'skipped'|'error', message, tierId?, beforeTierId?, skuId?, action?, snapshot }` where
`snapshot` captures the door's tier/status and door-SKU exception ids used by the R8
re-check. Rules: FR-040 (tier) / FR-041 (SKU), first match wins. Applicable = `ready` ∪
`warning`.

### Impact (step 4)

Per door: `{ doorId, door, doorKey, beforeLabel, afterLabel, skusBefore, skusAfter, delta,
note }` from the preview engine (R2). KPIs: `doorsChanging`, `avgNetDelta` (tier) or
`exceptionsCreated` (SKU), `skuChanges` (Σ |added| + |removed| per door), `rowsLeftOut`.

### BulkResult

`{ kind: 'applied'|'undone', type, succeeded: Change[], failed: {row, error}[],
stale: CheckedRow[], doors: number }` with `Change = { doorId, prevTierId?, newTierId } |
{ exceptionId }`. Undo uses `succeeded` only (session-scoped, FR-047); undo results
replace `result` with `kind: 'undone'` and its own failures.

## 6. Write operations (`src/lib/data/mutations.ts`, R7–R9)

| Operation              | Generated call                             | Payload                                                                   |
| ---------------------- | ------------------------------------------ | ------------------------------------------------------------------------- |
| setDoorTier            | `Cr380_doorsService.update`                | `{ 'cr380_TierID@odata.bind': '/cr380_tiers(id)' }`                       |
| clearDoorTier (undo)   | `Cr380_doorsService.update`                | `{ 'cr380_TierID@odata.bind': null }`                                     |
| createDoorException    | `Cr380_assortmentexceptionsService.create` | Door level, action, Active, reason, name, date reported, door & SKU binds |
| cancelException (undo) | `Cr380_assortmentexceptionsService.update` | `{ cr380_exceptionstatus: 860080001 }`                                    |
| recheckDoors           | `Cr380_doorsService.getAll`                | `select` tier/status; `or` filter ≤ 50 ids                                |
| recheckDoorExceptions  | `Cr380_assortmentexceptionsService.getAll` | active door-level; `or` filter ≤ 50 door ids                              |

Every operation returns `{ ok, error? }` from `IOperationResult`; never throws past the
pool.
