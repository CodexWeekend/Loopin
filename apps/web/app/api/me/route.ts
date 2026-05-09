import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

import { authOptions } from '@/auth';
import { getProfile } from '@/lib/local-db';

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ profile: null }, { status: 401 });
  }

  const profile = getProfile(session.user.id);
  return NextResponse.json({
    profile,
  });
}
