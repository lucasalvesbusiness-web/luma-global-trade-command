import { redirect } from 'next/navigation';
import { auth, signIn } from '@/server/auth/config';

export const metadata = { title: 'Entrar' };

/**
 * Página de sign-in — magic link via Nodemailer/Mailpit.
 * Usuários já logados são redirecionados.
 */
export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const session = await auth();
  const params = await searchParams;
  const next = params.next ?? '/internal/proposals';

  if (session?.user?.id) {
    redirect(next);
  }

  async function handleSignIn(formData: FormData) {
    'use server';
    const email = String(formData.get('email') ?? '').trim().toLowerCase();
    if (!email) return;
    await signIn('nodemailer', {
      email,
      redirectTo: next,
    });
  }

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
      <div className="luma-glass w-full max-w-md rounded-2xl p-8 shadow-xl shadow-black/10">
        <p className="text-[0.68rem] uppercase tracking-[0.4em] text-luma-olive/80">
          Luma × Spectre
        </p>
        <h1 className="mt-2 font-display text-2xl font-light text-luma-ink">
          Acesso interno
        </h1>
        <p className="mt-2 text-[13px] leading-relaxed text-luma-ink/65">
          Enviaremos um link de acesso único para o seu e-mail. Válido para usuários
          staff da Luma.
        </p>

        <form action={handleSignIn} className="mt-6 space-y-3">
          <label
            htmlFor="email"
            className="text-[0.62rem] uppercase tracking-[0.24em] text-luma-olive/80"
          >
            E-mail corporativo
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="commercial@luma.local"
            className="w-full rounded-md border border-black/10 bg-white/70 px-3 py-2.5 text-sm text-luma-ink shadow-sm outline-none focus:border-luma-olive focus:ring-2 focus:ring-luma-olive/25"
          />

          <button
            type="submit"
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-md bg-luma-olive px-4 py-2.5 text-sm font-medium text-luma-offwhite shadow-sm transition hover:brightness-110"
          >
            Enviar link de acesso
          </button>
        </form>

        {params.error && (
          <p className="mt-4 rounded-md bg-[hsl(var(--luma-earth)_/_0.1)] px-3 py-2 text-[12.5px] text-[hsl(var(--luma-earth))] ring-1 ring-inset ring-[hsl(var(--luma-earth)_/_0.3)]">
            {params.error === 'AccessDenied'
              ? 'Seu e-mail não tem acesso interno.'
              : 'Falha no envio. Tente novamente.'}
          </p>
        )}

        <p className="mt-6 text-[11px] uppercase tracking-[0.25em] text-luma-ink/55">
          Dev · e-mails aparecem em http://localhost:8025
        </p>
      </div>
    </main>
  );
}
