<!--
Sync Impact Report
- Version change: 1.2.0 → 2.0.0 (MAJOR)
  Rationale: the generic starter constitution is redefined into the Assortment Tool project
  constitution. Backward-incompatible redefinitions: UI Component Library Standard now
  mandates pixel-level fidelity to the prototype's Chanel design system; Playwright
  responsiveness tests and per-spec unit tests become blocking gates; AI agents are
  prohibited from push and data-source operations.
- Modified principles:
  IV. Environment & Configuration Discipline → IV. Environment, Configuration & Human-Only
      Deployment (AI agents MUST NOT run `pa app push` or add/remove data sources)
  VIII. Placeholder & Template Hygiene (now also covers data-gap placeholders)
- Added principles:
  IX. Prototype Fidelity & Chanel Brand (NON-NEGOTIABLE)
  X. Design Tokens Are the Single Styling Source (`src/theme/token.ts`)
  XI. Responsive on Every Screen, Proven by Playwright
  XII. Modular Architecture: Components, Features, Pages
  XIII. The Assortment Engine Is Pure, Isolated, and Test-First
  XIV. No Spec Is Complete Without Passing Unit Tests and Recorded Limitations
  XV. Data Gaps Are Flagged, Never Invented
- Added sections: Canonical Brand Tokens (reference), Data Model Alignment & Known Gaps
- Modified sections: Project-Specific Configuration (filled), UI Component Library Standard,
  Technology Constraints & Prerequisites (versions aligned to package.json),
  Development Workflow & Quality Gates (new gates 5–8)
- Removed sections: none
- Templates: plan/spec/tasks templates read this file at runtime; not modified by this run.
  ⚠ Recommended follow-up (manual): add a "Data Gaps" and "Verification & Known
  Limitations" section to .specify/templates/spec-template.md; align
  .specify/memory/frontend-standards.md and .github/copilot-instructions.md with
  Principles IV, X, XI, XII.
- Deferred TODOs: TODO(FONT_ASSETS), TODO(OWNING_TEAM), TODO(REVIEWERS),
  TODO(TARGET_ENVIRONMENTS), TODO(PERFORMANCE_TARGETS), TODO(SECURITY_COMPLIANCE),
  TODO(LICENSING_PLAN), TODO(DATA_GAP_STRATEGY), TODO(VIEWPORT_MATRIX_CONFIRMATION)
-->

# Assortment Tool Constitution

A Spec-Driven Development (SDD) constitution for the **Assortment Tool**, a Power Platform
code app whose purpose is to exercise and validate the **Assortment Engine** that powers
door assortment. Principles I–VIII are inherited from the Slalom Power Platform Code App
starter; Principles IX–XV are specific to this project.

## Project-Specific Configuration

- **App name**: Assortment Tool (Chanel Fragrance & Beauty · United States)
- **Business purpose**: Provide a faithful, production-styled UI over the Assortment Engine
  so users can test how door assortments are derived (Door → Tier → Tier rules → SKU,
  filtered by Product Line ↔ Axis coverage, then adjusted by Assortment exceptions), and
  see the limitations of each delivered spec. Screens replicate the prototype: Overview,
  Doors, Mass update, Tier assortments (incl. Manage tiers), Exceptions, Explorer, Exports,
  Activity, Data sources, and Parking lot.
- **Target environments (dev / test / prod) & ALM promotion path**: One development
  environment configured by a human via `power.config.json`. TODO(TARGET_ENVIRONMENTS):
  confirm environment names and who owns UAT/PROD promotion.
- **Data sources & connectors used** (created via Power Platform maker portal, wired in
  through `pa app add data-source` **by a human only**): Dataverse tables currently
  generated in `src/generated/`: `cr380_doors`, `cr380_tiers`, `cr380_skus`,
  `cr380_tierrules`, `cr380_assortmentexceptions`. Gaps against the ERD are listed in
  "Data Model Alignment & Known Gaps".
- **Owning team**: TODO(OWNING_TEAM)
- **Reviewers / approvers for review gates**: TODO(REVIEWERS)
- **Performance targets**: TODO(PERFORMANCE_TARGETS). Proposed default: first meaningful
  render ≤ 3 s inside the Power Apps host on a desktop connection; engine recomputation for
  a single door ≤ 200 ms; grids remain interactive (≤ 100 ms input latency) at 5,000 rows
  via virtualization.
- **Accessibility target**: WCAG 2.1 AA (the prototype's 3 px ink focus ring, 44 px compact
  touch targets, and reduced-motion handling are mandatory).
- **Security & compliance**: TODO(SECURITY_COMPLIANCE): confirm DLP policy, Conditional
  Access, and data-residency constraints.
- **Licensing**: Power Apps Premium for end users. TODO(LICENSING_PLAN): confirm.
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
This repository's ALM responsibility ends at pushing the built app to one environment via
`pa app push`, performed by a human developer. Promotion into UAT/PROD and solution-level
ALM are owned by the Power Platform team's existing deployment process.

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
remain visibly labeled and MUST be removed before production. Any UI region that cannot be
backed by a generated service because of a data gap (Principle XV) MUST render a visibly
labeled placeholder state, never silent mock data.

