import type { Key, KeyboardEvent, MouseEvent, ReactNode } from 'react';
import { Table, Tooltip, type TableProps } from 'antd';
import type { ColumnType } from 'antd/es/table';
import { px, token, type SizeKey } from '../../theme/token';
import styles from './DataGrid.module.css';

export type GridWidth = 'wide' | 'medium' | 'narrow' | SizeKey;

export interface DataGridColumn<T> {
  key: string;
  title: ReactNode;
  dataIndex?: keyof T & string;
  render?: (value: unknown, record: T, index: number) => ReactNode;
  width?: GridWidth;
  align?: 'left' | 'right' | 'center';
  /** Pinned to the left while scrolling horizontally. */
  pinned?: boolean;
  /** Single-line cell with a tooltip for long text (default true). */
  truncate?: boolean;
  sorter?: boolean | ((a: T, b: T) => number);
  sortOrder?: 'ascend' | 'descend' | null;
}

export interface DataGridProps<T> {
  rowKey: keyof T & string;
  columns: readonly DataGridColumn<T>[];
  dataSource: readonly T[];
  pagination?: TableProps<T>['pagination'];
  rowSelection?: TableProps<T>['rowSelection'];
  onChange?: TableProps<T>['onChange'];
  /** Opens the row (click outside interactive controls, or Enter on the focused row). */
  onRowActivate?: (record: T) => void;
  maxHeight?: SizeKey;
  emptyText?: ReactNode;
  zebra?: boolean;
  testId?: string;
  ariaLabel?: string;
}

const PRESETS: Record<'wide' | 'medium' | 'narrow', SizeKey> = {
  wide: 'column-wide',
  medium: 'column-medium',
  narrow: 'column-narrow',
};

const widthOf = (width?: GridWidth) =>
  width === undefined
    ? undefined
    : px(
        token.size[width in PRESETS ? PRESETS[width as keyof typeof PRESETS] : (width as SizeKey)],
      );

const isMissing = (value: unknown) =>
  value === null ||
  value === undefined ||
  value === '' ||
  (typeof value === 'number' && Number.isNaN(value));

// Clicks on controls inside a row (checkbox, select, buttons, links) never open the row.
const INTERACTIVE =
  'button, a, input, textarea, .ant-select, .ant-checkbox-wrapper, [role="combobox"]';

/** Token-styled table (port of the prototype's ChanelUI DataGrid). */
export function DataGrid<T extends object>({
  rowKey,
  columns,
  dataSource,
  pagination = false,
  rowSelection,
  onChange,
  onRowActivate,
  maxHeight,
  emptyText,
  zebra = true,
  testId,
  ariaLabel,
}: DataGridProps<T>) {
  const antColumns: ColumnType<T>[] = columns.map(
    ({ pinned, width, truncate = true, render, dataIndex, ...rest }) => ({
      ...rest,
      dataIndex,
      width: widthOf(width),
      fixed: pinned ? 'left' : undefined,
      ellipsis: truncate ? { showTitle: false } : false,
      render: (value: unknown, record: T, index: number) => {
        const content = render ? render(value, record, index) : (value as ReactNode);
        if (isMissing(content)) {
          return (
            <span className={`cds-missing ${styles.missing}`} role="img" aria-label="Unavailable">
              —
            </span>
          );
        }
        if (truncate && (typeof content === 'string' || typeof content === 'number')) {
          return (
            <Tooltip title={content} placement="topLeft">
              <span className={`cds-cell-text ${styles.cellText}`}>{content}</span>
            </Tooltip>
          );
        }
        return content;
      },
    }),
  );

  const onRow = onRowActivate
    ? (record: T) => ({
        tabIndex: 0,
        onClick: (event: MouseEvent<HTMLElement>) => {
          if ((event.target as HTMLElement).closest(INTERACTIVE)) return;
          onRowActivate(record);
        },
        onKeyDown: (event: KeyboardEvent<HTMLElement>) => {
          if (event.key === 'Enter' && event.target === event.currentTarget) onRowActivate(record);
        },
      })
    : undefined;

  return (
    <div className={styles.wrap} data-testid={testId}>
      <Table<T>
        className={`cds-grid ${styles.grid}`}
        size="small"
        rowKey={(record) => String(record[rowKey] as Key)}
        columns={antColumns}
        dataSource={dataSource as T[]}
        pagination={pagination}
        rowSelection={rowSelection}
        onChange={onChange}
        onRow={onRow}
        scroll={{ x: 'max-content', y: maxHeight ? px(token.size[maxHeight]) : undefined }}
        rowClassName={(_, index) => (zebra && index % 2 === 1 ? 'cds-row-zebra' : '')}
        locale={emptyText ? { emptyText } : undefined}
        aria-label={ariaLabel}
      />
    </div>
  );
}
