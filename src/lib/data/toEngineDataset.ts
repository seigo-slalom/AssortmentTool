import type { EngineDataset } from '../../features/engine';
import type { AssortmentRecords } from './records';

/**
 * Maps the screens' records to the engine's input with the same rules as the engine's own
 * loaders (records are already filtered to active rows at the source), so one load serves
 * both the grids and the engine (specs/003-doors-screen/research.md R1).
 */
export function toEngineDataset(records: AssortmentRecords): EngineDataset {
  return {
    doors: records.doors.map((d) => ({
      id: d.id,
      tierId: d.tierId,
      productLine: d.productLine,
      distributorNameCode: d.distributorNameCode,
    })),
    tiers: records.tiers.map((t) => ({ id: t.id })),
    skus: records.skus.map((s) => ({ id: s.id, axis: s.axis, active: true })),
    tierRules: records.tierRules.map((r) => ({
      id: r.id,
      tierId: r.tierId,
      skuId: r.skuId,
      enabled: true,
    })),
    exceptions: records.exceptions.map((e) => ({
      id: e.id,
      level: e.level,
      action: e.action,
      skuId: e.skuId,
      doorId: e.doorId,
      distributorNameCode: e.distributorNameCode,
      active: true,
    })),
  };
}
