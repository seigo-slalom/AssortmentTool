import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { createStore, useStore } from './store';

describe('createStore', () => {
  it('notifies subscribers on change only and supports unsubscribe', () => {
    const store = createStore(1);
    const listener = vi.fn();
    const off = store.subscribe(listener);
    store.set(1);
    expect(listener).not.toHaveBeenCalled();
    store.set(2);
    expect(store.get()).toBe(2);
    expect(listener).toHaveBeenCalledTimes(1);
    off();
    store.set(3);
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('useStore re-renders with the current value', () => {
    const store = createStore('a');
    const { result } = renderHook(() => useStore(store));
    expect(result.current).toBe('a');
    act(() => store.set('b'));
    expect(result.current).toBe('b');
  });
});
