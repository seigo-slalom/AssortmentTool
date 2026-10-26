import { describe, expect, it } from 'vitest';

// Brand gate (constitution Principle X / Workflow §7): no literal style values outside token.ts.
const SOURCES = import.meta.glob('/src/**/*.{ts,tsx,css}', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

const EXEMPT = [
  /^\/src\/theme\/token\.ts$/,
  /^\/src\/generated\//,
  /^\/src\/test\//,
  /\.test\.tsx?$/,
  /\.testutil\.ts$/,
];

const RULES: readonly { name: string; pattern: RegExp }[] = [
  { name: 'hex color', pattern: /#[0-9a-fA-F]{3,8}\b(?![-\w])/ },
  { name: 'rgb/hsl color', pattern: /\b(?:rgba?|hsla?)\(/ },
  {
    name: 'unit literal',
    pattern: /(?<![\w.-])(?:[1-9]\d*(?:\.\d+)?|0\.\d*[1-9]\d*)(?:px|rem|em|vh|vw|ms|s)\b/,
  },
  { name: 'font-family literal', pattern: /font-?family\s*:(?!\s*(?:var\(|"?\$\{|token\.))/i },
  { name: 'font name', pattern: /ABChanel|Helvetica|Georgia|Arial|Times New Roman/ },
];

export function findViolations(path: string, source: string): string[] {
  const violations: string[] = [];
  source.split('\n').forEach((line, index) => {
    // Import specifiers (e.g. the bundled font file path) are not style values.
    if (/^\s*import\s/.test(line)) return;
    const code = line.replace(/\/\/.*$|\/\*.*?\*\//g, '');
    for (const rule of RULES) {
      if (rule.pattern.test(code)) {
        violations.push(`${path}:${index + 1} ${rule.name}: ${line.trim()}`);
      }
    }
  });
  return violations;
}

describe('no hardcoded style values', () => {
  it('detects each kind of literal', () => {
    expect(findViolations('x.css', 'color: #050505;')).toHaveLength(1);
    expect(findViolations('x.css', 'background: rgba(5, 5, 5, 0.1);')).toHaveLength(1);
    expect(findViolations('x.css', 'padding: 16px;')).toHaveLength(1);
    expect(findViolations('x.css', 'transition: color 0.2s;')).toHaveLength(1);
    expect(findViolations('x.css', "font-family: 'Arial';")).toHaveLength(2);
    expect(findViolations('x.ts', "fontFamily: 'Georgia'")).toHaveLength(2);
  });

  it('allows token variables, unitless zero, keywords and comments', () => {
    expect(findViolations('x.css', 'padding: var(--space-panel) 0;')).toEqual([]);
    expect(findViolations('x.css', 'font-family: var(--font-display);')).toEqual([]);
    expect(findViolations('x.ts', 'font-family: "${family}";')).toEqual([]);
    expect(findViolations('x.tsx', "href={`#${targetId}`} id='main-content'")).toEqual([]);
    expect(findViolations('x.ts', '// 16px in the prototype')).toEqual([]);
    expect(findViolations('x.css', 'min-height: 100dvh;')).toEqual([]);
    expect(findViolations('x.css', 'transition-duration: 0s;')).toEqual([]);
    expect(findViolations('x.ts', 'fontFamily: token.families.text,')).toEqual([]);
    expect(findViolations('x.ts', "import url from './ABChanel.ttf?url';")).toEqual([]);
    expect(findViolations('x.css', 'width: 0.5px;')).toHaveLength(1);
  });

  it('finds no literals in src outside token.ts', () => {
    const files = Object.entries(SOURCES).filter(([path]) => !EXEMPT.some((re) => re.test(path)));
    expect(files.length).toBeGreaterThan(20);
    const violations = files.flatMap(([path, source]) => findViolations(path, source));
    expect(violations).toEqual([]);
  });
});
