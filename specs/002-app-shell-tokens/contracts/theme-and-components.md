# Interface Contract: Theme & Shared Components

**Feature**: [../spec.md](../spec.md) · Public API that later specs build on. Signatures
are normative; implementation details are not.

## `src/theme/`

```ts
// token.ts — the only file allowed to contain literal style values
export const token: {
  readonly color: Readonly<Record<ColorKey, string>>;
  readonly families: { readonly display: string; readonly text: string };
  readonly fontFace: { readonly display: string; readonly text: string };
  readonly weights: { readonly text: 200; readonly display: 400 };
  readonly styles: Readonly<Record<TypeStyleKey, TypeStyle>>;
  readonly spacing: Readonly<Record<SpacingKey, string>>;
  readonly radius: Readonly<Record<RadiusKey, string>>;
  readonly shadow: Readonly<Record<ShadowKey, string>>;
  readonly size: Readonly<Record<SizeKey, string>>;
  readonly duration: Readonly<Record<DurationKey, string>>;
  readonly easing: { readonly standard: 'ease' };
  readonly letterSpacing: { readonly 'app-name': string };
  readonly zIndex: Readonly<Record<'header' | 'drawer', number>>;
  readonly opacity: { readonly 'control-outline': number };
  readonly measure: { readonly description: string };
};
export type Density = 'standard' | 'dense';
export const px: (value: string) => number; // '56px' → 56

// cssVariables.ts
export function buildCssVariables(density: Density): Record<`--${string}`, string>;

// antdTheme.ts
export function buildAntdTheme(density: Density, opts?: { compact?: boolean }): ThemeConfig;

// fontFaces.ts
export function buildFontFaceCss(fontUrl: string): string;

// chart.ts
export const chartPalette: {
  readonly series: readonly [string, string, string];
  readonly grid: string;
};

// ThemeProvider.tsx — replaces the bare <ConfigProvider> in main.tsx
export function ThemeProvider(props: { density?: Density; children: ReactNode }): JSX.Element;
```

Consumers MUST style with `var(--…)` in CSS Modules or read `token` in TS; they MUST NOT
introduce literals (enforced by `noHardcodedStyles.test.ts` and ESLint).

## `src/hooks/`

```ts
export type LayoutTier = 'compact' | 'standard' | 'wide';
export function tierForWidth(width: number): LayoutTier;
export function useLayoutTier(): LayoutTier; // live, matchMedia-based
export function useDocumentTitle(title: string): void; // sets "<title> · Assortment tool"
```

## `src/components/` (one folder per component, one exported component per file)

```ts
// AppShell/AppShell.tsx
export function AppShell(props: {
  appName: string;
  items: readonly NavDestination[];
  actions?: ReactNode; // header trailing actions (empty in this spec)
  children: ReactNode; // routed screen
}): JSX.Element;

// PageHeader/PageHeader.tsx
export function PageHeader(props: {
  title: string;
  eyebrow?: string;
  description?: ReactNode;
  breadcrumb?: readonly { label: string; to: string }[];
  actions?: ReactNode;
}): JSX.Element;

// ScreenRegion/ScreenRegion.tsx  (Card with h5-style label, min-height region-min-height)
export function ScreenRegion(props: {
  label: string;
  description?: string;
  state?: RegionStateKind;
  onRetry?: () => void;
  extra?: ReactNode;
  children?: ReactNode;
  'data-visual-mask'?: boolean;
}): JSX.Element;

// RegionState/RegionState.tsx
export type RegionStateKind = 'loading' | 'empty' | 'error' | 'placeholder';
export function RegionState(props: {
  state: RegionStateKind;
  title?: string;
  description?: string;
  onRetry?: () => void;
  rows?: number;
}): JSX.Element;
```

Behavioral guarantees (unit-tested):

- `RegionState` `loading` → `aria-busy="true"`, label "Loading content"; `empty` → label
  "No results"; `error` → label "Content unavailable" and a primary "Try again" button only
  when `onRetry` is given; `placeholder` → visible "Coming in a later spec" label plus
  description; never renders sample data.
- `PageHeader` renders breadcrumb items as links followed by the current title, eyebrow
  as uppercase display prominent label, title as `h1`.
- `AppShell` renders exactly one Main navigation for the current tier, the skip link,
  and the landmarks in [ui-shell.md](./ui-shell.md).
