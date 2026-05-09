import {
  createConnectionSchema,
  socialQuerySchema,
  updateConnectionSchema,
} from '@/lib/local-api-contracts';
import {
  createConnection,
  getSocialState,
  updateConnection,
} from '@/lib/local-db';
import {
  handleRouteError,
  jsonOk,
  parseJsonBody,
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
    return jsonOk({
      connections: getSocialState(query.data, session.userId).connections,
    });
  } catch (error) {
    return handleRouteError(error, 'load connections');
  }
}

export async function POST(request: Request) {
  const session = await requireSessionUser();

  if ('error' in session) {
    return session.error;
  }

  const body = await parseJsonBody(request, createConnectionSchema);

  if ('error' in body) {
    return body.error;
  }

  try {
    return jsonOk(
      {
        connections: createConnection(session.userId, body.data),
      },
      201,
    );
  } catch (error) {
    return handleRouteError(error, 'create connection');
  }
}

export async function PATCH(request: Request) {
  const session = await requireSessionUser();

  if ('error' in session) {
    return session.error;
  }

  const body = await parseJsonBody(request, updateConnectionSchema);

  if ('error' in body) {
    return body.error;
  }

  try {
    return jsonOk({
      connections: updateConnection(session.userId, body.data),
    });
  } catch (error) {
    return handleRouteError(error, 'update connection');
  }
}
