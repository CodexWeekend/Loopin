import { presenceUpdateSchema } from '@/lib/local-api-contracts';
import { updatePresence } from '@/lib/local-db';
import {
  handleRouteError,
  jsonOk,
  parseJsonBody,
  requireSessionUser,
} from '@/lib/api-route';

export async function PATCH(request: Request) {
  const session = await requireSessionUser();

  if ('error' in session) {
    return session.error;
  }

  const body = await parseJsonBody(request, presenceUpdateSchema);

  if ('error' in body) {
    return body.error;
  }

  try {
    return jsonOk({
      presence: updatePresence(session.userId, body.data),
    });
  } catch (error) {
    return handleRouteError(error, 'update social presence');
  }
}
