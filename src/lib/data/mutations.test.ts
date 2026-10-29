import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Cr380_assortmentexceptionsService } from '../../generated/services/Cr380_assortmentexceptionsService';
import { Cr380_doorsService } from '../../generated/services/Cr380_doorsService';
import { Cr380_tierrulesService } from '../../generated/services/Cr380_tierrulesService';
import { Cr380_tiersService } from '../../generated/services/Cr380_tiersService';
import {
  bindTo,
  cancelException,
  createDoorException,
  createTier,
  disableTierRule,
  enableTierRule,
  recheckDoorExceptions,
  recheckDoors,
  setDoorTier,
  updateTier,
} from './mutations';

vi.mock('../../generated/services/Cr380_tierrulesService', () => ({
  Cr380_tierrulesService: { getAll: vi.fn(), create: vi.fn(), update: vi.fn() },
}));
vi.mock('../../generated/services/Cr380_tiersService', () => ({
  Cr380_tiersService: { create: vi.fn(), update: vi.fn() },
}));

vi.mock('../../generated/services/Cr380_doorsService', () => ({
  Cr380_doorsService: { getAll: vi.fn(), update: vi.fn() },
}));
vi.mock('../../generated/services/Cr380_assortmentexceptionsService', () => ({
  Cr380_assortmentexceptionsService: { getAll: vi.fn(), create: vi.fn(), update: vi.fn() },
}));

const ok = (data: unknown = {}) => ({ success: true, data }) as never;
const failed = (error: unknown) => ({ success: false, data: undefined, error }) as never;

beforeEach(() => {
  vi.clearAllMocks();
});

describe('writes', () => {
  it('binds lookups to their entity set', () => {
    expect(bindTo('cr380_tiers', 'T1')).toBe('/cr380_tiers(T1)');
  });

  it('setDoorTier binds the tier, or clears it with null', async () => {
    vi.mocked(Cr380_doorsService.update).mockResolvedValue(ok());
    await expect(setDoorTier('D1', 'T2')).resolves.toEqual({ ok: true, value: undefined });
    expect(Cr380_doorsService.update).toHaveBeenCalledWith('D1', {
      'cr380_TierID@odata.bind': '/cr380_tiers(T2)',
    });
    await setDoorTier('D1', null);
    expect(Cr380_doorsService.update).toHaveBeenLastCalledWith('D1', {
      'cr380_TierID@odata.bind': null,
    });
  });

  it('maps failures and thrown errors to { ok: false } without throwing', async () => {
    vi.mocked(Cr380_doorsService.update).mockResolvedValueOnce(failed(new Error('denied')));
    await expect(setDoorTier('D1', 'T1')).resolves.toEqual({ ok: false, error: 'denied' });
    vi.mocked(Cr380_doorsService.update).mockResolvedValueOnce(failed({ message: 'http 429' }));
    await expect(setDoorTier('D1', 'T1')).resolves.toEqual({ ok: false, error: 'http 429' });
    vi.mocked(Cr380_doorsService.update).mockResolvedValueOnce(failed(undefined));
    await expect(setDoorTier('D1', 'T1')).resolves.toEqual({ ok: false, error: 'Unknown error' });
    vi.mocked(Cr380_doorsService.update).mockRejectedValueOnce('offline');
    await expect(setDoorTier('D1', 'T1')).resolves.toEqual({ ok: false, error: 'offline' });
  });

  it('createDoorException writes a door-level, active exception with the reason', async () => {
    vi.mocked(Cr380_assortmentexceptionsService.create).mockResolvedValue(
      ok({ cr380_assortmentexceptionid: 'E9' }),
    );
    const input = {
      doorId: 'D1',
      doorKey: 'US1001',
      skuId: 'S1',
      skuKey: '100001',
      reason: 'Fixture constraint',
      today: '2026-09-23',
    };
    await expect(createDoorException({ ...input, action: 'add' })).resolves.toEqual({
      ok: true,
      value: { id: 'E9' },
    });
    expect(Cr380_assortmentexceptionsService.create).toHaveBeenCalledWith({
      'cr380_DoorID@odata.bind': '/cr380_doors(D1)',
      'cr380_SKUID@odata.bind': '/cr380_skus(S1)',
      cr380_exceptionlevel: 860080000,
      cr380_exceptionaction: 860080000,
      cr380_exceptionstatus: 860080000,
      cr380_exceptionname: 'US1001 · 100001 · Add',
      cr380_reason: 'Fixture constraint',
      cr380_datereported: '2026-09-23',
      statecode: 0,
    });
    await createDoorException({ ...input, action: 'remove' });
    expect(Cr380_assortmentexceptionsService.create).toHaveBeenLastCalledWith(
      expect.objectContaining({
        cr380_exceptionaction: 860080001,
        cr380_exceptionname: 'US1001 · 100001 · Remove',
      }),
    );
  });

  it('cancelException sets status Cancelled', async () => {
    vi.mocked(Cr380_assortmentexceptionsService.update).mockResolvedValue(ok());
    await expect(cancelException('E1')).resolves.toEqual({ ok: true, value: undefined });
    expect(Cr380_assortmentexceptionsService.update).toHaveBeenCalledWith('E1', {
      cr380_exceptionstatus: 860080001,
    });
  });
});

