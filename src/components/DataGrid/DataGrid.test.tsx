import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { DataGrid, type DataGridColumn } from '.';

interface Row {
  id: string;
  name: string;
  count?: number;
}

const rows: Row[] = [
  { id: 'a', name: 'Alpha', count: 3 },
  { id: 'b', name: 'Bravo' },
  { id: 'c', name: 'Charlie', count: 0 },
];

const columns: DataGridColumn<Row>[] = [
  { key: 'name', title: 'Name', dataIndex: 'name', width: 'wide', pinned: true, sorter: true },
  { key: 'count', title: 'Count', dataIndex: 'count', width: 'narrow', align: 'right' },
  {
    key: 'action',
    title: 'Action',
    width: 'column-key',
    truncate: false,
    render: (_, r) => <button type="button">Edit {r.name}</button>,
  },
  { key: 'plain', title: 'Plain', render: () => 'x', truncate: false },
];

describe('DataGrid', () => {
  it('renders zebra rows, dashes for missing values and tooltip-wrapped text', () => {
    const { container } = render(
      <DataGrid rowKey="id" columns={columns} dataSource={rows} testId="grid" ariaLabel="Doors" />,
    );
    expect(screen.getByTestId('grid').querySelector('.cds-grid')).toBeInTheDocument();
    const bodyRows = container.querySelectorAll('tbody tr[data-row-key]');
    expect(bodyRows).toHaveLength(3);
    expect(bodyRows[1]).toHaveClass('cds-row-zebra');
    expect(bodyRows[0]).not.toHaveClass('cds-row-zebra');
    expect(
      within(bodyRows[1] as HTMLElement).getByRole('img', { name: 'Unavailable' }),
    ).toBeInTheDocument();
    expect(within(bodyRows[2] as HTMLElement).getByText('0')).toHaveClass('cds-cell-text');
    expect(screen.getByText('Alpha')).toHaveClass('cds-cell-text');
  });

  it('activates rows by click or Enter but not from interactive controls', () => {
    const onRowActivate = vi.fn();
    const { container } = render(
      <DataGrid rowKey="id" columns={columns} dataSource={rows} onRowActivate={onRowActivate} />,
    );
    const first = container.querySelector('tbody tr[data-row-key="a"]') as HTMLElement;
    expect(first).toHaveAttribute('tabindex', '0');
    fireEvent.click(screen.getByText('Alpha'));
    expect(onRowActivate).toHaveBeenLastCalledWith(rows[0]);
    fireEvent.click(screen.getByRole('button', { name: 'Edit Bravo' }));
    expect(onRowActivate).toHaveBeenCalledTimes(1);
    fireEvent.keyDown(first, { key: 'Enter' });
    expect(onRowActivate).toHaveBeenCalledTimes(2);
    fireEvent.keyDown(first, { key: ' ' });
    fireEvent.keyDown(screen.getByRole('button', { name: 'Edit Alpha' }), { key: 'Enter' });
    expect(onRowActivate).toHaveBeenCalledTimes(2);
  });

  it('supports sorting callbacks, selection, pagination and an empty text', () => {
    const onChange = vi.fn();
    const onSelect = vi.fn();
    const { rerender, container } = render(
      <DataGrid
        rowKey="id"
        columns={columns}
        dataSource={rows}
        zebra={false}
        maxHeight="grid-max-height"
        onChange={onChange}
        rowSelection={{
          selectedRowKeys: ['a'],
          onChange: onSelect,
          getCheckboxProps: (r: Row) => ({ 'aria-label': `Select ${r.name}` }),
        }}
        pagination={{ pageSize: 2, showTotal: (t, r) => `${r[0]}–${r[1]} of ${t}` }}
      />,
    );
    expect(screen.getByText('1–2 of 3')).toBeInTheDocument();
    expect(container.querySelector('.cds-row-zebra')).toBeNull();
    fireEvent.click(screen.getByRole('checkbox', { name: 'Select Bravo' }));
    expect(onSelect).toHaveBeenCalled();
    fireEvent.click(screen.getAllByText('Name')[0]);
    expect(onChange).toHaveBeenCalled();

    rerender(<DataGrid rowKey="id" columns={columns} dataSource={[]} emptyText="Nothing here." />);
    expect(screen.getByText('Nothing here.')).toBeInTheDocument();
  });
});
