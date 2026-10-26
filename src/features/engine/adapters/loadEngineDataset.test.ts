import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Cr380_assortmentexceptionsService } from '../../../generated/services/Cr380_assortmentexceptionsService';
import { Cr380_doorsService } from '../../../generated/services/Cr380_doorsService';
import { Cr380_skusService } from '../../../generated/services/Cr380_skusService';
import { Cr380_tierrulesService } from '../../../generated/services/Cr380_tierrulesService';
import { Cr380_tiersService } from '../../../generated/services/Cr380_tiersService';
import { loadEngineDataset } from './loadEngineDataset';

vi.mock('../../../generated/services/Cr380_doorsService', () => ({
  Cr380_doorsService: { getAll: vi.fn() },
}));
vi.mock('../../../generated/services/Cr380_tiersService', () => ({
  Cr380_tiersService: { getAll: vi.fn() },
}));
vi.mock('../../../generated/services/Cr380_skusService', () => ({
  Cr380_skusService: { getAll: vi.fn() },
}));
vi.mock('../../../generated/services/Cr380_tierrulesService', () => ({
  Cr380_tierrulesService: { getAll: vi.fn() },
}));
vi.mock('../../../generated/services/Cr380_assortmentexceptionsService', () => ({
  Cr380_assortmentexceptionsService: { getAll: vi.fn() },
}));

// Serves `total` rows in pages of 5,000 using skipToken, like Dataverse.
const paged = (total: number, row: (i: number) => object) => (options: { skipToken?: string }) => {
  const start = options.skipToken ? Number(options.skipToken) : 0;
  const end = Math.min(start + 5000, total);
  return Promise.resolve({
    success: true,
    data: Array.from({ length: end - start }, (_, i) => row(start + i)),
    skipToken: end < total ? String(end) : undefined,
  } as never);
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('loadEngineDataset', () => {
  it('loads the medium dataset in about a dozen requests', async () => {
    vi.mocked(Cr380_doorsService.getAll).mockImplementation(
      paged(3000, (i) => ({ cr380_doorid: `D${i}` })),
    );
    vi.mocked(Cr380_tiersService.getAll).mockImplementation(
      paged(6, (i) => ({ cr380_tierid: `T${i}` })),
    );
    vi.mocked(Cr380_skusService.getAll).mockImplementation(
      paged(5000, (i) => ({ cr380_skuid: `S${i}` })),
    );
    vi.mocked(Cr380_tierrulesService.getAll).mockImplementation(
      paged(18000, (i) => ({ cr380_tierruleid: `R${i}` })),
    );
    vi.mocked(Cr380_assortmentexceptionsService.getAll).mockImplementation(
      paged(20000, (i) => ({ cr380_assortmentexceptionid: `E${i}` })),
    );

    const dataset = await loadEngineDataset();
    expect(dataset.doors).toHaveLength(3000);
    expect(dataset.tiers).toHaveLength(6);
    expect(dataset.skus).toHaveLength(5000);
    expect(dataset.tierRules).toHaveLength(18000);
    expect(dataset.exceptions).toHaveLength(20000);

    const requests = [
      Cr380_doorsService,
      Cr380_tiersService,
      Cr380_skusService,
      Cr380_tierrulesService,
      Cr380_assortmentexceptionsService,
    ].reduce((sum, service) => sum + vi.mocked(service.getAll).mock.calls.length, 0);
    expect(requests).toBe(1 + 1 + 1 + 4 + 4);
  });

  it('rejects without a partial dataset when any source fails', async () => {
    const empty = () => Promise.resolve({ success: true, data: [] } as never);
    vi.mocked(Cr380_doorsService.getAll).mockImplementation(empty);
    vi.mocked(Cr380_tiersService.getAll).mockImplementation(empty);
    vi.mocked(Cr380_skusService.getAll).mockImplementation(empty);
    vi.mocked(Cr380_tierrulesService.getAll).mockImplementation(empty);
    vi.mocked(Cr380_assortmentexceptionsService.getAll).mockResolvedValue({
      success: false,
      data: [],
      error: new Error('boom'),
    } as never);
    await expect(loadEngineDataset()).rejects.toThrow('Failed to load assortment exceptions: boom');
  });
});
