import { useId } from 'react';
import { Button } from 'antd';
import styles from './BulkUpdate.module.css';

const INTRO = [
  ['1', 'Choose the change', 'Re-tier doors, or add or remove SKUs at specific doors.'],
  ['2', 'Choose the doors', 'Use your selection, a saved filter, or upload the matching template.'],
  ['3', 'Check the rows', 'Every row is checked and labelled. Nothing is saved yet.'],
  [
    '4',
    'Review and apply',
    'See the impact per door, give a reason, apply. You can undo it afterwards.',
  ],
] as const;

/** "How bulk update works" (prototype `mu.intro`); hidden for the session with "Hide". */
export function BulkIntro({ onHide }: { onHide: () => void }) {
  const headingId = useId();
  return (
    <section aria-labelledby={headingId} className={styles.paper} data-testid="bulk-intro">
      <div className={styles.row}>
        <h2 id={headingId} className={`cds-prominent-label ${styles.prominent}`}>
          How bulk update works
        </h2>
        <Button type="text" size="small" onClick={onHide}>
          Hide
        </Button>
      </div>
      <ol className={styles.introList}>
        {INTRO.map(([n, title, text]) => (
          <li key={n} className={styles.introItem}>
            <span aria-hidden className={styles.introNumber}>
              {n}
            </span>
            <span className={styles.introText}>
              <span>{title}</span>
              <span className={styles.muted}>{text}</span>
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}
