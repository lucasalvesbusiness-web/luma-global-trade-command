import Link from 'next/link';
import { redirect } from 'next/navigation';

import { auth, signIn } from '@/server/auth/config';
import { Button } from '@/components/ui/Button';
import { GridBackground } from '@/components/ui/GridBackground';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { TechLabel } from '@/components/ui/TechLabel';

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const session = await auth();
  if (session?.user) redirect('/inbox');

  const { callbackUrl } = await searchParams;

  async function handleSignIn(formData: FormData) {
    'use server';
    const email = String(formData.get('email') ?? '').trim();
    if (!email) return;
    await signIn('nodemailer', {
      email,
      redirectTo: callbackUrl ?? '/inbox',
    });
  }

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
          <h1 className="display-xl mb-1 text-2xl text-ink-50">Entrar</h1>
          <p className="mb-8 text-sm text-ink-300">
            Enviaremos um link mágico para o seu email. Sem senha, sem fricção.
          </p>

          <form action={handleSignIn} className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <Label htmlFor="email">Email corporativo</Label>
              <Input
                id="email"
                name="email"
                type="email"
                required
                placeholder="voce@empresa.com.br"
                autoComplete="email"
                className="h-12 text-base"
              />
            </div>
            <Button type="submit" size="lg">
              Receber link de acesso →
            </Button>
          </form>

          <div className="mt-6 border-t border-white/[0.05] pt-6">
            <p className="text-xs leading-relaxed text-ink-400">
              Em desenvolvimento, abra o Mailpit em{' '}
              <a
                href="http://localhost:8025"
                target="_blank"
                rel="noreferrer"
                className="text-ink-200 underline decoration-amber/40 underline-offset-4 hover:text-amber-glow"
              >
                localhost:8025
              </a>{' '}
              para ver o link.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
