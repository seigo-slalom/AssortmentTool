import { isSavedFilterId, type SavedFilterId } from './savedFilters';

export type DoorSort = 'name' | 'tier' | 'skus' | 'distributor' | 'changed';
export type SortDir = 'asc' | 'desc';

/** Doors screen state kept in the URL query of `#/doors` (data-model.md §2). */
export interface DoorQuery {
  q: string;
  dist: string[];
  /** Tier ids, or `none` for "Needs tier". */
  tier: string[];
  oo?: string;
  dt?: string;
  pl?: string;
  st?: string;
  saved?: SavedFilterId;
  /** "More filters" expanded. */
  more: boolean;
  sort: DoorSort;
  dir: SortDir;
  page: number;
}

export const NO_TIER = 'none';

export const DEFAULT_DOOR_QUERY: DoorQuery = {
  q: '',
  dist: [],
  tier: [],
  more: false,
  sort: 'name',
  dir: 'asc',
  page: 1,
};

const SORTS: readonly DoorSort[] = ['name', 'tier', 'skus', 'distributor', 'changed'];
const MORE_KEYS = ['oo', 'dt', 'pl', 'st'] as const;

const single = (sp: URLSearchParams, key: string) => sp.get(key)?.trim() || undefined;

export function parseDoorQuery(sp: URLSearchParams): DoorQuery {
  const sort = sp.get('sort') as DoorSort;
  const saved = sp.get('saved');
  const page = Number(sp.get('page'));
  const query: DoorQuery = {
    q: sp.get('q') ?? '',
    dist: sp.getAll('dist').filter(Boolean),
    tier: sp.getAll('tier').filter(Boolean),
    oo: single(sp, 'oo'),
    dt: single(sp, 'dt'),
    pl: single(sp, 'pl'),
    st: single(sp, 'st'),
    saved: isSavedFilterId(saved) ? saved : undefined,
    more: sp.get('more') === '1',
    sort: SORTS.includes(sort) ? sort : 'name',
    dir: sp.get('dir') === 'desc' ? 'desc' : 'asc',
    page: Number.isInteger(page) && page >= 1 ? page : 1,
  };
  return { ...query, more: query.more || moreFilterCount(query) > 0 };
}

export function stringifyDoorQuery(query: DoorQuery): string {
  const sp = new URLSearchParams();
  if (query.q) sp.set('q', query.q);
  for (const value of query.dist) sp.append('dist', value);
  for (const value of query.tier) sp.append('tier', value);
  for (const key of MORE_KEYS) if (query[key]) sp.set(key, query[key]!);
  if (query.saved) sp.set('saved', query.saved);
  if (query.more) sp.set('more', '1');
  if (query.sort !== 'name') sp.set('sort', query.sort);
  if (query.dir !== 'asc') sp.set('dir', query.dir);
  if (query.page > 1) sp.set('page', String(query.page));
  const text = sp.toString();
  return text ? `?${text}` : '';
}

/** Number of set filters hidden behind "More filters". */
export function moreFilterCount(query: DoorQuery): number {
  return MORE_KEYS.filter((key) => query[key]).length;
}

/** Whether "Clear filters" applies (FR-010). */
export function hasFilters(query: DoorQuery): boolean {
  return Boolean(
    query.q.trim() ||
    query.dist.length ||
    query.tier.length ||
    moreFilterCount(query) ||
    query.saved,
  );
}
