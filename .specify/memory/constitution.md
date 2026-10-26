<!--
Sync Impact Report
- Version change: 2.1.0 → 2.2.0 (MINOR)
  Rationale: formalizes a manual amendment to Principle XIII adding a new non-negotiable
  storage/memory constraint (derived-never-persisted, factored base assortments per
  (Tier, Product Line), sparse exceptions, lazy evaluation). New binding guidance, not a
  wording fix, hence MINOR rather than PATCH.
- Modified principles: XIII. The Assortment Engine Is Pure, Isolated, and Test-First
  (storage & memory rule added; manual text normalized to MUST language, stray quote
  removed, rationale added)
- Added / removed sections: none
- Deferred TODOs (unchanged): TODO(OWNING_TEAM), TODO(REVIEWERS), TODO(RETAILER_FIELD)

Previous report (2.1.0):
- Version change: 2.0.0 → 2.1.0 (MINOR)
  Rationale: resolves deferred TODOs from 2.0.0 with stakeholder answers and materially
  expands guidance (screen scope, engine matching/precedence rules, visual-regression
  testing, 100% coverage gate). No principle removed or renamed.
- Modified principles:
  IV. Environment, Configuration & Human-Only Deployment (test app; ALM out of scope)
  VIII. Placeholder & Template Hygiene (excluded screens are not built, not placeholdered)
  IX. Prototype Fidelity & Chanel Brand (single bundled TTF font; prototype sample data,
      copy, and Parking lot excluded; visual fidelity unchanged)
  XI. Responsive on Every Screen, Proven by Playwright (viewport matrix confirmed;
      screenshot comparison against the prototype added)
  XII. Modular Architecture (feature list reduced to in-scope screens)
  XIII. The Assortment Engine (exact-text Axis ↔ Product Line match, no mapping tables;
      Door-level exceptions override Retailer-level)
  XIV. No Spec Is Complete (100% unit-test coverage threshold)
  XV. Data Gaps (gap strategy resolved by scope exclusion)
- Added sections: none
- Modified sections: Project-Specific Configuration, UI Component Library Standard
  (Recharts confirmed), Data Model Alignment & Known Gaps (in-scope vs excluded),
  Development Workflow & Quality Gates (coverage + visual gates)
- Removed sections: none
- Resolved TODOs: FONT_ASSETS, TARGET_ENVIRONMENTS, DATA_GAP_STRATEGY,
  VIEWPORT_MATRIX_CONFIRMATION, PERFORMANCE_TARGETS (defaults adopted),
  SECURITY_COMPLIANCE and LICENSING_PLAN (test-app defaults)
- Templates: not modified by this run. ⚠ Recommended follow-up (manual): add "Data Gaps"
  and "Verification & Known Limitations" sections to .specify/templates/spec-template.md;
  align .specify/memory/frontend-standards.md and .github/copilot-instructions.md.
- Deferred TODOs: TODO(OWNING_TEAM), TODO(REVIEWERS), TODO(RETAILER_FIELD)
-->

# Assortment Tool Constitution

A Spec-Driven Development (SDD) constitution for the **Assortment Tool**, a Power Platform
code app whose purpose is to exercise and validate the **Assortment Engine** that powers
door assortment. Principles I–VIII are inherited from the Slalom Power Platform Code App
starter; Principles IX–XV are specific to this project.

## Project-Specific Configuration

- **App name**: Assortment Tool (Chanel Fragrance & Beauty · United States)
- **Business purpose**: A **test app** that provides a brand-faithful UI over the
  Assortment Engine so users can verify how door assortments are derived (Door → Tier →
  Tier rules → SKU, filtered by exact Axis ↔ Product Line match, then adjusted by
  Assortment exceptions) and see the limitations of each delivered spec.
- **In-scope screens**: Overview, Doors, Mass update (without import-batch tracking), Tier
  assortments (incl. Manage tiers), and Exceptions.
- **Excluded screens** (not related to the engine): Activity (Change log), Exports (Export
  run / Export line), Data sources, Explorer (Explorer view), and Parking lot. These MUST
  NOT be built, stubbed, or shown in navigation.
