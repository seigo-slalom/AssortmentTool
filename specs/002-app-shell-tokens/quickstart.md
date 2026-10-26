# Quickstart: Validate App Shell & Design Tokens

**Feature**: [spec.md](./spec.md) · Contracts: [ui-shell.md](./contracts/ui-shell.md),
[theme-and-components.md](./contracts/theme-and-components.md)

## Prerequisites

- Node.js 22.22.2+ or 24.15+, dependencies installed (`npm ci`).
- Playwright Chromium installed once per machine: `npx playwright install chromium`.
- No Power Platform environment or Dataverse connection is needed for any check below.

## 1. Static gates

```powershell
npm run build          # strict TypeScript + Vite build
npm run lint           # includes no-literal-style rules for TSX
npm run format:check
```

Expected: all succeed with zero errors.

## 2. Unit tests + coverage (FR-034, SC-006, SC-008)

```powershell
npm run test:coverage
```

Expected:

- All tests pass; lines/branches/functions/statements = 100%.
- `src/theme/token.test.ts` passes (token parity with the constitution).
- `src/theme/noHardcodedStyles.test.ts` passes (no literal colors, px sizes, or font
  families outside `src/theme/token.ts`).

## 3. Run the shell locally (manual look-and-feel check, SC-010)

```powershell
npx vite --mode e2e --port 5174
```

Open `http://localhost:5174/#/` beside `docs/Assortment-Tool-Prototype.html` and compare at
~390, ~1366, and ~1920 px widths:

- Header "ASSORTMENT TOOL", rail with Overview / Doors / Tier assortments / Exceptions,
  Overview selected (ink background, white text).
- `#/doors/mass-update` and `#/doors/D-001` keep Doors selected and show a "Doors"
  breadcrumb.
- `#/explorer` shows "Page not found" inside the shell.
- Below 992 px: "Open navigation" button opens a drawer; above: rail + collapse toggle.

(`--mode e2e` stubs the Power Apps host; in a real host use `npm run dev` and the Local
Play URL.)

## 4. End-to-end responsive, structure & accessibility suite (FR-035, SC-003, SC-007)

```powershell
npm run test:e2e -- --project=e2e
```

Expected: every in-scope screen passes at all 7 viewports — no horizontal overflow, correct
`data-tier` and navigation mode, landmarks and focus ring present, 0 axe WCAG 2.1 AA
violations.

## 5. Visual comparison with the prototype (FR-036, SC-004)

Baselines are captured **from the prototype** by a human, once, and whenever the prototype
changes:

```powershell
npm run test:e2e -- --project=prototype-baseline --update-snapshots
```

Then compare the app:

```powershell
npm run test:e2e -- --project=visual
```

Expected: 42 comparisons (6 screens × 7 viewports) each within `maxDiffPixelRatio: 0.01`.
On failure, open `playwright-report/` to inspect the diff. Baseline updates require human
approval in the PR.

## 6. Completion

Record results (counts, coverage, any untested scenarios, deviations) in the spec's
**Verification & Known Limitations** section before marking the spec complete.
