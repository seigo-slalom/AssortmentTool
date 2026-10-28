import { formatIsoDate } from '../../lib/clock';
import { DOOR_COLUMNS, doorCellText, type DoorRow } from '../../lib/doors';
import { downloadWorkbook } from '../../lib/excel';

export type ExportKind = 'filtered' | 'selection';

// Excel column widths (characters) roughly matching the grid's presets.
const WIDTHS: Record<string, number> = { name: 36, distributor: 22, status: 18, lastChanged: 20 };

/** Exports exactly the grid's columns and displayed values (FR-021, FR-022). */
export async function exportDoors(
  rows: readonly DoorRow[],
  kind: ExportKind,
  today: Date,
): Promise<number> {
  await downloadWorkbook(`Doors_${kind}_${formatIsoDate(today)}.xlsx`, [
    {
      name: 'Doors',
      columns: DOOR_COLUMNS.map((c) => ({ header: c.title, width: WIDTHS[c.key] ?? 16 })),
      rows: rows.map((row) => DOOR_COLUMNS.map((c) => doorCellText(row, c.key))),
    },
  ]);
  return rows.length;
}
