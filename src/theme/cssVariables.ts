import { token, type Density, type TypeStyleKey } from './token';

export type CssVariables = Record<`--${string}`, string>;

const densityStyle = (density: Density, key: 'body' | 'grid-header' | 'label-prominent') =>
  token.styles[(density === 'dense' ? `dense-${key}` : key) as TypeStyleKey];

/**
 * CSS custom properties for the `.cds-root` element, derived only from `token` (port of the
 * prototype's ChanelUI `A$`). CSS Modules consume these via `var(--…)`.
 */
export function buildCssVariables(density: Density): CssVariables {
  const vars: CssVariables = {};
  for (const [key, value] of Object.entries(token.color)) vars[`--${key}`] = value;
  for (const group of [token.spacing, token.radius, token.shadow, token.size, token.duration]) {
    for (const [key, value] of Object.entries(group)) vars[`--${key}`] = value;
  }
  for (const [key, style] of Object.entries(token.styles)) {
    vars[`--type-${key}-size`] = style.fontSize;
    vars[`--type-${key}-line`] = style.lineHeight;
  }

  vars['--font-display'] = token.families.display;
  vars['--font-text'] = token.families.text;
  vars['--weight-text'] = String(token.weights.text);
  vars['--weight-display'] = String(token.weights.display);
  vars['--easing'] = token.easing.standard;
  vars['--letter-spacing-app-name'] = token.letterSpacing['app-name'];
  vars['--measure-description'] = token.measure.description;
  vars['--z-header'] = String(token.zIndex.header);
  vars['--z-skip-link'] = String(token.zIndex['skip-link']);

  const body = densityStyle(density, 'body');
  vars['--cds-body-size'] = body.fontSize;
  vars['--cds-body-line'] = body.lineHeight;
  vars['--cds-grid-header-size'] = densityStyle(density, 'grid-header').fontSize;
  vars['--cds-prominent-size'] = densityStyle(density, 'label-prominent').fontSize;
  vars['--cds-prominent-line'] = densityStyle(density, 'label-prominent').lineHeight;
  return vars;
}
