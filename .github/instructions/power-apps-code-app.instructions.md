---
description: 'Power Platform code app development rules (connector-first, generated services, strict TS, accessibility).'
applyTo: 'src/**,vite.config.ts,package.json,tsconfig*.json'
---

# Power Platform Code App — Development Instructions

You are working in a **Power Platform code app** (React + Vite + TypeScript running inside
Power Platform). Follow these rules for all code in `src/**` and related config.

## Scope

- This repository builds the **code app codebase only**. Do NOT scaffold or author other
  Power Platform components (Dataverse tables, columns, choices, flows, connectors,
  connection references, environments, solutions). Direct the developer to create those in
  the Power Platform maker portal, then wire them in with `pa app add data-source`.

## Data access (connector-first — non-negotiable)

- NEVER use `fetch`, `axios`, Microsoft Graph SDKs, Azure REST, or any direct HTTP client
  for data access. Code apps run in a sandbox where direct outbound requests fail at
  runtime.
- ALWAYS use the typed services generated into `src/generated/services/` by
  `pa app add data-source`. If a needed data source has no generated service yet, tell the
  developer which connector/command to run rather than writing an HTTP call.
- If no connector exists for a capability, say so explicitly. Do not implement a workaround.

## Generated code

- Do not hand-edit files under `src/generated/` except for documented connector
  workarounds (e.g., Azure DevOps `parameters` → `body`).
- Use generated model interfaces for typing; do not redefine shapes with `any`.
- Dataverse: choice/picklist fields are integers (type `useState` as `number`); lookups
  read `_field_value` and write `@odata.bind`; file/image columns use the generated
  upload/download methods.

## Security

- The client bundle is public. NEVER embed secrets, API keys, tokens, or connection
  strings in source. Connectors proxy authentication server-side — that is the only safe
  path.
- Do not hardcode environment IDs or connection IDs; they live in `power.config.json`
  (developer-created, Git-ignored).

## Quality

- TypeScript strict mode: no unused imports (TS6133), no `any`. Run `npm run build` and
  fix all errors before any `pa app push`.
- Handle loading, error, and empty states for every data interaction.
- The `PowerProvider` initialization lifecycle must resolve before rendering feature UI.
- Meet the project accessibility target (default WCAG 2.1 AA): keyboard navigation, ARIA
  semantics, sufficient contrast.

## Standards stack

Prefer the repository's standard stack: **Ant Design v5** for UI (ProComponents —
`ProTable`/`ProForm`/`ProLayout` — is an optional add-on for schema-driven CRUD screens,
not installed by default; add it only when a feature needs it), **TanStack Query** for
server state, **React Router** for routing, **React Hook Form + Zod** for forms,
**Vitest** for unit tests, **Playwright** for e2e, **Prettier** for formatting. Folder
conventions: `components/`, `hooks/`, `pages/`, `lib/`, with `src/generated/` reserved for
CLI output.

For deeper guidance see `.specify/memory/power-platform-code-apps.md` and
`.specify/memory/frontend-standards.md`.
