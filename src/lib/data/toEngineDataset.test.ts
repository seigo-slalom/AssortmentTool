import { describe, expect, it, vi } from 'vitest';
import { Cr380_assortmentexceptionsService } from '../../generated/services/Cr380_assortmentexceptionsService';
import { Cr380_doorsService } from '../../generated/services/Cr380_doorsService';
import { Cr380_skusService } from '../../generated/services/Cr380_skusService';
import { Cr380_tierrulesService } from '../../generated/services/Cr380_tierrulesService';
import { Cr380_tiersService } from '../../generated/services/Cr380_tiersService';
import { loadEngineDataset, type EngineDataset } from '../../features/engine';
import { loadAssortmentRecords } from './records';
import { toEngineDataset } from './toEngineDataset';

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

const page = (data: unknown[]) => Promise.resolve({ success: true, data }) as never;

// Raw rows carry more columns than either loader selects; each loader maps only its own.
const ROWS = {
  doors: [
    {
      cr380_doorid: 'D1',
      cr380_doorname: 'A',
      _cr380_tierid_value: 'T1',
      cr380_productline: ' Fragrance ',
      cr380_distributornamecode: 'R1',
    },
    { cr380_doorid: 'D2', _cr380_tierid_value: null, cr380_productline: '' },
  ],
  tiers: [{ cr380_tierid: 'T1', cr380_tiername: 'Access' }],
  skus: [
    { cr380_skuid: 'S1', cr380_axis: 'Fragrance ' },
    { cr380_skuid: 'S2', cr380_axis: null },
  ],
  tierRules: [
    { cr380_tierruleid: 'R1', _cr380_tierid_value: 'T1', _cr380_sku_value: 'S1' },
    { cr380_tierruleid: 'R2' },
  ],
  exceptions: [
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
      cr380_distributornamecode: 'R1',
      _cr380_skuid_value: 'S2',
    },
    { cr380_assortmentexceptionid: 'E3' },
  ],
};

const normalize = (ds: EngineDataset) =>
  JSON.parse(
    JSON.stringify(ds, (_key, value: unknown) => (value === undefined ? '__absent__' : value)),
  ) as unknown;

describe('toEngineDataset', () => {
  it('maps records exactly like the engine loaders do (equivalence)', async () => {
    vi.mocked(Cr380_doorsService.getAll).mockImplementation(() => page(ROWS.doors));
    vi.mocked(Cr380_tiersService.getAll).mockImplementation(() => page(ROWS.tiers));
    vi.mocked(Cr380_skusService.getAll).mockImplementation(() => page(ROWS.skus));
    vi.mocked(Cr380_tierrulesService.getAll).mockImplementation(() => page(ROWS.tierRules));
    vi.mocked(Cr380_assortmentexceptionsService.getAll).mockImplementation(() =>
      page(ROWS.exceptions),
    );

    const fromEngine = await loadEngineDataset();
    const fromRecords = toEngineDataset(await loadAssortmentRecords());
    expect(normalize(fromRecords)).toEqual(normalize(fromEngine));
  });
});
