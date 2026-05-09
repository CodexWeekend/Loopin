import { describe, expect, test } from 'vitest';

import * as core from '../src/index';

describe('nearby recommendations', () => {
  test('ranks nearby places by time fit and proximity', () => {
    expect(typeof (core as Record<string, unknown>).rankNearbyPlaces).toBe('function');

    const places = ((core as Record<string, unknown>).rankNearbyPlaces as (value: unknown) => Array<{
      id: string;
      score: number;
    }>)({
      category: 'food',
      minutesAvailable: 60,
      origin: {
        lat: 35.644,
        lng: 139.699,
      },
      places: [
        {
          category: 'food',
          hiddennessLabel: 'Hidden',
          id: 'nearby-food',
          lat: 35.643,
          lng: 139.6998,
          popularityScore: 0.58,
          visitDurationMinutes: 35,
        },
        {
          category: 'food',
          hiddennessLabel: 'Balanced',
          id: 'farther-food',
          lat: 35.7148,
          lng: 139.7967,
          popularityScore: 0.98,
          visitDurationMinutes: 120,
        },
      ],
    });

    expect(places[0]?.id).toBe('nearby-food');
    expect(places[0]?.score).toBeGreaterThan(places[1]?.score ?? 0);
  });
});
