import { useId, type ReactNode } from 'react';
import { Card, Typography } from 'antd';
import { RegionState, type RegionStateKind } from '../RegionState';
import styles from './ScreenRegion.module.css';

export interface ScreenRegionProps {
  label: string;
  description?: string;
  state?: RegionStateKind;
  onRetry?: () => void;
  extra?: ReactNode;
  children?: ReactNode;
  /** Hidden in screenshot comparisons because it carries data the prototype does not share. */
  visualMask?: boolean;
  testId?: string;
}

/** A labeled card region (port of the prototype's ChanelUI ScreenRegion). */
export function ScreenRegion({
  label,
  description,
  state = 'empty',
  onRetry,
  extra,
  children,
  visualMask = false,
  testId,
}: ScreenRegionProps) {
  const labelId = useId();
  return (
    <section
      aria-labelledby={labelId}
      className={styles.region}
      data-visual-mask={visualMask ? '' : undefined}
      data-testid={testId}
    >
      <Card
        className={`cds-region ${styles.card}`}
        title={
          <Typography.Title level={5} id={labelId} className={styles.title}>
            {label}
          </Typography.Title>
        }
        extra={extra}
      >
        {children ?? <RegionState state={state} description={description} onRetry={onRetry} />}
      </Card>
    </section>
  );
}
