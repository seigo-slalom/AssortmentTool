import type { ReactNode } from 'react';
import styles from './FormGrid.module.css';

/** One or two responsive form columns (port of the prototype's ChanelUI FormGrid). */
export function FormGrid({ columns = 2, children }: { columns?: 1 | 2; children: ReactNode }) {
  return (
    <div className={`cds-form-grid-wrap ${styles.wrap}`}>
      <div
        className={`cds-form-grid cds-form-grid--${columns} ${styles.grid} ${styles[`c${columns}`]}`}
      >
        {children}
      </div>
    </div>
  );
}
