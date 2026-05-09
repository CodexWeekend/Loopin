import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';

import { authOptions } from '@/auth';

type ApiErrorPayload = {
  error: {
    code: string;
    details?: unknown;
    message: string;
  };
};

export function jsonOk<T>(payload: T, status = 200) {
  return NextResponse.json(payload, { status });
}

export function jsonError(
  status: number,
  code: string,
  message: string,
  details?: unknown,
) {
  return NextResponse.json<ApiErrorPayload>(
    {
      error: {
        code,
        details,
        message,
      },
    },
    { status },
  );
}

export async function requireSessionUser() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return {
      error: jsonError(401, 'unauthorized', 'Authentication required.'),
    } as const;
  }

  return {
    session,
    userId: session.user.id,
  } as const;
}

export async function parseJsonBody<TSchema extends z.ZodTypeAny>(
  request: Request,
  schema: TSchema,
) {
  try {
    const payload = await request.json();

    return {
      data: schema.parse(payload),
    } as const;
  } catch (error) {
    if (error instanceof SyntaxError) {
      return {
        error: jsonError(400, 'invalid_json', 'Request body must be valid JSON.'),
      } as const;
    }

    if (error instanceof z.ZodError) {
      return {
        error: jsonError(400, 'invalid_body', 'Request body was invalid.', error.flatten()),
      } as const;
    }

    return {
      error: jsonError(400, 'invalid_body', 'Request body was invalid.'),
    } as const;
  }
}

export function parseQuery<TSchema extends z.ZodTypeAny>(
  request: Request,
  schema: TSchema,
) {
  try {
    const url = new URL(request.url);
    const payload = Object.fromEntries(url.searchParams.entries());

    return {
      data: schema.parse(payload),
    } as const;
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        error: jsonError(400, 'invalid_query', 'Query parameters were invalid.', error.flatten()),
      } as const;
    }

    return {
      error: jsonError(400, 'invalid_query', 'Query parameters were invalid.'),
    } as const;
  }
}

export function parseParams<TSchema extends z.ZodTypeAny>(
  params: unknown,
  schema: TSchema,
) {
  try {
    return {
      data: schema.parse(params),
    } as const;
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        error: jsonError(400, 'invalid_params', 'Route parameters were invalid.', error.flatten()),
      } as const;
    }

    return {
      error: jsonError(400, 'invalid_params', 'Route parameters were invalid.'),
    } as const;
  }
}

export function handleRouteError(error: unknown, context: string) {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();

    if (message.includes('not found')) {
      return jsonError(404, 'not_found', error.message);
    }

    if (message.includes('access denied')) {
      return jsonError(403, 'forbidden', error.message);
    }

    if (message.includes('cannot') || message.includes('invalid')) {
      return jsonError(422, 'invalid_state', error.message);
    }

    return jsonError(500, 'internal_error', `Failed to ${context}.`, {
      message: error.message,
    });
  }

  return jsonError(500, 'internal_error', `Failed to ${context}.`);
}
