import { afterEach, describe, expect, test } from 'vitest';

import * as api from '../src/index';

type ApiTestApp = {
  close: () => Promise<void>;
  inject: (value: {
    method: string;
    payload?: unknown;
    query?: Record<string, string>;
    url: string;
  }) => Promise<{ json: () => unknown; statusCode: number }>;
};

describe('discovery routes', () => {
  let app: ApiTestApp | undefined;

  afterEach(async () => {
    await app?.close();
  });

  test('returns a city overview and filtered places for a supported city', async () => {
    expect(typeof (api as Record<string, unknown>).createApp).toBe('function');

    app = ((api as Record<string, unknown>).createApp as () => ApiTestApp)();

    const overviewResponse = await app.inject({
      method: 'GET',
      url: '/api/v1/cities/tokyo',
    });

    expect(overviewResponse.statusCode).toBe(200);

    const overviewPayload = overviewResponse.json() as {
      overview: {
        hiddenGemCount: number;
        neighborhoods: Array<{ name: string }>;
      };
    };

    expect(overviewPayload.overview.hiddenGemCount).toBeGreaterThan(0);
    expect(overviewPayload.overview.neighborhoods.length).toBeGreaterThan(0);

    const placesResponse = await app.inject({
      method: 'GET',
      query: {
        budget: 'low',
        category: 'food',
      },
      url: '/api/v1/cities/tokyo/places',
    });

    expect(placesResponse.statusCode).toBe(200);

    const placesPayload = placesResponse.json() as {
      places: Array<{ category: string; costLevel: number }>;
    };

    expect(placesPayload.places.length).toBeGreaterThan(0);
    expect(placesPayload.places.every((place) => place.category === 'food')).toBe(true);
    expect(placesPayload.places.every((place) => place.costLevel <= 1)).toBe(true);
  });

  test('returns 404 for an unknown city and 400 for invalid discovery filters', async () => {
    app = ((api as Record<string, unknown>).createApp as () => ApiTestApp)();

    const missingCityResponse = await app.inject({
      method: 'GET',
      url: '/api/v1/cities/unknown-city',
    });

    expect(missingCityResponse.statusCode).toBe(404);

    const invalidQueryResponse = await app.inject({
      method: 'GET',
      query: {
        hiddenness: 'mystery-mode',
      },
      url: '/api/v1/cities/tokyo/places',
    });

    expect(invalidQueryResponse.statusCode).toBe(400);
  });
});
