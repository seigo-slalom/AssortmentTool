import { createEngine } from '../../features/engine';
import { withDoorTierOverrides, type AssortmentData, type DoorRecord } from '../../lib/data';
import { fmt, signed } from '../../lib/format';
import { doorSkuIds, statusCategory, tierHasOtherAxes } from '../../lib/doors';

export interface TierImpact {
  total: number;
  retail: number;
  spm: number;
  /** Difference against today; only when the door already has a tier. */
  delta?: number;
  /** The target tier carries SKUs of axes this door's product line does not receive. */
  axesLimited: boolean;
  isProject: boolean;
}

/** SKUs a door would receive under another tier, from a preview engine (research R2). */
export function tierImpact(data: AssortmentData, doorId: string, toTierId: string): TierImpact {
  const door = data.index.doorById.get(doorId)!;
  const preview = createEngine(withDoorTierOverrides(data.dataset, new Map([[doorId, toTierId]])));
  const skuIds = doorSkuIds(preview, doorId);
  let retail = 0;
  let spm = 0;
  for (const id of skuIds) {
    const type = data.index.skuById.get(id)?.type;
    if (type === 'retail') retail += 1;
    if (type === 'spm') spm += 1;
  }
  const hadTier = Boolean(door.tierId && data.index.tierById.has(door.tierId));
  return {
    total: skuIds.length,
    retail,
    spm,
    delta: hadTier ? skuIds.length - doorSkuIds(data.engine, doorId).length : undefined,
    axesLimited: tierHasOtherAxes(data, toTierId, door.productLine),
    isProject: statusCategory(door.status) === 'project',
  };
}

/** FR-026 impact sentence (prototype `vTierModal`). */
export function impactText(impact: TierImpact, door: Pick<DoorRecord, 'productLine'>): string {
  const against = impact.delta === undefined ? '' : `, ${signed(impact.delta)} against today`;
  const parts = [
    `This door will receive ${fmt(impact.retail)} retail and ${fmt(impact.spm)} SPM SKUs (${fmt(impact.total)} in total${against}).`,
  ];
  if (impact.axesLimited) {
    parts.push(`Product line ${door.productLine ?? 'not set'}: SKUs of other axes are skipped.`);
  }
  if (impact.isProject) {
    parts.push('Project door (MTP): a preview until it is Pre-Trade; nothing goes to SAP yet.');
  }
  return parts.join(' ');
}
