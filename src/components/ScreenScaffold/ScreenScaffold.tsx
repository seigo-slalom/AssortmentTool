import type { ReactNode } from 'react';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import type { ScreenDefinition } from '../../lib/screens';
import { PageHeader } from '../PageHeader';
import { RegionState } from '../RegionState';
import { ScreenRegion } from '../ScreenRegion';
import styles from './ScreenScaffold.module.css';

export interface ScreenScaffoldProps {
  screen: ScreenDefinition;
  /** Screen content; defaults to the labeled placeholder from the screen registry. */
  children?: ReactNode;
}

/** Route-level layout: document title, prototype page header, then the screen's regions. */
export function ScreenScaffold({ screen, children }: ScreenScaffoldProps) {
  useDocumentTitle(screen.title);
  return (
    <div className={styles.screen} data-screen={screen.id}>
      <PageHeader title={screen.title} eyebrow={screen.eyebrow} breadcrumb={screen.breadcrumb} />
      {children ?? (
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