describe('re-checks', () => {
  const ids = (n: number) => Array.from({ length: n }, (_, i) => `D${i + 1}`);

  it.each([
    [0, 0],
    [1, 1],
    [50, 1],
    [51, 2],
    [120, 3],
  ])('recheckDoors(%i ids) issues %i requests', async (count, requests) => {
    vi.mocked(Cr380_doorsService.getAll).mockResolvedValue(ok([]));
    await recheckDoors(ids(count));
    expect(Cr380_doorsService.getAll).toHaveBeenCalledTimes(requests);
  });

  it('recheckDoors returns tier and status per door using an or-filter', async () => {
    vi.mocked(Cr380_doorsService.getAll).mockResolvedValue(
      ok([
        { cr380_doorid: 'D1', _cr380_tierid_value: 'T1', cr380_doorstatus: 'Open' },
        { cr380_doorid: 'D2', _cr380_tierid_value: null, cr380_doorstatus: null },
      ]),
    );
    const result = await recheckDoors(['D1', 'D2', 'D1']);
    expect(result.get('D1')).toEqual({ tierId: 'T1', status: 'Open' });
    expect(result.get('D2')).toEqual({ tierId: undefined, status: undefined });
    expect(Cr380_doorsService.getAll).toHaveBeenCalledWith({
      select: ['cr380_doorid', '_cr380_tierid_value', 'cr380_doorstatus'],
      filter: '(cr380_doorid eq D1 or cr380_doorid eq D2)',
    });
  });

  it('recheckDoorExceptions groups active door-level exceptions by door', async () => {
    vi.mocked(Cr380_assortmentexceptionsService.getAll).mockResolvedValue(
      ok([
        {
          cr380_assortmentexceptionid: 'E1',
          cr380_exceptionlevel: 860080000,
          cr380_exceptionaction: 860080000,
          _cr380_doorid_value: 'D1',
          _cr380_skuid_value: 'S1',
        },
        { cr380_assortmentexceptionid: 'E2', _cr380_doorid_value: 'D9' },
      ]),
    );
    const result = await recheckDoorExceptions(['D1', 'D2']);
    expect(result.get('D1')?.map((e) => e.id)).toEqual(['E1']);
    expect(result.get('D2')).toEqual([]);
    expect(result.has('D9')).toBe(false);
    expect(vi.mocked(Cr380_assortmentexceptionsService.getAll).mock.calls[0][0]?.filter).toBe(
      'statecode eq 0 and cr380_exceptionstatus eq 860080000 and cr380_exceptionlevel eq 860080000 and (_cr380_doorid_value eq D1 or _cr380_doorid_value eq D2)',
    );
  });

  it('re-check read failures reject with a readable message', async () => {
    vi.mocked(Cr380_doorsService.getAll).mockResolvedValue(failed(new Error('down')));
    await expect(recheckDoors(['D1'])).rejects.toThrow('Could not re-check doors: down');
    vi.mocked(Cr380_assortmentexceptionsService.getAll).mockResolvedValue(failed(undefined));
    await expect(recheckDoorExceptions(['D1'])).rejects.toThrow(
      'Could not re-check door exceptions: Unknown error',
    );
  });
});

