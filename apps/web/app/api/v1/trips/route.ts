import {
  createTripRequestSchema,
} from '@/lib/local-api-contracts';
import { createTrip, listTripsForUser } from '@/lib/local-db';
import {
  handleRouteError,
  jsonOk,
  parseJsonBody,
  requireSessionUser,
} from '@/lib/api-route';

export async function GET() {
  const session = await requireSessionUser();

  if ('error' in session) {
    return session.error;
  }

  try {
    return jsonOk({
      trips: listTripsForUser(session.userId),
    });
  } catch (error) {
    return handleRouteError(error, 'list trips');
  }
}

export async function POST(request: Request) {
  const session = await requireSessionUser();

  if ('error' in session) {
    return session.error;
  }

  const body = await parseJsonBody(request, createTripRequestSchema);

  if ('error' in body) {
    return body.error;
  }

  try {
    return jsonOk(
      {
        trip: createTrip(session.userId, body.data),
      },
      201,
    );
  } catch (error) {
    return handleRouteError(error, 'create trip');
  }
}
