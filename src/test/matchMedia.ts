// Controllable `window.matchMedia` for jsdom. Supports `(min-width: Npx)` queries (used by
// useLayoutTier) and treats every other query as not matching.
type Listener = (event: MediaQueryListEvent) => void;

let width = 1366;
const listeners = new Map<string, Set<Listener>>();

const minWidth = (query: string): number | null => {
  const match = /\(min-width:\s*(\d+(?:\.\d+)?)px\)/.exec(query);
  return match ? Number(match[1]) : null;
};

const matches = (query: string): boolean => {
  const min = minWidth(query);
  return min !== null && width >= min;
};

export function installMatchMedia(): void {
  window.matchMedia = (query: string) => {
    const set = listeners.get(query) ?? new Set<Listener>();
    listeners.set(query, set);
    return {
      get matches() {
        return matches(query);
      },
      media: query,
      onchange: null,
      addEventListener: (_type: string, listener: Listener) => set.add(listener),
      removeEventListener: (_type: string, listener: Listener) => set.delete(listener),
      addListener: (listener: Listener) => set.add(listener),
      removeListener: (listener: Listener) => set.delete(listener),
      dispatchEvent: () => true,
    } as unknown as MediaQueryList;
  };
}

/** Sets the simulated viewport width and notifies every registered media-query listener. */
export function setViewportWidth(next: number): void {
  width = next;
  for (const [query, set] of listeners) {
    for (const listener of [...set]) {
      listener({ matches: matches(query), media: query } as MediaQueryListEvent);
    }
  }
}

export function listenerCount(): number {
  let total = 0;
  for (const set of listeners.values()) total += set.size;
  return total;
}

/** Resets the simulated width without notifying listeners (safe after unmount). */
export function resetViewport(): void {
  width = 1366;
}
