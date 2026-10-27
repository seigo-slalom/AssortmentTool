import { formatIsoDate } from '../../lib/clock';
import type { AssortmentData } from '../../lib/data';
import { downloadWorkbook } from '../../lib/excel';
import { BULK_LIMITS } from './bulkReducer';
import { STATUS_LABEL } from './checkRows';
import type { ChangeType, CheckedRow } from './types';

export interface TemplateColumn {
  col: string;
  required: boolean;
  rule: string;
}

export function templateColumns(type: ChangeType, data: AssortmentData): TemplateColumn[] {
  const tiers = data.index.activeTiers.map((t) => t.name).join(', ');
  return type === 'tier'
    ? [
        { col: 'Door key', required: true, rule: 'Text, for example US1542. Matches the door.' },
        { col: 'Door name', required: false, rule: 'For your reference only; not saved.' },
        { col: 'New tier', required: true, rule: `${tiers} (dropdown).` },
        { col: 'Reason', required: false, rule: 'Per-row note, added to your comment.' },
      ]
    : [
        { col: 'Door key', required: true, rule: 'Text, for example US1542.' },
        { col: 'SKU key', required: true, rule: '6-digit SKU key from the catalogue.' },
        { col: 'Action', required: true, rule: 'Add or Remove (dropdown).' },
        { col: 'Reason', required: false, rule: 'Per-row note, added to your comment.' },
      ];
}

export const REQUIRED_HEADERS: Record<ChangeType, readonly string[]> = {
  tier: ['Door key', 'New tier'],
  sku: ['Door key', 'SKU key', 'Action'],
};

export const TEMPLATE_FILE: Record<ChangeType, string> = {
  tier: 'Re-tier_doors_template.xlsx',
  sku: 'Door_SKU_exceptions_template.xlsx',
};

/** The .xlsx template: an Update sheet with dropdowns and a Rules sheet (FR-039, R4). */
export async function downloadTemplate(type: ChangeType, data: AssortmentData): Promise<void> {
  const columns = templateColumns(type, data);
  const example =
    type === 'tier'
      ? ['US1542', 'Example door', data.index.activeTiers[0]?.name ?? '', 'Cluster review']
      : ['US1542', '123456', 'Add', 'Fixture constraint'];
  const list =
    type === 'tier'
      ? { column: 3, list: data.index.activeTiers.map((t) => t.name) }
      : { column: 3, list: ['Add', 'Remove'] };
  await downloadWorkbook(TEMPLATE_FILE[type], [
    {
      name: 'Update',
      columns: columns.map((c) => ({ header: c.col, width: 20 })),
      rows: [example],
      validations: [{ ...list, rows: BULK_LIMITS[type] }],
    },
    {
      name: 'Rules',
      columns: [
        { header: 'Column', width: 16 },
        { header: 'Required', width: 12 },
        { header: 'Rule', width: 60 },
      ],
      rows: columns.map((c) => [c.col, c.required ? 'Required' : 'Optional', c.rule]),
    },
  ]);
}

/** Rows that are not Ready, for fixing the file (FR-042). */
export async function downloadIssues(rows: readonly CheckedRow[], today: Date): Promise<void> {
  await downloadWorkbook(`Rows_to_fix_${formatIsoDate(today)}.xlsx`, [
    {
      name: 'Rows to fix',
      columns: ['Row', 'Door key', 'Door', 'Change', 'Status', 'Details'].map((header) => ({
        header,
        width: header === 'Details' ? 60 : 20,
      })),
      rows: rows.map((r) => [
        r.line,
        r.doorKey,
        r.doorLabel,
        r.change,
        STATUS_LABEL[r.status],
        r.message,
      ]),
    },
  ]);
}
