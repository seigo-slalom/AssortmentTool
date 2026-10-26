import fontUrl from '../assets/fonts/ABChanel Corpo Regular.ttf?url';
import { token } from './token';

export { fontUrl };

// The single licensed face is registered under both prototype family names so the display
// and text stacks resolve unchanged (constitution Principle IX).
const face = (family: string, url: string) =>
  `@font-face {
  font-family: "${family}";
  src: url("${url}") format("truetype");
  font-weight: 100 900;
  font-style: normal;
  font-display: swap;
}`;

export function buildFontFaceCss(url: string): string {
  return [face(token.fontFace.display, url), face(token.fontFace.text, url)].join('\n');
}
