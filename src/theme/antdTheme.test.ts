import { describe, expect, it } from 'vitest';
import { buildAntdTheme } from './antdTheme';
import { token } from './token';

describe('buildAntdTheme', () => {
  it('maps global tokens from token.ts (standard density)', () => {
    const theme = buildAntdTheme('standard');
    const t = theme.token!;
    expect(t.colorPrimary).toBe(token.color.accent);
    expect(t.colorBgLayout).toBe(token.color.canvas);
    expect(t.colorBorder).toBe(token.color['border-control']);
    expect(t.fontFamily).toBe(token.families.text);
    expect(t.borderRadius).toBe(4);
    expect(t.lineWidthFocus).toBe(3);
    expect(t.controlOutline).toBe(token.color['selected-option']);
    expect(t.motionDurationMid).toBe(token.duration['duration-mid']);
    expect(t.fontSize).toBe(13);
    expect([
      t.fontSizeHeading1,
      t.fontSizeHeading2,
      t.fontSizeHeading3,
      t.fontSizeHeading4,
      t.fontSizeHeading5,
    ]).toEqual([30, 24, 20, 16, 14]);
    expect(t.controlHeight).toBeUndefined();
  });

  it('maps component tokens like the prototype', () => {
    const { components } = buildAntdTheme('standard');
    expect(components?.Layout).toMatchObject({
      headerHeight: 56,
      headerBg: token.color.paper,
      bodyBg: token.color.canvas,
      headerPadding: '0 24px',
    });
    expect(components?.Menu).toMatchObject({
      itemSelectedBg: token.color.ink,
      itemSelectedColor: token.color.paper,
      itemHeight: 40,
      iconMarginInlineEnd: 5,
      collapsedWidth: 64,
    });
    expect(components?.Button?.defaultBorderColor).toBe(token.color.border);
    expect(components?.Table?.headerBg).toBe(token.color.ink);
  });

  it('uses the dense type scale', () => {
    const t = buildAntdTheme('dense').token!;
    expect(t.fontSize).toBe(10);
    expect([
      t.fontSizeHeading1,
      t.fontSizeHeading2,
      t.fontSizeHeading3,
      t.fontSizeHeading4,
      t.fontSizeHeading5,
    ]).toEqual([24, 20, 16, 14, 10]);
  });

  it('enlarges controls in the compact tier', () => {
    const t = buildAntdTheme('standard', { compact: true }).token!;
    expect(t.controlHeight).toBe(40);
    expect(t.controlHeightLG).toBe(44);
    expect(t.controlHeightSM).toBe(32);
  });
});
