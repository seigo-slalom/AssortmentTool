import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { ConfigProvider } from 'antd';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { NAV_DESTINATIONS } from '../../lib/navigation';
import { setViewportWidth } from '../../test/matchMedia';
import { AppShell } from './AppShell';

const renderShell = (path = '/', width = 1366) => {
  setViewportWidth(width);
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AppShell appName="Assortment tool" items={NAV_DESTINATIONS} actions={<span>action</span>}>
        <Routes>
          <Route path="*" element={<h1>screen</h1>} />
        </Routes>
      </AppShell>
    </MemoryRouter>,
  );
};

const mainNavs = () => screen.queryAllByRole('navigation', { name: 'Main' });

describe('AppShell — frame (standard tier)', () => {
  it('renders the header, rail, and main landmarks', () => {
    renderShell();
    const header = screen.getByTestId('app-header');
    expect(header.tagName).toBe('HEADER');
    expect(screen.getByRole('banner')).toBe(header);
    expect(within(header).getByTestId('app-name')).toHaveTextContent('Assortment tool');
    expect(screen.getByTestId('header-actions')).toHaveTextContent('action');
    expect(screen.getByTestId('nav-rail').tagName).toBe('ASIDE');
    const main = screen.getByRole('main');
    expect(main).toHaveAttribute('id', 'main-content');
    expect(main).toHaveAttribute('tabindex', '-1');
    expect(main.querySelector('.content')).toContainElement(screen.getByText('screen'));
  });

  it('selects Overview at the root and renders exactly one Main navigation', () => {
    renderShell();
    expect(mainNavs()).toHaveLength(1);
    expect(screen.getByRole('link', { name: 'Overview' })).toHaveAttribute('aria-current', 'page');
    expect(screen.queryByTestId('nav-trigger')).not.toBeInTheDocument();
  });

  it('starts with the skip link as the first focusable element', () => {
    const { container } = renderShell();
    const first = container.querySelector('a, button, [tabindex="0"]');
    expect(first).toHaveTextContent('Skip to main content');
  });
});

describe('AppShell — rail toggle (standard/wide)', () => {
  it('collapses and expands the rail', () => {
    renderShell('/', 1366);
    const toggle = screen.getByTestId('rail-toggle');
    expect(toggle).toHaveAccessibleName('Collapse navigation');
    expect(toggle).toHaveAttribute('aria-expanded', 'true');

    fireEvent.click(toggle);
    expect(toggle).toHaveAccessibleName('Expand navigation');
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(screen.getByTestId('nav-rail')).toHaveClass('railCollapsed');
    expect(screen.getByRole('link', { name: 'Doors' })).toHaveAttribute('title', 'Doors');

    fireEvent.click(toggle);
    expect(screen.getByTestId('nav-rail')).not.toHaveClass('railCollapsed');
  });

  it('keeps the collapsed state across standard and wide', () => {
    renderShell('/', 1366);
    fireEvent.click(screen.getByTestId('rail-toggle'));
    act(() => setViewportWidth(1920));
    expect(screen.getByTestId('nav-rail')).toHaveClass('railCollapsed');
  });
});

describe('AppShell — compact drawer', () => {
  it('shows a trigger instead of the rail', () => {
    renderShell('/', 390);
    const trigger = screen.getByTestId('nav-trigger');
    expect(trigger).toHaveAccessibleName('Open navigation');
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(trigger).toHaveAttribute('aria-controls', 'nav-drawer');
    expect(screen.queryByTestId('nav-rail')).not.toBeInTheDocument();
    expect(screen.queryByTestId('rail-toggle')).not.toBeInTheDocument();
    expect(mainNavs()).toHaveLength(0);
  });

  it('opens a titled drawer and closes it after navigation, moving focus to main', async () => {
    renderShell('/', 390);
    fireEvent.click(screen.getByTestId('nav-trigger'));
    expect(screen.getByTestId('nav-trigger')).toHaveAttribute('aria-expanded', 'true');
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText('Assortment tool')).toBeInTheDocument();
    expect(mainNavs()).toHaveLength(1);
    // Let the open motion finish so afterOpenChange(true) runs and leaves focus alone.
    await act(() => new Promise((resolve) => setTimeout(resolve, 400)));
    expect(screen.getByTestId('nav-trigger')).toHaveAttribute('aria-expanded', 'true');

    fireEvent.click(within(dialog).getByRole('link', { name: 'Doors' }));
    await waitFor(() => expect(document.activeElement).toBe(screen.getByRole('main')));
    expect(screen.getByTestId('nav-trigger')).toHaveAttribute('aria-expanded', 'false');
  });

  it('leaves focus in the drawer once it has opened (motion disabled)', async () => {
    setViewportWidth(390);
    render(
      <ConfigProvider theme={{ token: { motion: false } }}>
        <MemoryRouter>
          <AppShell appName="Assortment tool" items={NAV_DESTINATIONS}>
            <p>screen</p>
          </AppShell>
        </MemoryRouter>
      </ConfigProvider>,
    );
    const trigger = screen.getByTestId('nav-trigger');
    fireEvent.click(trigger);
    await screen.findByRole('dialog');
    await act(() => new Promise((resolve) => setTimeout(resolve, 50)));
    expect(document.activeElement).not.toBe(trigger);
  });

  it('returns focus to the trigger when closed with Escape', async () => {
    renderShell('/', 390);
    const trigger = screen.getByTestId('nav-trigger');
    fireEvent.click(trigger);
    const dialog = await screen.findByRole('dialog');
    fireEvent.keyDown(dialog, { key: 'Escape' });
    await waitFor(() => expect(document.activeElement).toBe(trigger));
  });

  it('wraps Tab focus inside the open drawer', async () => {
    renderShell('/', 390);
    fireEvent.click(screen.getByTestId('nav-trigger'));
    const dialog = await screen.findByRole('dialog');
    const links = within(dialog).getAllByRole('link');
    links[links.length - 1].focus();
    fireEvent.keyDown(document, { key: 'Tab' });
    expect(dialog).toContainElement(document.activeElement as HTMLElement);
    expect(document.activeElement).not.toBe(links[links.length - 1]);
  });

  it('closes the drawer and shows the rail when the tier leaves compact', async () => {
    renderShell('/', 390);
    fireEvent.click(screen.getByTestId('nav-trigger'));
    await screen.findByRole('dialog');
    act(() => setViewportWidth(1366));
    expect(screen.getByTestId('nav-rail')).toBeInTheDocument();
    expect(mainNavs()).toHaveLength(1);

    act(() => setViewportWidth(390));
    expect(screen.getByTestId('nav-trigger')).toHaveAttribute('aria-expanded', 'false');
  });
});
