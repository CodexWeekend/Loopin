import { tripIdParamsSchema } from '@/lib/local-api-contracts';
import { regenerateTripItinerary } from '@/lib/local-db';
import {
  handleRouteError,
  jsonOk,
  parseParams,
  requireSessionUser,
} from '@/lib/api-route';

type TripRouteContext = {
  params: Promise<{
    tripId: string;
  }>;
};

export async function POST(_request: Request, context: TripRouteContext) {
  const session = await requireSessionUser();

  if ('error' in session) {
    return session.error;
  }

  const params = parseParams(await context.params, tripIdParamsSchema);

  if ('error' in params) {
    return params.error;
  }

  try {
    return jsonOk({
      trip: regenerateTripItinerary(params.data.tripId, session.userId),
    });
  } catch (error) {
    return handleRouteError(error, 'generate itinerary');
  }
}
