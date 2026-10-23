# Slalom Power Platform Code App — SDD Starter Template

A reusable starter for building **Power Platform code apps** with **Spec-Driven Development
(SDD)**. It pairs a React + Vite + TypeScript code-app foundation with [Spec Kit](https://github.com/github/spec-kit)
so features are built through a disciplined `constitution → specify → plan → tasks →
implement` workflow, guided by Power Platform–specific guardrails.

> **Scope**: This repository builds the **code app codebase only**. Dataverse tables,
> connectors, flows, connection references, and environments are created by developers via
> the Power Platform maker portal / admin center, then wired into the app with
> `pa app add data-source`. See the [project constitution](.specify/memory/constitution.md).

## What's included

- **Code-app foundation** — React 19, Vite 7, TypeScript (strict), `@microsoft/power-apps`
  SDK + `@microsoft/power-apps-vite` plugin, with a `PowerProvider` initialization pattern.
- **Enterprise UI stack** — Ant Design v5, TanStack Query, React Router, React Hook Form +
  Zod, Vitest, Playwright, Prettier, ESLint. ProComponents (`ProTable`/`ProForm`/`ProLayout`)
  is available as an optional add-on for schema-driven CRUD screens — see
  [frontend-standards.md](.specify/memory/frontend-standards.md) — but isn't installed by
  default.
- **Placeholder app** — a clearly marked sample screen (`src/`) to replace with your first
  feature. It is not production functionality.
- **Spec Kit (SDD)** — `/speckit.*` commands plus a Power Platform–tailored
  [constitution](.specify/memory/constitution.md).
- **Power Platform guidance** — runtime knowledge in
  [.specify/memory/power-platform-code-apps.md](.specify/memory/power-platform-code-apps.md)
  and [.specify/memory/frontend-standards.md](.specify/memory/frontend-standards.md).
- **Copilot customization** — auto-applied guardrails
  ([power-apps-code-app.instructions.md](.github/instructions/power-apps-code-app.instructions.md))
  and an on-demand [`code-app-architect` chat mode](.github/chatmodes/code-app-architect.chatmode.md).
- **Runbook** — end-to-end operational guide in [docs/RUNBOOK.md](docs/RUNBOOK.md).
- **Maintenance** — how to keep this template current as Spec Kit and the UI stack
  evolve: [docs/MAINTENANCE.md](docs/MAINTENANCE.md) · [CHANGELOG.md](CHANGELOG.md).

## Coming from Canvas Apps?

If you're used to building Canvas Apps, here's roughly how the concepts map over. It's
directional, not one-to-one — read [frontend-standards.md](.specify/memory/frontend-standards.md)
when you're ready to go deeper.

| Canvas Apps                                                                          | This code app                                                           |
| ------------------------------------------------------------------------------------ | ----------------------------------------------------------------------- |
| Screen                                                                               | A page component in `src/pages/`, rendered via a route in `src/App.tsx` |
| Control & its properties                                                             | A React component and its props                                         |
| `Set()` / `UpdateContext()` (variables)                                              | `useState` inside a component                                           |
| `OnSelect` / `OnChange` (behavior formulas)                                          | Event handler functions (`onClick`, `onChange`)                         |
| Data source / connection                                                             | A connector wired in with `pa app add data-source`, which               |
| generates `src/generated/services/*`                                                 |
| `Patch()` / `Collect()` / `LookUp()`                                                 | A TanStack Query hook wrapping a generated service                      |
| (`useQuery` for reads, `useMutation` for writes) — see `src/hooks/useSampleItems.ts` |
| Studio theming                                                                       | Ant Design's `ConfigProvider` theme tokens in `src/main.tsx`            |
| Publish                                                                              | `npm run build` (compiles), then `npx power-apps push` (deploys)        |

## Prerequisites

1. **Node.js 22.22.2+ or 24.15+ (LTS)** and **Git** on your PATH (`nvm use` reads `.nvmrc`).
   `.npmrc` sets `engine-strict=true`, so older Node versions fail fast at install.
2. A **Power Platform environment with code apps enabled** (admin toggle in the Power
   Platform admin center → Environment → Settings → Product → Features).
3. **Power Apps Premium** licensing for end users.
4. An AI coding agent with Spec Kit (e.g., GitHub Copilot in VS Code).

The Power Apps CLI (`@microsoft/power-apps-cli`) is installed locally by `npm ci` — no
separate global install is required.

## Get started

### 1. Create your project from this template

- **GitHub** — click **Use this template** → **Create a new repository**, then clone it.
- **Or degit** (no Git history):

  ```bash
  npx degit <your-org>/<this-template-repo> my-code-app
  cd my-code-app
  ```

### 2. Install and initialize (order matters)

```bash
npm ci                      # installs the exact locked deps + the Power Apps CLI locally
npx power-apps init         # FIRST Power Platform command — creates power.config.json
```

`npx power-apps init` (equivalently `pa app init`) prompts you to sign in and select your
environment, then writes `power.config.json` (Git-ignored; never committed).

### 3. Establish project principles

In your agent, run `/speckit.constitution`. You'll be prompted to complete the
**Project-Specific Configuration** (app name, environments, data sources, accessibility
target, and to **confirm or change the default UI library**, Ant Design v5 + ProComponents).

### 4. Build your first feature via SDD

```text
/speckit.specify   → describe WHAT to build (requirements, user stories)
/speckit.plan      → tech approach, connectors/data sources, constraints
/speckit.tasks     → dependency-ordered task list
/speckit.implement → build the feature against the plan
```

Optional: `/speckit.clarify` (before plan), `/speckit.analyze`, `/speckit.checklist`.

### 5. Connect data (created outside this repo)

Create Dataverse tables / connectors / flows in the **maker portal**, then generate typed
services:

```bash
npx power-apps add data-source --connector <api> -c <connection-id>
# → src/generated/models/* and src/generated/services/* (use these; never raw fetch/axios)
```

### 6. Run, build, and publish

```bash
npm run dev                 # local dev; open the printed Local Play URL in your tenant profile
npm run build               # must be clean before publishing
npx power-apps push         # deploy to Power Apps; returns a shareable app URL
```

## Common commands

| Command                                                    | Purpose                                                       |
| ---------------------------------------------------------- | ------------------------------------------------------------- |
| `npm ci`                                                   | Install the exact locked dependencies (use on fresh clones)   |
| `npm install <pkg>`                                        | Add or upgrade a dependency (updates `package-lock.json`)     |
| `npx power-apps init`                                      | Initialize the app + select environment → `power.config.json` |
| `npm run dev`                                              | Start the Vite dev server (prints the Local Play URL)         |
| `npm run build`                                            | Type-check + production build (`tsc -b && vite build`)        |
| `npm run lint` / `npm run format`                          | Lint / format                                                 |
| `npm test` / `npm run test:e2e`                            | Unit tests (Vitest) / e2e (Playwright)                        |
| `npx power-apps add data-source --connector <api> -c <id>` | Generate typed services for a data source                     |
| `npx power-apps push`                                      | Build output → deploy to Power Apps                           |
| `npx power-apps connection list`                           | Find connection IDs                                           |

> The CLI ships two binaries: **`pa`** (preferred) and **`power-apps`** (fallback), invoked
> with `npx --no-install <pa|power-apps>`. Classic `pac code ...` commands are deprecated.

## Guardrails (why some things are enforced)

- **Connector-first** — code apps run in a sandbox; direct HTTP (`fetch`, `axios`, Graph,
  Azure REST) fails at runtime. Use generated services only.
- **No secrets in source** — the client bundle is public; connectors proxy auth server-side.
- **No config in code** — environment/connection IDs live in `power.config.json`.
- **Strict TypeScript + build-before-push**, **Node 22+**, **WCAG 2.1 AA** by default.

See the [constitution](.specify/memory/constitution.md) for the full set.

## Project structure

```text
.github/
  chatmodes/code-app-architect.chatmode.md     # on-demand architect advisor
  instructions/power-apps-code-app.instructions.md  # auto-applied guardrails
  skills/speckit-*/                             # Spec Kit commands (managed)
.specify/
  memory/constitution.md                        # governance (fill per project)
  memory/power-platform-code-apps.md            # Power Platform runtime guidance
  memory/frontend-standards.md                  # React/UI/testing standards
  templates/                                     # spec/plan/tasks/constitution templates
docs/RUNBOOK.md                                  # end-to-end operational guide
src/                                             # placeholder code app (replace via SDD)
```

## Making this a template repository

In GitHub, go to **Settings → General** and enable **Template repository** so teams can use
**Use this template**. Keep `power.config.json` out of the template (it is Git-ignored).

## License & attribution

Licensed under the [MIT License](LICENSE). This starter is derived from Microsoft's
[PowerAppsCodeApps](https://github.com/microsoft/PowerAppsCodeApps) template and integrates
[GitHub Spec Kit](https://github.com/github/spec-kit); see [NOTICE](NOTICE).
