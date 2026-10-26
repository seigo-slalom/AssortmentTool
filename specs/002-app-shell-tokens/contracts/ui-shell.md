# UI Contract: Shell, Routes & Accessibility

**Feature**: [../spec.md](../spec.md) · Consumed by later screen specs and by `e2e/` tests.

## Routes (HashRouter)

| Address                                                                                          | Screen           | Selected nav     | Document title                       |
| ------------------------------------------------------------------------------------------------ | ---------------- | ---------------- | ------------------------------------ |
| `#/`                                                                                             | Overview         | Overview         | `Overview · Assortment tool`         |
| `#/doors`                                                                                        | Doors            | Doors            | `Doors · Assortment tool`            |
| `#/doors/:doorId`                                                                                | Door detail      | Doors            | `Door detail · Assortment tool`      |
| `#/doors/mass-update`                                                                            | Mass update      | Doors            | `Mass update · Assortment tool`      |
| `#/tier-assortments`                                                                             | Tier assortments | Tier assortments | `Tier assortments · Assortment tool` |
| `#/exceptions`                                                                                   | Exceptions       | Exceptions       | `Exceptions · Assortment tool`       |
| anything else (incl. `#/explorer`, `#/exports`, `#/activity`, `#/data-sources`, `#/parking-lot`) | Not found        | none             | `Page not found · Assortment tool`   |

Later specs add content **inside** these routes; they MUST NOT add routes for excluded
screens.

## DOM / landmark contract

Stable hooks for tests and later specs. `data-testid` values are part of the contract.

```text
div.cds-root [data-tier=compact|standard|wide] [data-density=standard]
├── a.skip-link  href="#main-content"  "Skip to main content"        (first focusable)
├── header [role=banner] data-testid="app-header"  (height = --header-height)
│   ├── button data-testid="nav-trigger"  aria-label="Open navigation"
│   │         aria-expanded  aria-controls="nav-drawer"            (compact only)
│   ├── button data-testid="rail-toggle"  aria-label="Collapse navigation"|"Expand navigation"
│   │         aria-expanded                                         (standard/wide only)
│   ├── span.brand  data-testid="app-name"  "Assortment tool"   (display, uppercase)
│   └── div data-testid="header-actions"                            (empty in this spec)
├── aside data-testid="nav-rail"  (width 240 | 64)                  (standard/wide only)
│   └── nav aria-label="Main" > ul > li > a[aria-current=page?]
├── div#nav-drawer [role=dialog] aria-label="Assortment tool"       (compact, when open)
│   └── nav aria-label="Main" > ul > li > a[aria-current=page?]
└── main#main-content tabindex=-1 data-testid="main-content"
    └── div.content  (max-width = --content-max-width, padding/gap per tier)
        ├── header data-testid="page-header"
        │   ├── nav aria-label="Breadcrumb" (sub-screens only)
        │   ├── span data-testid="page-eyebrow"
        │   ├── h1 data-testid="page-title"
        │   ├── p  data-testid="page-description"  (optional)
        │   └── div data-testid="page-actions"     (optional)
        └── section data-testid="screen-placeholder" data-visual-mask
              aria-labelledby=… (labeled "Coming in a later spec")
```

Rules:

- Exactly one `nav[aria-label="Main"]` is rendered at a time.
- Exactly one link has `aria-current="page"`; for sub-screens it is the Doors link.
- Every focusable element shows `outline: var(--focus-ring-width) solid var(--focus-ring)`
  with `outline-offset: var(--focus-offset)` on `:focus-visible`.
- In `compact`, every interactive shell control's box is ≥ `--touch-target` (44 px).
- `main` receives focus when the skip link is used; route changes do not steal focus
  except when the drawer closes after navigation (focus moves to `main`).
- Under `prefers-reduced-motion: reduce`, transition and animation durations collapse to
  ≈ 0.

## Viewport matrix (E2E)

`360×740, 390×844, 768×1024` → compact · `1024×768, 1366×768` → standard ·
`1920×1080, 2560×1440` → wide.

Per screen × viewport assertions: `document.documentElement.scrollWidth <=
window.innerWidth`; expected `data-tier`; nav mode (trigger vs rail); header, nav access,
page title visible; Tab reaches a control with a visible focus ring.

## Visual baselines

`e2e/visual/__baselines__/<screen-id>-<w>x<h>.png` — 6 screens × 7 viewports = 42 files,
captured from the prototype only (see [research.md R8](../research.md#r8-screenshot-comparison-against-the-prototype)).
Elements carrying `data-visual-mask` are hidden during capture in the app; the equivalent
prototype regions are hidden by the shared normalising stylesheet.
