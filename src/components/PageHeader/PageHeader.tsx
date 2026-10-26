import type { ReactNode } from 'react';
import { Breadcrumb, Typography } from 'antd';
import { Link } from 'react-router-dom';
import styles from './PageHeader.module.css';

export interface PageHeaderProps {
  title: string;
  eyebrow?: string;
  description?: ReactNode;
  breadcrumb?: readonly { readonly label: string; readonly to: string }[];
  actions?: ReactNode;
}

/** Screen title block (port of the prototype's ChanelUI PageHeader). */
export function PageHeader({ title, eyebrow, description, breadcrumb, actions }: PageHeaderProps) {
  return (
    <header className={`cds-page-header ${styles.header}`} data-testid="page-header">
      {breadcrumb?.length ? (
        <Breadcrumb
          aria-label="Breadcrumb"
          items={[
            ...breadcrumb.map((item) => ({ title: <Link to={item.to}>{item.label}</Link> })),
            { title },
          ]}
        />
      ) : null}
      <div className={styles.row}>
        <div className={styles.text}>
          {eyebrow ? (
            <span className={`cds-prominent-label ${styles.eyebrow}`} data-testid="page-eyebrow">
              {eyebrow}
            </span>
          ) : null}
          <Typography.Title level={1} className={styles.title} data-testid="page-title">
            {title}
          </Typography.Title>
          {description ? (
            <Typography.Paragraph
              type="secondary"
              className={styles.description}
              data-testid="page-description"
            >
              {description}
            </Typography.Paragraph>
          ) : null}
        </div>
        {actions ? (
          <div className={styles.actions} data-testid="page-actions">
            {actions}
          </div>
        ) : null}
      </div>
    </header>
  );
}
