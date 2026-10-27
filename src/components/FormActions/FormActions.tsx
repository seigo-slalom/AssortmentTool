import type { ReactNode } from 'react';
import styles from './FormActions.module.css';

/** Right-aligned, wrapping button row (port of the prototype's ChanelUI FormActions). */
export function FormActions({ children }: { children: ReactNode }) {
  return <div className={`cds-form-actions ${styles.actions}`}>{children}</div>;
}
