---
description: 'Task list for 002-app-shell-tokens'
---

# Tasks: App Shell & Design Tokens

**Input**: Design documents from `specs/002-app-shell-tokens/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md),
[data-model.md](./data-model.md), [contracts/ui-shell.md](./contracts/ui-shell.md),
[contracts/theme-and-components.md](./contracts/theme-and-components.md),
[quickstart.md](./quickstart.md)

**Tests**: REQUIRED. The spec mandates unit tests at 100% coverage (FR-034), Playwright
viewport-matrix tests (FR-035), screenshot comparison against the prototype (FR-036), and
deterministic fixtures (FR-037). Write each test before or alongside its implementation;
a test task listed before its implementation task should fail first.

**Organization**: Tasks are grouped by user story so each story can be implemented and
verified on its own.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependency on an incomplete task)
- **[Story]**: User story from spec.md (US1–US6)

## Global rules for every task (from constitution + plan)

- **No literal style values outside `src/theme/token.ts`**: no hex/rgb colors, no
  `px`/`rem`/`em`/`s`/`ms` numbers, no font-family strings, no numeric `gap`/`size`/
  `width`/`height`/`padding`/`margin` props. CSS Modules use only `var(--…)`, `0`,
  keywords, `%`, `fr`, and `calc()` over variables. TS reads from `token`.
- One exported component per file; one folder per component (`src/components/<Name>/`)
  and per screen (`src/pages/<Screen>Page/`), each with an `index.ts` barrel.
- Copy rules: app name **"Assortment tool"**; nav labels in mixed case; screen copy per
  [data-model.md §4](./data-model.md#4-screen-definition-srclibscreensts). Never render
  prototype sample data.
- Never run `pa app push`, `pa app add data-source`, or any deploy/data-source skill.
- Verification commands (`npm run build|lint|test|test:coverage|test:e2e`) are appropriate
  in this phase because these tasks change `src/**`, configs, and tests.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Tooling so every later phase can be built and tested without a Power Apps
host.

- [x] T001 Add `@axe-core/playwright` as a devDependency via `npm install -D @axe-core/playwright` (updates package.json and package-lock.json). It is MPL-2.0, so a human must approve it first per plan.md Complexity Tracking. If it is rejected, skip this task and T061's axe assertions, and record that in the spec's Verification section
- [x] T002 Install the Playwright Chromium browser once per machine with `npx playwright install chromium` (no repo file change; documented in specs/002-app-shell-tokens/quickstart.md)
- [x] T003 [P] Create empty folders with `.gitkeep` where needed: src/theme/, src/hooks/, src/pages/, e2e/fixtures/, e2e/shell/, e2e/visual/**baselines**/
- [x] T004 [P] Create the host stub e2e/fixtures/power-apps-app.stub.ts that exports `getContext()` with the same signature as `@microsoft/power-apps/app`. It resolves a deterministic `IContext` fixture (user fullName "E2E Tester", fixed ids). It reads `new URLSearchParams(location.search).get('host')`: `error` rejects with Error("Stubbed host failure"), and `slow` delays resolution by 1500 ms before resolving. Any other export used by src/ must be re-exported as a no-op
- [x] T005 Modify vite.config.ts to use `defineConfig(({ mode }) => …)`. When `mode === 'e2e'`, add `resolve.alias` mapping `@microsoft/power-apps/app` to `path.resolve(__dirname, 'e2e/fixtures/power-apps-app.stub.ts')`. Keep all existing plugins and build options unchanged for other modes (research.md R9)
- [x] T006 [P] Create e2e/fixtures/viewports.ts exporting `VIEWPORTS` as readonly `{ name, width, height, tier }[]`: 360×740 compact, 390×844 compact, 768×1024 compact, 1024×768 standard, 1366×768 standard, 1920×1080 wide, 2560×1440 wide (contracts/ui-shell.md)
- [x] T007 [P] Create e2e/fixtures/screens.ts exporting `SCREENS` as readonly `{ id, hash, title, eyebrow, breadcrumb?, navLabel }[]` for overview `#/`, doors `#/doors`, door-detail `#/doors/D-001`, mass-update `#/doors/mass-update`, tier-assortments `#/tier-assortments`, and exceptions `#/exceptions`. Also export `EXCLUDED_HASHES = ['#/explorer','#/exports','#/activity','#/data-sources','#/parking-lot']`, `NOT_FOUND = { id: 'not-found', hash: '#/explorer', title: 'Page not found' }`, and `MATRIX_PAGES = [...SCREENS, NOT_FOUND]` (all pages for the viewport matrix, C4)
- [x] T008 Rewrite playwright.config.ts with:
  - `webServer.command: 'npx vite --mode e2e --port 5174'` and `baseURL: 'http://localhost:5174'`
  - `snapshotPathTemplate: '{testDir}/visual/__baselines__/{arg}{ext}'`
  - `expect.toHaveScreenshot: { maxDiffPixelRatio: 0.01, animations: 'disabled', caret: 'hide' }`
  - three projects, all on Desktop Chrome / Chromium:
    - `e2e`: testMatch `shell/**/*.spec.ts`
    - `visual`: testMatch `visual/app.visual.spec.ts`
    - `prototype-baseline`: testMatch `visual/prototype.capture.ts`; does not need the webServer, so guard the tests to use the `file://` URL
