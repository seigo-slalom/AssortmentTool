import { afterEach, describe, expect, it } from 'vitest';
import { wrapFocus } from './focusWrap';

const setup = () => {
  document.body.innerHTML = `
    <button id="outside">outside</button>
    <div id="panel">
      <button id="first">first</button>
      <a id="middle" href="#x">middle</a>
      <button id="last">last</button>
    </div>
    <div id="empty"><span>nothing</span></div>`;
  return document.getElementById('panel')!;
};

const tab = (shiftKey = false) =>
  new KeyboardEvent('keydown', { key: 'Tab', shiftKey, cancelable: true });
const focus = (id: string) => document.getElementById(id)!.focus();

afterEach(() => {
  document.body.innerHTML = '';
});

describe('wrapFocus', () => {
  it('wraps Tab from the last element to the first', () => {
    const panel = setup();
    focus('last');
    const event = tab();
    expect(wrapFocus(panel, event)).toBe(true);
    expect(event.defaultPrevented).toBe(true);
    expect(document.activeElement?.id).toBe('first');
  });

  it('wraps Shift+Tab from the first element to the last', () => {
    const panel = setup();
    focus('first');
    expect(wrapFocus(panel, tab(true))).toBe(true);
    expect(document.activeElement?.id).toBe('last');
  });

  it('pulls focus back in when it escaped the container', () => {
    const panel = setup();
    focus('outside');
    expect(wrapFocus(panel, tab())).toBe(true);
    expect(document.activeElement?.id).toBe('first');
    focus('outside');
    expect(wrapFocus(panel, tab(true))).toBe(true);
    expect(document.activeElement?.id).toBe('last');
  });

  it('leaves focus alone in the middle of the container', () => {
    const panel = setup();
    focus('middle');
    expect(wrapFocus(panel, tab())).toBe(false);
    expect(wrapFocus(panel, tab(true))).toBe(false);
    expect(document.activeElement?.id).toBe('middle');
  });

  it('ignores other keys, missing containers and containers without focusables', () => {
    const panel = setup();
    expect(wrapFocus(panel, new KeyboardEvent('keydown', { key: 'Enter' }))).toBe(false);
    expect(wrapFocus(null, tab())).toBe(false);
    expect(wrapFocus(document.getElementById('empty'), tab())).toBe(false);
  });
});
