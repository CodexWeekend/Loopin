import { removeTripStop } from '@/lib/local-db';
import { stopParamsSchema } from '@/lib/local-api-contracts';
import {
  handleRouteError,
  jsonOk,
  parseParams,
  requireSessionUser,
} from '@/lib/api-route';

type StopRouteContext = {
  params: Promise<{
    stopId: string;
    tripId: string;
  }>;
};

export async function DELETE(_request: Request, context: StopRouteContext) {
  const session = await requireSessionUser();

  if ('error' in session) {
    return session.error;
  }

  const params = parseParams(await context.params, stopParamsSchema);

  if ('error' in params) {
    return params.error;
  }

  try {
    return jsonOk({
      trip: removeTripStop(session.userId, params.data.tripId, params.data.stopId),
    });
  } catch (error) {
    return handleRouteError(error, 'remove trip stop');
  }
}
