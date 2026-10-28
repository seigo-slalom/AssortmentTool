import type { KeyboardEvent } from 'react';
import { Tag } from 'antd';
import { SAVED_FILTERS, type SavedFilterId } from '../../lib/doors';
import styles from './SavedFilters.module.css';

export interface SavedFiltersProps {
  value?: SavedFilterId;
  onChange: (value: SavedFilterId | undefined) => void;
}

/** The hardcoded saved filters as checkable tags; at most one is checked (FR-006). */
export function SavedFilters({ value, onChange }: SavedFiltersProps) {
  const toggle = (id: SavedFilterId, checked: boolean) => onChange(checked ? id : undefined);
  const onKeyDown = (id: SavedFilterId) => (event: KeyboardEvent<HTMLSpanElement>) => {
    if (event.key === ' ' || event.key === 'Enter') {
      event.preventDefault();
      toggle(id, value !== id);
    }
  };

  return (
    <div
      role="group"
      aria-label="Saved filters"
      className={styles.row}
      data-testid="doors-saved-filters"
    >
      <span className={styles.label} aria-hidden>
        Saved filters
      </span>
      {SAVED_FILTERS.map(({ id, label }) => {
        // CheckableTag forwards these to its <span>, but its typings omit them.
        const a11y = {
          role: 'checkbox',
          'aria-checked': value === id,
          tabIndex: 0,
          onKeyDown: onKeyDown(id),
          'data-testid': `saved-${id}`,
        } as Record<string, unknown>;
        return (
          <Tag.CheckableTag
            key={id}
            className={styles.tag}
            checked={value === id}
            onChange={(checked) => toggle(id, checked)}
            {...a11y}
          >
            {label}
          </Tag.CheckableTag>
        );
      })}
    </div>
  );
}
