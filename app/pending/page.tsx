import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Clock4, MailWarning, ShieldOff } from 'lucide-react';

import { auth, signOut } from '@/server/auth/config';
import { db } from '@/lib/db';

export const metadata = { title: 'Aguardando aprovação' };

export default async function PendingPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/auth/sign-in');
  }

  const buyer = await db.buyer.findUnique({
    where: { userId: session.user.id },
    include: { company: true },
  });

  if (!buyer) {
    redirect('/');
  }

  const status = buyer.company.approvalStatus;
  if (status === 'APPROVED') {
    if (!buyer.company.onboardingCompletedAt) redirect('/onboarding');
    redirect('/');
  }

  async function handleSignOut() {
    'use server';
    await signOut({ redirectTo: '/' });
  }

  const Icon =
    status === 'PENDING' ? Clock4 : status === 'BLOCKED' ? ShieldOff : MailWarning;
  const title =
    status === 'PENDING'
      ? 'Cadastro em análise'
      : status === 'BLOCKED'
        ? 'Acesso suspenso'
        : 'Cadastro não aprovado';
  const body =
    status === 'PENDING'
      ? 'Seu cadastro está em revisão pelo time Luma. Você receberá um e-mail assim que for aprovado.'
      : status === 'BLOCKED'
        ? 'Seu acesso foi suspenso. Entre em contato com o time comercial Luma para mais informações.'
        : 'Seu cadastro não foi aprovado.';

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
      <div className="luma-glass w-full max-w-md rounded-2xl p-8 text-center shadow-xl shadow-black/10">
        <Icon className="mx-auto h-10 w-10 text-luma-olive/80" strokeWidth={1.5} />
        <h1 className="mt-3 font-display text-2xl font-light text-luma-ink">
          {title}
        </h1>
        <p className="mt-3 text-[13.5px] leading-relaxed text-luma-ink/70">{body}</p>
        {status === 'REJECTED' && buyer.company.rejectionReason && (
          <div className="mt-3 rounded-md bg-luma-offwhite/80 p-3 text-left text-[12.5px] text-luma-ink/80 ring-1 ring-inset ring-black/5">
            <p className="text-[10.5px] uppercase tracking-[0.22em] text-luma-olive/85">
              Motivo informado
            </p>
            <p className="mt-1">{buyer.company.rejectionReason}</p>
          </div>
        )}
        <p className="mt-6 text-[11.5px] text-luma-ink/55">
          {session.user.email}
        </p>
        <form action={handleSignOut}>
          <button
            type="submit"
            className="mt-3 text-[11px] uppercase tracking-[0.22em] text-luma-ink/65 hover:text-luma-ink"
          >
            Sair
          </button>
        </form>
        <Link
          href="/"
          className="mt-2 inline-block text-[11px] uppercase tracking-[0.22em] text-luma-olive/85 hover:text-luma-olive"
        >
          Voltar à home
        </Link>
      </div>
    </main>
  );
}
