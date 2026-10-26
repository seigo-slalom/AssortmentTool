import { NavLink } from 'react-router-dom';
import type { NavDestination } from '../../lib/navigation';
import styles from './SideNav.module.css';

export interface SideNavProps {
  items: readonly NavDestination[];
  /** Icons-only rail; each link keeps its accessible name and a tooltip. */
  collapsed?: boolean;
  /** Drawer variant: items grow to the touch-target height. */
  touch?: boolean;
  onNavigate?: () => void;
}

/**
 * Side navigation styled like the prototype's inline Ant Design Menu, built from real links so
 * the current page is announced with `aria-current="page"` (research.md R6).
 */
export function SideNav({ items, collapsed = false, touch = false, onNavigate }: SideNavProps) {
  const listClass = [styles.list, collapsed ? styles.collapsed : '', touch ? styles.touch : '']
    .filter(Boolean)
    .join(' ');
  return (
    <nav aria-label="Main" className={styles.nav}>
      <ul className={listClass}>
        {items.map(({ key, label, path, icon: Icon, end }) => (
          <li key={key} className={styles.item}>
            <NavLink
              to={path}
              end={end}
              className={({ isActive }) =>
                isActive ? `${styles.link} ${styles.isActive}` : styles.link
              }
              aria-label={collapsed ? label : undefined}
              title={collapsed ? label : undefined}
              onClick={onNavigate}
            >
              <span className={styles.icon} aria-hidden="true">
                <Icon />
              </span>
              <span className={`cds-side-label ${styles.label}`}>{label}</span>
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
