import { afterEach, describe, expect, test } from 'vitest';

import * as api from '../src/index';

type ApiTestApp = {
  close: () => Promise<void>;
  inject: (value: {
    method: string;
    payload?: unknown;
    url: string;
  }) => Promise<{ json: () => unknown; statusCode: number }>;
};

describe('trip routes', () => {
  let app: ApiTestApp | undefined;

  afterEach(async () => {
    await app?.close?.();
  });

  test('creates a trip, fetches it, and generates a naive itinerary', async () => {
    expect(typeof (api as Record<string, unknown>).createApp).toBe('function');

    app = ((api as Record<string, unknown>).createApp as () => ApiTestApp)();

    const createResponse = await app.inject({
      method: 'POST',
      payload: {
        citySlug: 'tokyo',
        endDate: '2026-10-02',
        partySize: 2,
        preferences: {
          budget: 'medium',
          hiddenGemPreference: 'mixed',
          interests: ['food', 'culture'],
          pace: 'balanced',
        },
        startDate: '2026-10-01',
      },
      url: '/api/v1/trips',
    });

    expect(createResponse.statusCode).toBe(201);

    const createdTrip = createResponse.json() as { trip: { id: string } };

    const getResponse = await app.inject({
      method: 'GET',
      url: `/api/v1/trips/${createdTrip.trip.id}`,
    });

    expect(getResponse.statusCode).toBe(200);

    const itineraryResponse = await app.inject({
      method: 'POST',
      url: `/api/v1/trips/${createdTrip.trip.id}/itinerary/generate`,
    });

    expect(itineraryResponse.statusCode).toBe(200);

    const itineraryPayload = itineraryResponse.json() as {
      itinerary: {
        dayPlans: Array<{ stops: Array<{ placeId: string }> }>;
      };
    };

    expect(itineraryPayload.itinerary.dayPlans.length).toBeGreaterThan(0);
    expect(itineraryPayload.itinerary.dayPlans[0]?.stops.length).toBeGreaterThan(0);
  });
});
