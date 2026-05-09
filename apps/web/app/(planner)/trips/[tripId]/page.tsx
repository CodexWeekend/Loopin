import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';

import { authOptions } from '@/auth';
import LoopinApp from '@/components/loopin/loopin-app';

export default async function TripPlannerPage({
  params,
}: {
  params: Promise<{ tripId: string }>
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/auth/login');
  }

  const { tripId } = await params;

  return <LoopinApp initialTripId={tripId} />;
}
