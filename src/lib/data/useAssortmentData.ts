import { useCallback, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { createEngine, type Engine, type EngineDataset } from '../../features/engine';
import { buildIndex, type AssortmentIndex } from './buildIndex';
import { loadAssortmentRecords, type AssortmentRecords } from './records';
import { toEngineDataset } from './toEngineDataset';

export const ASSORTMENT_DATA_KEY = ['assortment-data'] as const;

export interface AssortmentData {
  /** Changes on every (re)load; screens key memoized views on it. */
  version: number;
  records: AssortmentRecords;
  dataset: EngineDataset;
  engine: Engine;
  index: AssortmentIndex;
}

export function buildAssortmentData(records: AssortmentRecords, version: number): AssortmentData {
  const dataset = toEngineDataset(records);
  return { version, records, dataset, engine: createEngine(dataset), index: buildIndex(records) };
}

export interface AssortmentDataState {
  status: 'pending' | 'error' | 'success';
  data?: AssortmentData;
  refetch: () => void;
}

/**
 * Loads the five tables once and builds the engine from the same records (research R1).
 * Data stays fresh until a write invalidates it, so moving between Doors and Bulk Update
 * does not reload.
 */
export function useAssortmentData(): AssortmentDataState {
  const query = useQuery({
    queryKey: ASSORTMENT_DATA_KEY,
    queryFn: loadAssortmentRecords,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    retry: false,
  });
  const { data: records, dataUpdatedAt, refetch: refetchQuery } = query;
  const data = useMemo(
    () => (records ? buildAssortmentData(records, dataUpdatedAt) : undefined),
    [records, dataUpdatedAt],
  );
  const refetch = useCallback(() => void refetchQuery(), [refetchQuery]);
  return { status: query.status, data, refetch };
}

/** Reloads the data after a write so every screen shows the new assortment (FR-049). */
export function useInvalidateAssortmentData(): () => Promise<void> {
  const client = useQueryClient();
  return useCallback(() => client.invalidateQueries({ queryKey: ASSORTMENT_DATA_KEY }), [client]);
}
