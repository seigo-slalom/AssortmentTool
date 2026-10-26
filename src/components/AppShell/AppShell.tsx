import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Button, Drawer } from 'antd';
import { MenuFoldOutlined, MenuOutlined, MenuUnfoldOutlined } from '@ant-design/icons';
import { useLayoutTier } from '../../hooks/useLayoutTier';
import type { NavDestination } from '../../lib/navigation';
import { token } from '../../theme/token';
import { SideNav } from './SideNav';
import { SkipLink } from './SkipLink';
import { wrapFocus } from './focusWrap';
import styles from './AppShell.module.css';

export const MAIN_CONTENT_ID = 'main-content';
export const NAV_DRAWER_ID = 'nav-drawer';

const DRAWER_SIZE = `min(${token.size['nav-drawer-width']}, ${token.size['nav-drawer-max-viewport']})`;

export interface AppShellProps {
  appName: string;
  items: readonly NavDestination[];
  actions?: ReactNode;
  children: ReactNode;
}

/**
 * Application frame (port of the prototype's ChanelUI AppShell in side-navigation mode):
 * header, collapsible rail on standard/wide, navigation drawer on compact.
 */
export function AppShell({ appName, items, actions, children }: AppShellProps) {
  const tier = useLayoutTier();
  const compact = tier === 'compact';
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [railCollapsed, setRailCollapsed] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const closedByNavigation = useRef(false);

  // Leaving the compact tier removes the drawer; reset so it starts closed next time.
  if (!compact && drawerOpen) setDrawerOpen(false);

  // Ant Design's focus lock briefly hands focus to <body> between cycles; wrap explicitly.
  useEffect(() => {
    if (!drawerOpen) return undefined;
    const onKeyDown = (event: KeyboardEvent) => {
      wrapFocus(document.getElementById(NAV_DRAWER_ID), event);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [drawerOpen]);

  const handleNavigate = () => {
    closedByNavigation.current = true;
    setDrawerOpen(false);
  };

  const handleDrawerOpenChange = (open: boolean) => {
    if (open) return;
    if (closedByNavigation.current) {
      closedByNavigation.current = false;
      document.getElementById(MAIN_CONTENT_ID)?.focus();
    } else {
      triggerRef.current?.focus();
    }
  };

  return (
    <div className={styles.shell}>
      <SkipLink targetId={MAIN_CONTENT_ID} />
      <header className={styles.header} data-testid="app-header">
        {compact ? (
          <Button
            ref={triggerRef}
            className={styles.trigger}
            icon={<MenuOutlined />}
            aria-label="Open navigation"
            aria-expanded={drawerOpen}
            aria-controls={NAV_DRAWER_ID}
            data-testid="nav-trigger"
            onClick={() => setDrawerOpen(true)}
          />
        ) : (
          <Button
            type="text"
            className={styles.trigger}
            icon={railCollapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            aria-label={railCollapsed ? 'Expand navigation' : 'Collapse navigation'}
            aria-expanded={!railCollapsed}
            data-testid="rail-toggle"
            onClick={() => setRailCollapsed((collapsed) => !collapsed)}
          />
        )}
        <span className={styles.brand} data-testid="app-name">
          {appName}
        </span>
        <div className={styles.headerActions} data-testid="header-actions">
          {actions}
        </div>
      </header>
      <div className={styles.body}>
        {compact ? null : (
          <aside
            className={railCollapsed ? `${styles.rail} ${styles.railCollapsed}` : styles.rail}
            data-testid="nav-rail"
          >
            <SideNav items={items} collapsed={railCollapsed} />
          </aside>
        )}
        <main id={MAIN_CONTENT_ID} tabIndex={-1} className={styles.main} data-testid="main-content">
          <div className={`cds-content ${styles.content}`}>{children}</div>
        </main>
      </div>
      {compact ? (
        <Drawer
          id={NAV_DRAWER_ID}
          open={drawerOpen}
          placement="left"
          title={appName}
          size={DRAWER_SIZE}
          rootClassName="cds-drawer-root"
          classNames={{ body: styles.drawerBody }}
          focusable={{ trap: true, focusTriggerAfterClose: false }}
          onClose={() => setDrawerOpen(false)}
          afterOpenChange={handleDrawerOpenChange}
        >
          <SideNav items={items} touch onNavigate={handleNavigate} />
        </Drawer>
      ) : null}
    </div>
  );
}
