// The single source of every visual constant (constitution Principle X). Values mirror the
// prototype's ChanelUI token object and the constitution's Canonical Brand Tokens; the
// supplementary group at the end holds values the prototype's components hardcode.
// Nothing outside this file may contain literal colors, sizes, durations, or font families.

const color = {
  ink: '#050505',
  'soft-black': '#1f1f1f',
  'ink-muted': '#6b6862',
  paper: '#ffffff',
  canvas: '#f7f6f4',
  border: '#e4e2de',
  'border-control': '#8c8882',
  accent: '#050505',
  'selected-option': '#05050514',
  'nav-selected-bg': '#050505',
  'nav-selected-text': '#ffffff',
  'row-zebra': '#f7f6f4',
  'row-hover': '#e4e2de',
  'row-selected': '#e4e2de',
  critical: '#a8071a',
  error: '#f5222d',
  warning: '#d48806',
  'warning-strong': '#a86500',
  success: '#389e0d',
  unavailable: '#6b6862',
  'chart-1': '#050505',
  'chart-2': '#6b6862',
  'chart-3': '#b8b4ae',
  'chart-grid': '#e4e2de',
  'focus-ring': '#050505',
} as const;

const fontFace = {
  display: 'ABChanel Corpo Display',
  text: 'ABChanel Corpo Text',
} as const;

const families = {
  display: `'${fontFace.display}', Georgia, 'Times New Roman', serif`,
  text: `'${fontFace.text}', 'Helvetica Neue', Helvetica, Arial, sans-serif`,
} as const;

const weights = { text: 200, display: 400 } as const;

type FamilyKey = keyof typeof families;

export interface TypeStyle {
  readonly family: FamilyKey;
  readonly fontSize: string;
  readonly lineHeight: string;
  readonly fontWeight: 200 | 400;
}

const display = (fontSize: string, lineHeight: string): TypeStyle => ({
  family: 'display',
  fontSize,
  lineHeight,
  fontWeight: weights.display,
});
const text = (fontSize: string, lineHeight: string): TypeStyle => ({
  family: 'text',
  fontSize,
  lineHeight,
  fontWeight: weights.text,
});

const styles = {
  h1: display('30px', '38px'),
  h2: display('24px', '32px'),
  h3: display('20px', '28px'),
  h4: display('16px', '24px'),
  h5: display('14px', '22px'),
  'label-prominent': display('13px', '20px'),
  body: text('13px', '21px'),
  label: text('12px', '20px'),
  'grid-header': display('12px', '20px'),
  'kpi-value': display('28px', '32px'),
  'workflow-number': display('18px', '28px'),
  'tier-title': display('18px', '24px'),
  'dense-h1': display('24px', '32px'),
  'dense-h2': display('20px', '28px'),
  'dense-h3': display('16px', '24px'),
  'dense-h4': display('14px', '22px'),
  'dense-h5': display('10px', '18px'),
  'dense-label-prominent': display('12px', '18px'),
  'dense-body': text('10px', '18px'),
  'dense-grid-header': display('10px', '18px'),
  'nav-label': display('10px', '10px'),
  'app-name': display('12px', '12px'),
} as const satisfies Record<string, TypeStyle>;

const spacing = {
  'space-compact': '4px',
  'space-icon': '6px',
  'space-control': '8px',
  'space-panel': '16px',
  'tile-gap': '12px',
  'content-padding-compact': '16px',
  'content-padding-standard': '24px',
  'content-padding-wide': '32px',
  'section-gap-compact': '12px',
  'section-gap-standard': '20px',
  'section-gap-wide': '28px',
  'region-gap-compact': '8px',
  'region-gap-standard': '16px',
  'region-gap-wide': '20px',
  // Supplementary: Ant Design Menu iconMarginInlineEnd and inline indent in the prototype.
  'nav-icon-gap': '5px',
  'nav-item-indent': '24px',
} as const;

const radius = { radius: '4px', 'radius-nav-horizontal': '0px' } as const;

const shadow = {
  'shadow-tile': '0 1px 3px rgba(5, 5, 5, 0.08)',
  'shadow-popup': '0 8px 24px rgba(5, 5, 5, 0.16)',
} as const;

const size = {
  'header-height': '56px',
  'content-max-width': '2200px',
  'focus-ring-width': '3px',
  'focus-offset': '2px',
  'nav-trigger-size': '40px',
  'nav-drawer-width': '300px',
  'nav-rail-width': '240px',
  'nav-item-height': '40px',
  'region-min-height': '140px',
  'kpi-tile-height': '96px',
  'chart-height': '220px',
  'drawer-width': '420px',
  'modal-width': '520px',
  'modal-width-wide': '720px',
  'column-min': '88px',
  'column-narrow': '96px',
  'column-medium': '160px',
  'column-wide': '280px',
  'touch-target': '44px',
  'breakpoint-standard': '992px',
  'breakpoint-wide': '1600px',
  // Supplementary values hardcoded by prototype components.
  'border-width': '1px',
  'nav-rail-collapsed-width': '64px',
  'nav-drawer-max-viewport': '85vw',
  'control-height-sm': '32px',
  'state-min-height': '96px',
  'page-header-text-basis': '320px',
  // Supplementary values hardcoded by the prototype's Doors and Mass update screens and by
  // ChanelUI KpiTile / WorkflowSection / DataGrid (specs/003-doors-screen).
  'line-compact': '16px',
  'workflow-number-column': '32px',
  'workflow-body-indent': '40px',
  'kpi-min-tile': '160px',
  'grid-max-height': '470px',
  'grid-max-height-rows': '360px',
  'tier-rail-width': '232px',
  'tier-row-check': '40px',
  'tier-row-coverage-min': '130px',
  'tier-row-count': '72px',
  'tier-row-indent': '36px',
  'tier-list-offset': '290px',
  'tier-search-width': '210px',
  'coverage-bar-height': '4px',
  'dialog-width-tier': '560px',
  'grid-max-height-impact': '300px',
  'filter-search-width': '300px',
  'filter-select-width': '200px',
  'filter-select-narrow': '130px',
  'filter-select-medium': '150px',
  'filter-select-default': '160px',
  'filter-tier-width': '170px',
  'tier-select-width': '112px',
  'column-key': '104px',
  'column-row-number': '64px',
  'column-check-status': '124px',
  'column-change': '220px',
  'column-details': '300px',
  'column-door-status': '190px',
  'column-template-column': '112px',
  'card-min-width': '300px',
  'intro-item-min-width': '200px',
  'intro-number-column': '28px',
  'reason-picks-gap': '6px',
  'panel-max-width': '880px',
  'sentence-max-width': '90ch',
  'two-column-min': '320px',
  'grid-fact-label': '96px',
  'dragger-padding': '16px',
} as const;

const duration = {
  'duration-fast': '0.15s',
  'duration-mid': '0.2s',
  'duration-slow': '0.25s',
} as const;

export const token = {
  color,
  families,
  fontFace,
  weights,
  styles,
  spacing,
  radius,
  shadow,
  size,
  duration,
  easing: { standard: 'ease' },
  letterSpacing: { 'app-name': '0.04em' },
  zIndex: { header: 10, 'skip-link': 1100 },
  measure: { description: '72ch' },
} as const;

export type Density = 'standard' | 'dense';
export type ColorKey = keyof typeof color;
export type TypeStyleKey = keyof typeof styles;
export type SpacingKey = keyof typeof spacing;
export type SizeKey = keyof typeof size;
export type DurationKey = keyof typeof duration;

/** Numeric value of a pixel token, e.g. `px('56px') === 56`. */
export function px(value: string): number {
  return parseFloat(value);
}
