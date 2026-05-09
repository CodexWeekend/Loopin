import { describe, expect, test } from 'vitest';

import { semanticColors, spacingScale } from '../src/index';

describe('design-system scaffold', () => {
  test('exports shared spacing and semantic colors', () => {
    expect(spacingScale.at(-1)).toBe(64);
    expect(semanticColors.ink).toBe('#14213D');
  });
});
