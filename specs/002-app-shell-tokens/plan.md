# Implementation Plan: App Shell & Design Tokens

**Branch**: `002-app-shell-tokens` | **Date**: 2026-10-26 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/002-app-shell-tokens/spec.md`

## Summary

Replace the starter placeholder UI with the prototype's branded application frame and a
single typed design-token source. `src/theme/token.ts` mirrors the prototype's ChanelUI
token object (identical to the constitution's Canonical Brand Tokens); CSS custom
properties, the Ant Design theme, font faces, and the chart palette are **derived** from
it by pure, unit-tested builders ported from the prototype's own design-system bundle.
A token-styled `AppShell` (56 px header, 240/64 px collapsible rail, compact drawer,
content capped at 2200 px, per-tier padding) hosts six lazily loaded screens — Overview,
Doors, Door detail, Mass update, Tier assortments, Exceptions — each in its own folder,
each showing the prototype page header and a labeled placeholder region. Excluded screens
are never routed. Hash routing makes every screen bookmarkable inside the Power Apps host.
Quality is proven by 100%-coverage Vitest suites (including token parity and a
no-hardcoded-style scan) and a Playwright suite covering the 7-viewport matrix, axe
accessibility checks, and screenshot comparison against baselines captured from the
prototype itself.

## Technical Context

**Language/Version**: TypeScript ~6.0 (strict), React 19.3, Node.js 22.22.2+ / 24.15+

**Primary Dependencies**: Ant Design 6.6 + `@ant-design/icons` 6.3 (themed only via
tokens), React Router 7.18 (`HashRouter`, `NavLink`), Vite 8 (CSS Modules, `?url` asset
import), `@microsoft/power-apps` 1.4 (host context only). **New dev dependency**:
`@axe-core/playwright` (see Complexity Tracking).

**Storage**: N/A — no data read or persisted; shell UI state is in-memory per session.

**Testing**: Vitest 5 + Testing Library + jsdom (unit, 100% coverage thresholds already
configured); Playwright 1.63 (`e2e/`, Chromium) for viewport matrix, accessibility, and
`toHaveScreenshot` visual comparison.

**Target Platform**: Power Apps code app in the Power Apps web player (evergreen
Chromium/Edge, Firefox, Safari), desktop and mobile browsers, 320 px → 2560+ px wide.

**Project Type**: Single-project front-end web app (Power Platform code app).

**Performance Goals**: First meaningful render ≤ 3 s in host (SC-009); tier switch on
resize without reload; screen modules lazy-loaded.

**Constraints**: No literal colors / px / font families outside `token.ts`; no
direct HTTP; no secrets; WCAG 2.1 AA; prototype fidelity ≤ 1% pixel diff on masked
screenshots; E2E must not touch a live environment.

**Scale/Scope**: 6 in-scope screens + not-found, 4 nav destinations, 4 shared components
(AppShell, PageHeader, ScreenRegion, RegionState), 7 viewports, 42 visual baselines.

### Power Platform Code App Context

**Data sources & connectors**: N/A — the shell reads no data.

**Generated services required**: none — placeholder only. Existing `src/generated/`
services are untouched.

**Connection IDs needed**: none.

**Target environment**: unchanged; single human-configured environment in
`power.config.json` (not committed).

**Connector workarounds**: none.

**UI library**: Ant Design v6 (as pinned) themed exclusively from `src/theme/token.ts`
(constitution "UI component library confirmation"); ProComponents not used.

**Accessibility target**: WCAG 2.1 AA (3 px ink focus ring, 44 px compact targets,
reduced motion, landmarks, skip link).

**Constraints check**: connector-first (no fetch/axios — unchanged ESLint rules); no
secrets in bundle; Node 22+; `npm run build` clean before any human `pa app push`.

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-checked after Phase 1 design._

| #    | Principle                           | Pre-research | Post-design | Evidence                                                                                                                                                                                    |
| ---- | ----------------------------------- | ------------ | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| I    | Code-app scope only                 | ✅           | ✅          | Only `src/`, `e2e/`, config files change                                                                                                                                                    |
| II   | Connector-first                     | ✅           | ✅          | No data access; no HTTP; E2E stub is build-time alias (R9)                                                                                                                                  |
| III  | Generated services source of truth  | ✅           | ✅          | `src/generated/` untouched                                                                                                                                                                  |
| IV   | Human-only deployment               | ✅           | ✅          | No push / data-source commands in plan or quickstart                                                                                                                                        |
| V    | Strict TS, build-before-push        | ✅           | ✅          | `npm run build` in quickstart gate                                                                                                                                                          |
| VI   | SDD lifecycle                       | ✅           | ✅          | specify → plan (this) → tasks → implement                                                                                                                                                   |
| VII  | Public surface, states, a11y        | ✅           | ✅          | Branded PowerProvider loading/error; RegionState; landmarks, skip link, focus (contracts/ui-shell.md)                                                                                       |
| VIII | Placeholder hygiene                 | ✅           | ✅          | Starter `PlaceholderBanner` removed; screen placeholders visibly labeled; excluded screens absent                                                                                           |
| IX   | Prototype fidelity & brand          | ✅           | ✅          | Tokens 1:1 with prototype; bundled TTF under both names; `font-synthesis: none`; side-nav label casing corrected from prototype source (spec Clarifications); screenshot diff vs. prototype |
| X    | Tokens single source                | ✅           | ✅          | Derived CSS vars / antd theme / fonts / chart palette; parity + scan tests; ESLint rule (R2, R10)                                                                                           |
| XI   | Responsive, Playwright, screenshots | ✅           | ✅          | 3 tiers via `matchMedia` from tokens; 7-viewport matrix; prototype baselines, `maxDiffPixelRatio 0.01`, data regions masked, deterministic host stub                                        |
| XII  | Modular architecture                | ✅           | ✅          | `theme/`, `components/<Name>/`, `pages/<Screen>Page/`, `hooks/`, `lib/` (see Structure)                                                                                                     |
| XIII | Engine pure & isolated              | ✅           | ✅          | Engine untouched; shell does not import it                                                                                                                                                  |
| XIV  | Tests + limitations                 | ✅           | ✅          | 100% coverage; E2E + visual; spec Verification section to be filled at implement                                                                                                            |
| XV   | Data gaps flagged                   | ✅           | ✅          | Spec Data Gaps: none                                                                                                                                                                        |

**Gate result**: PASS. One justified exception (dev-only MPL-2.0 test dependency) and two
minor prototype deviations are recorded in Complexity Tracking.

## Project Structure

### Documentation (this feature)

```text
specs/002-app-shell-tokens/
├── plan.md                          # This file
├── research.md                      # Phase 0 decisions R1–R13
├── data-model.md                    # Tokens, tiers, nav destinations, screens, UI state
├── quickstart.md                    # Validation guide
├── contracts/
│   ├── ui-shell.md                  # Routes, DOM/landmarks, viewport & visual contract
│   └── theme-and-components.md      # token.ts / builders / hooks / component props
├── checklists/requirements.md
└── tasks.md                         # /speckit-tasks (not created here)
```

### Source Code (repository root)

```text
src/
├── main.tsx                         # MODIFY: HashRouter; ThemeProvider replaces bare ConfigProvider
├── App.tsx                          # REWRITE: AppShell + lazy routes from lib/screens
├── App.test.tsx                     # REWRITE: routing, selection, not-found, titles
├── index.css                        # DELETE (replaced by theme/global.css)
├── PowerProvider.tsx                # MODIFY: branded token-styled loading/error states
├── PowerProvider.test.tsx           # UPDATE
├── assets/fonts/ABChanel Corpo Regular.ttf   # existing, bundled via ?url
├── theme/
│   ├── token.ts                     # NEW: the only literal style values
│   ├── token.test.ts                # parity with constitution canonical tokens
│   ├── cssVariables.ts (+ .test.ts) # buildCssVariables(density)
│   ├── antdTheme.ts (+ .test.ts)    # buildAntdTheme(density, { compact })
│   ├── fontFaces.ts (+ .test.ts)    # buildFontFaceCss(url) + TTF ?url import
│   ├── chart.ts (+ .test.ts)        # chartPalette
│   ├── ThemeProvider.tsx (+ .test.tsx)  # ConfigProvider, .cds-root vars, data-tier/density, <style> fonts
│   ├── global.css                   # resets, focus ring, display-face rules, reduced motion — var() only
│   └── noHardcodedStyles.test.ts    # scan of src/** for literal style values
├── hooks/
│   ├── useLayoutTier.ts (+ .test.ts)    # tierForWidth + matchMedia hook
│   └── useDocumentTitle.ts (+ .test.ts)
├── lib/
│   ├── navigation.ts (+ .test.ts)   # 4 NavDestinations, excluded deny-list test
│   └── screens.ts (+ .test.ts)      # ScreenDefinition registry + documentTitle()
├── components/
│   ├── AppShell/   AppShell.tsx · AppShell.module.css · AppShell.test.tsx
│   │               SideNav.tsx · SideNav.module.css · SideNav.test.tsx
│   │               SkipLink.tsx · SkipLink.module.css · SkipLink.test.tsx · index.ts
│   ├── PageHeader/ PageHeader.tsx · PageHeader.module.css · PageHeader.test.tsx · index.ts
│   ├── ScreenRegion/ ScreenRegion.tsx · ScreenRegion.module.css · ScreenRegion.test.tsx · index.ts
│   ├── RegionState/  RegionState.tsx · RegionState.module.css · RegionState.test.tsx · index.ts
│   ├── ErrorBoundary.tsx (+ test)   # MODIFY: render RegionState error
│   └── PlaceholderBanner.tsx (+ test)   # DELETE (FR-014)
└── pages/
    ├── OverviewPage/          OverviewPage.tsx · OverviewPage.test.tsx · index.ts
    ├── DoorsPage/             DoorsPage.tsx · DoorsPage.test.tsx · index.ts
    ├── DoorDetailPage/        DoorDetailPage.tsx · DoorDetailPage.test.tsx · index.ts
    ├── MassUpdatePage/        MassUpdatePage.tsx · MassUpdatePage.test.tsx · index.ts
    ├── TierAssortmentsPage/   TierAssortmentsPage.tsx · TierAssortmentsPage.test.tsx · index.ts
    ├── ExceptionsPage/        ExceptionsPage.tsx · ExceptionsPage.test.tsx · index.ts
    └── NotFoundPage/          NotFoundPage.tsx · NotFoundPage.test.tsx · index.ts

