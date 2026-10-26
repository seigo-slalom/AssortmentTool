import { describe, expect, it } from 'vitest';
import { buildFontFaceCss, fontUrl } from './fontFaces';
import { token } from './token';

describe('buildFontFaceCss', () => {
  const css = buildFontFaceCss('/f.ttf');
  const blocks = css.split('@font-face').slice(1);

  it('registers the bundled face under both prototype family names', () => {
    expect(blocks).toHaveLength(2);
    expect(blocks[0]).toContain(`font-family: "${token.fontFace.display}"`);
    expect(blocks[1]).toContain(`font-family: "${token.fontFace.text}"`);
  });

  it('declares source, weight range, style and display for each face', () => {
    for (const block of blocks) {
      expect(block).toContain('src: url("/f.ttf") format("truetype")');
      expect(block).toContain('font-weight: 100 900');
      expect(block).toContain('font-style: normal');
      expect(block).toContain('font-display: swap');
    }
  });

  it('exports the bundled font URL', () => {
    expect(fontUrl).toMatch(/ABChanel/);
  });
});
