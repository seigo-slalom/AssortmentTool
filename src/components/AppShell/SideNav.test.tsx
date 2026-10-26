import { fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { NAV_DESTINATIONS } from '../../lib/navigation';
import { SideNav } from './SideNav';

const renderAt = (path: string, props: Partial<Parameters<typeof SideNav>[0]> = {}) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <SideNav items={NAV_DESTINATIONS} {...props} />
    </MemoryRouter>,
  );

describe('SideNav', () => {
  it('renders a Main navigation list with an icon and label per destination', () => {
    renderAt('/');
    const nav = screen.getByRole('navigation', { name: 'Main' });
    const links = within(nav).getAllByRole('link');
    expect(links.map((l) => l.textContent)).toEqual([
      'Overview',
      'Doors',
      'Tier assortments',
      'Exceptions',
    ]);
    for (const link of links) {
      expect(link.querySelector('.cds-side-label')).not.toBeNull();
      expect(link.querySelector('.anticon')).not.toBeNull();
    }
  });

  it('marks exactly one link as the current page', () => {
    renderAt('/');
    const current = screen.getAllByRole('link').filter((l) => l.getAttribute('aria-current'));
    expect(current).toHaveLength(1);
    expect(current[0]).toHaveTextContent('Overview');
    expect(current[0]).toHaveAttribute('aria-current', 'page');
    expect(current[0]).toHaveClass('isActive');
  });

  it('keeps Doors current on Doors sub-screens', () => {
    renderAt('/doors/mass-update');
    expect(screen.getByRole('link', { name: 'Doors' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: 'Overview' })).not.toHaveAttribute('aria-current');
  });

  it('keeps accessible names and tooltips when collapsed', () => {
    const { container } = renderAt('/', { collapsed: true });
    const link = screen.getByRole('link', { name: 'Tier assortments' });
    expect(link).toHaveAttribute('title', 'Tier assortments');
    expect(container.querySelector('.list')).toHaveClass('collapsed');
  });

  it('omits tooltips when expanded and supports the touch variant', () => {
    const { container } = renderAt('/', { touch: true });
    expect(screen.getByRole('link', { name: 'Doors' })).not.toHaveAttribute('title');
    expect(container.querySelector('.list')).toHaveClass('touch');
  });

  it('reports navigation', () => {
    const onNavigate = vi.fn();
    renderAt('/', { onNavigate });
    fireEvent.click(screen.getByRole('link', { name: 'Exceptions' }));
    expect(onNavigate).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('link', { name: 'Exceptions' })).toHaveAttribute(
      'aria-current',
      'page',
    );
  });
});
