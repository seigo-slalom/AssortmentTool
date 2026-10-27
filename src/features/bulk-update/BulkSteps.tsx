import { Steps } from 'antd';
import { fmt, plural } from '../../lib/format';
import { TYPE_NAME } from './options';
import type { ChangeType, Step } from './types';

export interface BulkStepsProps {
  step: Step;
  type?: ChangeType;
  rawCount: number;
  applicableCount: number;
}

/** The four-step indicator; finished steps show what was chosen (FR-032). */
export function BulkSteps({ step, type, rawCount, applicableCount }: BulkStepsProps) {
  return (
    <div data-testid="bulk-steps">
      <Steps
        size="small"
        current={step}
        items={[
          { title: 'Choose the change', content: step > 0 && type ? TYPE_NAME[type] : undefined },
          {
            title: 'Choose the doors',
            content: step > 1 ? plural(rawCount, 'row', 'rows') : undefined,
          },
          {
            title: 'Check the rows',
            content: step > 2 ? `${fmt(applicableCount)} to apply` : undefined,
          },
          { title: 'Review and apply' },
        ]}
      />
    </div>
  );
}
