import '@testing-library/jest-dom';
import { afterEach } from 'vitest';
import { installMatchMedia, resetViewport } from './matchMedia';

// jsdom has no matchMedia (needed by useLayoutTier and Ant Design); default to standard tier.
installMatchMedia();

// jsdom has no ResizeObserver (Ant Design Table, Popconfirm and Select observe their size).
class ResizeObserverStub {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
}
globalThis.ResizeObserver ??= ResizeObserverStub as unknown as typeof ResizeObserver;

afterEach(() => {
  resetViewport();
});
