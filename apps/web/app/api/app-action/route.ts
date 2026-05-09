import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

import { authOptions } from '@/auth';
import type { LoopinAction } from '@/lib/loopin-api';
import { applyLoopinAction } from '@/lib/loopin-app-state';

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const action = (await request.json()) as LoopinAction;

  return NextResponse.json({
    state: applyLoopinAction(session.user.id, action),
  });
}
