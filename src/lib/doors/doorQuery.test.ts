import { describe, expect, it } from 'vitest';
import {
  DEFAULT_DOOR_QUERY,
  hasFilters,
  moreFilterCount,
  parseDoorQuery,
  stringifyDoorQuery,
  type DoorQuery,
} from './doorQuery';

const parse = (search: string) => parseDoorQuery(new URLSearchParams(search));

describe('door query', () => {
  it('parses an empty query to the defaults', () => {
    expect(parse('')).toEqual({
      ...DEFAULT_DOOR_QUERY,
      oo: undefined,
      dt: undefined,
      pl: undefined,
      st: undefined,
      saved: undefined,
    });
    expect(stringifyDoorQuery(DEFAULT_DOOR_QUERY)).toBe('');
  });

  it('round-trips every key', () => {
    const query: DoorQuery = {
      q: 'macy',
      dist: ["Macy's", 'Nordstrom'],
      tier: ['T1', 'none'],
      oo: 'Online',
      dt: 'Specialty',
      pl: 'Fragrance',
      st: 'Open',
      saved: 'recent',
      more: true,
      sort: 'skus',
      dir: 'desc',
      page: 3,
    };
    const text = stringifyDoorQuery(query);
    expect(text.startsWith('?')).toBe(true);
    expect(parse(text.slice(1))).toEqual(query);
  });

  it('drops unknown keys and invalid values', () => {
    const query = parse('foo=1&saved=q3&sort=bogus&dir=up&page=-2&dist=&oo=%20');
    expect(query.saved).toBeUndefined();
    expect(query.sort).toBe('name');
    expect(query.dir).toBe('asc');
    expect(query.page).toBe(1);
    expect(query.dist).toEqual([]);
    expect(query.oo).toBeUndefined();
    expect(parse('page=2.5').page).toBe(1);
  });

  it('expands More filters when any hidden filter is set', () => {
    expect(parse('dt=Specialty').more).toBe(true);
    expect(parse('more=1').more).toBe(true);
    expect(parse('').more).toBe(false);
  });

  it('counts hidden filters and detects active filters', () => {
    const base = { ...DEFAULT_DOOR_QUERY };
    expect(hasFilters(base)).toBe(false);
    expect(hasFilters({ ...base, q: '  ' })).toBe(false);
    expect(hasFilters({ ...base, q: 'x' })).toBe(true);
    expect(hasFilters({ ...base, dist: ['a'] })).toBe(true);
    expect(hasFilters({ ...base, tier: ['none'] })).toBe(true);
    expect(hasFilters({ ...base, st: 'Open' })).toBe(true);
    expect(hasFilters({ ...base, saved: 'closed' })).toBe(true);
    expect(hasFilters({ ...base, more: true })).toBe(false);
    expect(moreFilterCount({ ...base, oo: 'a', pl: 'b' })).toBe(2);
  });
});
