import { ShieldAlert } from 'lucide-react';
import Link from 'next/link';

export const metadata = { title: 'Acesso restrito' };

export default function NoAccessPage() {
  return (
    <main className="min-h-svh flex items-center justify-center p-6 bg-luma-offwhite">
      <div
        aria-hidden
        className="absolute inset-0 -z-10"
        style={{
          background:
            'radial-gradient(ellipse at 30% 30%, hsl(var(--luma-sand) / 0.55) 0%, hsl(var(--luma-offwhite)) 70%)',
        }}
      />
      <div className="luma-glass w-full max-w-md rounded-2xl p-8 shadow-xl shadow-black/10 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-luma-earth/10 ring-1 ring-inset ring-luma-earth/25">
          <ShieldAlert className="h-6 w-6 text-luma-earth" strokeWidth={1.5} />
        </div>
        <h1 className="mt-5 font-display text-xl font-light text-luma-ink">
          Acesso restrito
        </h1>
        <p className="mt-3 text-[13px] leading-relaxed text-luma-ink/70">
          Sua conta não tem permissão para acessar a área interna. Contate o
          administrador da Luma se acreditar que isso é um erro.
        </p>
        <Link
          href="/"
          className="mt-6 inline-block rounded-md bg-luma-olive px-4 py-2 text-[13px] font-medium text-luma-offwhite transition hover:brightness-110"
        >
          Voltar ao canvas público
        </Link>
      </div>
    </main>
  );
}
