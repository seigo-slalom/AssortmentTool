import type { IOperationResult } from '@microsoft/power-apps/data';
import type { IGetAllOptions } from '../../../generated/models/CommonModels';

export const PAGE_SIZE = 5000;

// Follows every skipToken page; any failed page rejects so a partial dataset is never returned.
export async function fetchAllPages<T>(
  sourceName: string,
  getPage: (options: IGetAllOptions) => Promise<IOperationResult<T[]>>,
  options: IGetAllOptions,
): Promise<T[]> {
  const rows: T[] = [];
  let skipToken: string | undefined;
  do {
    const result = await getPage({ ...options, maxPageSize: PAGE_SIZE, skipToken });
    if (!result.success) {
      throw new Error(`Failed to load ${sourceName}: ${result.error?.message ?? 'unknown error'}`);
    }
    rows.push(...result.data);
    skipToken = result.skipToken;
  } while (skipToken);
  return rows;
}
