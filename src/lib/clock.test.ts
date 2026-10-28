import { afterEach, describe, expect, it, vi } from 'vitest';
import { E2E_DEFAULT_TODAY, resetClock, setClockForTests, today, todayIso } from './clock';

afterEach(() => {
  resetClock();
  vi.unstubAllEnvs();
  window.history.replaceState(null, '', '/');
});

describe('clock', () => {
  it('defaults to the real date at local midnight', () => {
    const real = new Date();
    const t = today();
    expect([t.getFullYear(), t.getMonth(), t.getDate()]).toEqual([
      real.getFullYear(),
      real.getMonth(),
      real.getDate(),
    ]);
    expect([t.getHours(), t.getMinutes()]).toEqual([0, 0]);
  });

  it('can be overridden and reset', () => {
    setClockForTests(() => new Date(2026, 0, 5, 15, 30));
    expect(todayIso()).toBe('2026-01-05');
    expect(today().getHours()).toBe(0);
    resetClock();
    expect(todayIso()).not.toBe('2026-01-05');
  });

  it('uses the fixture date in e2e mode, or a valid ?today= parameter', () => {
    vi.stubEnv('MODE', 'e2e');
    expect(todayIso()).toBe(E2E_DEFAULT_TODAY);
    window.history.replaceState(null, '', '/?today=2025-12-31');
    expect(todayIso()).toBe('2025-12-31');
    window.history.replaceState(null, '', '/?today=garbage');
    expect(todayIso()).toBe(E2E_DEFAULT_TODAY);
  });
});
