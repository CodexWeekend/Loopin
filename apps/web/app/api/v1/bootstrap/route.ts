import { bootstrapQuerySchema } from '@/lib/local-api-contracts';
import { getAppBootstrapState } from '@/lib/local-db';
import {
  handleRouteError,
  jsonOk,
  parseQuery,
  requireSessionUser,
} from '@/lib/api-route';

export async function GET(request: Request) {
  const session = await requireSessionUser();

  if ('error' in session) {
    return session.error;
  }

  const query = parseQuery(request, bootstrapQuerySchema);

  if ('error' in query) {
    return query.error;
  }

  try {
    return jsonOk(getAppBootstrapState(session.userId, query.data.cityId));
  } catch (error) {
    return handleRouteError(error, 'load bootstrap state');
  }
}
