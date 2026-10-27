import { forwardRef, useId, type ReactNode } from 'react';
import styles from './WorkflowSection.module.css';

export interface WorkflowSectionProps {
  number: number;
  title: string;
  children: ReactNode;
}

/**
 * Numbered workflow step (port of the prototype's ChanelUI WorkflowSection). The heading is
 * focusable (`tabIndex=-1`) so a step change can move focus to it.
 */
export const WorkflowSection = forwardRef<HTMLHeadingElement, WorkflowSectionProps>(
  function WorkflowSection({ number, title, children }, ref) {
    const headingId = useId();
    return (
      <section className={`cds-workflow ${styles.section}`} aria-labelledby={headingId}>
        <h3
          id={headingId}
          ref={ref}
          tabIndex={-1}
          className={`cds-workflow__h ${styles.heading}`}
          aria-label={`Step ${number}: ${title}`}
        >
          <span className={`cds-workflow__head ${styles.head}`}>
            <span className={`cds-workflow__num ${styles.num}`} aria-hidden>
              {String(number).padStart(2, '0')}
            </span>
            <span className={`cds-workflow__title ${styles.title}`}>{title}</span>
          </span>
        </h3>
        <div className={`cds-workflow__body ${styles.body}`}>{children}</div>
      </section>
    );
  },
);
