import type { ReactNode } from 'react';
import { Button, Flex, Input } from 'antd';
import { REASON_MAX_LENGTH } from '../../lib/doors';
import { Field } from '../Field';
import styles from './ReasonField.module.css';

export interface ReasonFieldProps {
  value: string;
  onChange: (value: string) => void;
  reasons: readonly string[];
  help: ReactNode;
  placeholder?: string;
  rows?: number;
  label?: string;
}

/**
 * "Why is this change being made?" with one-click suggested reasons (prototype
 * `helpWithPicks`). Picking a reason fills the text; the picked one is highlighted.
 */
export function ReasonField({
  value,
  onChange,
  reasons,
  help,
  placeholder,
  rows = 2,
  label = 'Why is this change being made?',
}: ReasonFieldProps) {
  return (
    <Field
      label={label}
      required
      help={
        <span className={styles.help}>
          <Flex wrap align="center" className={styles.picks}>
            {reasons.map((reason) => (
              <Button
                key={reason}
                size="small"
                type={value === reason ? 'primary' : 'default'}
                aria-pressed={value === reason}
                onClick={() => onChange(reason)}
              >
                {reason}
              </Button>
            ))}
          </Flex>
          <span>{help}</span>
        </span>
      }
    >
      <Input.TextArea
        value={value}
        rows={rows}
        maxLength={REASON_MAX_LENGTH}
        showCount
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </Field>
  );
}
