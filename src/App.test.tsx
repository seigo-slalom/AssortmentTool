import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import App from './App';
import { PowerContext } from './lib/powerContext';

const renderApp = (context: never | null) =>
  render(
    <PowerContext.Provider value={context}>
      <MemoryRouter initialEntries={['/anywhere']}>
        <App />
      </MemoryRouter>
    </PowerContext.Provider>,
  );

describe('App', () => {
  it('shows the signed-in user and the placeholder route', () => {
    renderApp({ user: { fullName: 'Ada' } } as never);
    expect(screen.getByText('Signed in as Ada')).toBeInTheDocument();
    expect(screen.getByText('Placeholder application')).toBeInTheDocument();
  });

  it('omits the user name when there is no context', () => {
    renderApp(null);
    expect(screen.queryByText(/Signed in as/)).not.toBeInTheDocument();
    expect(screen.getByText('Placeholder application')).toBeInTheDocument();
  });
});
