import type { Ref } from 'react';
import { Button, Segmented } from 'antd';
import { DownloadOutlined } from '@ant-design/icons';
import { DataGrid } from '../../components/DataGrid';
import { FormActions } from '../../components/FormActions';
import { StatusIndicator } from '../../components/StatusIndicator';
import { WorkflowSection } from '../../components/WorkflowSection';
import { fmt, plural } from '../../lib/format';
import { applicableRows } from './bulkReducer';
import { STATUS_LABEL, STATUS_TONE } from './checkRows';
import type { CheckedRow, DoorSource, RowStatus } from './types';
import styles from './BulkUpdate.module.css';

export interface StepCheckRowsProps {
  rows: readonly CheckedRow[];
  view: 'all' | 'issues';
  source: DoorSource;
  onView: (view: 'all' | 'issues') => void;
  onDownloadIssues: (rows: readonly CheckedRow[]) => void;
  onBack: () => void;
  onReview: () => void;
  headingRef: Ref<HTMLHeadingElement>;
}

const COUNT_LABEL: Record<RowStatus, (n: number) => string> = {
  ready: () => 'ready',
  warning: (n) => (n === 1 ? 'warning' : 'warnings'),
  nochange: () => 'no change',
  skipped: () => 'skipped',
  error: (n) => (n === 1 ? 'error' : 'errors'),
};

export const INTRO =
  'Each row was checked against the door list, the SKU catalogue, the product line rule and the assortment rules. Nothing is saved yet. Ready rows and rows with warnings will be applied; the others are left out.';

/** Step 3: every row with its status and details (FR-040–FR-042). */
export function StepCheckRows({
  rows,
  view,
  source,
  onView,
  onDownloadIssues,
  onBack,
  onReview,
  headingRef,
}: StepCheckRowsProps) {
  const count = (status: RowStatus) => rows.filter((r) => r.status === status).length;
  const errors = count('error');
  const skipped = count('skipped');
  const same = count('nochange');
  const applicable = applicableRows(rows).length;
  const leftOut = rows.length - applicable;
  const issues = rows.filter((r) => r.status !== 'ready');
  const shown = view === 'issues' ? issues : rows;
  const leftParts = [
    errors ? plural(errors, 'row has an error', 'rows have errors') : '',
    skipped ? plural(skipped, 'row is skipped', 'rows are skipped') : '',
    same ? plural(same, 'row changes nothing', 'rows change nothing') : '',
  ].filter(Boolean);
  const advice = errors
    ? source === 'upload'
      ? 'Download them, fix the file and upload it again, or continue without them.'
      : 'Continue without them, or go back and change your choice.'
    : 'You can continue; they do not need fixing.';

  return (
    <WorkflowSection number={3} title="Check the rows" ref={headingRef}>
      <div className={styles.stack}>
        <span>{INTRO}</span>
        <div className={styles.wrapRow} data-testid="bulk-counts">
          {(['ready', 'warning', 'nochange', 'skipped', 'error'] as const)
            .filter((status) => count(status) > 0)
            .map((status) => (
              <StatusIndicator
                key={status}
                tone={STATUS_TONE[status]}
                label={`${fmt(count(status))} ${COUNT_LABEL[status](count(status))}`}
              />
            ))}
        </div>
        {leftOut > 0 ? (
          <div className={styles.notice} data-testid="bulk-left-out">
            <StatusIndicator
              tone={errors ? 'critical' : 'neutral'}
              label={plural(leftOut, 'row will be left out', 'rows will be left out')}
            />
            <span>{`${leftParts.join(', ')}. ${advice}`}</span>
          </div>
        ) : null}
        <div className={styles.row}>
          <Segmented
            aria-label="Rows to show"
            value={view}
            onChange={(value) => onView(value as 'all' | 'issues')}
            options={[
              { value: 'all', label: `All rows (${fmt(rows.length)})` },
              { value: 'issues', label: `Needs attention (${fmt(issues.length)})` },
            ]}
          />
          {issues.length ? (
            <Button
              icon={<DownloadOutlined aria-hidden />}
              onClick={() => onDownloadIssues(issues)}
            >
              Download rows that need attention
            </Button>
          ) : null}
        </div>
        <DataGrid<CheckedRow>
          rowKey="key"
          dataSource={shown}
          maxHeight="grid-max-height-rows"
          testId="bulk-rows"
          emptyText="Every row is ready."
          pagination={
            shown.length > 100 ? { pageSize: 100, showSizeChanger: false, size: 'small' } : false
          }
          columns={[
            {
              key: 'line',
              title: 'Row',
              dataIndex: 'line',
              width: 'column-row-number',
              align: 'right',
            },
            { key: 'doorKey', title: 'Door key', dataIndex: 'doorKey', width: 'column-key' },
            { key: 'door', title: 'Door', dataIndex: 'doorLabel', width: 'column-change' },
            { key: 'change', title: 'Change', dataIndex: 'change', width: 'column-change' },
            {
              key: 'status',
              title: 'Status',
              width: 'column-check-status',
              truncate: false,
              render: (_, r) => (
                <StatusIndicator tone={STATUS_TONE[r.status]} label={STATUS_LABEL[r.status]} />
              ),
            },
            {
              key: 'message',
              title: 'Details',
              dataIndex: 'message',
              width: 'column-details',
              truncate: false,
            },
          ]}
        />
        <FormActions>
          <Button onClick={onBack}>Back</Button>
          <Button type="primary" disabled={!applicable} onClick={onReview}>
            {applicable
              ? `Review impact (${plural(applicable, 'row', 'rows')})`
              : 'No rows to apply'}
          </Button>
        </FormActions>
      </div>
    </WorkflowSection>
  );
}
