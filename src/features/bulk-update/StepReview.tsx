import { useId, type Ref } from 'react';
import { Button } from 'antd';
import { DataGrid } from '../../components/DataGrid';
import { FormActions } from '../../components/FormActions';
import { KpiRow, KpiTile } from '../../components/KpiTile';
import { ReasonField } from '../../components/ReasonField';
import { ScreenRegion } from '../../components/ScreenRegion';
import { StatusIndicator } from '../../components/StatusIndicator';
import { WorkflowSection } from '../../components/WorkflowSection';
import { SKU_REASONS, TIER_REASONS } from '../../lib/doors';
import { fmt, plural, signed } from '../../lib/format';
import type { ChangeType, Impact, ImpactRow } from './types';
import styles from './BulkUpdate.module.css';

const AFTER_APPLY = [
  'Saved immediately when you apply.',
  'Nothing to wait for: the assortment is calculated from tiers and exceptions, so every screen shows the result straight away.',
  'You can undo the whole update from the confirmation screen.',
];

export interface StepReviewProps {
  type: ChangeType;
  impact: Impact;
  errors: number;
  reason: string;
  onReason: (reason: string) => void;
  onBack: () => void;
  onApply: () => void;
  busy: boolean;
  headingRef: Ref<HTMLHeadingElement>;
}

/** Step 4: summary, KPIs, before/after per door, reason and Apply (FR-043, FR-044). */
export function StepReview({
  type,
  impact,
  errors,
  reason,
  onReason,
  onBack,
  onApply,
  busy,
  headingRef,
}: StepReviewProps) {
  const afterId = useId();
  const isTier = type === 'tier';
  const applyLabel = isTier
    ? `Re-tier ${plural(impact.doorsChanging, 'door', 'doors')}`
    : `Create ${plural(impact.exceptionsCreated, 'exception', 'exceptions')}`;

  return (
    <WorkflowSection number={4} title="Review and apply" ref={headingRef}>
      <div className={styles.stack}>
        <p className={styles.sentence} data-testid="bulk-sentence">
          {impact.sentence}
        </p>
        <KpiRow>
          <KpiTile label="Doors changing" value={fmt(impact.doorsChanging)} />
          <KpiTile
            label={isTier ? 'Net SKU change per door (average)' : 'Door exceptions created'}
            value={isTier ? signed(impact.avgNetDelta) : fmt(impact.exceptionsCreated)}
          />
          <KpiTile label="SKU changes across doors" value={fmt(impact.skuChanges)} />
          <KpiTile
            label="Rows left out"
            value={fmt(impact.rowsLeftOut)}
            status={
              impact.rowsLeftOut
                ? {
                    tone: errors ? 'critical' : 'neutral',
                    label: errors ? plural(errors, 'error', 'errors') : 'Nothing to fix',
                  }
                : null
            }
          />
        </KpiRow>
        <ScreenRegion
          label="Before and after, per door"
          description="No doors in scope."
          testId="bulk-impact-region"
        >
          <DataGrid<ImpactRow>
            rowKey="key"
            dataSource={impact.rows}
            maxHeight="grid-max-height-impact"
            testId="bulk-impact"
            columns={[
              { key: 'door', title: 'Door', dataIndex: 'door', width: 'wide', pinned: true },
              { key: 'doorKey', title: 'Door key', dataIndex: 'doorKey', width: 'column-key' },
              {
                key: 'before',
                title: isTier ? 'Tier before' : 'Tier',
                dataIndex: 'beforeLabel',
                width: 'medium',
              },
              {
                key: 'after',
                title: isTier ? 'Tier after' : 'Change',
                dataIndex: 'afterLabel',
                width: 'medium',
              },
              {
                key: 'skusBefore',
                title: 'SKUs before',
                width: 'narrow',
                align: 'right',
                render: (_, r) => fmt(r.skusBefore),
              },
              {
                key: 'skusAfter',
                title: 'SKUs after',
                width: 'narrow',
                align: 'right',
                render: (_, r) => fmt(r.skusAfter),
              },
              {
                key: 'delta',
                title: 'Difference',
                width: 'narrow',
                align: 'right',
                render: (_, r) => signed(r.delta),
              },
              {
                key: 'note',
                title: 'Note',
                width: 'column-details',
                truncate: false,
                render: (_, r) =>
                  r.note ? <StatusIndicator tone="warning" label={r.note} /> : null,
              },
            ]}
          />
        </ScreenRegion>
        <div className={styles.twoColumns}>
          <section aria-labelledby={afterId} className={`${styles.subPanel} ${styles.canvas}`}>
            <h3 id={afterId} className={`cds-prominent-label ${styles.prominent}`}>
              What happens when you apply
            </h3>
            <ol className={styles.afterList}>
              {AFTER_APPLY.map((text) => (
                <li key={text}>{text}</li>
              ))}
            </ol>
          </section>
          <div className={styles.tight}>
            <ReasonField
              value={reason}
              onChange={onReason}
              reasons={isTier ? TIER_REASONS : SKU_REASONS}
              placeholder={
                isTier
                  ? 'For example: cluster review'
                  : 'For example: Fixture constraint confirmed by Merchandising'
              }
              help={
                isTier
                  ? 'Pick a reason or type your own. Tier-change reasons are not saved.'
                  : 'Pick a reason or type your own. Saved on each exception.'
              }
            />
            <FormActions>
              <Button onClick={onBack} disabled={busy}>
                Back
              </Button>
              <Button
                type="primary"
                disabled={!reason.trim() || busy}
                loading={busy}
                onClick={onApply}
              >
                {applyLabel}
              </Button>
            </FormActions>
          </div>
        </div>
      </div>
    </WorkflowSection>
  );
}
