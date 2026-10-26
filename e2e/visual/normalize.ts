// Shared normalising stylesheets for screenshot comparison (research.md R8). They hide
// everything in the content area except the page header, plus data-driven header parts, so
// the comparison asserts chrome, typography, and color only. Both sides use the same rules.

const ANIMATIONS_OFF =
  '*, *::before, *::after { transition: none !important; animation: none !important; caret-color: transparent !important; }';

const CONTENT_EXCEPT_HEADER = `
.cds-content * { visibility: hidden !important; }
.cds-content .cds-page-header,
.cds-content .cds-page-header * { visibility: visible !important; }`;

export const APP_NORMALIZE_CSS = `
${ANIMATIONS_OFF}
${CONTENT_EXCEPT_HEADER}
.cds-content .cds-page-header [data-testid='page-description'],
.cds-content .cds-page-header [data-testid='page-actions'] { visibility: hidden !important; }
[data-screen='door-detail'] .cds-page-header [data-testid='page-title'],
[data-screen='door-detail'] .cds-page-header [data-testid='page-eyebrow'],
[data-screen='door-detail'] .cds-page-header .ant-breadcrumb li:last-child,
[data-screen='door-detail'] .cds-page-header .ant-breadcrumb li:last-child * { visibility: hidden !important; }`;

// Door detail's eyebrow, title and last breadcrumb are door data in the prototype.
const DOOR_DETAIL_PROTOTYPE = `
.cds-content .cds-page-header .cds-page-header__title,
.cds-content .cds-page-header .cds-page-header__eyebrow,
.cds-content .cds-page-header .cds-page-header__crumbs li:last-child,
.cds-content .cds-page-header .cds-page-header__crumbs li:last-child * { visibility: hidden !important; }`;

/**
 * Prototype normaliser: additionally hides data-driven header parts, the demo persona
 * switcher, and the five excluded nav entries (always the last five of nine).
 */
export function prototypeNormalizeCss(screenId: string): string {
  return `
${ANIMATIONS_OFF}
${CONTENT_EXCEPT_HEADER}
.cds-content .cds-page-header .cds-page-header__desc,
.cds-content .cds-page-header .cds-page-header__actions,
.cds-content .cds-page-header .cds-page-header__desc *,
.cds-content .cds-page-header .cds-page-header__actions *,
.cds-header-actions,
.cds-side-menu .ant-menu-item:nth-child(n+5) { visibility: hidden !important; }
${screenId === 'door-detail' ? DOOR_DETAIL_PROTOTYPE : ''}`;
}

/** Registers the bundled TTF under both prototype family names. */
export function fontInjectionCss(fontUrl: string): string {
  return ['ABChanel Corpo Display', 'ABChanel Corpo Text']
    .map(
      (family) =>
        `@font-face { font-family: "${family}"; src: url("${fontUrl}") format("truetype"); font-weight: 100 900; font-style: normal; }`,
    )
    .join('\n');
}
