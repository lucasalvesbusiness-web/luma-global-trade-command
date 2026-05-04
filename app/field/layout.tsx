import { redirect } from 'next/navigation';

import { auth, signOut } from '@/server/auth/config';
import { db } from '@/lib/db';
import { LogOut } from 'lucide-react';

export default async function FieldLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/auth/sign-in?next=/field');
  }
  const role = session.user.role;
  if (role !== 'FIELD_OPERATOR' && role !== 'ADMIN') {
    redirect('/auth/no-access');
  }

  async function handleSignOut() {
    'use server';
    await signOut({ redirectTo: '/' });
  }

  // Resolve origem do operador (admin pode acessar qualquer)
  let operatorOriginSlug: string | null = null;
  if (role === 'FIELD_OPERATOR') {
    const op = await db.fieldOperator.findUnique({
      where: { userId: session.user.id },
      include: { origin: { select: { slug: true } } },
    });
    operatorOriginSlug = op?.origin.slug ?? null;
  }

  return (
    <div className="min-h-svh bg-luma-offwhite">
      <header className="sticky top-0 z-20 border-b border-black/5 bg-luma-offwhite/85 backdrop-blur-md">
        <div className="flex items-center justify-between px-6 py-4">
          <div>
            <p className="text-[0.62rem] uppercase tracking-[0.38em] text-luma-olive/80">
              Luma Field · Operador
            </p>
            <h1 className="mt-0.5 font-display text-lg font-light text-luma-ink">
              Rotina fotográfica
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-[12.5px] font-medium text-luma-ink">
                {session.user.name ?? session.user.email}
              </p>
              <p className="text-[10px] uppercase tracking-[0.24em] text-luma-olive/80">
                {role === 'ADMIN' ? 'ADMIN OVERRIDE' : 'OPERADOR'}
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
      {children}
      <input
        type="hidden"
        data-operator-origin-slug={operatorOriginSlug ?? ''}
      />
    </div>
  );
}
