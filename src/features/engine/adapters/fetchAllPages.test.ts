import type { IOperationResult } from '@microsoft/power-apps/data';
import { describe, expect, it, vi } from 'vitest';
import { fetchAllPages, PAGE_SIZE } from './fetchAllPages';

const ok = (data: number[], skipToken?: string): IOperationResult<number[]> => ({
  success: true,
  data,
  skipToken,
});

describe('fetchAllPages', () => {
  it('follows every skipToken page and concatenates the rows', async () => {
    const getPage = vi
      .fn()
      .mockResolvedValueOnce(ok([1, 2], 'p2'))
      .mockResolvedValueOnce(ok([3], 'p3'))
      .mockResolvedValueOnce(ok([4]));
    await expect(
      fetchAllPages('numbers', getPage, { select: ['a'], filter: 'f' }),
    ).resolves.toEqual([1, 2, 3, 4]);
    expect(getPage).toHaveBeenCalledTimes(3);
    expect(getPage.mock.calls.map(([o]) => o.skipToken)).toEqual([undefined, 'p2', 'p3']);
    expect(getPage.mock.calls[0][0]).toMatchObject({
      select: ['a'],
      filter: 'f',
      maxPageSize: PAGE_SIZE,
    });
  });

  it('rejects with the source name and error message when a page fails', async () => {
    const getPage = vi
      .fn()
      .mockResolvedValueOnce(ok([1], 'p2'))
      .mockResolvedValueOnce({ success: false, data: [], error: new Error('throttled') });
    await expect(fetchAllPages('numbers', getPage, {})).rejects.toThrow(
      'Failed to load numbers: throttled',
    );
  });

  it('rejects with a generic message when no error detail is available', async () => {
    const getPage = vi.fn().mockResolvedValueOnce({ success: false, data: [] });
    await expect(fetchAllPages('numbers', getPage, {})).rejects.toThrow(
      'Failed to load numbers: unknown error',
    );
  });

  it('propagates rejected requests', async () => {
    const getPage = vi.fn().mockRejectedValue(new Error('network'));
    await expect(fetchAllPages('numbers', getPage, {})).rejects.toThrow('network');
  });
});
