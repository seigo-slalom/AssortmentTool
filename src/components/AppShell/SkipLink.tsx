import type { MouseEvent } from 'react';
import styles from './SkipLink.module.css';

/** "Skip to main content" link; visually hidden until focused (WCAG 2.4.1). */
export function SkipLink({ targetId }: { targetId: string }) {
  // HashRouter owns the URL hash, so move focus manually instead of following the anchor.
  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    document.getElementById(targetId)?.focus();
  };
  return (
    <a href={`#${targetId}`} className={styles.skip} onClick={handleClick}>
      Skip to main content
    </a>
  );
}
