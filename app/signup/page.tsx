import { redirect } from 'next/navigation';

import { auth } from '@/server/auth/config';
import { db } from '@/lib/db';
import { SignupClient } from '@/components/auth/SignupClient';

export const metadata = { title: 'Cadastro · Luma Global Trade Command' };

export default async function SignupPage() {
  const session = await auth();
  if (session?.user?.id) {
    redirect('/');
  }

  const countries = await db.country.findMany({
    select: { iso2: true, name: true },
    orderBy: { name: 'asc' },
  });

  return <SignupClient countries={countries} />;
}
