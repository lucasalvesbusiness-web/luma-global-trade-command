import { redirect } from 'next/navigation';

import { auth } from '@/server/auth/config';
import { MobileNav } from '@/components/system/MobileNav';
import { Sidebar } from '@/components/system/Sidebar';

export default async function AuthedLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect('/auth/sign-in');

  const companySlug = session.user.companySlug ?? null;
  const isAdmin = session.user.platformRole === 'ADMIN';

  return (
    <div className="flex min-h-screen bg-spectre-carbon">
      <Sidebar companySlug={companySlug} isAdmin={isAdmin} />
      <div className="flex min-w-0 flex-1 flex-col">
        <MobileNav companySlug={companySlug} />
        <main className="min-w-0 flex-1 pb-16 md:pb-0">{children}</main>
      </div>
    </div>
  );
}
