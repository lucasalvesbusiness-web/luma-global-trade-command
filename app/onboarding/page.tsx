import { redirect } from 'next/navigation';

import { auth } from '@/server/auth/config';
import { db } from '@/lib/db';
import { OnboardingClient } from '@/components/auth/OnboardingClient';

export const metadata = { title: 'Complete seu cadastro' };

export default async function OnboardingPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/auth/sign-in');

  const buyer = await db.buyer.findUnique({
    where: { userId: session.user.id },
    include: { company: true },
  });
  if (!buyer) redirect('/signup');

  const status = buyer.company.approvalStatus;
  if (status !== 'APPROVED') redirect('/pending');
  if (buyer.company.onboardingCompletedAt) redirect('/');

  const countries = await db.country.findMany({
    select: { iso2: true, name: true },
    orderBy: { name: 'asc' },
  });
  const products = await db.product.findMany({
    select: { slug: true, name: true },
    orderBy: { name: 'asc' },
  });

  return (
    <OnboardingClient
      company={{
        legalName: buyer.company.legalName,
        displayName: buyer.company.displayName,
        city: buyer.company.city,
        address: buyer.company.address,
        contactPhone: buyer.company.contactPhone,
        defaultIncoterm: buyer.company.defaultIncoterm,
        estimatedMonthlyVolume: buyer.company.estimatedMonthlyVolume,
        productsOfInterest: buyer.company.productsOfInterest,
        targetMarkets: buyer.company.targetMarkets,
      }}
      countries={countries}
      products={products}
    />
  );
}
