import { useMemo } from 'react';
import { Radio, Select, message } from 'antd';
import { Field } from '../../components/Field';
import { FormGrid } from '../../components/FormGrid';
import type { AssortmentData } from '../../lib/data';
import { plural } from '../../lib/format';
import { skuGroups, skuOptions } from './options';
import type { SkuAction } from './types';
import styles from './BulkUpdate.module.css';

export interface SkuFieldsProps {
  data: AssortmentData;
  action: SkuAction;
  skuIds: string[];
  onAction: (action: SkuAction) => void;
  onSkuIds: (ids: string[]) => void;
  notify: ReturnType<typeof message.useMessage>[0];
}

/** Step 2 fields for SKU changes: action, group picker and the SKU multi-select. */
export function SkuFields({ data, action, skuIds, onAction, onSkuIds, notify }: SkuFieldsProps) {
  const groups = useMemo(() => skuGroups(data), [data]);
  const options = useMemo(() => skuOptions(data), [data]);

  const addGroup = (key: string) => {
    const next = [...new Set([...skuIds, ...groups.ids.get(key)!])];
    notify.info(
      `${plural(next.length - skuIds.length, 'SKU', 'SKUs')} from ${key.slice(2)} added. Remove any you don’t want.`,
    );
    onSkuIds(next);
  };

  return (
    <div className={styles.limited}>
      <FormGrid>
        <Field label="Action" required>
          <Radio.Group
            value={action}
            onChange={(e) => onAction(e.target.value as SkuAction)}
            options={[
              { value: 'add', label: 'Add the SKUs' },
              { value: 'remove', label: 'Remove the SKUs' },
            ]}
          />
        </Field>
      </FormGrid>
      <Field
        label="Add SKUs by group"
        help="Adds every SKU in the franchise or line. Remove any you don’t want below."
      >
        <Select
          className={styles.fullWidth}
          value={null}
          showSearch
          optionFilterProp="label"
          placeholder="Add every SKU in a franchise or line"
          options={groups.options}
          onChange={(key: string) => addGroup(key)}
          data-testid="bulk-sku-group"
        />
      </Field>
      <Field
        label="SKUs"
        required
        help="Each door and SKU pair becomes one door exception. For a whole tier or retailer, use a tier rule or a retailer exception."
      >
        <Select
          className={styles.fullWidth}
          mode="multiple"
          value={skuIds}
          showSearch
          optionFilterProp="label"
          maxTagCount={10}
          maxTagPlaceholder={(omitted) => `+ ${omitted.length} more`}
          allowClear
          placeholder="Search by SKU key or name"
          options={options}
          onChange={(ids: string[]) => onSkuIds(ids)}
          data-testid="bulk-skus"
        />
      </Field>
    </div>
  );
}
