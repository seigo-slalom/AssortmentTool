import { useCallback } from 'react';
import { createStore, useStore } from './store';

const EMPTY: ReadonlySet<string> = new Set();

const selectionStore = createStore<ReadonlySet<string>>(EMPTY);

/** Doors selected on the Doors screen; shared with Bulk Update for the session. */
export const doorSelection = {
  get: selectionStore.get,
  subscribe: selectionStore.subscribe,
  set(ids: Iterable<string>) {
    const next = new Set(ids);
    selectionStore.set(next.size ? next : EMPTY);
  },
  clear() {
    selectionStore.set(EMPTY);
  },
  /** Drops ids that no longer exist after a data refresh. */
  prune(validIds: ReadonlySet<string>) {
    const current = selectionStore.get();
    const kept = [...current].filter((id) => validIds.has(id));
    if (kept.length !== current.size) doorSelection.set(kept);
  },
};

export function useDoorSelection(): [ReadonlySet<string>, (ids: Iterable<string>) => void] {
  const selected = useStore(selectionStore);
  const set = useCallback((ids: Iterable<string>) => doorSelection.set(ids), []);
  return [selected, set];
}

/** The last Doors URL query (e.g. `?saved=closed`) so returning to Doors restores filters. */
export const lastDoorsSearch = createStore<string>('');
export const useLastDoorsSearch = (): string => useStore(lastDoorsSearch);

/** "Hide" on the Bulk Update intro lasts for the session. */
export const bulkIntroHidden = createStore<boolean>(false);
export const useBulkIntroHidden = (): boolean => useStore(bulkIntroHidden);

/** Path back to Doors with the last filters. */
export const doorsPath = (search: string): string => `/doors${search}`;
