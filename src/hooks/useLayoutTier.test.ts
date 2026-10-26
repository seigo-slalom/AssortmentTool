import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { listenerCount, setViewportWidth } from '../test/matchMedia';
import { tierForWidth, useLayoutTier } from './useLayoutTier';

describe('tierForWidth', () => {
  it.each([
    [320, 'compact'],
    [991, 'compact'],
    [992, 'standard'],
    [1599, 'standard'],
    [1600, 'wide'],
    [2560, 'wide'],
  ])('%i px → %s', (width, tier) => {
    expect(tierForWidth(width)).toBe(tier);
  });
});

describe('useLayoutTier', () => {
  it('returns the current tier and follows media-query changes', () => {
    setViewportWidth(390);
    const { result } = renderHook(() => useLayoutTier());
    expect(result.current).toBe('compact');

    act(() => setViewportWidth(1366));
    expect(result.current).toBe('standard');

    act(() => setViewportWidth(1920));
    expect(result.current).toBe('wide');
  });

  it('unsubscribes on unmount', () => {
    const before = listenerCount();
    const { unmount } = renderHook(() => useLayoutTier());
    expect(listenerCount()).toBeGreaterThan(before);
    unmount();
    expect(listenerCount()).toBe(before);
  });
});
