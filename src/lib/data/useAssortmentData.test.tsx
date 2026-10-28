import type { ReactNode } from 'react';
import { act, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { loadAssortmentRecords, type AssortmentRecords } from './records';
import { useAssortmentData, useInvalidateAssortmentData } from './useAssortmentData';

vi.mock('./records', async (importOriginal) => ({
  ...(await importOriginal<typeof import('./records')>()),
  loadAssortmentRecords: vi.fn(),
}));

const records: AssortmentRecords = {
  doors: [{ id: 'D1', name: 'One', tierId: 'T1', productLine: 'Fragrance' }],
  tiers: [{ id: 'T1', name: 'Access', rank: 1, active: true }],
  skus: [{ id: 'S1', axis: 'Fragrance' }],
  tierRules: [{ id: 'R1', tierId: 'T1', skuId: 'S1' }],
  exceptions: [],
};

const wrapper = () => {
  const client = new QueryClient();
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
};

beforeEach(() => {
  vi.mocked(loadAssortmentRecords).mockReset();
});

describe('useAssortmentData', () => {
  it('is pending, then exposes records, index and an engine built from them', async () => {
    vi.mocked(loadAssortmentRecords).mockResolvedValue(records);
    const { result } = renderHook(() => useAssortmentData(), { wrapper: wrapper() });
    expect(result.current.status).toBe('pending');
    expect(result.current.data).toBeUndefined();
    await waitFor(() => expect(result.current.status).toBe('success'));
    const data = result.current.data!;
    expect(data.records).toBe(records);
    expect(data.index.tierById.get('T1')?.name).toBe('Access');
    expect(data.engine.getCounts().byDoor.get('D1')).toBe(1);
    expect(data.version).toBeGreaterThan(0);
  });

  it('reports errors and can refetch', async () => {
    vi.mocked(loadAssortmentRecords).mockRejectedValueOnce(new Error('down'));
    const { result } = renderHook(() => useAssortmentData(), { wrapper: wrapper() });
    await waitFor(() => expect(result.current.status).toBe('error'));
    vi.mocked(loadAssortmentRecords).mockResolvedValue(records);
    act(() => result.current.refetch());
    await waitFor(() => expect(result.current.status).toBe('success'));
  });

  it('invalidation reloads the data with a new version', async () => {
    vi.mocked(loadAssortmentRecords).mockResolvedValue(records);
    const { result } = renderHook(
      () => ({ state: useAssortmentData(), invalidate: useInvalidateAssortmentData() }),
      { wrapper: wrapper() },
    );
    await waitFor(() => expect(result.current.state.status).toBe('success'));
    const first = result.current.state.data!.version;
    await new Promise((r) => setTimeout(r, 2));
    await act(() => result.current.invalidate());
    await waitFor(() => expect(result.current.state.data!.version).not.toBe(first));
    expect(loadAssortmentRecords).toHaveBeenCalledTimes(2);
  });
});
