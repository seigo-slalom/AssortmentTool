import type { ReactNode } from 'react';
import { Button, Flex } from 'antd';
import { plural } from '../../lib/format';
import styles from './SelectionBar.module.css';

export interface SelectionBarProps {
  count: number;
  onClear: () => void;
  /** Actions before "Clear selection" (Change tier, Add exception, Export selection). */
  children?: ReactNode;
}

/** Shown while doors are selected (prototype Doors selection bar; FR-019). */
export function SelectionBar({ count, onClear, children }: SelectionBarProps) {
  if (count === 0) return null;
  return (
    <div className={styles.bar} data-testid="doors-selection-bar">
      <span aria-live="polite">{plural(count, 'door selected', 'doors selected')}</span>
      <Flex wrap align="center" className={styles.actions}>
        {children}
        <Button type="text" onClick={onClear}>
          Clear selection
        </Button>
      </Flex>
    </div>
  );
}
