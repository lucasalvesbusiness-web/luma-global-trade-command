import { Mail } from 'lucide-react';

export const metadata = { title: 'Verifique seu e-mail' };

export default function VerifyPage() {
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
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-luma-olive/10 ring-1 ring-inset ring-luma-olive/25">
          <Mail className="h-6 w-6 text-luma-olive" strokeWidth={1.5} />
        </div>
        <h1 className="mt-5 font-display text-xl font-light text-luma-ink">
          Verifique seu e-mail
        </h1>
        <p className="mt-3 text-[13px] leading-relaxed text-luma-ink/70">
          Enviamos um link de acesso. Abra seu e-mail e clique no link para entrar.
        </p>
        <p className="mt-6 text-[11px] uppercase tracking-[0.25em] text-luma-olive/70">
          Dev · inbox em{' '}
          <a
            href="http://localhost:8025"
            target="_blank"
            rel="noreferrer"
            className="underline"
          >
            Mailpit
          </a>
        </p>
      </div>
    </main>
  );
}
