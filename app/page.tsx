import { redirect } from 'next/navigation';

import { CanvasShell } from '@/components/canvas/CanvasShell';
import { auth } from '@/server/auth/config';
import { db } from '@/lib/db';

export default async function HomePage() {
  const session = await auth();

  if (session?.user?.id && session.user.role === 'BUYER') {
    const buyer = await db.buyer.findUnique({
      where: { userId: session.user.id },
      include: { company: { select: { approvalStatus: true, onboardingCompletedAt: true } } },
    });
    if (buyer) {
      const status = buyer.company.approvalStatus;
      if (status !== 'APPROVED') redirect('/pending');
      if (!buyer.company.onboardingCompletedAt) redirect('/onboarding');
    }
  }

  if (session?.user?.id && session.user.role === 'FIELD_OPERATOR') {
    redirect('/field');
  }

  return <CanvasShell />;
}
