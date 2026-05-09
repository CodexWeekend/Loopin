import { describe, expect, test } from 'vitest';

import * as core from '../src/index';

describe('trip planning foundation', () => {
  test('creates a naive itinerary that assigns each place exactly once across trip days', () => {
    expect(typeof (core as Record<string, unknown>).createInitialItinerary).toBe('function');

    const itinerary = (
      (core as Record<string, unknown>).createInitialItinerary as (value: unknown) => {
        dayPlans: Array<{ date: string; stops: Array<{ placeId: string }> }>;
      }
    )({
      places: [
        {
          costLevel: 2,
          id: 'place-1',
          lat: 35.6762,
          lng: 139.6503,
          name: 'Tsukiji Outer Market',
          visitDurationMinutes: 90,
        },
        {
          costLevel: 3,
          id: 'place-2',
          lat: 35.7101,
          lng: 139.8107,
          name: 'Senso-ji',
          visitDurationMinutes: 120,
        },
        {
          costLevel: 1,
          id: 'place-3',
          lat: 35.6895,
          lng: 139.6917,
          name: 'Shinjuku Gyoen',
          visitDurationMinutes: 90,
        },
      ],
      trip: {
        endDate: '2026-10-02',
        id: 'trip-1',
        startDate: '2026-10-01',
      },
    });

    expect(itinerary.dayPlans).toHaveLength(2);
    expect(itinerary.dayPlans.flatMap((dayPlan) => dayPlan.stops.map((stop) => stop.placeId))).toEqual([
      'place-1',
      'place-2',
      'place-3',
    ]);
  });
});
