# Quickstart: Validate Doors Screen & Bulk Update

**Feature**: [spec.md](./spec.md) · Contracts: [ui-doors](./contracts/ui-doors.md),
[ui-bulk-update](./contracts/ui-bulk-update.md), [data-and-logic](./contracts/data-and-logic.md)

## Prerequisites

- Node 22.22.2+ / 24.15+; `npm ci` done; Playwright Chromium installed
  (`npx playwright install chromium`).
- `exceljs` added to `dependencies` (plan); no other new packages.
- No live environment needed: unit tests mock generated services; E2E runs
  `vite --mode e2e` with the host **and data** stubs (research R16).

## 1. Static gates

```powershell
npm run build          # strict TS + Vite; exceljs in its own lazy chunk (vendor-exceljs)
npm run lint
npm run format:check
```

Expected: all clean; the initial (non-lazy) bundle does not include exceljs.

## 2. Unit tests (100% coverage gate)

```powershell
npm run test:coverage
```

Expected: all pass; statements/branches/functions/lines = 100%. Key suites:

| Area                   | Proves                                                                                                                                                                                                           |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `lib/data`             | record mapping; `toEngineDataset` ≡ engine loaders; preview overrides ≡ reloaded dataset; write payloads (binds, choice values, null-tier undo, Cancelled status); recheck chunking (≤ 50 ids)                   |
| `lib/doors`            | status categories/tones; 4 saved filters incl. 90-day boundaries (today−90, today, today+1, missing date) and exact "Fragrance"; AND semantics; closed default; query round-trip; sort; 5,000-row filter < 50 ms |
| `lib/excel`            | workbook headers = grid columns; CSV parser (quotes, CRLF, BOM); file validation messages; templates contain dropdown validations + Rules sheet                                                                  |
| `lib/async/runPool`    | ordering, concurrency cap, progress, failure isolation                                                                                                                                                           |
| `features/bulk-update` | reducer transitions/guards; FR-040/FR-041 first-match-wins for every status; duplicates; impact KPIs and sentence; apply skips stale rows, records failures, undo reverses successes only                        |
| pages/components       | US1–US6 acceptance scenarios with mocked data (filters, selection bar, primary-button switch, tier dialog enable/disable/impact/error, all four steps, result, undo confirm)                                     |

## 3. E2E (deterministic fixtures)

```powershell
npm run test:e2e -- --project=e2e
```

Expected suites and outcomes:

- `e2e/doors/doors.spec.ts`: grid lists fixture doors minus Closed/Cancelled; each saved
  filter yields the fixture's expected count; "Q3 cluster review" absent; More/Fewer
  filters count; Clear filters; paging "1–50 of N"; row Enter → `#/doors/{id}` and
  breadcrumb back restores `?query`; Export downloads `Doors_filtered_YYYY-MM-DD.xlsx`
  whose rows/headers equal the grid (read back with exceljs in the test).
- `e2e/doors/tier-dialog.spec.ts`: inline tier change → impact text → Save disabled until
  reason → success toast and updated SKU count; `?data=error` on write keeps dialog open.
- `e2e/bulk-update/bulk-update.spec.ts`: selection → Change tier → step 2 preselected →
  check rows → review → apply → result → undo; SKU flow creates exceptions; upload a
  generated .xlsx with an unknown Door key, a bad tier, a closed door and a no-change row →
  exact status counts; "Download rows that need attention"; `#/doors/mass-update`
  redirects; reload on `#/doors/bulk-update` starts at step 1 with selection option
  disabled when none selected; `?data=throttle` shows partial result + Retry failed rows.
- `e2e/shell/*` (updated): routes/titles include Bulk Update; responsive (7 viewports, no
  document overflow, grid scrolls inside region) and axe (0 WCAG 2.1 AA violations) for
  Doors, each Bulk Update step, result, and tier dialog.

## 4. Visual comparison

```powershell
# human-only, once, after approving baseline changes:
npx playwright test --project=prototype-baseline --update-snapshots
npx playwright test --project=visual
```

Expected: `doors-*` and `bulk-update-*` (step 1) baselines pass at `maxDiffPixelRatio
0.01` with data regions masked and prototype "Mass update" wording normalized (R17).

## 5. Manual smoke in a real environment (human)

After a human `npm run build` + `pa app push` to the configured environment:

1. Doors loads real doors; "Needs tier" count equals doors with an empty Tier.
2. "Fragrance-only product line" shows only doors with product line `Fragrance`.
3. Change one door's tier, then undo it with a second change.
4. Bulk Update a 2-door selection to another tier, then Undo; verify both tiers restored.
5. Bulk Update SKU Add for 1 door × 1 SKU, then Undo; verify the exception is
   `Cancelled`.
6. Record results (and whether clearing a tier on undo is permitted — research R7) in the
   spec's Verification & Known Limitations.
