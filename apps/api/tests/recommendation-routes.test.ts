import { afterEach, describe, expect, test } from 'vitest';

import * as api from '../src/index';

type ApiTestApp = {
  close: () => Promise<void>;
  inject: (value: {
    method: string;
    query?: Record<string, string>;
    url: string;
  }) => Promise<{ json: () => unknown; statusCode: number }>;
};

describe('nearby recommendation routes', () => {
  let app: ApiTestApp | undefined;

  afterEach(async () => {
    await app?.close();
  });

  test('returns nearby recommendations for a supported city and valid query', async () => {
    app = ((api as Record<string, unknown>).createApp as () => ApiTestApp)();

    const response = await app.inject({
      method: 'GET',
      query: {
        category: 'food',
        lat: '35.644',
        lng: '139.699',
        minutesAvailable: '60',
      },
      url: '/api/v1/cities/tokyo/recommendations/nearby',
    });

    expect(response.statusCode).toBe(200);

    const payload = response.json() as {
      recommendations: Array<{ id: string }>;
    };

    expect(payload.recommendations.length).toBeGreaterThan(0);
    expect(payload.recommendations[0]?.id).toBe('tokyo-bakery-sasaki');
  });
});