e2e/
├── home.spec.ts                     # DELETE (superseded)
├── fixtures/
│   ├── power-apps-app.stub.ts       # getContext() fixture (aliased in --mode e2e)
│   ├── viewports.ts                 # 7-viewport matrix + expected tier
│   └── screens.ts                   # screen ids → addresses (from contracts/ui-shell.md)
├── shell/
│   ├── structure.spec.ts            # landmarks, nav set/order, selection, breadcrumbs, not-found, titles, back/forward
│   ├── responsive.spec.ts           # 6 screens × 7 viewports: overflow, tier, nav mode, touch targets, live resize
│   ├── accessibility.spec.ts        # axe WCAG 2.1 AA, skip link, focus ring, drawer focus trap/return, reduced motion
│   └── host-states.spec.ts          # branded loading / error via stub flags
└── visual/
    ├── normalize.ts                 # shared hide/mask stylesheet for app + prototype
    ├── prototype.capture.ts         # project "prototype-baseline" (human, --update-snapshots)
    ├── app.visual.spec.ts           # project "visual": 42 comparisons, maxDiffPixelRatio 0.01
    └── __baselines__/               # 42 PNGs captured from the prototype

vite.config.ts                       # MODIFY: e2e-mode alias for @microsoft/power-apps/app
playwright.config.ts                 # MODIFY: projects e2e / visual / prototype-baseline; port 5174 --mode e2e; snapshotPathTemplate
eslint.config.js                     # MODIFY: no-restricted-syntax for literal inline styles / sizing props
vitest.config.ts                     # MODIFY: css modules config; exclude index.ts barrels if type-only
package.json                         # MODIFY: add @axe-core/playwright (dev)
.specify/memory/frontend-standards.md  # MODIFY: HashRouter note + theme/ layout
```

**Structure Decision**: Single front-end project following constitution Principle XII.
Every screen has its own folder in `src/pages/`; shared, prototype-replica building blocks
live in `src/components/<Name>/`; all styling primitives live in `src/theme/`. Feature
folders (`src/features/overview`, `doors`, `mass-update`, `tiers`, `exceptions`) are
introduced by the screen-content specs, not by this shell spec.

## Implementation Approach (phased)

1. **Tokens & theme foundation** (US5): `token.ts` + parity test → `cssVariables`,
   `antdTheme`, `fontFaces`, `chart` builders → `ThemeProvider` + `global.css` →
   `noHardcodedStyles` scan + ESLint rule. Delete `index.css`.
2. **Shared components** (US1): `RegionState`, `ScreenRegion`, `PageHeader`, then
   `AppShell` (`SkipLink`, `SideNav`, drawer, rail toggle) with `useLayoutTier`.
3. **Screens & routing** (US2): `lib/navigation`, `lib/screens`, seven page folders,
   `App.tsx` with lazy routes under `HashRouter`, `useDocumentTitle`; remove
   `PlaceholderBanner`; brand `PowerProvider` and `ErrorBoundary` states.
4. **Responsive & accessibility hardening** (US3, US4): tier transitions, drawer focus
   restore, compact touch targets, reduced motion, forced-colors check.
5. **E2E & visual** (US6): Vite e2e alias + stub, Playwright projects, structure /
   responsive / a11y / host-state suites, prototype baseline capture (human), visual
   comparison.
6. **Close-out**: build, lint, 100% coverage, E2E + visual green; fill spec Verification &
   Known Limitations; update `frontend-standards.md`.

## Complexity Tracking

| Item                                                                                                                                   | Why Needed                                                                                      | Simpler Alternative Rejected Because                                                                                                    |
| -------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `@axe-core/playwright` (MPL-2.0) as **dev-only** dependency; constitution asks for MIT-licensed libraries                              | SC-007 requires automated proof of 0 WCAG 2.1 AA violations on every screen                     | Manual audits aren't repeatable; no MIT-licensed equivalent of axe is as complete. Not shipped in the bundle. **Needs human approval.** |
| Prototype deviation: custom `NavLink` list instead of Ant Design `Menu` for the side nav                                               | FR-023 requires `aria-current="page"`; `Menu` exposes application-menu roles and cannot emit it | Using `Menu` would fail the accessibility requirement; visual parity is held by screenshot comparison                                   |
| Prototype deviation: added "Skip to main content" link; prototype's empty header `<nav aria-label="Main">` in side mode not reproduced | FR-021 (WCAG 2.4.1); an empty landmark is an accessibility defect                               | The skip link is visually hidden until focused, so screenshots are unaffected                                                           |
| Routing switched from `BrowserRouter` to `HashRouter` (differs from `frontend-standards.md`)                                           | Deep links / reload must work inside the static Power Apps host (FR-010)                        | `BrowserRouter` 404s on reload of nested paths without server rewrites                                                                  |
