# Phase 0 Research: App Shell & Design Tokens

**Feature**: [spec.md](./spec.md) · **Plan**: [plan.md](./plan.md) · **Date**: 2026-10-26

All Technical Context unknowns are resolved below. Evidence for prototype facts was
extracted directly from `docs/Assortment-Tool-Prototype.html`, which embeds its own
ChanelUI design-system bundle (token object, CSS-variable builder, Ant Design theme
builder, `BrandProvider`, `AppShell`, `PageHeader`, `ScreenRegion`, `RegionState`), and
by rendering the prototype in Playwright (Edge channel) at 1366×768 and 390×844.

---

## R1. Source of truth for token values

- **Decision**: `src/theme/token.ts` mirrors the prototype's raw token object (`color`,
  `families`, `styles`, `spacing`, `radius`, `shadow`, `size`, `duration`) value-for-value,
  plus a small set of **supplementary** non-color tokens that the prototype's components
  hardcode (see [data-model.md](./data-model.md#supplementary-tokens)).
- **Rationale**: The extracted object matches the constitution's Canonical Brand Tokens
  exactly (all 25 colors, both families, 20 type styles incl. dense, 14 spacing values,
  radius, 2 shadows, sizes, breakpoints, 3 durations). Mirroring its shape lets the
  CSS-variable and Ant Design mappings be ported 1:1, which is the fastest route to visual
  parity.
- **Alternatives considered**: (a) Re-deriving tokens from screenshots — lossy, rejected.
  (b) Importing the prototype's ChanelUI bundle — not a package, not licensed for reuse,
  and would bypass Principle X; rejected.

## R2. How components consume tokens without literal CSS values

- **Decision**: Three derived layers, all generated from `token.ts`:
  1. **CSS custom properties** built by a pure `buildCssVariables(density)` function
     (port of the prototype's `A$`): `--ink`, `--canvas`, `--space-panel`,
     `--header-height`, `--duration-fast`, `--font-display`, `--font-text`, plus
     `--type-<style>-size|line` and `--cds-*` density sizes. Applied as the inline `style`
     of the root `.cds-root` element by `ThemeProvider` (values come from tokens, so this is
     not a hardcoded inline value).
  2. **Ant Design theme** built by a pure `buildAntdTheme(density, { compact })` (port of
     the prototype's `L3`) and passed to `ConfigProvider`.
  3. **CSS Modules** (`*.module.css`) per component that reference **only** `var(--…)`,
     unitless `0`, keywords, percentages / `fr`, and `calc()` over variables.
- **Rationale**: Vite supports CSS Modules natively (no new dependency); `var()` keeps
  every literal in `token.ts`; pure builders are trivially unit-testable for 100% coverage.
- **Alternatives considered**: CSS-in-JS (`antd-style`, emotion) — adds a dependency and
  runtime cost for no fidelity gain; inline `style` objects everywhere — harder to express
  `:hover`/`:focus-visible`/media queries, rejected.

## R3. Responsive tiers when media queries cannot use `var()`

- **Decision**: A `useLayoutTier()` hook (in `src/hooks/`) uses `window.matchMedia` with
  queries built from `token.size['breakpoint-standard']` / `['breakpoint-wide']` via
  `useSyncExternalStore`, returning `'compact' | 'standard' | 'wide'`. `ThemeProvider` sets
  `data-tier` (and `data-density`) on `.cds-root` and on `document.documentElement`, exactly
  as the prototype's `BrandProvider` does. CSS Modules style tiers with
  `[data-tier='compact'] .x { … }` selectors. Compact tier forces standard density (as in
  the prototype).
- **Rationale**: CSS `@media (min-width: var(--x))` is invalid; attribute selectors keep
  breakpoints single-sourced. `matchMedia` fires exactly at boundaries (991/992,
  1599/1600) and is cheaper than `resize` listeners. Matches prototype behavior verified in
  Playwright (`data-tier` = `standard` at 1366, `compact` at 390).
- **Alternatives considered**: Ant Design `Grid.useBreakpoint` — its breakpoints (xs…xxl)
  don't align with 992/1600 without overriding global screen tokens; rejected.
  `prefers-reduced-motion` stays a plain media query (no numeric value).

## R4. Font loading

- **Decision**: `src/theme/fontFaces.ts` imports the TTF via Vite (`?url`) and a pure
  `buildFontFaceCss(url)` returns two `@font-face` rules (family names from
  `token.families` — "ABChanel Corpo Display" and "ABChanel Corpo Text"), `font-weight:
100 900`, `font-display: swap`. `ThemeProvider` renders it in a `<style>` element. The
  root sets `font-synthesis: none`.
- **Rationale**: Satisfies Principle IX (bundled, no CDN, both family names) without a
  font-family string outside `token.ts`. Prototype in Playwright showed `document.fonts`
  empty (fallback faces), so baselines must inject the same TTF (R8).
- **Alternatives considered**: Static `fonts.css` — would hold family-name literals outside
  `token.ts`; `FontFace` JS API — not available in jsdom, harder to test.

## R5. Routing inside the Power Apps host

- **Decision**: Switch from `BrowserRouter` to **`HashRouter`**. Routes:
  `#/` (Overview), `#/doors`, `#/doors/:doorId` (Door detail), `#/doors/mass-update`,
  `#/tier-assortments`, `#/exceptions`, `*` (Not found).
- **Rationale**: Code apps are served as static assets inside the Power Apps player; the
  host cannot rewrite deep paths to `index.html`, so a reload on `/doors` would 404 with
  `BrowserRouter`. Hash routing needs no server support, keeps addresses bookmarkable
  (FR-010), and supports back/forward. Nesting sub-screens under `/doors` lets
  `NavLink` mark Doors as current for Door detail and Mass update without custom logic
  (FR-011).
- **Alternatives considered**: `BrowserRouter` + `basename` — fragile under the host's
  URL scheme; `MemoryRouter` — breaks bookmarking and back/forward. The prototype's flat
  `/door` and `/mass-update` keys are internal state, not URLs, so nesting is not a
  fidelity deviation. `frontend-standards.md` lists `BrowserRouter` in the provider order;
  this plan updates that note.

## R6. Navigation component (fidelity vs. accessibility)

- **Decision**: Build `SideNav` as `<nav aria-label="Main"><ul><li><NavLink>` (React
  Router), styled by CSS Module to reproduce the prototype's Ant Design inline `Menu`
  (item height 40, radius 4, padding 8, margin-block 4, icon gap 5, selected ink/white,
  hover canvas). Icons from `@ant-design/icons` (`DashboardOutlined`, `ShoppingOutlined`,
  `TableOutlined`, `FilterOutlined`). Collapsed rail (64 px) shows icons only; each link
  keeps its accessible name and a tooltip.
- **Rationale**: Ant Design `Menu` renders `role="menu"/"menuitem"` (application-menu
  semantics, discouraged for site navigation) and cannot emit `aria-current="page"`
  (FR-023). `NavLink` gives real links (open in new tab, reload) and `aria-current`
  automatically. Visual parity is enforced by screenshot comparison (R8).
- **Alternatives considered**: Ant Design `Menu` with labels as links — nested
  interactive elements and double focus stops; rejected.

## R7. Compact drawer and focus management

- **Decision**: Use Ant Design `Drawer` (`placement="left"`, width
  `min(var(--nav-drawer-width), 85vw)`, title = app name, body padding 0) as in the
  prototype. Verify focus trapping and focus return to the trigger in unit and E2E tests;
  if the pinned Ant Design version does not return focus to the trigger, `AppShell`
  restores it explicitly in `afterOpenChange`. Drawer closes on navigation, Escape, mask
  click, and when the tier leaves `compact`.
- **Rationale**: Matches prototype anatomy and inherits Ant Design's dialog semantics and
  focus lock; explicit restore guarantees FR-024 regardless of library internals.
- **Alternatives considered**: Custom dialog with a focus-trap library — new dependency
  and more code to cover; rejected.

## R8. Screenshot comparison against the prototype

- **Decision**: Two Playwright projects sharing one baseline folder via
  `snapshotPathTemplate: '{testDir}/visual/__baselines__/{arg}{ext}'`:
  - **`prototype-baseline`** (run only by a human with `--update-snapshots`): opens
    `docs/Assortment-Tool-Prototype.html` via `file://`, injects the bundled TTF as both
    families, navigates to each in-scope screen through the prototype's own nav/flows, and
    captures `<screen>-<width>x<height>.png` for all 7 viewports.
  - **`visual`** (part of the normal E2E run): captures the app at the same screen ×
    viewport and asserts `toHaveScreenshot(name, { maxDiffPixelRatio: 0.01 })`.
  - Both projects inject the same normalising stylesheet via the `style` option: hide
    data-bearing content below the page header, hide page-header description/actions, hide
    Door detail's data-driven title, and — prototype only — hide the excluded nav entries
    (Explorer…Parking lot, which are the last five items so no layout shift) and the demo
    "Viewing as" header action. Animations disabled; caret hidden.
- **Rationale**: Implements Principle XI's "baseline captured from the prototype rendered
  with the same bundled font" with masking of data regions. Verified feasible: the
  prototype renders standalone (header 56 px, rail 240 px, nine nav items, compact trigger
  "Open navigation" at 390 px, no document overflow).
- **Alternatives considered**: Baselines captured from the app itself — would only detect
  regressions, not prototype drift; rejected as non-compliant.
- **Note**: Baselines are browser- and OS-specific; they are captured and compared with
  the same Playwright Chromium on the same platform. CI is out of scope for this test app.

## R9. Running E2E outside the Power Apps host

- **Decision**: Add a Vite `e2e` mode. In that mode only, `vite.config.ts` aliases
  `@microsoft/power-apps/app` to `e2e/fixtures/power-apps-app.stub.ts`, whose
  `getContext()` resolves a deterministic fixture context. Playwright's `webServer` runs
  `vite --mode e2e --port 5174`. A query flag on the stub (`?host=error|slow`) lets tests
  exercise the branded loading/error states.
- **Rationale**: Today `PowerProvider` times out after 8 s outside the host, so no shell
  could be tested. Aliasing at the build layer keeps production code free of test seams and
  satisfies "deterministic fixtures injected at the data-access layer" with no live
  Dataverse. This feature reads no data, so no generated-service stubs are needed yet.
- **Alternatives considered**: `window.__E2E__` flag read in `PowerProvider` — ships a
  test seam to production; rejected.

## R10. Enforcing "no hardcoded style values"

- **Decision**: Two layers.
  1. **Vitest scan** (`src/theme/noHardcodedStyles.test.ts`) loads every
     `src/**/*.{ts,tsx,css}` as raw text with `import.meta.glob(…, { query: '?raw' })`,
     excluding `src/theme/token.ts`, `src/generated/**`, tests and `*.testutil.ts`, and fails
     on: hex colors, `rgb(a)/hsl(a)(`, numbers with `px|rem|em|vh|vw|ms|s` units,
     `font-family`/`fontFamily` literals, and known family names.
  2. **ESLint** `no-restricted-syntax` on `src/**/*.tsx`: forbid string/number literals
     inside JSX `style={{…}}` objects and numeric literals on sizing props
     (`gap`, `size`, `width`, `height`, `padding`, `margin`) — values must come from tokens.
- **Rationale**: The scan proves SC-005 automatically; ESLint gives instant editor
  feedback. Both are zero-dependency.
- **Alternatives considered**: Stylelint — new dependency and only covers CSS; rejected.

## R11. Automated accessibility checks

- **Decision**: Add `@axe-core/playwright` (dev dependency) and run WCAG 2.1 A/AA rules on
  every in-scope screen at one compact and one standard viewport, plus with the drawer open.
- **Rationale**: Needed to prove SC-007 ("0 WCAG 2.1 AA violations"). Dev-only, never
  bundled. License is MPL-2.0, not MIT → recorded in Complexity Tracking for approval.
- **Alternatives considered**: Manual audit only — not repeatable; Lighthouse — heavier and
  less targeted.

## R12. Screen module structure and loading

- **Decision**: One folder per screen under `src/pages/<Screen>Page/` containing the page
  component, its test, and an `index.ts`. Pages are lazy-loaded with `React.lazy` and a
  `Suspense` fallback of `RegionState state="loading"`. Screen metadata (path, title,
  eyebrow, breadcrumb, owning nav key, placeholder text) lives in a typed registry
  `src/lib/screens.ts`; navigation destinations in `src/lib/navigation.ts`.
  Feature folders (`src/features/overview`, `doors`, `mass-update`, `tiers`, `exceptions`)
  are created by the content specs, not here.
- **Rationale**: Meets "every screen has its own file structure" and Principle XII (thin
  pages, shared components in `components/`); lazy loading keeps the first render within
  SC-009 as screens grow.
- **Alternatives considered**: Creating empty feature folders now — speculative; rejected.

## R13. Playwright browsers

- **Decision**: The quickstart instructs `npx playwright install chromium` once per
  machine. Playwright's bundled browsers were not installed on the authoring machine; the
  research probe used the system Edge channel. Tests target bundled Chromium for
  reproducible baselines.
