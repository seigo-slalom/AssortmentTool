import type { Dispatch, Ref } from 'react';
import { Button, Radio, Select, message } from 'antd';
import { Field } from '../../components/Field';
import { FormActions } from '../../components/FormActions';
import { FormGrid } from '../../components/FormGrid';
import { WorkflowSection } from '../../components/WorkflowSection';
import type { AssortmentData, DoorRecord } from '../../lib/data';
import { BULK_SAVED_FILTERS, savedFilterLabel, type SavedFilterId } from '../../lib/doors';
import { fmt, plural } from '../../lib/format';
import type { BulkAction } from './bulkReducer';
import { SkuFields } from './SkuFields';
import { UploadPanel } from './UploadPanel';
import type { BulkState, DoorSource } from './types';
import styles from './BulkUpdate.module.css';

export interface StepChooseDoorsProps {
  state: BulkState;
  dispatch: Dispatch<BulkAction>;
  data: AssortmentData;
  scope: readonly DoorRecord[];
  rawCount: number;
  /** Non-closed doors per saved filter. */
  filterCounts: Record<SavedFilterId, number>;
  canCheck: boolean;
  onCheck: () => void;
  notify: ReturnType<typeof message.useMessage>[0];
  headingRef: Ref<HTMLHeadingElement>;
}

function scopeText(state: BulkState, rawCount: number, doors: number): string {
  if (state.source === 'upload') {
    return state.upload
      ? `${plural(rawCount, 'row', 'rows')} to check.`
      : 'Upload a file to continue.';
  }
  if (state.type === 'tier' && !state.tierId) return 'Choose the new tier to continue.';
  if (state.type === 'sku' && !state.skuIds.length) return 'Choose at least one SKU to continue.';
  const detail =
    state.type === 'sku'
      ? ` (${plural(doors, 'door', 'doors')} × ${plural(state.skuIds.length, 'SKU', 'SKUs')})`
      : '';
  return `${plural(rawCount, 'row', 'rows')} to check${detail}.`;
}

/** Step 2: where the doors come from, plus the new tier or the SKUs (FR-036–FR-039). */
export function StepChooseDoors({
  state,
  dispatch,
  data,
  scope,
  rawCount,
  filterCounts,
  canCheck,
  onCheck,
  notify,
  headingRef,
}: StepChooseDoorsProps) {
  const isTier = state.type === 'tier';
  const selected = state.doorIds.length;
  const names = scope
    .slice(0, 4)
    .map((d) => d.name)
    .join(', ');
  const more = scope.length > 4 ? ` and ${fmt(scope.length - 4)} more` : '';

  return (
    <WorkflowSection
      number={2}
      title={isTier ? 'Choose the doors and the new tier' : 'Choose the doors and the SKUs'}
      ref={headingRef}
    >
      <div className={styles.stack}>
        <div className={styles.tight}>
          <span id="bulk-source-label">Where do the doors come from?</span>
          <Radio.Group
            aria-labelledby="bulk-source-label"
            value={state.source}
            onChange={(e) => dispatch({ type: 'setSource', source: e.target.value as DoorSource })}
            options={[
              {
                value: 'selection',
                label: `Doors selected on the Doors screen (${selected ? fmt(selected) : 'none selected'})`,
                disabled: !selected,
              },
              { value: 'filter', label: 'A saved filter' },
              {
                value: 'upload',
                label: isTier
                  ? 'Upload a file (a different tier per door is fine)'
                  : 'Upload a file (different SKUs per door is fine)',
              },
            ]}
            data-testid="bulk-source"
          />
        </div>
        {state.source === 'selection' ? (
          <span data-testid="bulk-selection-text">{names + more}</span>
        ) : null}
        {state.source !== 'upload' ? (
          <div className={styles.limited}>
            {state.source === 'filter' || isTier ? (
              <FormGrid>
                {state.source === 'filter' ? (
                  <Field
                    label="Saved filter"
                    required
                    help="Uses the same saved filters as the Doors screen. Closed doors are left out."
                  >
                    <Select
                      className={styles.fullWidth}
                      value={state.filter}
                      options={BULK_SAVED_FILTERS.map((id) => ({
                        value: id,
                        label: `${savedFilterLabel(id)} · ${plural(filterCounts[id], 'door', 'doors')}`,
                      }))}
                      onChange={(filter: SavedFilterId) => dispatch({ type: 'setFilter', filter })}
                      data-testid="bulk-filter"
                    />
                  </Field>
                ) : null}
                {isTier ? (
                  <Field
                    label="New tier"
                    required
                    help="Every door in scope moves to this tier. To give doors different tiers, upload a file."
                  >
                    <Select
                      className={styles.fullWidth}
                      value={state.tierId}
                      placeholder="Choose a tier"
                      options={data.index.activeTiers.map((t) => ({ value: t.id, label: t.name }))}
                      onChange={(tierId: string) => dispatch({ type: 'setTier', tierId })}
                      data-testid="bulk-tier"
                    />
                  </Field>
                ) : null}
              </FormGrid>
            ) : null}
            {isTier ? null : (
              <SkuFields
                data={data}
                action={state.skuAction}
                skuIds={state.skuIds}
                onAction={(action) => dispatch({ type: 'setSkuAction', action })}
                onSkuIds={(skuIds) => dispatch({ type: 'setSkuIds', skuIds })}
                notify={notify}
              />
            )}
          </div>
        ) : (
          <UploadPanel
            type={state.type!}
            data={data}
            upload={state.upload}
            onUpload={(upload) => dispatch({ type: 'setUpload', upload })}
          />
        )}
        <span className={styles.muted} data-testid="bulk-scope-text">
          {scopeText(state, rawCount, scope.length)}
        </span>
        <FormActions>
          <Button onClick={() => dispatch({ type: 'back' })}>Back</Button>
          <Button type="primary" disabled={!canCheck} onClick={onCheck}>
            Check the rows
          </Button>
        </FormActions>
      </div>
    </WorkflowSection>
  );
}
