import Link from 'next/link';

import { GridBackground } from '@/components/ui/GridBackground';
import { TechLabel } from '@/components/ui/TechLabel';

export default function VerifyPage() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-spectre-carbon p-6">
      <GridBackground fade radial />

      <div className="relative w-full max-w-md">
        <div className="surface-graphite relative overflow-hidden rounded-md border border-white/[0.07] p-8">
          <div className="tick-tl text-amber" />
          <div className="tick-tr text-amber" />
          <div className="tick-bl text-amber" />
          <div className="tick-br text-amber" />

          <TechLabel dot className="mb-2">
            Aguardando confirmação
          </TechLabel>
          <h1 className="display-xl mb-3 text-2xl text-ink-50 terminal-cursor">
            Verifique seu email
          </h1>
          <p className="mb-2 text-sm leading-relaxed text-ink-300">
            Enviamos um link de acesso. O link expira em 10 minutos.
          </p>
          <p className="text-sm leading-relaxed text-ink-400">
            Em desenvolvimento, abra o Mailpit em{' '}
            <a
              href="http://localhost:8025"
              target="_blank"
              rel="noreferrer"
              className="text-ink-200 underline decoration-amber/40 underline-offset-4"
            >
              localhost:8025
            </a>
            .
          </p>

          <div className="mt-6 border-t border-white/[0.05] pt-6">
            <Link
              href="/auth/sign-in"
              className="text-xs uppercase tracking-wider text-ink-400 hover:text-ink-100"
            >
              ← Trocar email
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
