import { describe, expect, test } from 'vitest';

import * as shared from '../src/index';

describe('nearby recommendation query schema', () => {
  test('parses a valid nearby recommendation query', () => {
    expect('nearbyRecommendationsQuerySchema' in shared).toBe(true);

    const schema = (shared as Record<string, unknown>).nearbyRecommendationsQuerySchema as {
      safeParse: (value: unknown) => { success: boolean };
    };

    expect(
      schema.safeParse({
        category: 'food',
        lat: '35.68',
        lng: '139.70',
        minutesAvailable: '60',
      }).success,
    ).toBe(true);
  });

  test('rejects a nearby recommendation query without coordinates', () => {
    expect('nearbyRecommendationsQuerySchema' in shared).toBe(true);

    const schema = (shared as Record<string, unknown>).nearbyRecommendationsQuerySchema as {
      safeParse: (value: unknown) => { success: boolean };
    };

    expect(
      schema.safeParse({
        minutesAvailable: '60',
      }).success,
    ).toBe(false);
  });
});