- **Target environments & ALM promotion path**: Not applicable — test app deployed by a
  human to a single environment configured in `power.config.json`; no UAT/PROD promotion.
- **Data sources & connectors used** (created via Power Platform maker portal, wired in
  through `pa app add data-source` **by a human only**): Dataverse tables currently
  generated in `src/generated/`: `cr380_doors`, `cr380_tiers`, `cr380_skus`,
  `cr380_tierrules`, `cr380_assortmentexceptions`. Gaps against the ERD are listed in
  "Data Model Alignment & Known Gaps".
- **Owning team**: TODO(OWNING_TEAM)
- **Reviewers / approvers for review gates**: TODO(REVIEWERS)
- **Performance targets** (non-blocking for a test app): first meaningful render ≤ 3 s
  inside the Power Apps host on a desktop connection; engine recomputation for a single
  door ≤ 200 ms; grids remain interactive (≤ 100 ms input latency) at 5,000 rows.
- **Accessibility target**: WCAG 2.1 AA (the prototype's 3 px ink focus ring, 44 px compact
  touch targets, and reduced-motion handling are mandatory).
- **Security & compliance**: Test app; inherits the tenant's existing DLP and Conditional
  Access policies. No additional compliance obligations are assumed.
- **Licensing**: Power Apps Premium for end users (platform requirement for code apps).
- **UI component library confirmation**: Ant Design (major version as pinned in
  `package.json`, currently v6) themed exclusively through `src/theme/token.ts` to
  reproduce the prototype's Chanel design system (ChanelUI components). Reason: the
  prototype is built on Ant Design + ChanelUI and fidelity is non-negotiable (Principle IX).

## Core Principles

### I. Code-App Scope Only

This repository builds and contributes to the **code app codebase only**. It MUST NOT
be used to create other Power Platform components (Dataverse tables, columns, choices,
flows, connectors, connection references, environments, or solutions). Those components
are created by developers through traditional methods (Power Platform maker portal /
admin center) and are then referenced by the code app via the Power Apps CLI
(`pa app add data-source`). Any request to author non-code-app Power Platform artifacts
from this repo MUST be redirected to the maker portal.

### II. Connector-First Data Access

Power Platform code apps run in a sandbox where direct outbound network requests do not
function at runtime. **All external data access MUST go through Power Platform connectors
and their generated services.** Raw `fetch`, `axios`, Microsoft Graph SDKs, Azure REST
calls, or any direct HTTP client are prohibited for data access. If no connector exists
for a required capability, surface this to the developer explicitly — never implement a
direct API call as a workaround, because it will fail in production.

### III. Generated Services Are the Source of Truth

Typed models and services generated into `src/generated/` by `pa app add data-source`
are the only supported data-access layer. Do not hand-edit files in `src/generated/`
except for documented connector workarounds. Never commit secrets, keys, tokens, or
connection strings into the codebase. Choice/picklist fields are integers, lookups use
`_field_value` (read) and `@odata.bind` (write), and file/image columns use the generated
upload/download methods — see `.specify/memory/power-platform-code-apps.md`.

### IV. Environment, Configuration & Human-Only Deployment

The target environment is set once via `pa app init` (a.k.a. `npx power-apps init`),
which writes `power.config.json`. This file is developer-created and Git-ignored; it MUST
NOT be committed. Environment IDs and connection IDs MUST NOT be hardcoded in source.
This is a test app: its only deployment is a human running `pa app push` to the single
configured environment. ALM, environment promotion, and solution packaging are out of
scope and MUST NOT be planned or implemented.

**AI agents MUST NEVER** run `pa app push` (or `power-apps push`), `pa app add data-source`,
`pa app delete data-source`, or any equivalent command, script, or skill (e.g. `deploy`,
`add-dataverse`, `add-connector`, `add-datasource`) that pushes the app or adds, removes,
or regenerates data sources. When a feature needs a new data source, the agent MUST stop,
state the exact table/connector required, and hand the step to the user. Rationale: these
operations change shared environments and are irreversible from the agent's perspective.

### V. Build-Before-Push, Strict TypeScript, Node 22+

