import { act, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getContext } from '@microsoft/power-apps/app';
import { usePowerContext } from './lib/powerContext';
import PowerProvider from './PowerProvider';

vi.mock('@microsoft/power-apps/app', () => ({ getContext: vi.fn() }));

function Consumer() {
  return <p>user: {usePowerContext()?.user.fullName}</p>;
}

const deferred = <T,>() => {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
};

beforeEach(() => {
  vi.mocked(getContext).mockReset();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('PowerProvider', () => {
  it('shows a loading state while connecting', () => {
    vi.mocked(getContext).mockReturnValue(new Promise(() => {}));
    render(
      <PowerProvider>
        <Consumer />
      </PowerProvider>,
    );
    expect(screen.getByText(/Connecting to Power Platform/)).toBeInTheDocument();
  });

  it('renders children with the resolved context', async () => {
    vi.mocked(getContext).mockResolvedValue({ user: { fullName: 'Ada' } } as never);
    render(
      <PowerProvider>
        <Consumer />
      </PowerProvider>,
    );
    expect(await screen.findByText('user: Ada')).toBeInTheDocument();
  });

  it('shows the error message when initialization fails with an Error', async () => {
    vi.mocked(getContext).mockRejectedValue(new Error('host exploded'));
    render(
      <PowerProvider>
        <Consumer />
      </PowerProvider>,
    );
    expect(await screen.findByText('host exploded')).toBeInTheDocument();
    expect(screen.getByText('Power Platform host unavailable')).toBeInTheDocument();
  });

  it('shows a generic message when a non-Error is thrown', async () => {
    vi.mocked(getContext).mockRejectedValue('nope');
    render(
      <PowerProvider>
        <Consumer />
      </PowerProvider>,
    );
    expect(
      await screen.findByText('Failed to initialize the Power Apps host.'),
    ).toBeInTheDocument();
  });

  it('times out when the host never responds', () => {
    vi.useFakeTimers();
    vi.mocked(getContext).mockReturnValue(new Promise(() => {}));
    render(
      <PowerProvider>
        <Consumer />
      </PowerProvider>,
    );
    act(() => {
      vi.advanceTimersByTime(8000);
    });
    expect(screen.getByText(/Timed out initializing the Power Apps host/)).toBeInTheDocument();
  });

  it('ignores a late success after unmount', async () => {
    const pending = deferred<never>();
    vi.mocked(getContext).mockReturnValue(pending.promise);
    const { unmount } = render(
      <PowerProvider>
        <Consumer />
      </PowerProvider>,
    );
    unmount();
    pending.resolve({ user: { fullName: 'Late' } } as never);
    await act(async () => {
      await pending.promise;
    });
    expect(screen.queryByText('user: Late')).not.toBeInTheDocument();
  });

  it('ignores a late failure after unmount', async () => {
    const pending = deferred<never>();
    vi.mocked(getContext).mockReturnValue(pending.promise);
    const { unmount } = render(
      <PowerProvider>
        <Consumer />
      </PowerProvider>,
    );
    unmount();
    pending.reject(new Error('late'));
    await act(async () => {
      await pending.promise.catch(() => undefined);
    });
    expect(screen.queryByText('late')).not.toBeInTheDocument();
  });
});
