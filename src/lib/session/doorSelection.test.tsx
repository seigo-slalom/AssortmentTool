import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import {
  bulkIntroHidden,
  doorSelection,
  doorsPath,
  lastDoorsSearch,
  useBulkIntroHidden,
  useDoorSelection,
  useLastDoorsSearch,
} from '.';

afterEach(() => {
  doorSelection.clear();
  lastDoorsSearch.set('');
  bulkIntroHidden.set(false);
});

describe('door selection', () => {
  it('sets, clears and prunes the selection', () => {
    doorSelection.set(['D1', 'D2', 'D3']);
    expect([...doorSelection.get()]).toEqual(['D1', 'D2', 'D3']);
    doorSelection.prune(new Set(['D1', 'D3']));
    expect([...doorSelection.get()]).toEqual(['D1', 'D3']);
    const before = doorSelection.get();
    doorSelection.prune(new Set(['D1', 'D3']));
    expect(doorSelection.get()).toBe(before);
    doorSelection.set([]);
    expect(doorSelection.get().size).toBe(0);
    doorSelection.set(['D1']);
    doorSelection.clear();
    expect(doorSelection.get().size).toBe(0);
  });

  it('useDoorSelection exposes the selection and a setter', () => {
    const { result } = renderHook(() => useDoorSelection());
    act(() => result.current[1](['D9']));
    expect([...result.current[0]]).toEqual(['D9']);
  });

  it('remembers the last Doors query and the hidden intro', () => {
    const search = renderHook(() => useLastDoorsSearch());
    const hidden = renderHook(() => useBulkIntroHidden());
    act(() => {
      lastDoorsSearch.set('?saved=closed');
      bulkIntroHidden.set(true);
    });
    expect(search.result.current).toBe('?saved=closed');
    expect(hidden.result.current).toBe(true);
    expect(doorsPath('?page=2')).toBe('/doors?page=2');
  });
});