Always run `npm run build` and resolve all errors before `pa app push`. TypeScript strict
mode is mandatory; remove unused imports (TS6133) and avoid `any` in favor of generated
types. Node.js 22+ (LTS) is required for the Power Apps CLI and data-source generation.

### VI. Spec-Driven Lifecycle with Human Review Gates

All features flow through the SDD lifecycle: `constitution → specify → plan → tasks →
implement`, using the `/speckit.*` commands. Plans MUST state which connectors and data
sources the feature requires and MUST respect the constraints in this constitution.
Human review gates between phases are required; AI agents propose, humans approve.

### VII. Frontend Is a Public Surface (Security & Accessibility)

Everything shipped to the browser is inspectable by end users. Never embed secrets or
sensitive configuration in client code; connectors proxy authentication server-side and
are the only safe path. Every data interaction MUST handle loading, error, and empty
states. The `PowerProvider` SDK initialization lifecycle (loading / error /
not-authenticated) MUST be handled before rendering feature UI. UI MUST meet the project
accessibility target (default WCAG 2.1 AA): keyboard navigation, ARIA semantics, and
sufficient color contrast.

### VIII. Placeholder & Template Hygiene

The starter application under `src/` is a clearly marked **placeholder** intended to be
replaced by the project's first real feature via the SDD lifecycle. Placeholder code MUST
remain visibly labeled and MUST be removed before production. Any in-scope UI region that
cannot be backed by a generated service because of a data gap (Principle XV) MUST render a
visibly labeled placeholder state, never silent mock data. Excluded screens are simply not
built; they MUST NOT appear as placeholders.

### IX. Prototype Fidelity & Chanel Brand (NON-NEGOTIABLE)

`docs/Assortment-Tool-Prototype.html` is the **visual and behavioral source of truth** for
every in-scope screen. Each MUST replicate the prototype's layout, navigation, component
anatomy, typography, color, spacing, radius, shadow, motion, focus, and density behavior.
The app is **not** a content replica: the prototype's sample data, illustrative copy, and
excluded screens MUST NOT be carried over; real data comes from generated services.

- Fonts: the only licensed font file is `src/assets/fonts/ABChanel Corpo Regular.ttf`. It
  MUST be bundled via `@font-face` (Vite asset import, no remote CDN) and registered under
  **both** family names `ABChanel Corpo Display` and `ABChanel Corpo Text` so the
  prototype's family stacks resolve unchanged. Display usage (titles, prominent labels,
  grid headers, KPI values, nav labels) remains uppercase at weight 400; body/label usage
  keeps weight 200 in tokens. Because only a Regular face exists, weight 200 renders as
  Regular; `font-synthesis: none` MUST be set to prevent faux bold/italic. This is a known
  limitation to be listed in every UI spec's limitations section until more faces exist.
- The color palette, type scale, and dense/standard variants MUST match the
  "Canonical Brand Tokens" section below; no additional brand colors may be introduced.
- Deviations from the prototype require an explicit, approved entry in the feature plan's
  Complexity Tracking.

### X. Design Tokens Are the Single Styling Source

All visual constants — font families, font sizes, line heights, font weights, colors,
spacing, radius, shadow, sizes, breakpoints, durations, z-index — MUST be defined once in
**`src/theme/token.ts`** (typed, `as const`). The Ant Design `ConfigProvider` theme, CSS
custom properties (e.g. `--ink`, `--canvas`, `--font-display`), and any chart palette MUST
be derived from that file. Components and pages MUST NOT contain hardcoded hex/rgb values,
px font sizes, font-family strings, or magic spacing numbers. A unit test MUST assert that
`token.ts` matches the canonical values in this constitution.

### XI. Responsive on Every Screen, Proven by Playwright

The app MUST be usable on all monitor and mobile sizes, following the prototype's tiers:
**compact** (< 992 px: navigation drawer, 44 px touch targets, compact padding),
**standard** (992–1599 px), and **wide** (≥ 1600 px, content max-width 2200 px).
Playwright (`e2e/`) MUST verify every page and every new UI component across the viewport
matrix 360×740, 390×844, 768×1024, 1024×768, 1366×768, 1920×1080, and 2560×1440.
Minimum assertions: no horizontal document overflow, correct navigation mode per tier, key
regions visible and operable, keyboard focus visible.

