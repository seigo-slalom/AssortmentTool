import { renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it } from 'vitest';
import { PowerContext, usePowerContext } from './powerContext';

describe('usePowerContext', () => {
  it('returns null outside a provider', () => {
    const { result } = renderHook(() => usePowerContext());
    expect(result.current).toBeNull();
  });

  it('returns the provided context', () => {
    const context = { user: { fullName: 'Ada' } } as never;
    const wrapper = ({ children }: { children: ReactNode }) => (
      <PowerContext.Provider value={context}>{children}</PowerContext.Provider>
    );
    const { result } = renderHook(() => usePowerContext(), { wrapper });
    expect(result.current).toBe(context);
  });
});
