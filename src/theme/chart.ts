import { token } from './token';

/** Series colors (ink → muted → light) and grid line for charts, from tokens only. */
export const chartPalette = {
  series: [token.color['chart-1'], token.color['chart-2'], token.color['chart-3']],
  grid: token.color['chart-grid'],
} as const;