**Screenshot comparison** is mandatory: for each in-scope screen and viewport, Playwright
`toHaveScreenshot` MUST compare the app against a committed baseline captured from the
prototype rendered with the same bundled font. Data-bearing regions MUST be masked (the
app does not reuse prototype data), so comparisons assert layout, chrome, typography, and
color. Default tolerance is `maxDiffPixelRatio: 0.01`; baselines change only with human
approval. E2E tests MUST use deterministic fixtures injected at the data-access layer and
MUST NOT depend on a live Dataverse environment.

### XII. Modular Architecture: Components, Features, Pages

Code MUST be organized by responsibility, one exported component per file:

- `src/theme/` — `token.ts`, Ant Design theme mapping, global CSS variables, font faces.
- `src/components/` — shared, presentational replicas of the prototype's ChanelUI set
  (AppShell, PageHeader, ScreenRegion, RegionState, KpiTile, StatusIndicator, DataGrid,
  Field, FormGrid, WorkflowSection, DetailDrawer, ConfirmAction, SeriesChart).
- `src/features/<feature>/` — feature-scoped components, hooks, mappers, and tests:
  `engine`, `overview`, `doors`, `mass-update`, `tiers`, `exceptions`.
- `src/pages/` — thin route-level screens that compose features; no business logic.
- `src/hooks/`, `src/lib/` — cross-feature hooks and non-UI helpers.
- `src/generated/` — CLI output only (Principle III).

Features MUST NOT import from other features' internals; shared code moves to
`components/`, `hooks/`, or `lib/`.

### XIII. The Assortment Engine Is Pure, Isolated, and Test-First

The Assortment Engine MUST live in `src/features/engine/` as pure, deterministic TypeScript
functions with no React, no I/O, and no generated-service imports. Inputs are plain typed
objects mapped from generated models by adapters. Derivation order:

1. Resolve the Door's Tier.
2. Collect that Tier's rules (SKUs).
3. Keep a SKU only when its **Axis text exactly equals** one of the Door's **Product Line**
   values (case-sensitive, no trimming or normalization). No mapping tables exist or may
   be introduced; this match is performed solely in the engine.
4. Apply Assortment exceptions (add/remove). When a Door-level and a Retailer-level
   exception conflict for the same Door × SKU, the **Door-level exception wins** (finer
   granularity).

Every rule, precedence decision, and edge case (missing tier, empty or near-miss product
lines such as differing case or whitespace, conflicting exceptions, inactive records) MUST
have unit tests written before or alongside the code, and the UI MUST surface *why* a SKU
is or is not assorted to a door.

**Door assortments are derived, never persisted.** No Dataverse table, browser storage, or
in-memory structure may hold a materialized Door × SKU result. The engine MUST compute and
cache base assortments once per (Tier, Product Line) pair and treat Door-level and
Retailer-level exceptions as sparse adjustments resolved at lookup time; results are
produced lazily for the doors and rows a screen actually needs. Rationale: assortments can
reach millions of Door × SKU combinations, which would exhaust browser memory and Dataverse
capacity if stored, while the factored form stays proportional to tiers × product lines ×
SKUs plus exceptions.

### XIV. No Spec Is Complete Without Passing Unit Tests and Recorded Limitations

A spec MUST NOT be declared complete until (a) Vitest unit tests covering its acceptance
scenarios are written, **all** pass, and coverage is **100%** for lines, branches,
functions, and statements (enforced by Vitest coverage thresholds; only `src/generated/**`,
`src/main.tsx`, type-only files, and test files are excluded), (b) Playwright tests and
screenshot comparisons for any new UI component or page pass across the viewport matrix,
and (c) the spec's `spec.md` contains a **Verification & Known
Limitations** section listing test results, untested scenarios, data gaps, and behavior
that deviates from the prototype or ERD. Earlier specs' limitation sections MUST be kept
current so users can see what each delivered spec cannot yet do.

### XV. Data Gaps Are Flagged, Never Invented

