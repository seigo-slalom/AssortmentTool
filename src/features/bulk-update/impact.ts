import { createEngine, type EngineException } from '../../features/engine';
import { withDoorExceptions, withDoorTierOverrides, type AssortmentData } from '../../lib/data';
import { fmt, plural } from '../../lib/format';
import { doorSkuIds } from '../../lib/doors';
import { applicableRows } from './bulkReducer';
import type { ChangeType, CheckedRow, Impact, ImpactRow } from './types';

const skuSet = (engine: AssortmentData['engine'], doorId: string) =>
  new Set(doorSkuIds(engine, doorId));

const diffSize = (a: ReadonlySet<string>, b: ReadonlySet<string>) => {
  let n = 0;
  for (const x of a) if (!b.has(x)) n += 1;
  return n;
};

/** "3 rows are left out: 1 with errors, 2 skipped." */
export function leftOutClause(rows: readonly CheckedRow[]): string {
  const count = (status: CheckedRow['status']) => rows.filter((r) => r.status === status).length;
  const errors = count('error');
  const skipped = count('skipped');
  const same = count('nochange');
  const leftOut = errors + skipped + same;
  if (!leftOut) return '';
  const parts = [
    errors ? `${fmt(errors)} with ${errors === 1 ? 'an error' : 'errors'}` : '',
    skipped ? `${fmt(skipped)} skipped` : '',
    same ? `${fmt(same)} with no change` : '',
  ].filter(Boolean);
  return ` ${plural(leftOut, 'row is', 'rows are')} left out: ${parts.join(', ')}.`;
}

/** Per-door before/after from a preview engine, KPIs and the summary sentence (FR-043). */
export function computeImpact(
  checked: readonly CheckedRow[],
  type: ChangeType,
  data: AssortmentData,
): Impact {
  const applicable = applicableRows(checked);
  const byDoor = new Map<string, CheckedRow[]>();
  for (const row of applicable) byDoor.set(row.doorId!, [...(byDoor.get(row.doorId!) ?? []), row]);

  const preview =
    type === 'tier'
      ? createEngine(
          withDoorTierOverrides(
            data.dataset,
            new Map(applicable.map((r) => [r.doorId!, r.tierId])),
          ),
        )
      : createEngine(
          withDoorExceptions(
            data.dataset,
            applicable.map((r): EngineException => ({
              id: `preview-${r.key}`,
              level: 'door',
              action: r.action,
              doorId: r.doorId,
              skuId: r.skuId,
              active: true,
            })),
          ),
        );

  let skuChanges = 0;
  const rows: ImpactRow[] = [...byDoor].map(([doorId, doorRows]) => {
    const door = data.index.doorById.get(doorId)!;
    const before = skuSet(data.engine, doorId);
    const after = skuSet(preview, doorId);
    skuChanges += diffSize(after, before) + diffSize(before, after);
    const last = doorRows[doorRows.length - 1];
    const currentTier = (door.tierId && data.index.tierById.get(door.tierId)?.name) || 'Needs tier';
    return {
      key: `i-${doorId}`,
      doorId,
      door: door.name,
      doorKey: door.doorKey ?? '',
      beforeLabel: currentTier,
      afterLabel:
        type === 'tier'
          ? data.index.tierById.get(last.tierId!)!.name
          : plural(doorRows.length, 'exception', 'exceptions'),
      skusBefore: before.size,
      skusAfter: after.size,
      delta: after.size - before.size,
      note: doorRows.find((r) => r.status === 'warning')?.message ?? '',
    };
  });

  const doorsChanging = rows.length;
  const avgNetDelta = doorsChanging
    ? Math.round(rows.reduce((sum, r) => sum + r.delta, 0) / doorsChanging)
    : 0;
  const leftOut = leftOutClause(checked);

  let sentence: string;
  if (type === 'tier') {
    const targets = [...new Set(rows.map((r) => r.afterLabel))];
    const from = new Map<string, number>();
    for (const r of rows) {
      const label = r.beforeLabel === 'Needs tier' ? 'no tier' : r.beforeLabel;
      from.set(label, (from.get(label) ?? 0) + 1);
    }
    const fromText = [...from].map(([label, n]) => `${fmt(n)} from ${label}`).join(', ');
    sentence =
      `${plural(doorsChanging, 'door moves', 'doors move')} to ${targets.length === 1 ? targets[0] : 'new tiers'} (${fromText}). ` +
      `On average each ${avgNetDelta >= 0 ? 'gains' : 'loses'} ${plural(Math.abs(avgNetDelta), 'SKU', 'SKUs')}.${leftOut}`;
  } else {
    const adds = applicable.filter((r) => r.action === 'add').length;
    sentence =
      `${plural(applicable.length, 'door exception', 'door exceptions')} will be created at ${plural(doorsChanging, 'door', 'doors')}: ` +
      `${fmt(adds)} to add a SKU, ${fmt(applicable.length - adds)} to remove one.${leftOut}`;
  }

  return {
    rows,
    doorsChanging,
    avgNetDelta,
    exceptionsCreated: applicable.length,
    skuChanges,
    rowsLeftOut: checked.length - applicable.length,
    sentence,
  };
}
