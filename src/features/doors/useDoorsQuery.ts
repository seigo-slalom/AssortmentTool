import { useCallback, useEffect, useMemo } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import {
  DEFAULT_DOOR_QUERY,
  parseDoorQuery,
  stringifyDoorQuery,
  type DoorQuery,
} from '../../lib/doors';
import { lastDoorsSearch } from '../../lib/session';

export interface DoorsQueryApi {
  query: DoorQuery;
  /** Applies a change; any filter change returns to page 1 unless a page is given. */
  update: (patch: Partial<DoorQuery>) => void;
  /** Expands or collapses "More filters"; collapsing clears the hidden filters. */
  setMore: (open: boolean) => void;
  clear: () => void;
}

/** Doors filters, sort and page live in the URL query so they are deep-linkable (R6). */
export function useDoorsQuery(): DoorsQueryApi {
  const [params, setParams] = useSearchParams();
  const { search } = useLocation();
  const query = useMemo(() => parseDoorQuery(params), [params]);

  useEffect(() => {
    lastDoorsSearch.set(search);
  }, [search]);

  const commit = useCallback(
    (next: DoorQuery) =>
      setParams(new URLSearchParams(stringifyDoorQuery(next)), { replace: true }),
    [setParams],
  );

  const update = useCallback(
    (patch: Partial<DoorQuery>) => commit({ ...query, page: 1, ...patch }),
    [commit, query],
  );

  const setMore = useCallback(
    (open: boolean) =>
      update(
        open
          ? { more: true }
          : { more: false, oo: undefined, dt: undefined, pl: undefined, st: undefined },
      ),
    [update],
  );

  const clear = useCallback(() => commit(DEFAULT_DOOR_QUERY), [commit]);

  return { query, update, setMore, clear };
}
