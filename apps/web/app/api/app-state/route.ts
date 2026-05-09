import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

import { authOptions } from '@/auth';
import { getLoopinAppState } from '@/lib/loopin-app-state';

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const url = new URL(request.url);
  const tripId = url.searchParams.get('tripId') ?? undefined;

  return NextResponse.json({
    state: getLoopinAppState(session.user.id, tripId),
  });
}
