import { useEffect, useState, type ReactNode } from 'react';
import { getContext, type IContext } from '@microsoft/power-apps/app';
import { Alert, Flex, Spin } from 'antd';
import { PowerContext } from './lib/powerContext';

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
      if (cancelled) return;
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
      <Flex vertical align="center" justify="center" gap={16} style={{ minHeight: '100vh' }}>
        <Spin size="large" />
        <span>Connecting to Power Platform…</span>
      </Flex>
    );
  }

  if (state.status === 'error') {
    return (
      <Flex align="center" justify="center" style={{ minHeight: '100vh', padding: 24 }}>
        <Alert
          type="warning"
          showIcon
          message="Power Platform host unavailable"
          description={state.message}
          style={{ maxWidth: 560 }}
        />
      </Flex>
    );
  }

  return <PowerContext.Provider value={state.context}>{children}</PowerContext.Provider>;
}
