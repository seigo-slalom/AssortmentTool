import { act, render, screen } from '@testing-library/react';
import { Button } from 'antd';
import { describe, expect, it } from 'vitest';
import { setViewportWidth } from '../test/matchMedia';
import { ThemeProvider } from './ThemeProvider';
import { token } from './token';

const rootOf = (container: HTMLElement) => container.querySelector('.cds-root') as HTMLElement;

describe('ThemeProvider', () => {
  it('renders .cds-root with token CSS variables and tier/density attributes', () => {
    const { container } = render(
      <ThemeProvider>
        <p>child</p>
      </ThemeProvider>,
    );
    const root = rootOf(container);
    expect(root).toHaveAttribute('data-tier', 'standard');
    expect(root).toHaveAttribute('data-density', 'standard');
    expect(root.style.getPropertyValue('--ink')).toBe(token.color.ink);
    expect(root.style.getPropertyValue('--cds-body-size')).toBe('13px');
    expect(screen.getByText('child')).toBeInTheDocument();
  });

  it('mirrors variables and attributes on the document element', () => {
    render(
      <ThemeProvider density="dense">
        <p>child</p>
      </ThemeProvider>,
    );
    const html = document.documentElement;
    expect(html.dataset.tier).toBe('standard');
    expect(html.dataset.density).toBe('dense');
    expect(html.style.getPropertyValue('--canvas')).toBe(token.color.canvas);
    expect(html.style.getPropertyValue('--cds-body-size')).toBe('10px');
  });

  it('injects the bundled font faces', () => {
    const { container } = render(
      <ThemeProvider>
        <p>child</p>
      </ThemeProvider>,
    );
    const style = container.querySelector('style');
    expect(style?.textContent).toContain('@font-face');
    expect(style?.textContent).toContain(token.fontFace.display);
  });

  it('applies the token theme to Ant Design components', () => {
    render(
      <ThemeProvider>
        <Button type="primary">Go</Button>
      </ThemeProvider>,
    );
    expect(screen.getByRole('button', { name: 'Go' })).toBeInTheDocument();
  });

  it('forces standard density and follows the tier in compact viewports', () => {
    setViewportWidth(390);
    const { container } = render(
      <ThemeProvider density="dense">
        <p>child</p>
      </ThemeProvider>,
    );
    const root = rootOf(container);
    expect(root).toHaveAttribute('data-tier', 'compact');
    expect(root).toHaveAttribute('data-density', 'standard');

    act(() => setViewportWidth(1920));
    expect(root).toHaveAttribute('data-tier', 'wide');
    expect(root).toHaveAttribute('data-density', 'dense');
  });
});
