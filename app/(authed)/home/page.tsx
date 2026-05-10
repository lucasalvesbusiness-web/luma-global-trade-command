import { redirect } from 'next/navigation';

import { auth } from '@/server/auth/config';
import { db } from '@/lib/db';
import { HomeClient } from '@/components/home/HomeClient';
import { HomeNoLocation } from '@/components/home/HomeNoLocation';

export default async function HomePage() {
  const session = await auth();
  if (!session?.user) redirect('/auth/sign-in?callbackUrl=/home');
  if (!session.user.companyId) {
    return <HomeNoLocation reason="no-company" />;
  }

  const me = await db.company.findUnique({
    where: { id: session.user.companyId },
    select: { latitude: true, longitude: true },
  });

  if (!me || me.latitude === null || me.longitude === null) {
    return <HomeNoLocation reason="no-coords" />;
  }

  return <HomeClient />;
}