### IX. Prototype Fidelity & Chanel Brand (NON-NEGOTIABLE)

`docs/Assortment-Tool-Prototype.html` is the **visual and behavioral source of truth**.
Every screen MUST replicate the prototype's layout, navigation, copy, component anatomy,
typography, color, spacing, radius, shadow, motion, focus, and density behavior exactly.

- Fonts: **ABChanel Corpo Display** (weight 400, uppercase for titles, prominent labels,
  grid headers, KPI values, nav labels) and **ABChanel Corpo Text** (weight 200, body and
  labels) MUST be self-hosted as bundled `@font-face` assets (WOFF2) under
  `src/assets/fonts/` and used with the prototype's exact fallback stacks. Remote font CDNs
  MUST NOT be used (the code-app sandbox may block them). TODO(FONT_ASSETS): licensed font
  files must be supplied by the user.
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
matrix 360×740, 390×844, 768×1024, 1024×768, 1366×768, 1920×1080, and 2560×1440
(TODO(VIEWPORT_MATRIX_CONFIRMATION)). Minimum assertions: no horizontal document overflow,
correct navigation mode per tier, key regions visible and operable, keyboard focus visible.
E2E tests MUST use deterministic fixtures injected at the data-access layer and MUST NOT
depend on a live Dataverse environment.

### XII. Modular Architecture: Components, Features, Pages

Code MUST be organized by responsibility, one exported component per file:

- `src/theme/` — `token.ts`, Ant Design theme mapping, global CSS variables, font faces.
- `src/components/` — shared, presentational replicas of the prototype's ChanelUI set
  (AppShell, PageHeader, ScreenRegion, RegionState, KpiTile, StatusIndicator, DataGrid,
  Field, FormGrid, WorkflowSection, DetailDrawer, ConfirmAction, SeriesChart).
- `src/features/<feature>/` — feature-scoped components, hooks, mappers, and tests (e.g.
  `engine`, `doors`, `tiers`, `exceptions`, `mass-update`, `explorer`, `exports`,
  `activity`, `data-sources`).
- `src/pages/` — thin route-level screens that compose features; no business logic.
- `src/hooks/`, `src/lib/` — cross-feature hooks and non-UI helpers.
- `src/generated/` — CLI output only (Principle III).

Features MUST NOT import from other features' internals; shared code moves to
`components/`, `hooks/`, or `lib/`.

### XIII. The Assortment Engine Is Pure, Isolated, and Test-First

The Assortment Engine (door assortment derivation: Door's Tier → that Tier's rules (SKUs)
→ keep SKUs whose Axis is covered by the Door's Product Lines → apply Door-level and
Retailer-level add/remove exceptions) MUST live in `src/features/engine/` as pure,
deterministic TypeScript functions with no React, no I/O, and no generated-service imports.
Inputs are plain typed objects mapped from generated models by adapters. Every rule,
precedence decision, and edge case (missing tier, empty product lines, conflicting
exceptions, inactive records) MUST have unit tests written before or alongside the code,
and the UI MUST surface *why* a SKU is or is not assorted to a door.

### XIV. No Spec Is Complete Without Passing Unit Tests and Recorded Limitations

A spec MUST NOT be declared complete until (a) Vitest unit tests covering its acceptance
scenarios are written and pass, (b) Playwright tests for any new UI component or page pass
across the viewport matrix, and (c) the spec's `spec.md` contains a **Verification & Known
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
TODO(DATA_GAP_STRATEGY): confirm whether labeled local fixture data may back gap screens
in dev builds.

## UI Component Library Standard

**Ant Design** (version pinned in `package.json`) is the component foundation, themed only
through `src/theme/token.ts` and wrapped by the ChanelUI replica components in
`src/components/`. Feature code SHOULD consume the wrappers rather than raw Ant Design
components so brand fidelity is enforced in one place. Charts MUST reproduce the
prototype's SeriesChart (series ink → muted → light, grid `#e4e2de`, height 220 px).
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

Generated today: Door, Tier, SKU, Tier rule, Assortment exception. ERD entities and
concepts **not** available through generated services (flag in every affected spec):

| Gap | Affects |
| --- | --- |
| Change log | Activity screen, audit trail of tier changes / exceptions / imports |
| Import run | Mass update batch tracking (Batch ID) |
| Export run, Export line | Exports screen, SAP ship-to/sold-to export |
| Data source | Data sources screen (Reltio, Sunrise dataflow status) |
| Explorer view | Saved Explorer views |
| Retailer (no table; only distributor name/code text on Door) | Retailer-level exceptions |
| Product Line ↔ Axis mapping (no table; text fields only) | Engine coverage rule |
| SKU Type (formula column) | Retail/SPM filtering — read-only, verify availability |

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
   `npm run build` succeeds, `npm run lint` passes, Vitest unit tests pass, Playwright
   viewport-matrix tests pass for every new/changed page or component, accessibility
   target met, no secrets in source, no direct HTTP for data access.
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

**Version**: 2.0.0 | **Ratified**: 2026-10-23 | **Last Amended**: 2026-10-23
