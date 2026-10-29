# Quickstart: Tier Assortments Screen

## Prerequisites

Node 22+, `npm install` done, Playwright browsers installed (existing project setup).

## 1. Unit tests (pure logic only)

```powershell
npx vitest run src/lib/tiers
npm test -- --coverage
```

Expected: all pass; `src/lib/tiers/**` at 100%; tier-assortments UI files are excluded
from thresholds (see plan Complexity Tracking).

## 2. Build, lint, format

```powershell
npm run build; npm run lint; npm run format:check
```

Expected: clean.

## 3. E2E smoke + accessibility (in-memory data stub, no live environment)

```powershell
npx playwright test e2e/tier-assortments
npx playwright test e2e/shell
```

Expected: tier switch, filter, group toggle → staging bar → save with reason → counts
update; axe reports 0 violations; shell viewport matrix passes for `#/tier-assortments`.

## 4. Manual check against the prototype

Run `npm run dev`, open `#/tier-assortments` beside `docs/Assortment-Tool-Prototype.html`
(Tier assortments). Verify rail, panel, chip, group list, staging bar, Save dialog, Manage
tiers, Add/Edit/Retire dialogs, SKU drawer, and Export at ~1440 px and < 1100 px.

## 5. Deploy (human only)

`npm run build` then a human runs `pa app push`.
