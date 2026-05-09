import { describe, expect, test } from 'vitest';

import { buildDemoPlannerState } from '../src/features/trip-planner/api/trip-planner-client';

describe('mobile trip shell', () => {
  test('builds the trip shell state from the planner client', async () => {
    const state = await buildDemoPlannerState();

    expect(state.trip.citySlug).toBe('tokyo');
    expect(state.itinerary.dayPlans.length).toBeGreaterThan(0);
    expect(state.itinerary.dayPlans[0]?.stops.length).toBeGreaterThan(0);
  });
});
