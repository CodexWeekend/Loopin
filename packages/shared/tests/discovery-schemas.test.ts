import { describe, expect, test } from 'vitest';

import * as shared from '../src/index';

describe('shared discovery schemas', () => {
  test('parses a valid city places query', () => {
    expect('cityPlacesQuerySchema' in shared).toBe(true);

    const schema = (shared as Record<string, unknown>).cityPlacesQuerySchema as {
      safeParse: (value: unknown) => { success: boolean };
    };

    expect(
      schema.safeParse({
        budget: 'low',
        category: 'food',
        hiddenness: 'hidden',
      }).success,
    ).toBe(true);
  });

  test('rejects an invalid hiddenness query value', () => {
    expect('cityPlacesQuerySchema' in shared).toBe(true);

    const schema = (shared as Record<string, unknown>).cityPlacesQuerySchema as {
      safeParse: (value: unknown) => { success: boolean };
    };

    expect(
      schema.safeParse({
        hiddenness: 'mystery-mode',
      }).success,
    ).toBe(false);
  });
});
