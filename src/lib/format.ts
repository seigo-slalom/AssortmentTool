/** `1,234` (en-US), as in the prototype. */
export const fmt = (n: number): string => Number(n || 0).toLocaleString('en-US');

/** `1 door` / `3 doors`. */
export const plural = (n: number, one: string, many: string): string =>
  `${fmt(n)} ${n === 1 ? one : many}`;

/** `+3`, `−2` (true minus sign), `0`. */
export const signed = (n: number): string => `${n > 0 ? '+' : n < 0 ? '−' : ''}${fmt(Math.abs(n))}`;
