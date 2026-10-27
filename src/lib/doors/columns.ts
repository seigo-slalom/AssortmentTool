import type { DoorRow } from './doorRows';

export interface DoorColumn {
  key: DoorColumnKey;
  title: string;
}

export type DoorColumnKey =
  | 'name'
  | 'doorKey'
  | 'tier'
  | 'skus'
  | 'distributor'
  | 'productLine'
  | 'doorType'
  | 'onlineOffline'
  | 'salesChannel'
  | 'exceptions'
  | 'status'
  | 'shipTo'
  | 'lastChanged';

/** FR-011 order. The single source for both the grid and the Excel export (FR-021). */
export const DOOR_COLUMNS: readonly DoorColumn[] = [
  { key: 'name', title: 'Door name' },
  { key: 'doorKey', title: 'Door key' },
  { key: 'tier', title: 'Tier' },
  { key: 'skus', title: 'SKUs assorted' },
  { key: 'distributor', title: 'Distributor name' },
  { key: 'productLine', title: 'Product line' },
  { key: 'doorType', title: 'Door type' },
  { key: 'onlineOffline', title: 'Online / offline' },
  { key: 'salesChannel', title: 'Sales channel' },
  { key: 'exceptions', title: 'Exceptions' },
  { key: 'status', title: 'Door status' },
  { key: 'shipTo', title: 'SAP Ship To' },
  { key: 'lastChanged', title: 'Last changed on' },
];

/** The tier as displayed: name, "Needs tier" for open doors, "—" for closed doors. */
export function tierText(row: DoorRow): string {
  if (row.tierName) return row.tierName;
  return row.isClosed ? '—' : 'Needs tier';
}

/** The value a cell displays, used for the export so the workbook matches the grid. */
export function doorCellText(row: DoorRow, key: DoorColumnKey): string | number {
  switch (key) {
    case 'name':
      return row.name;
    case 'doorKey':
      return row.doorKey ?? '';
    case 'tier':
      return tierText(row);
    case 'skus':
      return row.skuCount ?? '';
    case 'distributor':
      return row.distributorName ?? '';
    case 'productLine':
      return row.productLine ?? '';
    case 'doorType':
      return row.doorType ?? '';
    case 'onlineOffline':
      return row.onlineOffline ?? '';
    case 'salesChannel':
      return row.salesChannel ?? '';
    case 'exceptions':
      return row.exceptionCount;
    case 'status':
      return row.status ?? '';
    case 'shipTo':
      return row.shipTo ?? '';
    case 'lastChanged':
      return row.lastChangedLabel;
  }
}
