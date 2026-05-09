import { profileUpdateSchema } from '@/lib/local-api-contracts';
import { getAppUser, getProfile, listTripsForUser, updateProfile } from '@/lib/local-db';
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
      profile: getProfile(session.userId),
      trips: listTripsForUser(session.userId),
      user: getAppUser(session.userId),
    });
  } catch (error) {
    return handleRouteError(error, 'load profile');
  }
}

export async function PATCH(request: Request) {
  const session = await requireSessionUser();

  if ('error' in session) {
    return session.error;
  }

  const body = await parseJsonBody(request, profileUpdateSchema);

  if ('error' in body) {
    return body.error;
  }

  try {
    return jsonOk(updateProfile(session.userId, body.data));
  } catch (error) {
    return handleRouteError(error, 'update profile');
  }
}
