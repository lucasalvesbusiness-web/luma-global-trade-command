import { redirect } from 'next/navigation';
import { auth } from '@/server/auth/config';

/**
 * Guard server-side da área interna. Só STAFF ou ADMIN entram.
 */
export default async function InternalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/auth/sign-in?next=/internal/proposals');
  }
  const role = session.user.role;
  if (role !== 'STAFF' && role !== 'ADMIN') {
    redirect('/auth/no-access');
  }

  return <div className="min-h-svh bg-luma-offwhite">{children}</div>;
}
