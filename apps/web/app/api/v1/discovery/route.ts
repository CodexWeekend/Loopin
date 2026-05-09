import { discoveryQuerySchema } from '@/lib/local-api-contracts';
import { getDiscoveryState } from '@/lib/local-db';
import {
  handleRouteError,
  jsonOk,
  parseQuery,
} from '@/lib/api-route';

export async function GET(request: Request) {
  const query = parseQuery(request, discoveryQuerySchema);

  if ('error' in query) {
    return query.error;
  }

  try {
    return jsonOk(getDiscoveryState(query.data));
  } catch (error) {
    return handleRouteError(error, 'load discovery state');
  }
}
