import { tripIdParamsSchema, updateTripRequestSchema } from '@/lib/local-api-contracts';
import { getTripById, updateTrip } from '@/lib/local-db';
import {
  handleRouteError,
  jsonOk,
  parseJsonBody,
  parseParams,
  requireSessionUser,
} from '@/lib/api-route';

type TripRouteContext = {
  params: Promise<{
    tripId: string;
  }>;
};

export async function GET(_request: Request, context: TripRouteContext) {
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
      trip: getTripById(params.data.tripId, session.userId),
    });
  } catch (error) {
    return handleRouteError(error, 'load trip');
  }
}

export async function PATCH(request: Request, context: TripRouteContext) {
  const session = await requireSessionUser();

  if ('error' in session) {
    return session.error;
  }

  const params = parseParams(await context.params, tripIdParamsSchema);

  if ('error' in params) {
    return params.error;
  }

  const body = await parseJsonBody(request, updateTripRequestSchema);

  if ('error' in body) {
    return body.error;
  }

  try {
    return jsonOk({
      trip: updateTrip(session.userId, params.data.tripId, body.data),
    });
  } catch (error) {
    return handleRouteError(error, 'update trip');
  }
}
