import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';

import LoopinApp from '@/components/loopin/loopin-app';

import { authOptions } from '@/auth';

export default async function Page() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/auth/login');
  }

  return <LoopinApp />;
}
