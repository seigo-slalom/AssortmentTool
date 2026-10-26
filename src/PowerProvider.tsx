import { useEffect, useState, type ReactNode } from 'react';
import { getContext, type IContext } from '@microsoft/power-apps/app';
import { RegionState } from './components/RegionState';
import { PowerContext } from './lib/powerContext';
import styles from './PowerProvider.module.css';

type InitState =
  | { status: 'loading' }
  | { status: 'ready'; context: IContext }
  | { status: 'error'; message: string };

// Surfaces guidance when the app is opened outside the Power Apps host (e.g. plain localhost).
const INIT_TIMEOUT_MS = 8000;

export default function PowerProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<InitState>({ status: 'loading' });

  useEffect(() => {
    let cancelled = false;
    const timeout = setTimeout(() => {
      setState({
        status: 'error',
        message:
          'Timed out initializing the Power Apps host. Open the app via the Local Play URL printed by "npm run dev", using the same browser profile as your Power Platform tenant.',
      });
    }, INIT_TIMEOUT_MS);

    getContext()
      .then((context) => {
        if (cancelled) return;
        clearTimeout(timeout);
        setState({ status: 'ready', context });
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        clearTimeout(timeout);
        setState({
          status: 'error',
          message:
            error instanceof Error ? error.message : 'Failed to initialize the Power Apps host.',
        });
      });

    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, []);

  if (state.status === 'loading') {
    return (
      <div className={styles.host}>
        <RegionState state="loading" rows={3} description="Connecting to Power Platform…" />
      </div>
    );
  }

  if (state.status === 'error') {
    return (
      <div className={styles.host}>
        <RegionState
          state="error"
          title="Power Platform host unavailable"
          description={state.message}
        />
      </div>
    );
  }

  return <PowerContext.Provider value={state.context}>{children}</PowerContext.Provider>;
}
