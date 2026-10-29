import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Cr380_assortmentexceptionsService } from '../../generated/services/Cr380_assortmentexceptionsService';
import { Cr380_doorsService } from '../../generated/services/Cr380_doorsService';
import { Cr380_skusService } from '../../generated/services/Cr380_skusService';
import { Cr380_tierrulesService } from '../../generated/services/Cr380_tierrulesService';
import { Cr380_tiersService } from '../../generated/services/Cr380_tiersService';
import {
  loadAssortmentRecords,
  loadDoorRecords,
  loadExceptionRecords,
  loadSkuRecords,
  loadTierRecords,
  loadTierRuleRecords,
  RECORD_SOURCES,
} from './records';

vi.mock('../../generated/services/Cr380_doorsService', () => ({
  Cr380_doorsService: { getAll: vi.fn() },
}));
vi.mock('../../generated/services/Cr380_tiersService', () => ({
  Cr380_tiersService: { getAll: vi.fn() },
}));
vi.mock('../../generated/services/Cr380_skusService', () => ({
  Cr380_skusService: { getAll: vi.fn() },
}));
vi.mock('../../generated/services/Cr380_tierrulesService', () => ({
  Cr380_tierrulesService: { getAll: vi.fn() },
}));
vi.mock('../../generated/services/Cr380_assortmentexceptionsService', () => ({
  Cr380_assortmentexceptionsService: { getAll: vi.fn() },
}));

const page = (data: unknown[]) => ({ success: true, data }) as never;

beforeEach(() => {
  vi.clearAllMocks();
});

