import { Button, Empty, Result, Skeleton, Typography } from 'antd';
import styles from './RegionState.module.css';

export type RegionStateKind = 'loading' | 'empty' | 'error' | 'placeholder';

export interface RegionStateProps {
  state: RegionStateKind;
  title?: string;
  description?: string;
  onRetry?: () => void;
  rows?: number;
}

const PLACEHOLDER_LABEL = 'Coming in a later spec';

/** Loading, empty, error, and labeled-placeholder states (port of the prototype's ChanelUI RegionState). */
export function RegionState({ state, title, description, onRetry, rows = 4 }: RegionStateProps) {
  const className = `cds-state ${styles.state}`;

  if (state === 'loading') {
    return (
      <section aria-busy="true" aria-label="Loading content" className={className}>
        <Skeleton active title={false} paragraph={{ rows }} />
        {description ? <Typography.Text type="secondary">{description}</Typography.Text> : null}
      </section>
    );
  }

  if (state === 'empty') {
    return (
      <section aria-label="No results" className={className}>
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={
            <Typography.Text type="secondary">
              {description ?? 'Nothing to show yet.'}
            </Typography.Text>
          }
        />
      </section>
    );
  }

  if (state === 'error') {
    return (
      <section aria-label="Content unavailable" className={`${className} ${styles.error}`}>
        <Result
          status="error"
          title={title ?? 'Content unavailable'}
          subTitle={
            description ?? 'The content could not be loaded. Try again without losing your place.'
          }
          extra={
            onRetry ? (
              <Button type="primary" onClick={onRetry}>
                Try again
              </Button>
            ) : undefined
          }
        />
      </section>
    );
  }

  return (
    <section aria-label={PLACEHOLDER_LABEL} className={`${className} ${styles.placeholder}`}>
      <span className="cds-prominent-label">{PLACEHOLDER_LABEL}</span>
      {title ? <span className={styles.placeholderTitle}>{title}</span> : null}
      {description ? (
        <Typography.Paragraph type="secondary" className={styles.placeholderText}>
          {description}
        </Typography.Paragraph>
      ) : null}
    </section>
  );
}
