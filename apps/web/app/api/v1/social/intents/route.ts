import { createIntentSchema } from '@/lib/local-api-contracts';
import { createIntent } from '@/lib/local-db';
import {
  handleRouteError,
  jsonOk,
  parseJsonBody,
  requireSessionUser,
} from '@/lib/api-route';

export async function POST(request: Request) {
  const session = await requireSessionUser();

  if ('error' in session) {
    return session.error;
  }

  const body = await parseJsonBody(request, createIntentSchema);

  if ('error' in body) {
    return body.error;
  }

  try {
    return jsonOk(
      {
        social: createIntent(session.userId, body.data),
      },
      201,
    );
  } catch (error) {
    return handleRouteError(error, 'create social intent');
  }
}
