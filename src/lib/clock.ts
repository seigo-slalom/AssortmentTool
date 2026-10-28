// "Today" for date-relative rules (e.g. "Opened in last 90 days"). Logic never calls
// `new Date()` directly so tests and `vite --mode e2e` get a fixed, deterministic date.
export const E2E_DEFAULT_TODAY = '2026-09-23';

const atLocalMidnight = (date: Date): Date =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate());

const fromIsoDate = (iso: string): Date => {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
};

function defaultNow(): Date {
  if (import.meta.env.MODE === 'e2e') {
    const param = new URLSearchParams(window.location.search).get('today');
    return fromIsoDate(param && /^\d{4}-\d{2}-\d{2}$/.test(param) ? param : E2E_DEFAULT_TODAY);
  }
  return new Date();
}

let now: () => Date = defaultNow;

/** Today's date at local midnight. */
export function today(): Date {
  return atLocalMidnight(now());
}

/** A date as `YYYY-MM-DD` using its local calendar day. */
export function formatIsoDate(d: Date): string {
  return [d.getFullYear(), d.getMonth() + 1, d.getDate()]
    .map((n, i) => String(n).padStart(i === 0 ? 4 : 2, '0'))
    .join('-');
}

/** Today as `YYYY-MM-DD` (local date), used in file names and Dataverse date columns. */
export function todayIso(): string {
  return formatIsoDate(today());
}

export function setClockForTests(fn: () => Date): void {
  now = fn;
}

export function resetClock(): void {
  now = defaultNow;
}
