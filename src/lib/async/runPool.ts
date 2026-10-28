export interface PoolOptions {
  /** Maximum number of workers in flight; defaults to 4 (research R9). */
  concurrency?: number;
  onProgress?: (done: number, total: number) => void;
}

export class PoolError {
  readonly message: string;
  readonly cause: unknown;
  constructor(cause: unknown) {
    this.cause = cause;
    this.message = cause instanceof Error ? cause.message : String(cause);
  }
}

export const isPoolError = (value: unknown): value is PoolError => value instanceof PoolError;

/**
 * Runs `worker` over `items` with bounded concurrency and returns results in input order.
 * A rejecting worker does not stop the others; its error is returned in place.
 */
export async function runPool<T, R>(
  items: readonly T[],
  worker: (item: T, index: number) => Promise<R>,
  { concurrency = 4, onProgress }: PoolOptions = {},
): Promise<(R | PoolError)[]> {
  const results = new Array<R | PoolError>(items.length);
  let next = 0;
  let done = 0;

  const lane = async () => {
    while (next < items.length) {
      const index = next;
      next += 1;
      try {
        results[index] = await worker(items[index], index);
      } catch (error) {
        results[index] = new PoolError(error);
      }
      done += 1;
      onProgress?.(done, items.length);
    }
  };

  const lanes = Math.max(1, Math.min(concurrency, items.length));
  await Promise.all(Array.from({ length: lanes }, lane));
  return results;
}
