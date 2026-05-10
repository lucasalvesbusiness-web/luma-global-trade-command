import { redirect } from 'next/navigation';

import { auth } from '@/server/auth/config';
import { repositories } from '@/server/repositories';
import { OnboardingClient } from '@/components/company/OnboardingClient';

export default async function OnboardingPage() {
  const session = await auth();
  if (!session?.user) redirect('/auth/sign-in?callbackUrl=/onboarding');

  const memberships = await repositories.company.listForUser(session.user.id);
  if (memberships.length > 0) {
    const first = memberships[0];
    if (first) redirect(`/company/${first.company.slug}`);
  }

  return <OnboardingClient />;
}
