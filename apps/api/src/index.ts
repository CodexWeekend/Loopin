import Fastify from 'fastify';

import { createInitialItinerary, createTripRecord } from '@loopin/core';
import { createTripInputSchema, getCityDiscoveryView, type Trip } from '@loopin/shared';

import { registerDiscoveryRoutes } from './modules/discovery/routes';

export const apiWorkspace = {
  milestone: 'vertical-slice',
  name: '@loopin/api',
  purpose: 'backend service foundation for trip creation and itinerary generation',
} as const;

export function createApp() {
  const app = Fastify();
  const tripStore = new Map<string, Trip>();
  let tripCounter = 1;

  app.get('/api/v1/health', async () => ({
    status: 'ok',
  }));

  registerDiscoveryRoutes(app);

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

    const places = getCityDiscoveryView(trip.citySlug)?.places ?? [];

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