- [x] T009 [P] Delete e2e/home.spec.ts (superseded by e2e/shell/*)
- [x] T010 [P] Update vitest.config.ts:
  - set `css: { modules: { classNameStrategy: 'non-scoped' } }` so tests can query stable class names
  - add no coverage exclusions (constitution XIV allows only generated, main.tsx, type-only, and test files)
  - keep the 100% thresholds

**Checkpoint**: `npx vite --mode e2e --port 5174` serves the (still starter) app without the 8 s host timeout.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: The token source and derived theme layers. Every story depends on these.

**⚠️ CRITICAL**: No user-story work begins until this phase is complete.

- [x] T011 Write src/theme/token.test.ts (parity test, FR-027/SC-006). Embed a literal copy of the constitution's Canonical Brand Tokens:
  - all 25 colors and both family stacks
  - weights 200/400
  - all type styles incl. dense variants (fontSize/lineHeight/family/fontWeight)
  - spacing, radius, shadows, sizes, breakpoints, durations, easing
    Assert `token` equals it key-by-key. Also assert the supplementary tokens in data-model.md §1 exist with the listed values, assert that `token.color` has exactly 25 keys (no extra colors), and test `px('56px') === 56`
- [x] T012 Create src/theme/token.ts as an `as const` object. Its shape and values come from data-model.md §1 (mirror the prototype ChanelUI object): `color`, `families`, `fontFace`, `weights`, `styles`, `spacing` (+`nav-icon-gap`), `radius`, `shadow`, `size` (+`border-width`, `nav-rail-collapsed-width`, `nav-drawer-max-viewport`, `control-height-sm`, `state-min-height`), `duration`, `easing`, `letterSpacing`, `zIndex`, `opacity`, `measure`. Export the types `Density`, `ColorKey`, `TypeStyleKey`, `SpacingKey`, `SizeKey`, `DurationKey`, `TypeStyle`, plus the helper `px(value: string): number`. Make T011 pass
- [x] T013 [P] Write src/theme/cssVariables.test.ts. It asserts that `buildCssVariables('standard')`:
  - contains `--ink: #050505`, `--canvas`, every spacing/radius/shadow/size/duration key as `--<key>`, `--font-display`, `--font-text`, `--easing`, and `--type-<style>-size/line` for every style
  - sets `--cds-body-size: 13px`, `--cds-grid-header-size: 12px`, `--cds-prominent-size: 13px`
    For `'dense'` it asserts 10px / 10px / 12px respectively. Every value must equal its source in `token`
- [x] T014 [P] Implement src/theme/cssVariables.ts `buildCssVariables(density)`, a port of the prototype `A$` (research.md R2). It returns `Record<\`--${string}\`, string>`built only from`token`
- [x] T015 [P] Write src/theme/antdTheme.test.ts:
  - `buildAntdTheme('standard')`: `token.colorPrimary === token.color.accent`, `colorBgLayout === canvas`, `colorBorder === border-control`, `fontFamily === families.text`, `borderRadius === 4`, `lineWidthFocus === 3`, `fontSize === 13`, heading sizes 30/24/20/16/14
  - `components.Layout`: headerHeight 56, headerBg paper, bodyBg canvas
  - `components.Menu`: itemSelectedBg ink, itemSelectedColor paper, itemHeight 40, iconMarginInlineEnd 5
  - `components.Button`: defaultBorderColor border
  - `'dense'` → fontSize 10, heading sizes 24/20/16/14/10
  - `{ compact: true }` → controlHeight 40, controlHeightLG 44, controlHeightSM 32
  - `controlOutline` is derived from ink with opacity 0.08
- [x] T016 [P] Implement src/theme/antdTheme.ts `buildAntdTheme(density, opts?)` as a port of prototype `L3` (token + components Layout, Menu, Button, Table, Select, Form, Collapse, Tabs, Card, Drawer, Breadcrumb). Read every value from `token` via `px()`; build `controlOutline` from `token.color.ink` + `token.opacity['control-outline']` with a small `withAlpha(hex, alpha)` helper kept in the same file
- [x] T017 [P] Write src/theme/fontFaces.test.ts. It asserts that `buildFontFaceCss('/f.ttf')` returns two `@font-face` blocks whose `font-family` values are `token.fontFace.display` and `token.fontFace.text`. Each block must have `src: url("/f.ttf") format("truetype")`, `font-weight: 100 900`, `font-style: normal`, and `font-display: swap`
- [x] T018 [P] Implement src/theme/fontFaces.ts. It exports `buildFontFaceCss(url)` and `fontUrl` (`import fontUrl from '../assets/fonts/ABChanel Corpo Regular.ttf?url'`)
- [x] T019 [P] Write src/hooks/useLayoutTier.test.ts:
  - `tierForWidth`: 320/991 → compact, 992/1599 → standard, 1600/2560 → wide
  - `useLayoutTier` with a mocked `window.matchMedia`: it returns the right tier initially and re-renders when the `(min-width: 992px)` / `(min-width: 1600px)` listeners fire
  - unsubscribes on unmount
- [x] T020 [P] Implement src/hooks/useLayoutTier.ts. Export `LayoutTier`, `tierForWidth(width)`, and `useLayoutTier()` using `useSyncExternalStore` over `matchMedia` queries built from `token.size['breakpoint-standard']` and `['breakpoint-wide']` (research.md R3)
- [x] T021 Create src/theme/global.css (var() only). It contains:
  - `html, body, #root { margin: 0; min-height: 100dvh }` and a global `box-sizing: border-box`
  - `.cds-root`: `color: var(--ink)`, `background: var(--canvas)`, `font-family: var(--font-text)`, `font-weight: var(--weight-text)`, `font-size: var(--cds-body-size)`, `line-height: var(--type-body-line)`, `font-synthesis: none`, `text-rendering: optimizeLegibility`
  - display-face rule for `h1–h5.ant-typography`, `.cds-headline`, `.cds-prominent-label`, `.ant-card-head-title`, `.ant-drawer-title`, `.ant-result-title`: `font-family: var(--font-display)`, `font-weight: var(--weight-display)`, `text-transform: uppercase`
  - `.cds-prominent-label { font-size: var(--cds-prominent-size) }`
  - `.cds-sr-only` utility
    (Add `--weight-text` / `--weight-display` to buildCssVariables and its test if not already present.)
- [x] T022 Write src/theme/ThemeProvider.test.tsx. It asserts that ThemeProvider:
  - renders `div.cds-root` with `data-density="standard"` and a `data-tier` from useLayoutTier (mock matchMedia)
  - sets `--ink` etc. on its inline style from `buildCssVariables`
  - sets `data-tier` / `data-density` on `document.documentElement`
  - renders a `<style>` containing `@font-face`
  - wraps children in ConfigProvider using `buildAntdTheme(density, { compact: tier === 'compact' })`
  - forces standard density when compact even if `density="dense"`
- [x] T023 Implement src/theme/ThemeProvider.tsx per contracts/theme-and-components.md: `ConfigProvider theme={…} wave={{ disabled: true }}`, root `div.cds-root` with the CSS variables as its style, the font `<style>` element, and a document attribute sync in `useEffect`
- [x] T024 Modify src/main.tsx:
  - replace `BrowserRouter` with `HashRouter` (research.md R5)
  - replace the bare `<ConfigProvider>` with `<ThemeProvider>`
  - replace `import './index.css'` with `import './theme/global.css'`
  - provider order: PowerProvider → QueryClientProvider → ThemeProvider → HashRouter → ErrorBoundary → App
    Then delete src/index.css

**Checkpoint**: `npm test -- src/theme src/hooks` passes; the app renders on the canvas background in the bundled font.

---

## Phase 3: User Story 1 - Recognizable branded frame on launch (Priority: P1) 🎯 MVP

**Goal**: On launch the tester sees the prototype frame: 56 px header with "ASSORTMENT
TOOL", a 240 px rail with Overview / Doors / Tier assortments / Exceptions (Overview
selected: ink bg, white text), the canvas, the Overview page header, and branded
loading/error states.

**Independent Test**: Run `npx vite --mode e2e --port 5174` and open `#/` beside the
prototype at 1366×768. The frame, typography, and colors match; `?host=error` shows a
branded error and `?host=slow` a branded loading state.

### Tests for User Story 1

- [x] T025 [P] [US1] Write src/components/RegionState/RegionState.test.tsx:
  - `loading`: section with `aria-busy="true"` and `aria-label="Loading content"` showing a Skeleton with `rows` paragraphs (default 4)
  - `empty`: `aria-label="No results"` with description, default "Nothing to show yet."
  - `error`: `aria-label="Content unavailable"`, title default "Content unavailable", default subtitle text; a "Try again" primary button only when `onRetry` is given, and clicking it calls `onRetry`
  - `placeholder`: visible label "Coming in a later spec" plus title/description
  - root has class `cds-state`
- [x] T026 [P] [US1] Write src/components/ScreenRegion/ScreenRegion.test.tsx:
  - renders a Card with an `h5` label and optional description/extra
  - renders `children` when given, else `RegionState` with `state` (default `empty`)
  - forwards `data-visual-mask`
  - `aria-labelledby` links the section to its label
- [x] T027 [P] [US1] Write src/components/PageHeader/PageHeader.test.tsx:
  - `header` with `data-testid="page-header"`; eyebrow `span.cds-prominent-label` `data-testid="page-eyebrow"`; title is the only `h1` (`data-testid="page-title"`)
  - optional description `p` and actions container
  - breadcrumb: `nav aria-label="Breadcrumb"` with router links for each item followed by the current title (render inside MemoryRouter)
  - nothing optional renders when the props are omitted
- [x] T028 [P] [US1] Write src/lib/navigation.test.ts. It asserts `NAV_DESTINATIONS`:
  - keys in order `overview, doors, tier-assortments, exceptions`
  - labels "Overview", "Doors", "Tier assortments", "Exceptions"
  - paths `/`, `/doors`, `/tier-assortments`, `/exceptions`; `end` true only for overview
  - icons DashboardOutlined, ShoppingOutlined, TableOutlined, FilterOutlined
  - no key/path/label matches the deny-list explorer, exports, activity, data-sources, parking-lot (FR-002, FR-004)
- [x] T029 [P] [US1] Write src/lib/screens.test.ts. It asserts that `SCREENS` matches the data-model.md §4 table exactly (id, path, eyebrow, title, breadcrumb, navKey, placeholder present for all but not-found), that `documentTitle(screen)` returns `"<title> · Assortment tool"`, and that no screen id/path is in the excluded deny-list
- [x] T030 [P] [US1] Write src/components/AppShell/SideNav.test.tsx (MemoryRouter):
  - renders `nav[aria-label="Main"] > ul > li > a` for each destination with icon + label in `.cds-side-label`
  - the active route link has `aria-current="page"` and class `isActive`
  - only one link is current
  - `collapsed` prop hides labels visually but keeps each link's accessible name (aria-label) and a title tooltip
  - clicking a link calls `onNavigate`
- [x] T031 [P] [US1] Write src/components/AppShell/AppShell.test.tsx (standard tier via mocked matchMedia, MemoryRouter). It asserts:
  - `header[role=banner]` `data-testid="app-header"` containing `data-testid="app-name"` with text "Assortment tool"
  - an empty `data-testid="header-actions"` slot that renders the `actions` prop
  - `aside data-testid="nav-rail"` containing SideNav
  - `main#main-content` (`tabindex=-1`, `data-testid="main-content"`) renders children inside `.content`
  - Overview selected at `/`
  - no `nav-trigger` in the standard tier
- [x] T032 [P] [US1] Write src/pages/OverviewPage/OverviewPage.test.tsx. It asserts the eyebrow "Fragrance & Beauty · United States", the h1 "Overview", and a ScreenRegion placeholder with `data-testid="screen-placeholder"` and `data-visual-mask` naming the later spec, and that no numbers/sample data render
- [x] T033 [P] [US1] Update src/PowerProvider.test.tsx. In the loading state it expects a branded RegionState `loading` inside a `.cds-root`-styled full-height canvas container with the text "Connecting to Power Platform…". In the error state it expects RegionState `error` titled "Power Platform host unavailable" with the message. It also asserts no navigation renders before `ready`
- [x] T034 [P] [US1] Update src/components/ErrorBoundary.test.tsx to expect a RegionState `error` (title "Something went wrong", retry resets the boundary) instead of the previous markup
- [x] T035 [P] [US1] Write e2e/shell/structure.spec.ts (project `e2e`) with test group "frame". At 1366×768 on `#/`, it asserts:
  - header height equals 56 px; app name text-transform is uppercase with family starting "ABChanel Corpo Display"
  - nav link texts in order equal the four labels; Overview has `aria-current="page"` and computed background rgb(5, 5, 5) and color rgb(255, 255, 255)
  - `.cds-root` background rgb(247, 246, 244)
  - page h1 "Overview" is visible
  - `document.fonts.check('12px "ABChanel Corpo Display"')` is true
- [x] T036 [P] [US1] Write e2e/shell/host-states.spec.ts (project `e2e`):
  - `/?host=slow#/` shows the "Connecting to Power Platform…" loading state before the shell appears
  - `/?host=error#/` shows "Power Platform host unavailable" and no `nav[aria-label="Main"]`

### Implementation for User Story 1

- [x] T037 [P] [US1] Implement src/components/RegionState/RegionState.tsx + RegionState.module.css + index.ts per contracts/theme-and-components.md. Use Ant Design Skeleton, Empty, and Result; `min-height: var(--state-min-height)`; `placeholder` uses a dashed `var(--border-width)` `var(--border-control)` outline with ink-muted text. Export the `RegionStateKind` type. Make T025 pass
- [x] T038 [P] [US1] Implement src/components/ScreenRegion/ScreenRegion.tsx + ScreenRegion.module.css + index.ts: Ant Design Card with title `<Typography.Title level={5}>` and `min-height: var(--region-min-height)`, `height: 100%`. Make T026 pass
- [x] T039 [P] [US1] Implement src/components/PageHeader/PageHeader.tsx + PageHeader.module.css + index.ts, ported from the prototype `tEe` with Ant Design Breadcrumb (items rendered as react-router `Link`) and Typography.Title level 1.
  - Row: flex-wrap, `align-items: flex-end`, `justify-content: space-between`, gap `var(--space-panel)`.
  - Text column: gap `var(--space-compact)`, `flex: 1 1 var(--page-header-text-basis)` (supplementary token `size.page-header-text-basis: 320px`, F1), min-width 0.
  - Description `max-width: var(--measure-description)`.
  - Eyebrow color `var(--ink-muted)`.
    Make T027 pass
- [x] T040 [P] [US1] Implement src/lib/navigation.ts exporting the `NavDestination` type and `NAV_DESTINATIONS` (readonly, data-model.md §3) plus `EXCLUDED_SCREEN_KEYS`. Make T028 pass
- [x] T041 [P] [US1] Implement src/lib/screens.ts exporting the `ScreenId`, `ScreenDefinition` types, `SCREENS` registry (data-model.md §4 incl. placeholder copy, e.g. "Overview tasks, KPIs and charts arrive with the Overview spec."), `screenById(id)`, and `documentTitle(screen)` using app name constant `APP_NAME = 'Assortment tool'`. Make T029 pass
- [x] T042 [US1] Implement src/components/AppShell/SideNav.tsx + SideNav.module.css. Render `nav aria-label="Main"` > `ul` > `li` > react-router `NavLink` (`end` from destination), with the icon and `span.cds-side-label` label.
      CSS reproduces the prototype inline Menu:
  - list padding `var(--space-control)`
  - item height `var(--nav-item-height)`, margin-block `var(--space-compact)`, radius `var(--radius)`
  - icon gap `var(--nav-icon-gap)`; text face at weight `var(--weight-text)`
  - hover background `var(--canvas)`; active background `var(--nav-selected-bg)` with color `var(--nav-selected-text)`
  - transitions use `var(--duration-mid)` `var(--easing)`
    The `collapsed` prop shows icons only (centered) with `aria-label` + `title`. Make T030 pass
- [x] T043 [US1] Implement src/components/AppShell/AppShell.tsx + AppShell.module.css + index.ts (standard/wide layout only in this story).
  - `.shell`: `min-height: 100dvh`, background canvas.
  - `header`: height `var(--header-height)`, background paper, bottom border `var(--border-width) solid var(--border)`, gap `var(--space-panel)`, padding-inline per tier via `[data-tier=…]` selectors using `--content-padding-*`, `z-index` from token.
  - `.brand`: display face, uppercase, `font-size: var(--type-app-name-size)`, `line-height: var(--type-app-name-line)`, `letter-spacing: var(--letter-spacing-app-name)`.
  - `.headerActions`: margin-inline-start auto, gap `var(--space-control)`.
  - `aside.rail`: width `var(--nav-rail-width)`, background paper, `border-inline-end: var(--border-width) solid var(--border)`.
  - `main.content`: padding/gap per tier, `max-width: var(--content-max-width)`, `margin-inline: auto`, width 100%, flex column, min-width 0.
    Make T031 pass. (Add `--letter-spacing-app-name`, `--measure-description`, and `--z-header` to buildCssVariables + test.)
- [x] T044 [US1] Implement src/pages/OverviewPage/OverviewPage.tsx + index.ts. It renders `PageHeader` from `screenById('overview')` and one `ScreenRegion` labeled "Overview" with `data-testid="screen-placeholder"`, `data-visual-mask`, and `RegionState state="placeholder"` from the registry copy. Make T032 pass
- [x] T045 [US1] Rewrite src/App.tsx to render `<AppShell appName={APP_NAME} items={NAV_DESTINATIONS}>` with `<Routes>`: `/` → OverviewPage and `*` → OverviewPage as a temporary fallback (replaced in T056). Remove the starter Layout, Header, and Footer. Delete src/components/PlaceholderBanner.tsx and src/components/PlaceholderBanner.test.tsx (FR-014)
- [x] T046 [US1] Modify src/PowerProvider.tsx so the loading and error states render inside a token-styled full-height canvas container (CSS Module src/PowerProvider.module.css) using RegionState `loading` (+ "Connecting to Power Platform…" text) and RegionState `error` (title "Power Platform host unavailable"). Remove the inline `style` and numeric `gap`/`padding` literals. Make T033 pass
- [x] T047 [US1] Modify src/components/ErrorBoundary.tsx to render RegionState `error` (title "Something went wrong", `onRetry` resets state) inside the canvas container; remove any literal styles. Make T034 pass
- [x] T048 [US1] Rewrite src/App.test.tsx (MemoryRouter at `/`, mocked matchMedia standard tier). It asserts the app name, the four nav links, Overview `aria-current`, and the Overview h1; then run `npm test` and `npx playwright test --project=e2e e2e/shell/structure.spec.ts e2e/shell/host-states.spec.ts` until green

**Checkpoint**: MVP. The branded frame + Overview matches the prototype at a standard viewport.

---

## Phase 4: User Story 2 - Navigate between in-scope screens (Priority: P1)

**Goal**: All six screens are reachable at bookmarkable hash addresses with the correct
page header, the correct selected nav entry, a Doors breadcrumb on sub-screens, branded
not-found, page titles, and back/forward.

**Independent Test**: Click each nav entry and open each address in
contracts/ui-shell.md. The header, selection, and document title are correct; excluded
addresses show "Page not found".

### Tests for User Story 2

- [x] T049 [P] [US2] Write src/hooks/useDocumentTitle.test.ts. It asserts that `document.title` becomes "Doors · Assortment tool" for "Doors" and updates when the argument changes
- [x] T050 [P] [US2] Write page tests, one per folder: src/pages/DoorsPage/DoorsPage.test.tsx, src/pages/DoorDetailPage/DoorDetailPage.test.tsx, src/pages/MassUpdatePage/MassUpdatePage.test.tsx, src/pages/TierAssortmentsPage/TierAssortmentsPage.test.tsx, src/pages/ExceptionsPage/ExceptionsPage.test.tsx. Each asserts:
  - the eyebrow "Strategy" and its h1 ("Doors", "Door detail", "Mass update", "Tier assortments", "Exceptions")
  - DoorDetail and MassUpdate render a Breadcrumb with a "Doors" link to `/doors`
  - one labeled placeholder region with `data-visual-mask`
  - the document title via useDocumentTitle
- [x] T051 [P] [US2] Write src/pages/NotFoundPage/NotFoundPage.test.tsx. It asserts the h1 "Page not found", RegionState-styled message, a link "Go to Overview" to `/`, and document title "Page not found · Assortment tool"
- [x] T052 [P] [US2] Extend src/App.test.tsx with a table-driven test over every route in contracts/ui-shell.md (MemoryRouter initialEntries). For each route it asserts the h1, the single `aria-current="page"` link (Doors for `/doors/D-001` and `/doors/mass-update`), and `document.title`. Each EXCLUDED path renders NotFoundPage and no nav link for it. Use `await findBy…` for the lazy pages
- [x] T053 [P] [US2] Extend e2e/shell/structure.spec.ts with test group "navigation". At 1366×768:
  - clicking each nav link updates `location.hash`, the h1, and `aria-current`
  - `page.reload()` keeps the screen
  - `#/doors/mass-update` and `#/doors/D-001` show Doors current plus a "Doors" breadcrumb that navigates to `#/doors`
  - each `EXCLUDED_HASHES` entry shows "Page not found" and a working "Go to Overview" link
  - `page.goBack()` / `goForward()` restore the screen and selection
  - `page.title()` matches the contract for every screen

### Implementation for User Story 2

- [x] T054 [P] [US2] Implement src/hooks/useDocumentTitle.ts (`useEffect` sets `document.title = \`${title} · ${APP_NAME}\``). Make T049 pass
- [x] T055 [P] [US2] Implement the page folders src/pages/DoorsPage/, DoorDetailPage/, MassUpdatePage/, TierAssortmentsPage/, ExceptionsPage/, NotFoundPage/ (each with `<Name>Page.tsx` + `index.ts`). Each page is thin: `useDocumentTitle`, `PageHeader` from `screenById`, and one placeholder `ScreenRegion` (NotFoundPage instead renders RegionState `empty`-style copy and a "Go to Overview" link). Also add `useDocumentTitle` to OverviewPage. Make T050–T051 pass
- [x] T056 [US2] Update src/App.tsx to lazy-load every page with `React.lazy(() => import('./pages/<X>Page'))` inside `<Suspense fallback={<RegionState state="loading" />}>`, with routes `/`, `/doors`, `/doors/mass-update`, `/doors/:doorId`, `/tier-assortments`, `/exceptions`, and `*` → NotFoundPage (static before dynamic). Paths come from `SCREENS`. Make T052 and T053 pass

**Checkpoint**: US1 + US2 together give a navigable shell for all six screens.

---

## Phase 5: User Story 3 - Usable on every monitor and phone size (Priority: P1)

**Goal**: Compact (< 992) uses the drawer with 44 px targets; standard uses the 240 px
rail with a collapse/expand toggle (64 px); wide applies wide spacing with content
≤ 2200 px. Tiers switch live, with no horizontal overflow anywhere.

**Independent Test**: Run e2e/shell/responsive.spec.ts across the 7-viewport matrix for
all 6 screens.

### Tests for User Story 3

- [x] T057 [P] [US3] Extend src/components/AppShell/AppShell.test.tsx with tier cases (mock matchMedia per tier):
  - **Compact**:
    - shows `button[data-testid=nav-trigger]` labeled "Open navigation" (`aria-expanded=false`, `aria-controls="nav-drawer"`) and no rail
    - clicking it opens a Drawer (`#nav-drawer`, title "Assortment tool", left placement) containing SideNav
    - choosing a link closes it; Escape closes it
    - switching the mocked tier to standard closes the drawer and shows the rail
  - **Standard/wide**:
    - shows `button[data-testid=rail-toggle]` "Collapse navigation" (`aria-expanded=true`)
    - clicking it sets the rail to collapsed (SideNav `collapsed`, button "Expand navigation", `aria-expanded=false`)
    - the collapsed state survives a standard→wide switch
- [x] T058 [P] [US3] Write e2e/shell/responsive.spec.ts (project `e2e`). For every `VIEWPORTS` × `MATRIX_PAGES` combination (49 tests, incl. not-found per C4):
  - `scrollWidth <= innerWidth`
  - `.cds-root[data-tier]` equals the expected tier
  - compact: trigger visible and rail hidden, and every interactive control in the header and drawer has a bounding box ≥ 44×44
  - standard/wide: rail width 240 and rail toggle visible
  - header, nav access, and h1 visible
  - wide: `.content` width ≤ 2200 and padding-left 32 px
    Also add these tests:
  - 320×640 has no overflow on every `MATRIX_PAGES` entry, and the header shows the trigger + app name without overlap
  - every `VIEWPORTS` entry with `?host=slow` (loading RegionState) and `?host=error` (error RegionState) has no overflow (C4: RegionState variants across the matrix)
  - the drawer is 300 px wide (or 85vw when narrower) and nav items are 40 px tall in standard (G4)
  - first meaningful render: time from `goto('#/')` to a visible h1 is < 3000 ms at 1366×768 (G1/SC-009)
  - font fallback: with `page.route('**/*.ttf', r => r.abort())`, `#/` still has no overflow and a visible h1 (G3)
  - live resize 1366→800→1366 keeps the screen and switches modes
  - an open drawer closes after a resize to 1366
  - rail collapse gives width 64 with the icons still visible
  - widths 991/992/1599/1600 give tiers compact/standard/standard/wide

### Implementation for User Story 3

- [x] T059 [US3] Extend src/components/AppShell/AppShell.tsx + AppShell.module.css for the tiers:
  - **Compact**: Ant Design Button `nav-trigger` with MenuOutlined at size `var(--nav-trigger-size)`, overridden to `var(--touch-target)` under `[data-tier='compact']`, and an Ant Design Drawer `id="nav-drawer"`, `placement="left"`, `title={appName}`, width `min(var(--nav-drawer-width), var(--nav-drawer-max-viewport))` via a CSS Module class, body padding 0, `rootClassName` for styles. Inside the drawer, nav items have `min-height: var(--touch-target)`.
  - **Standard/wide**: text Button `rail-toggle` with MenuFoldOutlined/MenuUnfoldOutlined, `aria-label` "Collapse navigation"/"Expand navigation", and `aria-expanded`; the rail width switches to `var(--nav-rail-collapsed-width)` with a `var(--duration-mid)` transition.
  - **Drawer state**: `drawerOpen` closes on navigate, on Escape (Drawer default), on mask click, and in an effect when the tier ≠ compact. `railCollapsed` is session state only.
    Make T057 and T058 pass
- [x] T060 [US3] Verify the overflow guards in src/components/AppShell/AppShell.module.css and src/components/PageHeader/PageHeader.module.css: `min-width: 0` on flex children, `overflow-wrap: anywhere` on h1 for long titles, `.brand { white-space: nowrap; overflow: hidden; text-overflow: ellipsis }`, and the header must not overflow at 320 px. Re-run responsive.spec.ts until all 42+ cases pass

**Checkpoint**: The shell is usable from 320 px to 2560+ px.

---

## Phase 6: User Story 4 - Accessible, keyboard-friendly shell (Priority: P2)

**Goal**: A skip link, landmarks, `aria-current`, a 3 px ink focus ring with 2 px offset,
the drawer focus trap and focus return, reduced motion, forced-colors support, and
0 axe violations.

**Independent Test**: Run e2e/shell/accessibility.spec.ts; navigate the full shell with
the keyboard only at 390×844 and 1366×768.

### Tests for User Story 4

- [x] T061 [P] [US4] Write e2e/shell/accessibility.spec.ts (project `e2e`):
  - **axe**: run `AxeBuilder` with tags `wcag2a, wcag2aa, wcag21a, wcag21aa` on all 6 screens at 390×844 and 1366×768, plus once with the drawer open; expect 0 violations
  - **Skip link**: the first Tab focuses "Skip to main content", and Enter moves focus to `#main-content`
  - **Focus ring**: tabbing to a nav link gives computed `outline-width` 3px, `outline-color` rgb(5, 5, 5), `outline-offset` 2px (on selected ink items the outline color is paper and the offset is negative, as in the prototype)
  - **Drawer**: at 390×844, repeated Tab inside the open drawer never leaves it; Escape closes it and focus returns to `nav-trigger`; choosing a link moves focus to `#main-content`
  - **Reduced motion**: with `page.emulateMedia({ reducedMotion: 'reduce' })`, the computed `transition-duration` on a nav link is ≤ 0.01ms
  - **Forced colors**: with `forcedColors: 'active'`, the current nav link and the focus outline remain visible (non-zero outline width; border/outline present)
- [x] T062 [P] [US4] Write src/components/AppShell/SkipLink.test.tsx. It asserts that the SkipLink renders `a[href="#main-content"]` with text "Skip to main content" and class `cds-sr-only`-until-focus, and that activating it calls `focus()` on `#main-content` and prevents default hash navigation (important under HashRouter)
- [x] T063 [P] [US4] Extend src/components/AppShell/AppShell.test.tsx:
  - the SkipLink is the first focusable element
  - exactly one `nav[aria-label="Main"]` exists per tier
  - after the drawer closes via Escape, focus returns to `nav-trigger`; after it closes via link selection, focus moves to `main#main-content`

### Implementation for User Story 4

- [x] T064 [P] [US4] Implement src/components/AppShell/SkipLink.tsx + SkipLink.module.css: visually hidden until `:focus-visible`, then positioned at the top-left with paper background, ink text, padding `var(--space-control)`, and `z-index` above the header from token. `onClick` does `preventDefault` and focuses `#main-content`. Render it first in AppShell. Make T062 pass
- [x] T065 [US4] Add the accessibility rules to src/theme/global.css (var() only):
  - focus ring on `button, a, input, textarea, select, [role=button], [role=tab], [role=switch], [role=checkbox], [role=radio], [tabindex='0']` at `:focus-visible`: `outline: var(--focus-ring-width) solid var(--focus-ring); outline-offset: var(--focus-offset)`
  - SideNav active link override: outline color `var(--paper)`, offset `calc(-1 * var(--focus-offset))`
  - `@media (prefers-reduced-motion: reduce)` collapses transition/animation durations, as in the prototype
  - `@media (forced-colors: active)`: active nav link gets `outline: var(--border-width) solid CanvasText`
    Add any missing variables to buildCssVariables + test
- [x] T066 [US4] Update src/components/AppShell/AppShell.tsx for focus management: keep a ref to `nav-trigger` and restore focus to it in Drawer `afterOpenChange(false)` unless the close came from navigation, in which case focus `#main-content`. Confirm the Ant Design Drawer focus lock holds; if not, add a minimal Tab/Shift+Tab wrap inside the drawer panel (research.md R7). Make T061 and T063 pass
- [x] T067 [US4] Fix any axe violations reported by T061 in the affected component files under src/components/ and src/pages/ (e.g. contrast, names, landmark duplication) without changing token values. Values must stay constitution-canonical; if a canonical color fails contrast, record it in the spec's Verification & Known Limitations instead of changing it

**Checkpoint**: The shell is fully keyboard- and screen-reader-operable.

---

## Phase 7: User Story 5 - One source of styling truth (Priority: P2)

**Goal**: Prove that every style value originates in `token.ts`: the derived chart palette,
an automated literal scan, an ESLint guard, and the font registered under both names.

**Independent Test**: `npm run lint` and `npm test -- src/theme` pass. Changing
`token.color.canvas` locally changes the canvas everywhere (manual spot check), then
revert.

### Tests for User Story 5

- [x] T068 [P] [US5] Write src/theme/chart.test.ts. It asserts that `chartPalette.series` equals `[token.color['chart-1'], token.color['chart-2'], token.color['chart-3']]` and that `chartPalette.grid === token.color['chart-grid']`
- [x] T069 [P] [US5] Write src/theme/noHardcodedStyles.test.ts (research.md R10).
  - Load `import.meta.glob('/src/**/*.{ts,tsx,css}', { query: '?raw', import: 'default', eager: true })`.
  - Exclude `/src/theme/token.ts`, `/src/generated/**`, `**/*.test.{ts,tsx}`, `**/*.testutil.ts`, and `/src/test/**`.
  - For each remaining file, fail with file:line when any of these appear:
    - `/#[0-9a-fA-F]{3,8}\b/` in a CSS value or a TS string
    - `/\b(rgba?|hsla?)\(/`
    - `/\b\d+(\.\d+)?(px|rem|em|vh|vw|ms|s)\b/` (allowing `0`)
    - `/font-family\s*:|fontFamily\s*:/`
    - `/ABChanel|Helvetica|Georgia|Arial|Times New Roman/`
  - Include a self-test proving the detector flags a sample string such as `"color: #050505"`.

### Implementation for User Story 5

- [x] T070 [P] [US5] Implement src/theme/chart.ts exporting `chartPalette` derived from `token`. Make T068 pass
- [x] T071 [US5] Add `no-restricted-syntax` rules to eslint.config.js for `src/**/*.tsx` (excluding `src/theme/token.ts` and tests):
  - forbid `JSXAttribute[name.name='style'] Literal` (any literal inside inline style objects)
  - forbid `JSXAttribute[name.name=/^(gap|size|width|height|padding|margin)$/] > JSXExpressionContainer > Literal[raw=/^\d/]`
    Each rule gets a message pointing to `src/theme/token.ts`
- [x] T072 [US5] Run `npm run lint` and `npm test -- src/theme/noHardcodedStyles.test.ts`. Fix every reported literal in the offending files under src/ by moving values into token-derived CSS variables or `token` reads (e.g. remaining literals in src/PowerProvider.tsx, src/components/ErrorBoundary.tsx, CSS Modules), until both pass

**Checkpoint**: The brand gate (constitution Workflow §7) is enforced automatically.

---

## Phase 8: User Story 6 - Automated proof of look, structure, and feel (Priority: P3)

**Goal**: Prototype-captured baselines, 42 visual comparisons within 1%, and a 100% unit
coverage gate, all without a live environment.

**Independent Test**: `npm run test:coverage` (100%) and `npm run test:e2e -- --project=visual`
(42 comparisons pass).

### Tests & tooling for User Story 6

- [x] T073 [P] [US6] Create e2e/visual/normalize.ts. It exports `APP_NORMALIZE_CSS` and `PROTOTYPE_NORMALIZE_CSS` (research.md R8).
  - **App**: `[data-visual-mask] { visibility: hidden !important }`; also hide `[data-testid=page-description]`, `[data-testid=page-actions]`, and on door-detail `[data-testid=page-title]`.
  - **Prototype**:
    - hide `.cds-content > * > :not(.cds-page-header)`, `.cds-page-header__desc`, `.cds-page-header__actions`, and `.cds-header-actions`
    - hide the last five `.cds-side-menu .ant-menu-item` entries (Explorer…Parking lot) using `:nth-child(n+5)`
    - on door-detail, hide `.cds-page-header__title`
  - **Both**: `*{transition:none!important;animation:none!important}`.
  - Export `fontInjectionCss(fileUrl)` registering the TTF under both family names for the prototype.
- [x] T074 [US6] Create e2e/visual/prototype.capture.ts (project `prototype-baseline`). For each `VIEWPORTS` entry and each screen:
  1. Open the `file://` URL of docs/Assortment-Tool-Prototype.html and inject `fontInjectionCss` for src/assets/fonts/ABChanel Corpo Regular.ttf.
  2. Await `document.fonts.ready` and wait for `.cds-shell`.
  3. Navigate with the prototype's own UI:
     - Overview / Doors / Tier assortments / Exceptions: click the side-menu item, or at compact tier open the drawer, click it, then close the drawer.
     - Door detail: from Doors, activate the first door row or door link in the grid.
     - Mass update: from Doors, select the first row checkbox, then activate the "Mass update"-labelled action (or any control whose click routes to `/mass-update`); fail loudly if the resulting h1 is not "Mass update" (U1). Assert 9 prototype nav items exist before hiding items 5–9 (U2).
  4. Assert the page h1 text, then `expect(page).toHaveScreenshot(\`${screen.id}-${w}x${h}.png\`, { style: PROTOTYPE_NORMALIZE_CSS })`.
Document at the top of the file that it runs only with `--update-snapshots` by a human
- [x] T075 [US6] Create e2e/visual/app.visual.spec.ts (project `visual`). For each `VIEWPORTS` × `SCREENS` entry, go to `screen.hash`, await `document.fonts.ready`, and run `expect(page).toHaveScreenshot(\`${screen.id}-${w}x${h}.png\`, { style: APP_NORMALIZE_CSS })`with the config default`maxDiffPixelRatio: 0.01`
- [x] T076 [US6] HUMAN STEP: capture the baselines with `npm run test:e2e -- --project=prototype-baseline --update-snapshots`, review the 42 PNGs in e2e/visual/**baselines**/, and commit them with human approval
- [x] T077 [US6] Run `npm run test:e2e -- --project=visual`. For each failing diff, adjust only token-driven CSS Module rules in src/components/** (spacing, alignment, typography classes) until all 42 comparisons pass. Do not change token values or baselines. Record any irreducible deviation in specs/002-app-shell-tokens/plan.md Complexity Tracking for approval
- [x] T078 [US6] Run `npm run test:coverage` and add the missing unit cases in the relevant `*.test.ts(x)` files under src/ until lines/branches/functions/statements are 100%. Exclusions stay limited to vitest.config.ts's existing list

**Checkpoint**: All automated gates are green with no manual inspection required.

---

## Phase 9: Polish & Cross-Cutting Concerns

- [x] T079 [P] Update .specify/memory/frontend-standards.md: provider order `PowerProvider → QueryClientProvider → ThemeProvider → HashRouter`, the HashRouter rationale (research.md R5), the `src/theme/` layout, CSS Modules + `var()` styling, and that page folders live in `src/pages/<Screen>Page/`
- [x] T080 [P] Update README.md (if it describes the starter UI or BrowserRouter) to reflect the shell, the `--mode e2e` local run, and the visual baseline workflow from specs/002-app-shell-tokens/quickstart.md
- [x] T081 Run the full quickstart (specs/002-app-shell-tokens/quickstart.md §1–§5): `npm run build`, `npm run lint`, `npm run format:check`, `npm run test:coverage`, `npm run test:e2e -- --project=e2e`, `npm run test:e2e -- --project=visual`. Fix any regressions
- [x] T082 Fill the "Verification & Known Limitations" section of specs/002-app-shell-tokens/spec.md with:
  - unit test count and coverage %
  - E2E counts (structure, responsive 42+, accessibility, host states) and visual 42/42 with max observed diff
  - axe status (or a note if T001 was declined)
  - untested scenarios (browser zoom 200% manual only, real Power Apps host manual only)
  - single-font-face limitation
  - deviations from plan.md Complexity Tracking
- [x] T083 [P] Update specs/001-assortment-engine-core/spec.md "Verification & Known Limitations" only if this feature changed anything it lists (e.g. the test harness); otherwise leave it untouched

---

## Dependencies & Execution Order

### Phase dependencies

- **Phase 1 Setup**: none. T001 waits on human license approval; nothing else depends on it except T061's axe assertions.
- **Phase 2 Foundational**: depends on Phase 1 (T003, T010). **Blocks all user stories.**
- **Phase 3 US1 (P1, MVP)**: depends on Phase 2.
- **Phase 4 US2 (P1)**: depends on US1 (uses AppShell, PageHeader, ScreenRegion, screens registry, and App.tsx).
- **Phase 5 US3 (P1)**: depends on US1 (extends AppShell). Its E2E suite iterates all screens, so run it after US2.
- **Phase 6 US4 (P2)**: depends on US3 (drawer focus) and US2 (all screens for axe).
- **Phase 7 US5 (P2)**: depends only on Phase 2 for T068–T071. T072 is best run after US1–US4 so it catches every file.
- **Phase 8 US6 (P3)**: depends on US1–US4 (complete shell). T076 is a human gate before T077.
- **Phase 9 Polish**: after all stories.

### Story completion order

```text
Setup → Foundational → US1 ─┬─→ US2 ─┬─→ US3 → US4 ─┐
                            │        │              ├─→ US6 → Polish
                            └────────┴─→ US5 ───────┘
```

### Within each story

Tests first (they should fail), then pure modules / leaf components, then composite components, then App wiring, then E2E green.

## Parallel Execution Examples

**Phase 1**: T003, T004, T006, T007, T009, and T010 together, then T005 and T008.

**Phase 2**: after T011–T012, run these pairs in parallel: T013/T014, T015/T016, T017/T018, T019/T020. Then T021 → T022 → T023 → T024.

**US1**:

```text
Tests together:    T025 T026 T027 T028 T029 T030 T031 T032 T033 T034 T035 T036
Leaves together:   T037 T038 T039 T040 T041
Then sequential:   T042 → T043 → T044 → T045 → T046 → T047 → T048
```

**US2**: T049, T050, T051, T052, and T053 together; T054 ‖ T055; then T056.

**US3**: T057 ‖ T058, then T059, then T060.

**US4**: T061 ‖ T062 ‖ T063, then T064 ‖ T065, then T066, then T067.

**US5**: T068 ‖ T069 ‖ T070, then T071, then T072.

**US6**: T073, then T074 ‖ T075, then T076 (human), then T077, then T078.

## Implementation Strategy

### MVP first (US1)

1. Phase 1 + Phase 2 → tokens, theme, and E2E harness.
2. Phase 3 (US1) → the branded frame + Overview.
3. **Stop and validate** side by side with the prototype at 1366×768; demo it.

### Incremental delivery

1. US2 → all screens navigable (demoable shell).
2. US3 → responsive across devices.
3. US4 → accessibility hardening.
4. US5 → automated brand gate (can run in parallel with US2–US4 once Phase 2 is done).
5. US6 → prototype-baseline visual proof + 100% coverage gate.
6. Polish → docs, the spec's Verification section, and a full quickstart run.

### Notes

- `[P]` means different files with no dependency on incomplete tasks.
- Commit after each task or logical group (the `/speckit-git-commit` hook is available).
- T001 (license) and T076 (baselines) need a human; never automate their approval.
