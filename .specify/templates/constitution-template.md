# [PROJECT_NAME] Constitution

A Spec-Driven Development (SDD) constitution for building **Power Platform code apps**.
The principles below are fixed for every app built from this template. The
**Project-Specific Configuration** block MUST be completed for each project during
repository initialization (run `/speckit.constitution` and answer the prompts).

## Project-Specific Configuration

> Complete every field below when adopting this template. Leaving a bracketed token
> unresolved is a signal that the project has not yet been fully initialized.

- **App name**: [APP_NAME]
- **Business purpose**: [APP_PURPOSE]
- **Target environments (dev / test / prod) & ALM promotion path**: [TARGET_ENVIRONMENTS]
- **Data sources & connectors used** (created via Power Platform maker portal, wired in
  through `pa app add data-source`): [DATA_SOURCES]
- **Owning team**: [OWNING_TEAM]
- **Reviewers / approvers for review gates**: [REVIEWERS]
- **Performance targets** (e.g., initial load budget, interaction latency): [PERFORMANCE_TARGETS]
- **Accessibility target**: [ACCESSIBILITY_TARGET]  <!-- Default: WCAG 2.1 AA -->
- **Security & compliance** (DLP policy, Conditional Access, data residency, sharing
  limits): [SECURITY_COMPLIANCE]
- **Licensing** (Power Apps Premium is required for end users): [LICENSING_PLAN]
- **UI component library confirmation**: [UI_LIBRARY_CONFIRMATION]
  <!-- Default is Ant Design v5 + ProComponents (see "UI Component Library Standard").
       Confirm the default, or record the approved alternative and the reason. -->

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

### IV. Environment & Configuration Discipline

The target environment is set once via `pa app init` (a.k.a. `npx power-apps init`),
which writes `power.config.json`. This file is developer-created and Git-ignored; it MUST
NOT be committed to the template. Environment IDs and connection IDs MUST NOT be hardcoded
in source. Running `init` is the first command a developer executes after adopting this
template.

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
remain visibly labeled and MUST be removed before production. Template scaffolding must
never be mistaken for delivered functionality.

## UI Component Library Standard

The **default** UI component library is **Ant Design v5** with **ProComponents**
(`ProTable`, `ProForm`, `ProLayout`), chosen for free, enterprise-grade CRUD scaffolding
that accelerates line-of-business app development. Any UI library used MUST be accessible
(target WCAG 2.1 AA), tree-shakeable, actively maintained, and MIT-licensed.

> **Accessibility callout**: Ant Design's accessibility is good but not best-in-class.
> For engagements with strict WCAG / Section 508 requirements, evaluate an alternative
> before committing:
>
> - **MUI + AG Grid Community** — accessibility-first enterprise stack (AG Grid Community
>   is free; heavy data grids covered).
> - **Mantine** — modern, brand-neutral, batteries-included.
> - **shadcn/ui + Radix + Tailwind** — maximum design control; Radix provides strong a11y.
>
> Confirm or override the default in the `[UI_LIBRARY_CONFIRMATION]` field above.

## Technology Constraints & Prerequisites

- **Stack**: React 19, TypeScript (strict), Vite 7, `@microsoft/power-apps` runtime +
  `@microsoft/power-apps-vite` plugin.
- **Standards stack** (see `.specify/memory/frontend-standards.md`): Ant Design v5 +
  ProComponents, TanStack Query, React Router, React Hook Form + Zod, Vitest, Playwright,
  Prettier, ESLint.
- **Tooling prerequisites**: Node.js 22+ (LTS), Git, and the Power Apps CLI
  (`@microsoft/power-apps-cli`, installed locally via `npm install`; dual binaries `pa`
  preferred / `power-apps` fallback, invoked with `npx --no-install`).
- **Environment prerequisites**: a Power Platform environment with **code apps enabled**
  (admin toggle) and **Power Apps Premium** licensing for end users.
- **Known platform limitations**: no Power Platform Git integration; not supported in Power
  Apps for Windows; no SAS IP restriction (use Conditional Access for IP control); no
  `PowerBIIntegration` (embed via Power Apps visual instead).

## Development Workflow & Quality Gates

1. Adopt the template (GitHub "Use this template" or `degit`), run `npm install`, then
   `npx power-apps init` to create `power.config.json` for the target environment.
2. Fill this constitution's Project-Specific Configuration via `/speckit.constitution`.
3. For each feature: `/speckit.specify` → `/speckit.plan` → `/speckit.tasks` →
   `/speckit.implement`, with human approval at each gate.
4. Create required Power Platform components (tables, connectors, flows) in the maker
   portal, then wire them in with `pa app add data-source`.
5. Quality gates before merge/deploy: strict TypeScript passes, `npm run build` succeeds,
   Vitest unit tests pass, accessibility target met, no secrets in source, no direct HTTP
   for data access.
6. Command execution discipline: `/speckit.specify`, `/speckit.plan`, `/speckit.tasks`, and
   `/speckit.constitution` only read/write Markdown planning artifacts — do not run
   `npm run build`/`lint`/`test`/`format` or start the dev server as part of those steps.
   Run verification commands only after changes to buildable code (`src/**`,
   `vite.config.ts`, `package.json`, `tsconfig*.json`, or test files), typically
   during/after `/speckit.implement`. See `.github/copilot-instructions.md`.

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

**Version**: [CONSTITUTION_VERSION] | **Ratified**: [RATIFICATION_DATE] | **Last Amended**: [LAST_AMENDED_DATE]
