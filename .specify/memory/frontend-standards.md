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
├── components/     # Reusable presentational components
├── hooks/          # Custom hooks (incl. TanStack Query hooks)
├── pages/          # Route-level screens
├── lib/            # Non-UI helpers, service wrappers, context
├── generated/      # CLI output from `pa app add data-source` — DO NOT hand-edit
├── PowerProvider.tsx  # Power Apps SDK init (loading/error lifecycle)
├── App.tsx         # Layout + routes
└── main.tsx        # Provider composition (PowerProvider, Query, Router, antd)
```

## Data access

- All external data goes through **generated services** in `src/generated/services/`.
  Never use `fetch`, `axios`, Graph SDKs, or Azure REST (connector-first — see the
  constitution and `power-platform-code-apps.md`).
- Wrap each service call in a TanStack Query hook (see `src/hooks/useSampleItems.ts` for
  the placeholder pattern). Always render loading, error, and empty states.
- The placeholder `src/lib/placeholderService.ts` is temporary — replace it with generated
  services for real features.

## Provider composition

The root composes providers in this order (see `src/main.tsx`):
`PowerProvider` → `QueryClientProvider` → `ConfigProvider` (antd theme) → `BrowserRouter` →
`App`. `PowerProvider` gates rendering on the Power Apps SDK `getContext()` lifecycle.

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
