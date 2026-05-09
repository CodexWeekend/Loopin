import { socialQuerySchema } from '@/lib/local-api-contracts';
import { getSocialState } from '@/lib/local-db';
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

  const query = parseQuery(request, socialQuerySchema);

  if ('error' in query) {
    return query.error;
  }

  try {
    return jsonOk(getSocialState(query.data, session.userId));
  } catch (error) {
    return handleRouteError(error, 'load social state');
  }
}
