import { describe, expect, it } from 'vitest';
import { chartPalette } from './chart';
import { token } from './token';

describe('chartPalette', () => {
  it('derives series and grid colors from tokens', () => {
    expect(chartPalette.series).toEqual([
      token.color['chart-1'],
      token.color['chart-2'],
      token.color['chart-3'],
    ]);
    expect(chartPalette.grid).toBe(token.color['chart-grid']);
  });
});
