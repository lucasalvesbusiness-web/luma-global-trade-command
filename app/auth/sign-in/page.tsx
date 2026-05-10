import Link from 'next/link';
import { redirect } from 'next/navigation';

import { auth } from '@/server/auth/config';
import { AuthForm } from '@/components/auth/AuthForm';
import { GridBackground } from '@/components/ui/GridBackground';
import { TechLabel } from '@/components/ui/TechLabel';

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string; mode?: string }>;
}) {
  const session = await auth();
  if (session?.user) redirect('/inbox');

  const { callbackUrl, mode } = await searchParams;
  const initialMode = mode === 'signup' ? 'signup' : 'signin';

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-spectre-carbon p-6">
      <GridBackground fade radial />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 60% 50% at 50% 30%, rgba(201,169,104,0.07), transparent 60%)',
        }}
      />

      <div className="relative w-full max-w-md">
        <Link
          href="/"
          className="mb-8 flex items-center gap-2 text-xs uppercase tracking-wider text-ink-400 hover:text-ink-100"
        >
          ← voltar
        </Link>

        <div className="surface-graphite relative overflow-hidden rounded-md border border-white/[0.07] p-8">
          <div className="tick-tl text-amber" />
          <div className="tick-tr text-amber" />
          <div className="tick-bl text-amber" />
          <div className="tick-br text-amber" />

          <TechLabel dot className="mb-2">
            Acesso à rede
          </TechLabel>

          <AuthForm initialMode={initialMode} callbackUrl={callbackUrl} />

          <div className="mt-6 border-t border-white/[0.05] pt-6">
            <p className="text-xs leading-relaxed text-ink-400">
              Em desenvolvimento, qualquer email do seed funciona. Senha padrão:{' '}
              <code className="rounded bg-ink-900 px-1.5 py-0.5 text-ink-200">senha123</code>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
