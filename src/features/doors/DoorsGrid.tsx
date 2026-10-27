import type { Key, ReactNode } from 'react';
import type { TablePaginationConfig } from 'antd';
import type { SorterResult } from 'antd/es/table/interface';
import { useNavigate } from 'react-router-dom';
import { DataGrid, type DataGridColumn, type GridWidth } from '../../components/DataGrid';
import { StatusIndicator } from '../../components/StatusIndicator';
import { fmt } from '../../lib/format';
import {
  DOOR_COLUMNS,
  type DoorColumnKey,
  type DoorQuery,
  type DoorRow,
  type DoorSort,
} from '../../lib/doors';

export const PAGE_SIZE = 50;

export interface DoorsGridProps {
  rows: readonly DoorRow[];
  query: DoorQuery;
  onQuery: (patch: Partial<DoorQuery>) => void;
  selected: ReadonlySet<string>;
  onSelect: (ids: string[]) => void;
  /** Tier cell renderer (the inline tier picker, US3). */
  renderTier: (row: DoorRow) => ReactNode;
}

const SORT_OF: Partial<Record<DoorColumnKey, DoorSort>> = {
  name: 'name',
  tier: 'tier',
  skus: 'skus',
  distributor: 'distributor',
  lastChanged: 'changed',
};

const LAYOUT: Record<
  DoorColumnKey,
  { width: GridWidth; pinned?: boolean; align?: 'right'; truncate?: boolean }
> = {
  name: { width: 'wide', pinned: true },
  doorKey: { width: 'column-key', pinned: true },
  tier: { width: 'medium', truncate: false },
  skus: { width: 'narrow', align: 'right' },
  distributor: { width: 'medium' },
  productLine: { width: 'medium' },
  doorType: { width: 'narrow' },
  onlineOffline: { width: 'medium' },
  salesChannel: { width: 'medium' },
  exceptions: { width: 'narrow', align: 'right' },
  status: { width: 'column-door-status', truncate: false },
  shipTo: { width: 'narrow' },
  lastChanged: { width: 'medium' },
};

const VALUE: Record<Exclude<DoorColumnKey, 'tier'>, (row: DoorRow) => ReactNode> = {
  name: (r) => r.name,
  doorKey: (r) => r.doorKey,
  skus: (r) => (r.skuCount === undefined ? undefined : fmt(r.skuCount)),
  distributor: (r) => r.distributorName,
  productLine: (r) => r.productLine,
  doorType: (r) => r.doorType,
  onlineOffline: (r) => r.onlineOffline,
  salesChannel: (r) => r.salesChannel,
  exceptions: (r) => String(r.exceptionCount),
  status: (r) => (r.status ? <StatusIndicator tone={r.statusTone} label={r.status} /> : undefined),
  shipTo: (r) => r.shipTo,
  lastChanged: (r) => r.lastChangedLabel,
};

/** The Doors grid (prototype `vDoors` columns; FR-011–FR-018). */
export function DoorsGrid({
  rows,
  query,
  onQuery,
  selected,
  onSelect,
  renderTier,
}: DoorsGridProps) {
  const navigate = useNavigate();
  const columns: DataGridColumn<DoorRow>[] = DOOR_COLUMNS.map(({ key, title }) => {
    const sort = SORT_OF[key];
    return {
      key,
      title,
      ...LAYOUT[key],
      render: (_value, row) => (key === 'tier' ? renderTier(row) : VALUE[key](row)),
      sorter: Boolean(sort),
      sortOrder: sort && query.sort === sort ? (query.dir === 'asc' ? 'ascend' : 'descend') : null,
    };
  });

  // Only pagination and single-column sorting are enabled on this grid.
  const onChange = (
    pagination: TablePaginationConfig,
    _filters: unknown,
    sorter: SorterResult<DoorRow> | SorterResult<DoorRow>[],
    extra: { action: string },
  ) => {
    if (extra.action === 'paginate') {
      onQuery({ page: pagination.current! });
      return;
    }
    const s = sorter as SorterResult<DoorRow>;
    const next = s.order ? SORT_OF[s.columnKey as DoorColumnKey] : undefined;
    onQuery(
      next
        ? { sort: next, dir: s.order === 'descend' ? 'desc' : 'asc' }
        : { sort: 'name', dir: 'asc' },
    );
  };

  const pageCount = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));

  return (
    <DataGrid<DoorRow>
      rowKey="id"
      columns={columns}
      dataSource={rows}
      maxHeight="grid-max-height"
      testId="doors-grid"
      ariaLabel="Doors"
      onChange={onChange as never}
      onRowActivate={(row) => navigate(`/doors/${encodeURIComponent(row.id)}`)}
      emptyText="No doors match these filters. Clear a filter to widen the list."
      pagination={{
        current: Math.min(query.page, pageCount),
        pageSize: PAGE_SIZE,
        showSizeChanger: false,
        size: 'small',
        showTotal: (total, range) => `${fmt(range[0])}–${fmt(range[1])} of ${fmt(total)}`,
      }}
      rowSelection={{
        selectedRowKeys: [...selected],
        preserveSelectedRowKeys: true,
        onChange: (keys: Key[]) => onSelect(keys.map(String)),
        getCheckboxProps: (row: DoorRow) => ({ 'aria-label': `Select ${row.name}` }),
      }}
    />
  );
}