The ERD (`docs/Assortment-Tool-Data-Model-ERD.html`) is the target model; the generated
services in `src/generated/` are the available model. Specs and plans MUST use the current
generated services to the fullest extent and MUST include a **Data Gaps** section listing
every entity, field, or relationship the feature needs but that is not generated. Agents
MUST NOT create tables, invent service calls, use direct HTTP, or hand-write generated
files to close a gap; they flag it and render a labeled placeholder (Principle VIII).
Gaps that only serve excluded screens are out of scope and need not be flagged.

## UI Component Library Standard

**Ant Design** (version pinned in `package.json`) is the component foundation, themed only
through `src/theme/token.ts` and wrapped by the ChanelUI replica components in
`src/components/`. Feature code SHOULD consume the wrappers rather than raw Ant Design
components so brand fidelity is enforced in one place. Charts MUST use **Recharts** and
reproduce the prototype's SeriesChart (series ink → muted → light, grid `#e4e2de`,
height 220 px), with colors taken from `token.ts`.
**ProComponents** remains an optional add-on only if it can be themed to full fidelity.
Any library used MUST be accessible (WCAG 2.1 AA), tree-shakeable, actively maintained,
and MIT-licensed (fonts excepted; they are licensed brand assets).

## Canonical Brand Tokens (reference)

Extracted from the prototype; `src/theme/token.ts` MUST match these values.

- **Families**: display `'ABChanel Corpo Display', Georgia, 'Times New Roman', serif`;
  text `'ABChanel Corpo Text', 'Helvetica Neue', Helvetica, Arial, sans-serif`.
- **Weights**: text 200, display 400.
- **Colors**: ink `#050505`, soft-black `#1f1f1f`, ink-muted `#6b6862`, paper `#ffffff`,
  canvas `#f7f6f4`, border `#e4e2de`, border-control `#8c8882`, accent `#050505`,
  selected-option `#05050514`, nav-selected bg/text `#050505`/`#ffffff`, row-zebra
  `#f7f6f4`, row-hover/row-selected `#e4e2de`, critical `#a8071a`, error `#f5222d`,
  warning `#d48806`, warning-strong `#a86500`, success `#389e0d`, unavailable `#6b6862`,
  chart-1/2/3 `#050505`/`#6b6862`/`#b8b4ae`, chart-grid `#e4e2de`, focus-ring `#050505`.
- **Type scale (size/line-height, standard → dense)**: h1 30/38 → 24/32; h2 24/32 → 20/28;
  h3 20/28 → 16/24; h4 16/24 → 14/22; h5 14/22 → 10/18; label-prominent 13/20 → 12/18;
  body 13/21 → 10/18; label 12/20; grid-header 12/20 → 10/18; kpi-value 28/32;
  workflow-number 18/28; nav-label 10/10; app-name 12/12.
- **Spacing**: compact 4, icon 6, control 8, panel 16, tile-gap 12; content padding
  16/24/32; section gap 12/20/28; region gap 8/16/20 (compact/standard/wide, px).
- **Radius / shadow**: radius 4 px, horizontal nav 0 px; tile `0 1px 3px rgba(5,5,5,0.08)`,
  popup `0 8px 24px rgba(5,5,5,0.16)`.
- **Sizes**: header 56, nav trigger 40, nav drawer 300, nav rail 240, nav item 40, region
  min-height 140, KPI tile 96, chart 220, drawer 420, modal 520/720, touch target 44,
  focus ring 3 / offset 2, content max-width 2200, breakpoints 992 / 1600 (px).
- **Motion**: fast 0.15 s, mid 0.2 s, slow 0.25 s, easing `ease`; honor
  `prefers-reduced-motion`.

## Data Model Alignment & Known Gaps

Generated today: Door, Tier, SKU, Tier rule, Assortment exception. These are sufficient
for the in-scope screens.

**In-scope gaps** (flag in every affected spec):

| Gap | Affects |
| --- | --- |
| Retailer (no table; only distributor name/code text on Door) | Retailer-level exceptions. TODO(RETAILER_FIELD): confirm which Door text field identifies the retailer for exception matching. |
| SKU Type (formula column) | Retail/SPM filtering — read-only, verify availability |

