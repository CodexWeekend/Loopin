import { stopParamsSchema, swapStopRequestSchema } from '@/lib/local-api-contracts';
import { skipTripStop } from '@/lib/local-db';
import {
  handleRouteError,
  jsonOk,
  parseJsonBody,
  parseParams,
  requireSessionUser,
} from '@/lib/api-route';

type StopRouteContext = {
  params: Promise<{
    stopId: string;
    tripId: string;
  }>;
};

export async function POST(request: Request, context: StopRouteContext) {
  const session = await requireSessionUser();

  if ('error' in session) {
    return session.error;
  }

  const params = parseParams(await context.params, stopParamsSchema);

  if ('error' in params) {
    return params.error;
  }

  const body = await parseJsonBody(request, swapStopRequestSchema);

  if ('error' in body) {
    return body.error;
  }

  try {
    return jsonOk(skipTripStop(session.userId, params.data.tripId, params.data.stopId, body.data));
  } catch (error) {
    return handleRouteError(error, 'skip trip stop');
  }
}
