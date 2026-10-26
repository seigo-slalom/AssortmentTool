import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Cr380_assortmentexceptionsService } from '../../../generated/services/Cr380_assortmentexceptionsService';
import { Cr380_doorsService } from '../../../generated/services/Cr380_doorsService';
import { Cr380_skusService } from '../../../generated/services/Cr380_skusService';
import { Cr380_tierrulesService } from '../../../generated/services/Cr380_tierrulesService';
import { Cr380_tiersService } from '../../../generated/services/Cr380_tiersService';
import { loadDoors, loadExceptions, loadSkus, loadTierRules, loadTiers, SOURCES } from './loaders';

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

const page = (data: unknown[]) => ({ success: true, data }) as never;

beforeEach(() => {
  vi.clearAllMocks();
});

describe('loaders request only what the engine needs', () => {
  it('doors: selected columns, active filter, mapped with absent optionals', async () => {
    vi.mocked(Cr380_doorsService.getAll).mockResolvedValue(
      page([
        {
          cr380_doorid: 'D1',
          _cr380_tierid_value: 'T1',
          cr380_productline: ' Fragrance ',
          cr380_distributornamecode: 'R1',
        },
        { cr380_doorid: 'D2', _cr380_tierid_value: null, cr380_productline: '' },
      ]),
    );
    await expect(loadDoors()).resolves.toEqual([
      { id: 'D1', tierId: 'T1', productLine: ' Fragrance ', distributorNameCode: 'R1' },
      { id: 'D2', tierId: undefined, productLine: undefined, distributorNameCode: undefined },
    ]);
    expect(Cr380_doorsService.getAll).toHaveBeenCalledWith(
      expect.objectContaining({
        select: [...SOURCES.doors.select],
        filter: 'statecode eq 0',
        maxPageSize: 5000,
      }),
    );
  });

  it('tiers: active only', async () => {
    vi.mocked(Cr380_tiersService.getAll).mockResolvedValue(page([{ cr380_tierid: 'T1' }]));
    await expect(loadTiers()).resolves.toEqual([{ id: 'T1' }]);
    expect(Cr380_tiersService.getAll).toHaveBeenCalledWith(
      expect.objectContaining({ select: ['cr380_tierid'], filter: 'statecode eq 0' }),
    );
  });

  it('SKUs: active only, Axis kept verbatim', async () => {
    vi.mocked(Cr380_skusService.getAll).mockResolvedValue(
      page([
        { cr380_skuid: 'S1', cr380_axis: 'Fragrance ' },
        { cr380_skuid: 'S2', cr380_axis: null },
      ]),
    );
    await expect(loadSkus()).resolves.toEqual([
      { id: 'S1', axis: 'Fragrance ', active: true },
      { id: 'S2', axis: undefined, active: true },
    ]);
    expect(Cr380_skusService.getAll).toHaveBeenCalledWith(
      expect.objectContaining({ filter: 'statecode eq 0 and cr380_isactive eq true' }),
    );
  });

  it('tier rules: enabled only, lookups mapped', async () => {
    vi.mocked(Cr380_tierrulesService.getAll).mockResolvedValue(
      page([
        { cr380_tierruleid: 'R1', _cr380_tierid_value: 'T1', _cr380_sku_value: 'S1' },
        { cr380_tierruleid: 'R2' },
      ]),
    );
    await expect(loadTierRules()).resolves.toEqual([
      { id: 'R1', tierId: 'T1', skuId: 'S1', enabled: true },
      { id: 'R2', tierId: '', skuId: '', enabled: true },
    ]);
    expect(Cr380_tierrulesService.getAll).toHaveBeenCalledWith(
      expect.objectContaining({ filter: 'statecode eq 0 and cr380_isenabled eq true' }),
    );
  });

  it('exceptions: Active status only, choices and lookups mapped', async () => {
    vi.mocked(Cr380_assortmentexceptionsService.getAll).mockResolvedValue(
      page([
        {
          cr380_assortmentexceptionid: 'E1',
          cr380_exceptionlevel: 860080000,
          cr380_exceptionaction: 860080000,
          _cr380_doorid_value: 'D1',
          _cr380_skuid_value: 'S1',
        },
        {
          cr380_assortmentexceptionid: 'E2',
          cr380_exceptionlevel: 860080001,
          cr380_exceptionaction: 860080001,
          _cr380_skuid_value: 'S2',
          cr380_distributornamecode: 'R1',
        },
        { cr380_assortmentexceptionid: 'E3' },
      ]),
    );
    await expect(loadExceptions()).resolves.toEqual([
      { id: 'E1', level: 'door', action: 'add', skuId: 'S1', doorId: 'D1', active: true },
      {
        id: 'E2',
        level: 'retailer',
        action: 'remove',
        skuId: 'S2',
        distributorNameCode: 'R1',
        active: true,
      },
      { id: 'E3', level: undefined, action: undefined, skuId: undefined, active: true },
    ]);
    expect(Cr380_assortmentexceptionsService.getAll).toHaveBeenCalledWith(
      expect.objectContaining({
        filter: 'statecode eq 0 and cr380_exceptionstatus eq 860080000',
      }),
    );
  });
});
