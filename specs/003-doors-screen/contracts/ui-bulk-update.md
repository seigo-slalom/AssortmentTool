# UI Contract: Bulk Update

**Feature**: [../spec.md](../spec.md) · State model: [data-model.md §5](../data-model.md).

## Entry points

| From                          | Navigation                                                    | Initial state                                       |
| ----------------------------- | ------------------------------------------------------------- | --------------------------------------------------- |
| Doors header "Bulk Update"    | `#/doors/bulk-update`                                         | step 0; `doorIds` = current selection               |
| Selection bar "Change tier"   | `#/doors/bulk-update`, state `{ type: 'tier', startStep: 1 }` | step 1, source `selection`                          |
| Selection bar "Add exception" | `#/doors/bulk-update`, state `{ type: 'sku', startStep: 1 }`  | step 1, source `selection`                          |
| Direct address / reload       | `#/doors/bulk-update`                                         | step 0; selection from session store (may be empty) |

Default source when no selection: `filter` (tier) / `upload` (sku).

## DOM contract

```text
div[data-screen=bulk-update]
├── header page-header: breadcrumb [Doors → #/doors?{last query}] · eyebrow "Strategy" · title "Bulk Update"
│   description "Change many doors at once. You see every row checked and the impact per door before anything is saved."
│              | (done) "Update applied. Follow its progress below; you can undo it from here."
├── section data-testid="bulk-intro" aria-labelledby (hidden after "Hide" or when done)
│   ├── h2 "How bulk update works"   button "Hide"
│   └── ol > li × 4: 1 Choose the change · 2 Choose the doors · 3 Check the rows · 4 Review and apply
├── nav.ant-steps data-testid="bulk-steps" (not when done) — 4 items, current = step, descriptions per FR-032
└── div data-testid="bulk-panel"
    ├── [step 0] WorkflowSection 1 "Choose the change"
    │   ├── button[aria-pressed] data-testid="bulk-card-tier"  "Re-tier doors" + facts
    │   ├── button[aria-pressed] data-testid="bulk-card-sku"   "Add or remove SKUs at specific doors" + facts
    │   ├── div data-testid="bulk-redirect" "SKUs for a whole tier or retailer?" — buttons "Open Tier assortments" (#/tier-assortments) · "Add a retailer exception" (#/exceptions)
    │   └── FormActions: "Cancel" (→ Doors) · "Continue" (primary, disabled until type)
    ├── [step 1] WorkflowSection 2 "Choose the doors and the new tier" | "Choose the doors and the SKUs"
    │   ├── radio group aria-label="Where the doors come from": selection (n|none selected, disabled if 0) · "A saved filter" · upload label
    │   ├── selection text: first 4 names "and N more"
    │   ├── filter: Field "Saved filter" options "Needs tier · n doors" · "Opened in last 90 days · n doors" · "Fragrance-only product line · n doors"
    │   │          help "Uses the same saved filters as the Doors screen. Closed doors are left out."
    │   ├── tier: Field "New tier" (required) help "Every door in scope moves to this tier. To give doors different tiers, upload a file."
    │   ├── sku:  Field "Action" radio "Add the SKUs"|"Remove the SKUs" · Field "Add SKUs by group" (Franchise / Line groups, "{name} · n SKUs") · Field "SKUs" multi-select search "Search by SKU key or name"
    │   ├── upload: panel "1 · Download the {re-tier|SKU exception} template" (template-columns grid, button [DownloadOutlined] "Download template")
    │   │          panel "2 · Upload the completed file": Upload.Dragger accept=".xlsx,.csv" "Drop the file here or click to browse" / ".xlsx or .csv · {limit text}"
    │   │          after upload: StatusIndicator success "{file} · {n} rows read" + link "Replace file"
    │   ├── span scope text ("N rows to check." | "Choose the new tier to continue." | "Choose at least one SKU to continue." | "Upload a file to continue.")
    │   └── FormActions: "Back" · "Check the rows" (primary, disabled until ready)
    ├── [step 2] WorkflowSection 3 "Check the rows"
    │   ├── intro text (prototype checkIntro)
    │   ├── status totals: StatusIndicator × (ready|warning|no change|skipped|error) with counts > 0
    │   ├── left-out panel (critical if errors): "{n} rows will be left out" + reasons sentence
    │   ├── Segmented aria-label="Rows to show": "All rows (n)" · "Needs attention (n)"
    │   ├── button [DownloadOutlined] "Download rows that need attention" (if any) → Rows_to_fix_{YYYY-MM-DD}.xlsx
    │   ├── DataGrid data-testid="bulk-rows" cols Row · Door key · Door · Change · Status · Details (100/page when > 100)
    │   └── FormActions: "Back" · "Review impact (n rows)" | "No rows to apply" (disabled)
    ├── [step 3] WorkflowSection 4 "Review and apply"
    │   ├── p summary sentence
    │   ├── KpiTile × 4: Doors changing · Net SKU change per door (average)|Door exceptions created · SKU changes across doors · Rows left out (+status)
    │   ├── ScreenRegion "Before and after, per door" > DataGrid data-testid="bulk-impact"
    │   │      cols Door* · Door key · Tier before|Tier · Tier after|Change · SKUs before · SKUs after · Difference · Note
    │   ├── section "What happens when you apply" ol: Saved immediately when you apply. · Nothing to wait for: … every screen shows the result straight away. · You can undo the whole update from the confirmation screen.
    │   ├── Field "Why is this change being made?" (required, ≤ 280, reason picks; tier help says not saved; SKU help "Saved on each exception.")
    │   └── FormActions: "Back" · "Re-tier N doors" | "Create N exceptions" (primary, disabled until reason)
    └── [done] Result status success|info|warning (partial) title/sub-title
        ├── Steps size small: Saved · Assortment updated
        ├── span[aria-live=polite] data-testid="bulk-progress" — "Applying {done} of {total}…" then summary
        ├── (partial) list data-testid="bulk-failures": failed + "Changed by someone else — not updated" rows; button "Retry failed rows"
        └── actions: "View doors" (primary → #/doors?{last query}, selection cleared) · ConfirmAction "Undo this update" (title "Undo this bulk update?") · "Start another update" (text)
```

## Result copy

| Case         | Title                                       | Sub-title                                                         |
| ------------ | ------------------------------------------- | ----------------------------------------------------------------- |
| Tier applied | `{n} doors moved to {tier                   | their new tiers}.`                                                | `Applied {n} of {m} rows.` + stale/failed counts if any |
| SKU applied  | `{n} door exceptions created at {d} doors.` | same                                                              |
| Undone       | `Update undone`                             | `Every change from this update was reversed.` (or partial counts) |

## Keyboard / a11y

Cards are `button[aria-pressed]`; disabled card has `aria-disabled` and explanation text.
Step changes move focus to the new WorkflowSection heading. The dragger is reachable by Tab
and opens the file dialog with Enter/Space. Progress and result are announced via the
polite live region.
