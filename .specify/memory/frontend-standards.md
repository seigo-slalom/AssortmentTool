# Frontend Standards — Power Platform Code Apps

Standards for React/UI/testing in this repository. Referenced by the constitution and the
`.github/instructions/power-apps-code-app.instructions.md` guardrails. These accelerate
development and keep every app consistent and accessible.

## Stack

| Concern | Standard | Notes |
| --- | --- | --- |
| UI components | **Ant Design v5** | Default. **ProComponents** (`ProTable`, `ProForm`, `ProLayout`) is an optional add-on — `npm install @ant-design/pro-components` — for features that need schema-driven CRUD scaffolding; not installed by default. Confirm/override the base library per project in the constitution. |
| Server state / data fetching | **TanStack Query** (`@tanstack/react-query`) | Wrap generated services; handle loading/error/empty. |
| Routing | **React Router** (`react-router-dom`) | |
| Forms & validation | **React Hook Form** + **Zod** (`@hookform/resolvers`) | ProForm may be used for CRUD-heavy forms. |
| Unit testing | **Vitest** + Testing Library + jsdom | `npm test`. |
| E2E testing | **Playwright** | `npm run test:e2e`. |
| Formatting | **Prettier** | `npm run format`. |
| Linting | **ESLint** (flat config) | `npm run lint`. |

## Folder conventions

```text
src/
├── theme/          # token.ts (ONLY literal style values), derived antd theme, CSS variables,
│                   # font faces, chart palette, ThemeProvider, global.css (var() only)
├── components/     # Shared ChanelUI replicas, one folder per component (AppShell,
│                   # PageHeader, ScreenRegion, RegionState, ScreenScaffold, …)
├── hooks/          # Custom hooks (useLayoutTier, useDocumentTitle, TanStack Query hooks)
├── pages/          # One folder per route-level screen: <Screen>Page/{<Screen>Page.tsx, test, index.ts}
├── features/       # Feature-scoped logic (e.g. engine/); no cross-feature internals
├── lib/            # Non-UI helpers, navigation + screen registries, context
├── generated/      # CLI output from `pa app add data-source` — DO NOT hand-edit
├── PowerProvider.tsx  # Power Apps SDK init (loading/error lifecycle)
├── App.tsx         # AppShell + lazy routes from lib/screens
└── main.tsx        # Provider composition (Theme, Power, Query, HashRouter)
```

## Styling

- Every visual constant lives in `src/theme/token.ts`. Components style themselves with
  CSS Modules (`*.module.css`) that use only `var(--token)`, `0`, keywords, `%`/`fr`, and
  `calc()` over variables. The Ant Design theme and CSS variables are derived from tokens.
- Layout tiers (`compact` < 992 ≤ `standard` < 1600 ≤ `wide`) are exposed as `data-tier`
  on `.cds-root`; style tiers with `:global([data-tier='compact']) .x { … }` because media
  queries cannot read CSS variables.
- Enforced by `src/theme/noHardcodedStyles.test.ts` and ESLint `no-restricted-syntax`.

## Data access

- All external data goes through **generated services** in `src/generated/services/`.
  Never use `fetch`, `axios`, Graph SDKs, or Azure REST (connector-first — see the
  constitution and `power-platform-code-apps.md`).
- Screens read the five assortment tables once through `useAssortmentData()`
  (`src/lib/data/`, TanStack Query key `['assortment-data']`). It returns the records, an
  index, and an Assortment Engine built from the **same** records. Do not load a second
  copy for the engine. Previews (what-if tiers/exceptions) rebuild an engine from a modified
  dataset with `withDoorTierOverrides` / `withDoorExceptions`; never persist results.
- Writes use `src/lib/data/mutations.ts` (`setDoorTier`, `createDoorException`,
  `cancelException`) which return `{ ok, error }` and never throw. Bulk writes re-check the
  affected doors first (`recheckDoors`, 50 ids per request) and run through
  `src/lib/async/runPool.ts` (4 at a time). Invalidate `useAssortmentData` after writes.
- Always render loading, error, and empty states.
- Excel (`src/lib/excel/`): exceljs is only reached through `import('exceljs')`, so it
  stays in its own lazy chunk; `.csv` uploads use the in-house `parseCsv` (exceljs' CSV
  reader needs Node streams).
- Screen state: filters/sort/page that should survive reload live in the URL query
  (`useSearchParams`); cross-route session state (door selection, last Doors query) lives
  in `src/lib/session/` stores. No browser storage.

## Provider composition

The root composes providers in this order (see `src/main.tsx`):
`ThemeProvider` (token theme, CSS variables, fonts) → `PowerProvider` → `QueryClientProvider`
→ `HashRouter` → `ErrorBoundary` → `App`. `ThemeProvider` is outermost so the host
loading/error states are branded. `PowerProvider` gates rendering on the Power Apps SDK
`getContext()` lifecycle. `HashRouter` (not `BrowserRouter`) keeps every screen
bookmarkable and reloadable inside the static Power Apps host, which cannot rewrite deep
paths to `index.html`.

## Accessibility (default WCAG 2.1 AA)

- All interactive elements keyboard-reachable; visible focus states.
- Meaningful labels/ARIA; images have `alt`; forms have associated labels.
- Sufficient color contrast; do not rely on color alone.
- Prefer accessible Ant Design components; verify custom components with keyboard and a
  screen reader. For strict Section 508 engagements, evaluate the alternative libraries
  named in the constitution.

## TypeScript

- Strict mode; no `any` — use generated model types.
- `import type` for type-only imports (verbatim module syntax).
- Remove unused imports (TS6133). `npm run build` must be clean before `pa app push`.

## Performance

- Ant Design is imported per-component for tree-shaking (`import { Button } from 'antd'`).
- **Bundle splitting is pre-wired, keep it that way.** `vite.config.ts` defines
  `manualChunks` splitting `vendor-react`, `vendor-antd`, and `vendor-query` from app code,
  and `App.tsx` lazy-loads each page with `React.lazy`/`Suspense`. Ant Design alone
  (~786kB minified) already exceeds Rollup's 500kB chunk warning, which is why
  `chunkSizeWarningLimit` is raised in `vite.config.ts`; if you add ProComponents or
  another large dependency (e.g. a charting library), re-check `npm run build` output and
  adjust
  `manualChunks`/`chunkSizeWarningLimit` accordingly. When you add a new top-level page
  under `src/pages/`, import it with `lazy(() => import(...))` in `App.tsx` instead of a
  static import so it ships its own chunk.
- Re-check `npm run build` output after adding a new large dependency (e.g. a charting
  library) — add it to `manualChunks` if it meaningfully grows the vendor bundle.

## Testing conventions

- Unit tests colocated as `*.test.tsx` next to the component; e2e specs in `e2e/`.
- Test behavior and accessibility (queries by role/label), not implementation details.
