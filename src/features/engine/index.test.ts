import { describe, expect, it, vi } from 'vitest';
import { createEngine, DOOR_NOT_FOUND, loadEngineDataset, REASON } from './index';

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

describe('engine public API', () => {
  it('exposes the engine, reasons and loader', () => {
    expect(typeof createEngine).toBe('function');
    expect(typeof loadEngineDataset).toBe('function');
    expect(DOOR_NOT_FOUND).toBe('DOOR_NOT_FOUND');
    expect(REASON.IN_TIER_RULES).toBe('IN_TIER_RULES');
  });
});
