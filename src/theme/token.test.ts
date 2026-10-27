import { describe, expect, it } from 'vitest';
import { px, token } from './token';

// Literal copy of the constitution's "Canonical Brand Tokens" (.specify/memory/constitution.md).
// If this test fails, either token.ts drifted or the constitution changed — never edit one
// side without the other.
const CANONICAL = {
  families: {
    display: "'ABChanel Corpo Display', Georgia, 'Times New Roman', serif",
    text: "'ABChanel Corpo Text', 'Helvetica Neue', Helvetica, Arial, sans-serif",
  },
  weights: { text: 200, display: 400 },
  color: {
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
  },
  // [standard size/line, dense size/line]
  typeScale: {
    h1: ['30px', '38px', '24px', '32px'],
    h2: ['24px', '32px', '20px', '28px'],
    h3: ['20px', '28px', '16px', '24px'],
    h4: ['16px', '24px', '14px', '22px'],
    h5: ['14px', '22px', '10px', '18px'],
    'label-prominent': ['13px', '20px', '12px', '18px'],
    body: ['13px', '21px', '10px', '18px'],
    'grid-header': ['12px', '20px', '10px', '18px'],
  },
  singleScale: {
    label: ['12px', '20px'],
    'kpi-value': ['28px', '32px'],
    'workflow-number': ['18px', '28px'],
    'nav-label': ['10px', '10px'],
    'app-name': ['12px', '12px'],
  },
  spacing: {
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
  },
  radius: { radius: '4px', 'radius-nav-horizontal': '0px' },
  shadow: {
    'shadow-tile': '0 1px 3px rgba(5, 5, 5, 0.08)',
    'shadow-popup': '0 8px 24px rgba(5, 5, 5, 0.16)',
  },
  size: {
    'header-height': '56px',
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
    'touch-target': '44px',
    'focus-ring-width': '3px',
    'focus-offset': '2px',
    'content-max-width': '2200px',
    'breakpoint-standard': '992px',
    'breakpoint-wide': '1600px',
  },
  duration: { 'duration-fast': '0.15s', 'duration-mid': '0.2s', 'duration-slow': '0.25s' },
  easing: 'ease',
} as const;

const SUPPLEMENTARY = {
  size: {
    'border-width': '1px',
    'nav-rail-collapsed-width': '64px',
    'nav-drawer-max-viewport': '85vw',
    'control-height-sm': '32px',
    'state-min-height': '96px',
    'page-header-text-basis': '320px',
    'column-min': '88px',
    'column-narrow': '96px',
    'column-medium': '160px',
    'column-wide': '280px',
    'line-compact': '16px',
    'workflow-number-column': '32px',
    'workflow-body-indent': '40px',
    'kpi-min-tile': '160px',
    'grid-max-height': '470px',
    'grid-max-height-rows': '360px',
    'grid-max-height-impact': '300px',
    'filter-search-width': '300px',
    'tier-select-width': '112px',
    'column-key': '104px',
  },
  spacing: { 'nav-icon-gap': '5px', 'nav-item-indent': '24px' },
} as const;

describe('token parity with the constitution', () => {
  it('matches font families and weights', () => {
    expect(token.families).toEqual(CANONICAL.families);
    expect(token.weights).toEqual(CANONICAL.weights);
    expect(token.fontFace).toEqual({
      display: 'ABChanel Corpo Display',
      text: 'ABChanel Corpo Text',
    });
  });

  it('matches every canonical color and adds no others', () => {
    expect(token.color).toEqual(CANONICAL.color);
    expect(Object.keys(token.color)).toHaveLength(25);
  });

  it('matches the standard and dense type scale', () => {
    for (const [key, [size, line, denseSize, denseLine]] of Object.entries(CANONICAL.typeScale)) {
      const standard = token.styles[key as keyof typeof token.styles];
      const dense = token.styles[`dense-${key}` as keyof typeof token.styles];
      expect([standard.fontSize, standard.lineHeight], key).toEqual([size, line]);
      expect([dense.fontSize, dense.lineHeight], `dense-${key}`).toEqual([denseSize, denseLine]);
    }
    for (const [key, [size, line]] of Object.entries(CANONICAL.singleScale)) {
      const style = token.styles[key as keyof typeof token.styles];
      expect([style.fontSize, style.lineHeight], key).toEqual([size, line]);
    }
  });

  it('uses the display face at 400 and the text face at 200', () => {
    for (const [key, style] of Object.entries(token.styles)) {
      const expected = style.family === 'display' ? 400 : 200;
      expect(style.fontWeight, key).toBe(expected);
    }
    expect(token.styles.body.family).toBe('text');
    expect(token.styles.label.family).toBe('text');
    expect(token.styles.h1.family).toBe('display');
  });

  it('matches spacing, radius, shadow, size, duration and easing', () => {
    expect(token.spacing).toMatchObject(CANONICAL.spacing);
    expect(token.radius).toEqual(CANONICAL.radius);
    expect(token.shadow).toEqual(CANONICAL.shadow);
    expect(token.size).toMatchObject(CANONICAL.size);
    expect(token.duration).toEqual(CANONICAL.duration);
    expect(token.easing.standard).toBe(CANONICAL.easing);
  });

  it('defines the supplementary non-color tokens', () => {
    expect(token.size).toMatchObject(SUPPLEMENTARY.size);
    expect(token.spacing).toMatchObject(SUPPLEMENTARY.spacing);
    expect(token.letterSpacing['app-name']).toBe('0.04em');
    expect(token.measure.description).toBe('72ch');
    expect(token.zIndex.header).toBeGreaterThan(0);
    expect(token.zIndex['skip-link']).toBeGreaterThan(token.zIndex.header);
  });
});

describe('px', () => {
  it('parses pixel tokens to numbers', () => {
    expect(px('56px')).toBe(56);
    expect(px(token.size['breakpoint-wide'])).toBe(1600);
  });
});
