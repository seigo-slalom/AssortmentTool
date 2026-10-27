import { describe, expect, it } from 'vitest';
import { fmt, plural, signed } from './format';

describe('format', () => {
  it('formats numbers, plurals and signed deltas', () => {
    expect(fmt(1234)).toBe('1,234');
    expect(fmt(Number.NaN)).toBe('0');
    expect(plural(1, 'door', 'doors')).toBe('1 door');
    expect(plural(2500, 'door', 'doors')).toBe('2,500 doors');
    expect(signed(3)).toBe('+3');
    expect(signed(-2)).toBe('−2');
    expect(signed(0)).toBe('0');
  });
});