describe('tier rule and tier writes', () => {
  const rules = Cr380_tierrulesService;

  it('enableTierRule creates a rule when none exists', async () => {
    vi.mocked(rules.getAll).mockResolvedValue(ok([]));
    vi.mocked(rules.create).mockResolvedValue(ok({}));
    await expect(enableTierRule('T1', 'S1')).resolves.toEqual({ ok: true, value: undefined });
    expect(rules.create).toHaveBeenCalledWith({
      'cr380_TierID@odata.bind': '/cr380_tiers(T1)',
      'cr380_SKU@odata.bind': '/cr380_skus(S1)',
      cr380_isenabled: true,
      statecode: 0,
    });
  });

  it('enableTierRule re-enables a disabled rule and skips an enabled one', async () => {
    vi.mocked(rules.getAll).mockResolvedValueOnce(
      ok([{ cr380_tierruleid: 'R1', cr380_isenabled: false }]),
    );
    vi.mocked(rules.update).mockResolvedValue(ok());
    await enableTierRule('T1', 'S1');
    expect(rules.update).toHaveBeenCalledWith('R1', { cr380_isenabled: true });
    vi.mocked(rules.getAll).mockResolvedValueOnce(
      ok([{ cr380_tierruleid: 'R1', cr380_isenabled: true }]),
    );
    await expect(enableTierRule('T1', 'S1')).resolves.toEqual({ ok: true, value: undefined });
    expect(rules.create).not.toHaveBeenCalled();
  });

  it('enableTierRule reports lookup failures', async () => {
    vi.mocked(rules.getAll).mockResolvedValueOnce(failed(new Error('nope')));
    await expect(enableTierRule('T1', 'S1')).resolves.toEqual({ ok: false, error: 'nope' });
    vi.mocked(rules.getAll).mockRejectedValueOnce(new Error('down'));
    await expect(enableTierRule('T1', 'S1')).resolves.toEqual({ ok: false, error: 'down' });
  });

  it('disableTierRule disables the rule', async () => {
    vi.mocked(rules.update).mockResolvedValue(ok());
    await disableTierRule('R2');
    expect(rules.update).toHaveBeenCalledWith('R2', { cr380_isenabled: false });
  });

  it('createTier creates an active tier and returns its id', async () => {
    vi.mocked(Cr380_tiersService.create).mockResolvedValue(ok({ cr380_tierid: 'T9' }));
    await expect(createTier({ name: 'Prestige', description: 'd', rank: 3 })).resolves.toEqual({
      ok: true,
      value: { id: 'T9' },
    });
    expect(Cr380_tiersService.create).toHaveBeenCalledWith({
      cr380_tiername: 'Prestige',
      cr380_description: 'd',
      cr380_rank: 3,
      cr380_tierstatus: 860080000,
      statecode: 0,
    });
  });

  it('updateTier sends only the given fields', async () => {
    vi.mocked(Cr380_tiersService.update).mockResolvedValue(ok());
    await updateTier('T1', { name: 'A', description: 'B', rank: 2, active: true });
    expect(Cr380_tiersService.update).toHaveBeenLastCalledWith('T1', {
      cr380_tiername: 'A',
      cr380_description: 'B',
      cr380_rank: 2,
      cr380_tierstatus: 860080000,
    });
    await updateTier('T1', { active: false });
    expect(Cr380_tiersService.update).toHaveBeenLastCalledWith('T1', {
      cr380_tierstatus: 860080001,
    });
    await updateTier('T1', {});
    expect(Cr380_tiersService.update).toHaveBeenLastCalledWith('T1', {});
  });
});
