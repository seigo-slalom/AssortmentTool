import { useSyncExternalStore } from 'react';
import { px, token } from '../theme/token';

export type LayoutTier = 'compact' | 'standard' | 'wide';

const STANDARD_MIN = px(token.size['breakpoint-standard']);
const WIDE_MIN = px(token.size['breakpoint-wide']);
const STANDARD_QUERY = `(min-width: ${token.size['breakpoint-standard']})`;
const WIDE_QUERY = `(min-width: ${token.size['breakpoint-wide']})`;

export function tierForWidth(width: number): LayoutTier {
  if (width >= WIDE_MIN) return 'wide';
  if (width >= STANDARD_MIN) return 'standard';
  return 'compact';
}

function getSnapshot(): LayoutTier {
  if (window.matchMedia(WIDE_QUERY).matches) return 'wide';
  if (window.matchMedia(STANDARD_QUERY).matches) return 'standard';
  return 'compact';
}

function subscribe(onChange: () => void): () => void {
  const lists = [window.matchMedia(STANDARD_QUERY), window.matchMedia(WIDE_QUERY)];
  for (const list of lists) list.addEventListener('change', onChange);
  return () => {
    for (const list of lists) list.removeEventListener('change', onChange);
  };
}

/** Live layout tier (compact < 992 ≤ standard < 1600 ≤ wide), from token breakpoints. */
export function useLayoutTier(): LayoutTier {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
