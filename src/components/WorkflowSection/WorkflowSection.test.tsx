import { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { WorkflowSection } from '.';

describe('WorkflowSection', () => {
  it('renders a numbered, labelled, focusable step heading', () => {
    const ref = createRef<HTMLHeadingElement>();
    render(
      <WorkflowSection number={2} title="Choose the doors" ref={ref}>
        <p>Body</p>
      </WorkflowSection>,
    );
    const heading = screen.getByRole('heading', { name: 'Step 2: Choose the doors' });
    expect(heading).toHaveAttribute('tabindex', '-1');
    expect(ref.current).toBe(heading);
    expect(screen.getByText('02')).toHaveAttribute('aria-hidden', 'true');
    expect(screen.getByRole('region', { name: 'Step 2: Choose the doors' })).toContainElement(
      screen.getByText('Body'),
    );
  });
});
