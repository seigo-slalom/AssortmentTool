import { describe, expect, it } from 'vitest';
import { statusCategory, statusTone } from './status';

describe('door status', () => {
  it.each([
    ['Open', 'open', 'success'],
    [' pre-trade ', 'pre-trade', 'info'],
    ['Project (MTP)', 'project', 'neutral'],
    ['PROJECT', 'project', 'neutral'],
    ['Closed', 'closed', 'unavailable'],
    ['cancelled', 'closed', 'unavailable'],
    ['Relocating', 'other', 'neutral'],
    [undefined, 'other', 'neutral'],
  ] as const)('%s → %s (%s)', (text, category, tone) => {
    expect(statusCategory(text)).toBe(category);
    expect(statusTone(statusCategory(text))).toBe(tone);
  });
});