describe('record loaders', () => {
  it('doors: display columns, active filter, nulls become absent', async () => {
    vi.mocked(Cr380_doorsService.getAll).mockResolvedValue(
      page([
        {
          cr380_doorid: 'D1',
          cr380_doorname: "Macy's Herald Square",
          cr380_doorkey: 'US1542',
          cr380_sapshipto: '0040001',
          cr380_sapsoldto: '0030001',
          cr380_distributorname: "Macy's",
          cr380_distributornamecode: 'MAC',
          cr380_dooronlineoffline: 'Offline',
          cr380_doortype: 'Department store',
          cr380_productline: 'Fragrance',
          cr380_saleschannel: 'Wholesale',
          cr380_doorstatus: 'Open',
          cr380_openingdate: '2026-08-01',
          _cr380_tierid_value: 'T1',
          modifiedon: '2026-09-01T10:00:00Z',
          '_modifiedby_value@OData.Community.Display.V1.FormattedValue': 'Jane Doe',
        },
        { cr380_doorid: 'D2', cr380_doorname: null, _cr380_tierid_value: null, cr380_doorkey: '' },
      ]),
    );
    await expect(loadDoorRecords()).resolves.toEqual([
      {
        id: 'D1',
        name: "Macy's Herald Square",
        doorKey: 'US1542',
        shipTo: '0040001',
        soldTo: '0030001',
        distributorName: "Macy's",
        distributorNameCode: 'MAC',
        onlineOffline: 'Offline',
        doorType: 'Department store',
        productLine: 'Fragrance',
        salesChannel: 'Wholesale',
        status: 'Open',
        openingDate: '2026-08-01',
        tierId: 'T1',
        modifiedOn: '2026-09-01T10:00:00Z',
        modifiedByName: 'Jane Doe',
      },
      expect.objectContaining({ id: 'D2', name: '', tierId: undefined, doorKey: undefined }),
    ]);
    expect(Cr380_doorsService.getAll).toHaveBeenCalledWith(
      expect.objectContaining({
        select: [...RECORD_SOURCES.doors.select],
        filter: 'statecode eq 0',
      }),
    );
  });

  it('tiers: name, rank, active status', async () => {
    vi.mocked(Cr380_tiersService.getAll).mockResolvedValue(
      page([
        {
          cr380_tierid: 'T1',
          cr380_tiername: 'Access',
          cr380_rank: 1,
          cr380_tierstatus: 860080000,
        },
        { cr380_tierid: 'T2', cr380_tierstatus: 860080001 },
      ]),
    );
    await expect(loadTierRecords()).resolves.toEqual([
      { id: 'T1', name: 'Access', rank: 1, active: true },
      { id: 'T2', name: '', rank: undefined, active: false },
    ]);
  });

  it('SKUs: active only, type mapped from the choice value', async () => {
    vi.mocked(Cr380_skusService.getAll).mockResolvedValue(
      page([
        {
          cr380_skuid: 'S1',
          cr380_skukey: '100001',
          cr380_skuname: 'N°5 EDP 100ml',
          cr380_axis: 'Fragrance',
          cr380_franchise: 'N°5',
          cr380_line: 'EDP',
          cr380_skutype: 860080000,
        },
        { cr380_skuid: 'S2', cr380_skutype: 860080001 },
        { cr380_skuid: 'S3', cr380_skutype: null },
      ]),
    );
    const skus = await loadSkuRecords();
    expect(skus[0]).toEqual({
      id: 'S1',
      key: '100001',
      name: 'N°5 EDP 100ml',
      axis: 'Fragrance',
      franchise: 'N°5',
      line: 'EDP',
      type: 'retail',
    });
    expect(skus[1].type).toBe('spm');
    expect(skus[2].type).toBeUndefined();
    expect(Cr380_skusService.getAll).toHaveBeenCalledWith(
      expect.objectContaining({ filter: 'statecode eq 0 and cr380_isactive eq false' }),
    );
  });

  it('tier rules: enabled only, lookups mapped', async () => {
    vi.mocked(Cr380_tierrulesService.getAll).mockResolvedValue(
      page([
        { cr380_tierruleid: 'R1', _cr380_tierid_value: 'T1', _cr380_sku_value: 'S1' },
        { cr380_tierruleid: 'R2' },
      ]),
    );
    await expect(loadTierRuleRecords()).resolves.toEqual([
      { id: 'R1', tierId: 'T1', skuId: 'S1' },
      { id: 'R2', tierId: '', skuId: '' },
    ]);
  });

  it('exceptions: Active status only, choices, lookups and reason mapped', async () => {
    vi.mocked(Cr380_assortmentexceptionsService.getAll).mockResolvedValue(
      page([
        {
          cr380_assortmentexceptionid: 'E1',
          cr380_exceptionlevel: 860080000,
          cr380_exceptionaction: 860080001,
          _cr380_doorid_value: 'D1',
          _cr380_skuid_value: 'S1',
          cr380_reason: 'Fixture constraint',
        },
        {
          cr380_assortmentexceptionid: 'E2',
          cr380_exceptionlevel: 860080001,
          cr380_exceptionaction: 860080000,
          cr380_distributornamecode: 'MAC',
        },
      ]),
    );
    await expect(loadExceptionRecords()).resolves.toEqual([
      {
        id: 'E1',
        level: 'door',
        action: 'remove',
        doorId: 'D1',
        skuId: 'S1',
        distributorNameCode: undefined,
        reason: 'Fixture constraint',
      },
      {
        id: 'E2',
        level: 'retailer',
        action: 'add',
        doorId: undefined,
        skuId: undefined,
        distributorNameCode: 'MAC',
        reason: undefined,
      },
    ]);
    expect(Cr380_assortmentexceptionsService.getAll).toHaveBeenCalledWith(
      expect.objectContaining({
        filter: 'statecode eq 0 and cr380_exceptionstatus eq 860080000',
      }),
    );
  });

  it('loadAssortmentRecords returns every table, or rejects if any fails', async () => {
    for (const service of [
      Cr380_doorsService,
      Cr380_tiersService,
      Cr380_skusService,
      Cr380_tierrulesService,
      Cr380_assortmentexceptionsService,
    ]) {
      vi.mocked(service.getAll).mockResolvedValue(page([]));
    }
    await expect(loadAssortmentRecords()).resolves.toEqual({
      doors: [],
      tiers: [],
      skus: [],
      tierRules: [],
      exceptions: [],
    });
    vi.mocked(Cr380_skusService.getAll).mockResolvedValue({
      success: false,
      error: new Error('boom'),
    } as never);
    await expect(loadAssortmentRecords()).rejects.toThrow('Failed to load SKUs: boom');
  });
});
