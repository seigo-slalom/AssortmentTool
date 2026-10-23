import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import PlaceholderBanner from './PlaceholderBanner';

describe('PlaceholderBanner', () => {
  it('renders the placeholder message', () => {
    render(<PlaceholderBanner />);
    expect(screen.getByText('Placeholder application')).toBeInTheDocument();
  });
});
