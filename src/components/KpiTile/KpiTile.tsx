import type { ReactNode } from 'react';
import { StatusIndicator, type StatusIndicatorTone } from '../StatusIndicator';
import styles from './KpiTile.module.css';

export interface KpiTileProps {
  label: string;
  value: ReactNode;
  status?: { tone: StatusIndicatorTone; label: string } | null;
}

const isMissing = (value: ReactNode) =>
  value === null ||
  value === undefined ||
  value === '' ||
  (typeof value === 'number' && Number.isNaN(value));

/** Fixed-height figure tile (port of the prototype's ChanelUI KpiTile). */
export function KpiTile({ label, value, status }: KpiTileProps) {
  return (
    <div className={`cds-kpi ${styles.kpi}`} data-testid="kpi-tile">
      <span className={`cds-kpi__label ${styles.label}`}>{label}</span>
      <span className={`cds-kpi__value ${styles.value}`}>
        {isMissing(value) ? (
          <span className={styles.missing} role="img" aria-label="Unavailable">
            —
          </span>
        ) : (
          value
        )}
      </span>
      {status ? (
        <span className={styles.status}>
          <StatusIndicator tone={status.tone} label={status.label} />
        </span>
      ) : (
        <span className={styles.spacer} />
      )}
    </div>
  );
}

/** Responsive row of KPI tiles. */
export function KpiRow({ children }: { children: ReactNode }) {
  return <div className={`cds-kpi-row ${styles.row}`}>{children}</div>;
}
