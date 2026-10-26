import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App';
import PowerProvider from './PowerProvider';
import ErrorBoundary from './components/ErrorBoundary';
import { ThemeProvider } from './theme/ThemeProvider';
import './theme/global.css';

const queryClient = new QueryClient();

// ThemeProvider is outermost so the host loading/error states are branded too. HashRouter
// keeps every screen bookmarkable inside the static Power Apps host (research.md R5).
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <PowerProvider>
        <QueryClientProvider client={queryClient}>
          <HashRouter>
            <ErrorBoundary>
              <App />
            </ErrorBoundary>
          </HashRouter>
        </QueryClientProvider>
      </PowerProvider>
    </ThemeProvider>
  </StrictMode>,
);
