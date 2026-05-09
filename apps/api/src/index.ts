import Fastify from 'fastify';

import { createInitialItinerary, createTripRecord } from '@loopin/core';
import { createTripInputSchema, type Place, type Trip } from '@loopin/shared';

export const apiWorkspace = {
  milestone: 'vertical-slice',
  name: '@loopin/api',
  purpose: 'backend service foundation for trip creation and itinerary generation',
} as const;

const seedPlacesByCity: Record<string, Place[]> = {
  tokyo: [
    {
      category: 'food',
      citySlug: 'tokyo',
      costLevel: 2,
      hiddennessLabel: 'Balanced',
      hiddennessScore: 0.5,
      id: 'tokyo-tsukiji',
      lat: 35.6655,
      lng: 139.7708,
      name: 'Tsukiji Outer Market',
      popularityScore: 0.9,
      visitDurationMinutes: 90,
    },
    {
      category: 'landmark',
      citySlug: 'tokyo',
      costLevel: 1,
      hiddennessLabel: 'Touristy',
      hiddennessScore: 0.2,
      id: 'tokyo-sensoji',
      lat: 35.7148,
      lng: 139.7967,
      name: 'Senso-ji',
      popularityScore: 0.98,
      visitDurationMinutes: 120,
    },
    {
      category: 'park',
      citySlug: 'tokyo',
      costLevel: 1,
      hiddennessLabel: 'Balanced',
      hiddennessScore: 0.45,
      id: 'tokyo-shinjuku-gyoen',
      lat: 35.6852,
      lng: 139.7101,
      name: 'Shinjuku Gyoen',
      popularityScore: 0.82,
      visitDurationMinutes: 90,
    },
  ],
};

export function createApp() {
  const app = Fastify();
  const tripStore = new Map<string, Trip>();
  let tripCounter = 1;

  app.get('/api/v1/health', async () => ({
    status: 'ok',
  }));

  app.post('/api/v1/trips', async (request, reply) => {
    const parsed = createTripInputSchema.safeParse(request.body);

    if (!parsed.success) {
      return reply.status(400).send({
        error: {
          code: 'invalid_trip_input',
          message: 'Trip input did not match the expected shape.',
        },
      });
    }

    const trip = createTripRecord(parsed.data, `trip-${tripCounter}`);
    tripCounter += 1;
    tripStore.set(trip.id, trip);

    return reply.status(201).send({ trip });
  });

  app.get('/api/v1/trips/:tripId', async (request, reply) => {
    const { tripId } = request.params as { tripId: string };
    const trip = tripStore.get(tripId);

    if (!trip) {
      return reply.status(404).send({
        error: {
          code: 'trip_not_found',
          message: 'Trip not found.',
        },
      });
    }

    return { trip };
  });

  app.post('/api/v1/trips/:tripId/itinerary/generate', async (request, reply) => {
    const { tripId } = request.params as { tripId: string };
    const trip = tripStore.get(tripId);

    if (!trip) {
      return reply.status(404).send({
        error: {
          code: 'trip_not_found',
          message: 'Trip not found.',
        },
      });
    }

    const places = seedPlacesByCity[trip.citySlug] ?? [];

    const itinerary = createInitialItinerary({
      places,
      trip,
    });

    return {
      itinerary,
      trip,
    };
  });

  return app;
}
