import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useDocumentTitle } from './useDocumentTitle';

describe('useDocumentTitle', () => {
  it('sets and updates the document title', () => {
    const { rerender } = renderHook(({ title }) => useDocumentTitle(title), {
      initialProps: { title: 'Doors' },
    });
    expect(document.title).toBe('Doors · Assortment tool');
    rerender({ title: 'Exceptions' });
    expect(document.title).toBe('Exceptions · Assortment tool');
  });
});
