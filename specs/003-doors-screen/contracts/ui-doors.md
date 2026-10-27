# UI Contract: Doors Screen

**Feature**: [../spec.md](../spec.md) · Extends
[002 ui-shell contract](../../002-app-shell-tokens/contracts/ui-shell.md). `data-testid`
values are part of the contract (unit + E2E tests).

## Routes (HashRouter) — changes vs. spec 002

| Address               | Screen                                        | Selected nav | Document title                  |
| --------------------- | --------------------------------------------- | ------------ | ------------------------------- |
| `#/doors[?query]`     | Doors                                         | Doors        | `Doors · Assortment tool`       |
| `#/doors/bulk-update` | Bulk Update                                   | Doors        | `Bulk Update · Assortment tool` |
| `#/doors/mass-update` | → redirect (replace) to `#/doors/bulk-update` | Doors        | —                               |
| `#/doors/:doorId`     | Door detail (placeholder, unchanged)          | Doors        | `Door detail · Assortment tool` |

`query` keys: see [data-model.md §2 DoorQuery](../data-model.md). Example:
`#/doors?saved=needs-tier&dist=Macy%27s&sort=skus&dir=desc&page=2`.

## DOM contract (inside `main`)

```text
div[data-screen=doors]
├── header data-testid="page-header"
│   ├── span page-eyebrow "Strategy"   h1 page-title "Doors"
│   ├── p page-description  "{N} door(s) match(es) the current filters. {M} doors need a tier.|Every door has a tier."
│   └── div page-actions
│       ├── button data-testid="doors-export"       [DownloadOutlined] "Export"
│       └── button data-testid="doors-bulk-update"  [SyncOutlined] "Bulk Update"   (.ant-btn-primary iff selection empty)
├── div data-testid="doors-filters" role="search" aria-label="Filter doors"
│   ├── input  aria-label="Search door name, Door key or SAP Ship To"   data-testid="doors-search"
│   ├── select aria-label="Distributor name" (multiple)                  data-testid="filter-distributor"
│   ├── select aria-label="Tier" (multiple; active tiers by rank + "Needs tier")  data-testid="filter-tier"
│   ├── button data-testid="doors-more-filters" aria-expanded [FilterOutlined] "More filters|Fewer filters[ (n)]"
│   ├── (when expanded) selects aria-label "Online / offline" · "Door type" · "Product line" · "Door status"
│   └── button[type=link] data-testid="doors-clear-filters" "Clear filters"   (only when hasFilters)
├── div data-testid="doors-saved-filters" role="group" aria-label="Saved filters"
│   ├── span "Saved filters"
│   └── span.ant-tag-checkable[role=checkbox][aria-checked] × 4:
│       "Needs tier" · "Fragrance-only product line" · "Opened in last 90 days" · "Closed"
│       (no "Q3 cluster review")
└── section ScreenRegion label="{N} door(s)" data-testid="doors-region" data-visual-mask
    ├── (loading|error|empty) RegionState — empty text "No doors match these filters. Clear a filter to widen the list."
    ├── div data-testid="doors-selection-bar" (when selection > 0)
    │   ├── span "{n} door(s) selected"
    │   └── buttons "Change tier" (primary) · "Add exception" · "Export selection" · "Clear selection" (text)
    └── DataGrid data-testid="doors-grid"
        columns (in order, data-col):
          name* · doorKey* · tier · skus · distributor · productLine · doorType ·
          onlineOffline · salesChannel · exceptions · status · shipTo · lastChanged
          (* pinned left)
        row: tr[data-row-key=doorId][tabindex=0]  — click/Enter ⇒ #/doors/{doorId}
        checkbox aria-label="Select {door name}"
        tier cell (not closed): select aria-label="Tier for {door name}" placeholder "Assign tier"
                                 + StatusIndicator warning icon-only when no tier
        tier cell (closed): text tier name or "—"
        pagination: 50/page, showTotal "{a}–{b} of {total}"
```

## Tier change dialog

```text
div[role=dialog] aria-label="Change tier" data-testid="tier-dialog"
├── p  "Change tier for {door} from {tier|no tier} to {new tier}?"
├── Field "New tier" (required) select
├── div data-testid="tier-impact"  — impact text (FR-026) or "Choose the new tier to see the impact." / "This door is already {tier}."
├── Field "Why is this change being made?" (required) textarea maxLength 280
│   └── reason picks (buttons): New door opening · Sales above tier threshold · Sales below tier threshold · Retailer request
│       help: "Pick a reason or type your own. Tier-change reasons are not saved."
└── footer: "Cancel" · "Save change" (primary; disabled until valid)
```

Success → `message.success("{door} moved to {tier}. It now receives {n} SKUs ({r} retail · {s} SPM).")`;
failure → inline `Alert type=error` in dialog, dialog stays open.

## Export contract (exceljs)

| Trigger          | File name                           | Sheet   | Rows                              |
| ---------------- | ----------------------------------- | ------- | --------------------------------- |
| Export           | `Doors_filtered_{YYYY-MM-DD}.xlsx`  | `Doors` | filtered + sorted list, all pages |
| Export selection | `Doors_selection_{YYYY-MM-DD}.xlsx` | `Doors` | selected doors, grid sort         |

Header row = grid column titles in grid order: Door name, Door key, Tier, SKUs assorted,
Distributor name, Product line, Door type, Online / offline, Sales channel, Exceptions,
Door status, SAP Ship To, Last changed on. Values = displayed text (Tier → name or "Needs
tier"/"—"; SKUs assorted → number or empty; Exceptions → number). Toast:
`"Door list exported · {n} door(s)"`.

## Responsive / a11y

- Compact (< 992 px): filters wrap; selects full-width; grid scrolls horizontally inside
  the region (no document overflow); touch targets ≥ 44 px.
- Saved-filter tags operable with Space/Enter; grid rows reachable by Tab; Enter on a row
  navigates; the tier select and checkbox stop propagation.
- Description and region label update politely (`aria-live="polite"` on description).
