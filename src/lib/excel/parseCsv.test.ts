import { describe, expect, it } from 'vitest';
import { parseCsv } from './parseCsv';

describe('parseCsv', () => {
  it('parses simple rows with CRLF or LF and no trailing newline', () => {
    expect(parseCsv('a,b\r\n1,2\n3,4')).toEqual([
      ['a', 'b'],
      ['1', '2'],
      ['3', '4'],
    ]);
  });

  it('handles quotes, escaped quotes, commas and newlines inside quotes', () => {
    expect(parseCsv('name,note\n"Macy\'s, NY","He said ""hi""\nthen left"\n')).toEqual([
      ['name', 'note'],
      ["Macy's, NY", 'He said "hi"\nthen left'],
    ]);
  });

  it('strips a BOM, keeps empty fields and ignores a trailing newline', () => {
    expect(parseCsv('\uFEFFa,,c\r\n,,\r\n')).toEqual([
      ['a', '', 'c'],
      ['', '', ''],
    ]);
    expect(parseCsv('')).toEqual([]);
    expect(parseCsv('x,')).toEqual([['x', '']]);
    expect(parseCsv('a\rb')).toEqual([['a'], ['b']]);
  });
});
