import type { FastifyInstance } from 'fastify';

import { buildCityOverview, filterCityPlaces } from '@loopin/core';
import { cityPlacesQuerySchema } from '@loopin/shared';

import { createDiscoveryRepository } from './repository';

export function registerDiscoveryRoutes(app: FastifyInstance) {
  const repository = createDiscoveryRepository();

  app.get('/api/v1/cities/:citySlug', async (request, reply) => {
    const { citySlug } = request.params as { citySlug: string };
    const cityView = repository.getCity(citySlug);

    if (!cityView) {
      return reply.status(404).send({
        error: {
          code: 'city_not_found',
          message: 'City not found.',
        },
      });
    }

    return {
      overview: buildCityOverview(cityView),
    };
  });

  app.get('/api/v1/cities/:citySlug/places', async (request, reply) => {
    const { citySlug } = request.params as { citySlug: string };
    const parsedQuery = cityPlacesQuerySchema.safeParse(request.query);

    if (!parsedQuery.success) {
      return reply.status(400).send({
        error: {
          code: 'invalid_city_places_query',
          message: 'City places query did not match the expected shape.',
        },
      });
    }

    const cityView = repository.getCity(citySlug);

    if (!cityView) {
      return reply.status(404).send({
        error: {
          code: 'city_not_found',
          message: 'City not found.',
        },
      });
    }

    const filteredPlaces = filterCityPlaces({
      filters: parsedQuery.data,
      places: cityView.places,
    });
    const startIndex = (parsedQuery.data.page - 1) * parsedQuery.data.pageSize;
    const pagedPlaces = filteredPlaces.slice(startIndex, startIndex + parsedQuery.data.pageSize);

    return {
      pagination: {
        page: parsedQuery.data.page,
        pageSize: parsedQuery.data.pageSize,
        total: filteredPlaces.length,
      },
      places: pagedPlaces,
    };
  });
}
