import { redirect } from 'next/navigation';

import { auth } from '@/server/auth/config';
import { db } from '@/lib/db';

export default async function FieldIndexPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/auth/sign-in?next=/field');
  }
  const op = await db.fieldOperator.findUnique({
    where: { userId: session.user.id },
    include: { origin: { select: { slug: true } } },
  });
  if (op) {
    redirect(`/field/${op.origin.slug}`);
  }
  if (session.user.role === 'ADMIN') {
    redirect('/admin/origins');
  }
  redirect('/auth/no-access');
}
