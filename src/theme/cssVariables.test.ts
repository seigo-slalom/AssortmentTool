import { describe, expect, it } from 'vitest';
import { buildCssVariables } from './cssVariables';
import { token } from './token';

describe('buildCssVariables', () => {
  const standard = buildCssVariables('standard');

  it('exposes every color as --<key>', () => {
    for (const [key, value] of Object.entries(token.color)) {
      expect(standard[`--${key}`]).toBe(value);
    }
    expect(standard['--ink']).toBe('#050505');
  });

  it('exposes spacing, radius, shadow, size and duration keys verbatim', () => {
    for (const group of [token.spacing, token.radius, token.shadow, token.size, token.duration]) {
      for (const [key, value] of Object.entries(group)) {
        expect(standard[`--${key}`], key).toBe(value);
      }
    }
  });

  it('exposes a size and line height for every type style', () => {
    for (const [key, style] of Object.entries(token.styles)) {
      expect(standard[`--type-${key}-size`]).toBe(style.fontSize);
      expect(standard[`--type-${key}-line`]).toBe(style.lineHeight);
    }
  });

  it('exposes families, weights, easing and supplementary values', () => {
    expect(standard['--font-display']).toBe(token.families.display);
    expect(standard['--font-text']).toBe(token.families.text);
    expect(standard['--weight-text']).toBe('200');
    expect(standard['--weight-display']).toBe('400');
    expect(standard['--easing']).toBe('ease');
    expect(standard['--letter-spacing-app-name']).toBe(token.letterSpacing['app-name']);
    expect(standard['--measure-description']).toBe(token.measure.description);
    expect(standard['--z-header']).toBe(String(token.zIndex.header));
    expect(standard['--z-skip-link']).toBe(String(token.zIndex['skip-link']));
  });

  it('uses standard density sizes', () => {
    expect(standard['--cds-body-size']).toBe('13px');
    expect(standard['--cds-body-line']).toBe('21px');
    expect(standard['--cds-grid-header-size']).toBe('12px');
    expect(standard['--cds-prominent-size']).toBe('13px');
    expect(standard['--cds-prominent-line']).toBe('20px');
  });

  it('uses dense density sizes', () => {
    const dense = buildCssVariables('dense');
    expect(dense['--cds-body-size']).toBe('10px');
    expect(dense['--cds-body-line']).toBe('18px');
    expect(dense['--cds-grid-header-size']).toBe('10px');
    expect(dense['--cds-prominent-size']).toBe('12px');
  });
});
