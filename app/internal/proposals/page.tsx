import { auth, signOut } from '@/server/auth/config';
import { ProposalKanban } from '@/components/internal/ProposalKanban';
import { LogOut } from 'lucide-react';

export const metadata = { title: 'Propostas · Internal' };

export default async function InternalProposalsPage() {
  const session = await auth();
  const name = session?.user?.name ?? session?.user?.email ?? 'Staff';
  const role = session?.user?.role;

  async function handleSignOut() {
    'use server';
    await signOut({ redirectTo: '/' });
  }

  return (
    <div className="min-h-svh bg-luma-offwhite">
      <header className="sticky top-0 z-20 border-b border-black/5 bg-luma-offwhite/85 backdrop-blur-md">
        <div className="flex items-center justify-between px-6 py-4">
          <div>
            <p className="text-[0.64rem] uppercase tracking-[0.38em] text-luma-olive/80">
              Luma Internal · Control View
            </p>
            <h1 className="mt-0.5 font-display text-xl font-light text-luma-ink">
              Triagem de propostas
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-[12.5px] font-medium text-luma-ink">{name}</p>
              <p className="text-[10px] uppercase tracking-[0.24em] text-luma-olive/80">
                {role ?? '—'}
              </p>
            </div>
            <form action={handleSignOut}>
              <button
                type="submit"
                aria-label="Sair"
                className="rounded-full bg-white/60 p-2 text-luma-ink/70 shadow-sm transition hover:bg-white"
              >
                <LogOut className="h-4 w-4" strokeWidth={1.5} />
              </button>
            </form>
          </div>
        </div>
      </header>

      <ProposalKanban />
    </div>
  );
}
