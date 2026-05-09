import { nearbyQuerySchema } from '@/lib/local-api-contracts';
import { getNearbyState } from '@/lib/local-db';
import {
  handleRouteError,
  jsonOk,
  parseQuery,
  requireSessionUser,
} from '@/lib/api-route';

export async function GET(request: Request) {
  const query = parseQuery(request, nearbyQuerySchema);

  if ('error' in query) {
    return query.error;
  }

  const session = await requireSessionUser();

  try {
    return jsonOk(
      getNearbyState(
        query.data,
        'error' in session ? undefined : session.userId,
      ),
    );
  } catch (error) {
    return handleRouteError(error, 'load nearby recommendations');
  }
}
