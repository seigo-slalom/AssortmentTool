import type { ReactNode } from 'react';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import type { ScreenDefinition } from '../../lib/screens';
import { PageHeader, type PageHeaderProps } from '../PageHeader';
import { RegionState } from '../RegionState';
import { ScreenRegion } from '../ScreenRegion';
import styles from './ScreenScaffold.module.css';

export interface ScreenScaffoldProps {
  screen: ScreenDefinition;
  /** Live header description (e.g. counts); omitted when not given. */
  description?: ReactNode;
  actions?: ReactNode;
  /** Overrides the registry breadcrumb, e.g. to return to Doors with its last filters. */
  breadcrumb?: PageHeaderProps['breadcrumb'];
  /** Screen content; defaults to the labeled placeholder from the screen registry. */
  children?: ReactNode;
}

/** Route-level layout: document title, prototype page header, then the screen's regions. */
export function ScreenScaffold({
  screen,
  description,
  actions,
  breadcrumb,
  children,
}: ScreenScaffoldProps) {
  useDocumentTitle(screen.title);
  return (
    <div className={styles.screen} data-screen={screen.id}>
      <PageHeader
        title={screen.title}
        eyebrow={screen.eyebrow}
        breadcrumb={breadcrumb ?? screen.breadcrumb}
        description={description}
        actions={actions}
      />
      {children !== undefined ? (
        children
      ) : (
        <ScreenRegion label={screen.title} visualMask testId="screen-placeholder">
          <RegionState
            state="placeholder"
            title={screen.placeholder?.title}
            description={screen.placeholder?.description}
          />
        </ScreenRegion>
      )}
    </div>
  );
}
