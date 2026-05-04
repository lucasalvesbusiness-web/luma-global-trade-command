import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Globe2, LayoutGrid, LogOut } from 'lucide-react';

import { auth, signOut } from '@/server/auth/config';
import { db } from '@/lib/db';

export default async function BuyerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/auth/sign-in?next=/buyer/proposals');
  }
  if (session.user.role !== 'BUYER') {
    redirect('/auth/no-access');
  }

  const buyer = await db.buyer.findUnique({
    where: { userId: session.user.id },
    include: { company: { select: { approvalStatus: true, onboardingCompletedAt: true, legalName: true } } },
  });
  if (!buyer) redirect('/auth/no-access');
  if (buyer.company.approvalStatus !== 'APPROVED') redirect('/pending');
  if (!buyer.company.onboardingCompletedAt) redirect('/onboarding');

  async function handleSignOut() {
    'use server';
    await signOut({ redirectTo: '/' });
  }

  return (
    <div className="min-h-svh bg-luma-offwhite">
      <header className="sticky top-0 z-20 border-b border-black/5 bg-luma-offwhite/85 backdrop-blur-md">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-8">
            <div>
              <p className="text-[0.62rem] uppercase tracking-[0.38em] text-luma-olive/80">
                Luma Global Trade Command
              </p>
              <h1 className="mt-0.5 font-display text-lg font-light text-luma-ink">
                {buyer.company.legalName}
              </h1>
            </div>
            <nav className="flex items-center gap-1">
              <Link
                href="/buyer/proposals"
                className="inline-flex items-center gap-1.5 rounded-full bg-white/60 px-3 py-1.5 text-[12px] font-medium text-luma-ink/75 shadow-sm transition hover:bg-white hover:text-luma-ink"
              >
                <LayoutGrid className="h-3.5 w-3.5" strokeWidth={1.5} />
                Minhas propostas / My proposals
              </Link>
              <Link
                href="/"
                className="inline-flex items-center gap-1.5 rounded-full bg-white/60 px-3 py-1.5 text-[12px] font-medium text-luma-ink/75 shadow-sm transition hover:bg-white hover:text-luma-ink"
              >
                <Globe2 className="h-3.5 w-3.5" strokeWidth={1.5} />
                Canvas
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-[12.5px] font-medium text-luma-ink">
                {session.user.name ?? session.user.email}
              </p>
              <p className="text-[10px] uppercase tracking-[0.24em] text-luma-olive/80">
                BUYER
              </p>
            </div>
            <form action={handleSignOut}>
              <button
                type="submit"
                aria-label="Sair / Sign out"
                className="rounded-full bg-white/60 p-2 text-luma-ink/70 shadow-sm transition hover:bg-white"
              >
                <LogOut className="h-4 w-4" strokeWidth={1.5} />
              </button>
            </form>
          </div>
        </div>
      </header>
      {children}
    </div>
  );
}
