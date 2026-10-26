import { useEffect } from 'react';
import { documentTitle } from '../lib/screens';

/** Sets the browser title to "<title> · Assortment tool" (FR-013). */
export function useDocumentTitle(title: string): void {
  useEffect(() => {
    document.title = documentTitle(title);
  }, [title]);
}
