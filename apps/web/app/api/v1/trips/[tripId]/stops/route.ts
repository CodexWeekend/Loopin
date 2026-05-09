import { addStopRequestSchema, tripIdParamsSchema } from '@/lib/local-api-contracts';
import { addTripStop } from '@/lib/local-db';
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

export async function POST(request: Request, context: TripRouteContext) {
  const session = await requireSessionUser();

  if ('error' in session) {
    return session.error;
  }

  const params = parseParams(await context.params, tripIdParamsSchema);

  if ('error' in params) {
    return params.error;
  }

  const body = await parseJsonBody(request, addStopRequestSchema);

  if ('error' in body) {
    return body.error;
  }

  try {
    return jsonOk({
      trip: addTripStop(session.userId, params.data.tripId, body.data),
    });
  } catch (error) {
    return handleRouteError(error, 'add trip stop');
  }
}
