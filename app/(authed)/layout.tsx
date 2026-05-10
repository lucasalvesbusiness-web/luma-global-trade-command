import { redirect } from 'next/navigation';

import { auth } from '@/server/auth/config';
import { Sidebar } from '@/components/system/Sidebar';

export default async function AuthedLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect('/auth/sign-in');

  return (
    <div className="flex min-h-screen bg-spectre-carbon">
      <Sidebar
        companySlug={session.user.companySlug ?? null}
        isAdmin={session.user.platformRole === 'ADMIN'}
      />
      <main className="min-w-0 flex-1">{children}</main>
    </div>
  );
}
