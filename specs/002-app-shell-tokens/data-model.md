# Data Model: App Shell & Design Tokens

**Feature**: [spec.md](./spec.md) · **Date**: 2026-10-26

This feature reads **no Dataverse data**. Its "entities" are typed, in-memory
configuration objects and UI state. All are `as const` / readonly.

---

## 1. Design Token Set (`src/theme/token.ts`)

Single source for every visual constant (Principle X, FR-027). Shape mirrors the
prototype's ChanelUI token object so mappings port 1:1. All values are strings with units
exactly as in the prototype; numeric helpers (`px()`) convert where Ant Design needs
numbers.

| Group      | Keys                                                                                                                                                                                                                                                                                                                                                                                                                                                                      | Source / validation                                         |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| `color`    | `ink`, `soft-black`, `ink-muted`, `paper`, `canvas`, `border`, `border-control`, `accent`, `selected-option`, `nav-selected-bg`, `nav-selected-text`, `row-zebra`, `row-hover`, `row-selected`, `critical`, `error`, `warning`, `warning-strong`, `success`, `unavailable`, `chart-1`, `chart-2`, `chart-3`, `chart-grid`, `focus-ring`                                                                                                                                   | Exactly the 25 constitution values; no other colors allowed |
| `families` | `display`, `text`                                                                                                                                                                                                                                                                                                                                                                                                                                                         | Constitution stacks verbatim                                |
| `fontFace` | `display: 'ABChanel Corpo Display'`, `text: 'ABChanel Corpo Text'`                                                                                                                                                                                                                                                                                                                                                                                                        | Names registered by `@font-face`                            |
| `weights`  | `text: 200`, `display: 400`                                                                                                                                                                                                                                                                                                                                                                                                                                               | Constitution                                                |
| `styles`   | `h1`–`h5`, `label-prominent`, `body`, `label`, `grid-header`, `kpi-value`, `workflow-number`, `nav-label`, `app-name`, `dense-h1`–`dense-h5`, `dense-label-prominent`, `dense-body`, `dense-grid-header` → `{ family, fontSize, lineHeight, fontWeight }`                                                                                                                                                                                                                 | Constitution type scale (standard → dense)                  |
| `spacing`  | `space-compact` 4, `space-icon` 6, `space-control` 8, `space-panel` 16, `tile-gap` 12, `content-padding-{compact,standard,wide}` 16/24/32, `section-gap-*` 12/20/28, `region-gap-*` 8/16/20 (px)                                                                                                                                                                                                                                                                          | Constitution                                                |
| `radius`   | `radius` 4px, `radius-nav-horizontal` 0px                                                                                                                                                                                                                                                                                                                                                                                                                                 | Constitution                                                |
| `shadow`   | `shadow-tile`, `shadow-popup`                                                                                                                                                                                                                                                                                                                                                                                                                                             | Constitution                                                |
| `size`     | `header-height` 56, `content-max-width` 2200, `focus-ring-width` 3, `focus-offset` 2, `nav-trigger-size` 40, `nav-drawer-width` 300, `nav-rail-width` 240, `nav-item-height` 40, `region-min-height` 140, `kpi-tile-height` 96, `chart-height` 220, `drawer-width` 420, `modal-width` 520, `modal-width-wide` 720, `column-min` 88, `column-narrow` 96, `column-medium` 160, `column-wide` 280, `touch-target` 44, `breakpoint-standard` 992, `breakpoint-wide` 1600 (px) | Constitution + prototype column widths                      |
| `duration` | `duration-fast` 0.15s, `duration-mid` 0.2s, `duration-slow` 0.25s                                                                                                                                                                                                                                                                                                                                                                                                         | Constitution                                                |
| `easing`   | `standard: 'ease'`                                                                                                                                                                                                                                                                                                                                                                                                                                                        | Constitution                                                |

### Supplementary tokens

Values the prototype's components hardcode; captured here so no literal appears elsewhere.
None is a color, so Principle IX's "no additional brand colors" is respected.

| Group.key                            | Value         | Prototype usage                                      |
| ------------------------------------ | ------------- | ---------------------------------------------------- |
| `size.border-width`                  | `1px`         | Header bottom border, rail border, region borders    |
| `size.nav-rail-collapsed-width`      | `64px`        | Collapsed rail width                                 |
| `size.nav-drawer-max-viewport`       | `85vw`        | Drawer width cap `min(300px, 85vw)`                  |
| `size.control-height-sm`             | `32px`        | Compact-tier small control height                    |
| `size.state-min-height`              | `96px`        | `RegionState` minimum height                         |
| `size.page-header-text-basis`        | `320px`       | Page-header text column flex basis                   |
| `spacing.nav-icon-gap`               | `5px`         | Menu `iconMarginInlineEnd`                           |
| `spacing.nav-item-indent`            | `24px`        | Inline Menu item indent (found by visual comparison) |
| `letterSpacing.app-name`             | `0.04em`      | Brand label tracking                                 |
| `zIndex.header` / `zIndex.skip-link` | `10` / `1100` | Layering (skip link above header and drawer)         |
| `measure.description`                | `72ch`        | Page-header description max width                    |

### Derived artifacts (pure functions, 100% unit-tested)

