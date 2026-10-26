const FOCUSABLE = 'a[href], button:not([disabled]), [tabindex="0"]';

/**
 * Keeps Tab / Shift+Tab cycling inside `container` by wrapping from the last focusable
 * element to the first and back. Returns true when it moved focus.
 */
export function wrapFocus(container: HTMLElement | null, event: KeyboardEvent): boolean {
  if (event.key !== 'Tab' || !container) return false;
  const focusables = Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE));
  if (focusables.length === 0) return false;
  const first = focusables[0];
  const last = focusables[focusables.length - 1];
  const active = document.activeElement;
  const outside = !container.contains(active);
  if (event.shiftKey && (active === first || outside)) {
    event.preventDefault();
    last.focus();
    return true;
  }
  if (!event.shiftKey && (active === last || outside)) {
    event.preventDefault();
    first.focus();
    return true;
  }
  return false;
}