**Resolved by design**: Product Line ↔ Axis needs no table; the engine matches exact text
(Principle XIII).

**Excluded with their screens** (do not build or flag): Change log, Import run, Export run,
Export line, Data source, Explorer view.

This list MUST be revalidated whenever the user regenerates data sources.

## Technology Constraints & Prerequisites

- **Stack**: React 19, TypeScript 6 (strict), Vite 8, `@microsoft/power-apps` runtime +
  `@microsoft/power-apps-vite` plugin (exact versions as pinned in `package.json`).
- **Standards stack** (see `.specify/memory/frontend-standards.md`): Ant Design (v6 as
  pinned), TanStack Query, React Router, React Hook Form + Zod, Vitest + Testing Library,
  Playwright, Prettier, ESLint.
- **Tooling prerequisites**: Node.js 22.22.2+ or 24.15+ (LTS), Git, and the Power Apps CLI
  (`@microsoft/power-apps-cli`, installed locally via `npm ci`; dual binaries `pa`
  preferred / `power-apps` fallback, invoked with `npx --no-install`).
- **Environment prerequisites**: a Power Platform environment with **code apps enabled**
  (admin toggle) and **Power Apps Premium** licensing for end users.
- **Known platform limitations**: no Power Platform Git integration; not supported in Power
  Apps for Windows; no SAS IP restriction (use Conditional Access for IP control); no
  `PowerBIIntegration` (embed via Power Apps visual instead).

## Development Workflow & Quality Gates

1. Adopt the template (GitHub "Use this template" or `degit`), run `npm ci`, then
   `npx power-apps init` to create `power.config.json` for the target environment.
2. Fill this constitution's Project-Specific Configuration via `/speckit.constitution`.
3. For each feature: `/speckit.specify` → `/speckit.plan` → `/speckit.tasks` →
   `/speckit.implement`, with human approval at each gate. Exception: for a trivial
   change (a typo, a copy tweak, a small bug fix with no behavior or data-source impact),
   it is acceptable to skip directly to a small PR rather than running the full
   specify→plan→tasks sequence.
4. A **human** creates required Power Platform components (tables, connectors, flows) in
   the maker portal and wires them in with `pa app add data-source`. AI agents never do
   this step (Principle IV).
5. Quality gates before a spec is complete or merged: strict TypeScript passes,
   `npm run build` succeeds, `npm run lint` passes, all Vitest unit tests pass with 100%
   coverage, Playwright viewport-matrix and screenshot-comparison tests pass for every
   new/changed page or component, accessibility target met, no secrets in source, no
   direct HTTP for data access.
6. Command execution discipline: `/speckit.specify`, `/speckit.plan`, `/speckit.tasks`, and
   `/speckit.constitution` only read/write Markdown planning artifacts — do not run
   `npm run build`/`lint`/`test`/`format` or start the dev server as part of those steps.
   Run verification commands only after changes to buildable code (`src/**`,
   `vite.config.ts`, `package.json`, `tsconfig*.json`, or test files), typically
   during/after `/speckit.implement`. See `.github/copilot-instructions.md`.
7. Brand gate: no hardcoded colors, font sizes, or font families outside
   `src/theme/token.ts`; the token-parity unit test passes.
8. Completion gate: the spec's Verification & Known Limitations and Data Gaps sections are
   filled in (Principles XIV, XV). Deployment (`pa app push`) is performed by a human only.

## Governance

This constitution supersedes ad-hoc practices for code-app development in this repository.
Amendments require a pull request documenting the change, approval from the owning team,
and a version bump per the policy below. All reviews MUST verify compliance with these
principles; complexity or deviations MUST be justified in the plan's Complexity Tracking.
Runtime development guidance lives in `.specify/memory/power-platform-code-apps.md` and
`.specify/memory/frontend-standards.md`.

**Versioning policy**: MAJOR for backward-incompatible governance/principle removals or
redefinitions; MINOR for a new principle/section or materially expanded guidance; PATCH
for clarifications and non-semantic refinements. Adopting projects record their own
ratification date when they complete initialization.

**Version**: 2.2.0 | **Ratified**: 2026-10-23 | **Last Amended**: 2026-10-26