| Function                               | Output                                      | Rule                                                                                                                                                                                                         |
| -------------------------------------- | ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `buildCssVariables(density)`           | `Record<'--name', string>`                  | `--<color>`, spacing/radius/shadow/size/duration keys verbatim, `--font-display`, `--font-text`, `--type-<style>-size/line`, `--cds-body-size`, `--cds-grid-header-size`, `--cds-prominent-size`, `--easing` |
| `buildAntdTheme(density, { compact })` | Ant Design `ThemeConfig`                    | Port of prototype `L3` (tokens + `Layout`, `Menu`, `Button`, `Table`, `Select`, `Tabs`, `Card`, `Collapse`, `Form` components)                                                                               |
| `buildFontFaceCss(url)`                | CSS string                                  | Two `@font-face` rules (Display, Text)                                                                                                                                                                       |
| `chartPalette`                         | `[chart-1, chart-2, chart-3]`, `grid`       | For later SeriesChart                                                                                                                                                                                        |
| `tierForWidth(width)`                  | `LayoutTier`                                | `≥ wide` → wide; `≥ standard` → standard; else compact                                                                                                                                                       |
| `tierMetrics(tier)`                    | `{ contentPadding, sectionGap, regionGap }` | Port of prototype `M$`                                                                                                                                                                                       |

**Validation**: `token.test.ts` asserts every canonical value against a literal copy of the
constitution table (parity test, FR-027/SC-006); `noHardcodedStyles.test.ts` asserts no
literals elsewhere (FR-029/SC-005).

---

## 2. Layout Tier

`type LayoutTier = 'compact' | 'standard' | 'wide'`

| Tier     | Width    | Navigation                                      | Density         | Touch targets | Padding / section / region gap |
| -------- | -------- | ----------------------------------------------- | --------------- | ------------- | ------------------------------ |
| compact  | < 992    | Drawer via 44 px "Open navigation" button       | forced standard | ≥ 44 px       | 16 / 12 / 8                    |
| standard | 992–1599 | 240 px rail (collapsible to 64) + header toggle | standard        | —             | 24 / 20 / 16                   |
| wide     | ≥ 1600   | same as standard; content ≤ 2200 px centered    | standard        | —             | 32 / 28 / 20                   |

**Transitions**: live on `matchMedia` change; leaving `compact` closes the drawer; rail
collapsed state is preserved across standard ↔ wide and reset on reload.

---

## 3. Navigation Destination (`src/lib/navigation.ts`)

| Field   | Type                                                          | Values (in order)                                                             |
| ------- | ------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| `key`   | `'overview' \| 'doors' \| 'tier-assortments' \| 'exceptions'` | —                                                                             |
| `label` | string                                                        | Overview · Doors · Tier assortments · Exceptions                              |
| `path`  | string                                                        | `/` · `/doors` · `/tier-assortments` · `/exceptions`                          |
| `icon`  | Ant Design icon component                                     | `DashboardOutlined` · `ShoppingOutlined` · `TableOutlined` · `FilterOutlined` |
| `end`   | boolean                                                       | `true` for Overview only (so `/` is not active everywhere)                    |

**Rules**: exactly four entries, this order (FR-002); no entry for any excluded screen
(FR-004) — asserted by unit test against a deny-list `['explorer','exports','activity',
'data-sources','parking-lot']`.

---

## 4. Screen Definition (`src/lib/screens.ts`)

| Field         | Type                                                                                                           | Notes                                                 |
| ------------- | -------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| `id`          | `'overview' \| 'doors' \| 'door-detail' \| 'mass-update' \| 'tier-assortments' \| 'exceptions' \| 'not-found'` |                                                       |
| `path`        | route pattern                                                                                                  | see table below                                       |
| `title`       | string                                                                                                         | Page header title and document title prefix           |
| `eyebrow`     | string?                                                                                                        |                                                       |
| `breadcrumb`  | `{ label, path }[]`?                                                                                           |                                                       |
| `navKey`      | NavDestination key?                                                                                            | owning nav entry; `undefined` for not-found           |
| `placeholder` | `{ title, description }`?                                                                                      | Labeled placeholder region text naming the later spec |

| id               | path                 | eyebrow                            | title            | breadcrumb       | navKey           |
| ---------------- | -------------------- | ---------------------------------- | ---------------- | ---------------- | ---------------- |
| overview         | `/`                  | Fragrance & Beauty · United States | Overview         | —                | overview         |
| doors            | `/doors`             | Strategy                           | Doors            | —                | doors            |
| door-detail      | `/doors/:doorId`     | Strategy                           | Door detail      | Doors → `/doors` | doors            |
| mass-update      | `/doors/mass-update` | Strategy                           | Mass update      | Doors → `/doors` | doors            |
| tier-assortments | `/tier-assortments`  | Strategy                           | Tier assortments | —                | tier-assortments |
| exceptions       | `/exceptions`        | Strategy                           | Exceptions       | —                | exceptions       |
| not-found        | `*`                  | —                                  | Page not found   | —                | —                |

**Derived**: `documentTitle(title) = \`${title} · Assortment tool\``(FR-013). Ant Design`controlOutline`reuses the canonical`selected-option` color (ink at ~8%), so no opacity token or new color is needed.

---

## 5. Shell UI State (in `AppShell`, not persisted)

| State           | Type    | Initial | Transitions                                                              |
| --------------- | ------- | ------- | ------------------------------------------------------------------------ |
| `drawerOpen`    | boolean | `false` | open: menu button · close: nav click, Escape, mask click, tier ≠ compact |
| `railCollapsed` | boolean | `false` | toggle: header rail button (standard/wide only)                          |

## 6. Host Startup State (existing `PowerProvider`, restyled)

`loading → ready | error` (unchanged logic). Loading and error render branded token-styled
states (FR-006); navigation is not rendered until `ready`.
