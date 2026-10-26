import '@testing-library/jest-dom';
import { afterEach } from 'vitest';
import { installMatchMedia, resetViewport } from './matchMedia';

// jsdom has no matchMedia (needed by useLayoutTier and Ant Design); default to standard tier.
installMatchMedia();

afterEach(() => {
  resetViewport();
});
