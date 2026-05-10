import Link from 'next/link';

import { auth } from '@/server/auth/config';
import { redirect } from 'next/navigation';

import { ChapterDivider } from '@/components/ui/ChapterDivider';
import { GridBackground } from '@/components/ui/GridBackground';
import { Reveal } from '@/components/ui/Reveal';
import { TechLabel } from '@/components/ui/TechLabel';
import { Button } from '@/components/ui/Button';
import { PublicNav } from '@/components/system/PublicNav';
import { LandingNetworkCanvas } from '@/components/canvas/LandingNetworkCanvas';

export default async function HomePage() {
  const session = await auth();
  if (session?.user?.companyId) redirect('/inbox');
  if (session?.user) redirect('/start');

  return (
    <>
      <PublicNav />
      <main className="relative">
        {/* HERO */}
        <section className="relative isolate overflow-hidden">
          <div className="absolute inset-0 -z-10">
            <LandingNetworkCanvas />
          </div>
          <GridBackground fade radial />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 -z-10"
            style={{
              background:
                'radial-gradient(ellipse 90% 70% at 50% 0%, rgba(28,28,28,0) 0%, rgba(28,28,28,0.85) 70%, #1c1c1c 100%)',
            }}
          />

          <div className="mx-auto max-w-layout px-6 pt-24 pb-32 md:pt-36 md:pb-44">
            <Reveal>
              <TechLabel dot className="mb-6">
                Rede de confiança transacional · B2B
              </TechLabel>
            </Reveal>
            <Reveal delay={0.1}>
              <h1 className="display-xxl text-[clamp(2.4rem,7vw,5.4rem)] text-ink-50 max-w-4xl">
                Confiança não é{' '}
                <span className="text-amber-glow">discurso</span>.
                <br />É evidência auditável.
              </h1>
            </Reveal>
            <Reveal delay={0.25}>
              <p className="mt-6 max-w-xl text-base leading-relaxed text-ink-300 md:text-lg">
                Empresas se descobrem, negociam dentro da plataforma e provam execução.
                Cada negócio bem conduzido fortalece a próxima decisão da rede.
              </p>
            </Reveal>
            <Reveal delay={0.4}>
              <div className="mt-10 flex flex-wrap items-center gap-3">
                <Button asChild variant="primary" size="lg">
                  <Link href="/auth/sign-in">Entrar na rede →</Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <Link href="#como">Como funciona</Link>
                </Button>
              </div>
            </Reveal>

            <Reveal delay={0.6}>
              <dl className="mt-20 grid grid-cols-2 gap-x-10 gap-y-6 md:grid-cols-4 md:max-w-3xl">
                {[
                  ['00', 'Identidade verificável'],
                  ['01', 'Descoberta contextual'],
                  ['02', 'Deal room auditável'],
                  ['03', 'Reputação derivada'],
                ].map(([code, label]) => (
                  <div key={code} className="flex flex-col gap-1">
                    <dt className="num-marker text-xs text-amber/80">{code}</dt>
                    <dd className="text-xs uppercase tracking-wider text-ink-200">{label}</dd>
                  </div>
                ))}
              </dl>
            </Reveal>
          </div>
        </section>

        {/* §00 TESE */}
        <ChapterDivider code="§00" title="A tese" />
        <section className="mx-auto max-w-layout px-6 py-12 md:py-20">
          <div className="grid gap-12 md:grid-cols-12">
            <Reveal className="md:col-span-5">
              <TechLabel>Problema estrutural</TechLabel>
              <h2 className="display-xl mt-4 text-[clamp(1.6rem,3.5vw,2.4rem)] text-ink-50">
                A internet é ruim em responder em quem dá para confiar para fazer negócio.
              </h2>
            </Reveal>
            <Reveal delay={0.15} className="md:col-span-7">
              <div className="space-y-4 text-ink-300 leading-relaxed">
                <p>
                  Hoje empresas tentam responder isso somando sinais fragmentados — site,
                  Instagram, indicação informal, PDF de proposta, contratos fora da plataforma.
                  Reputação fica espalhada e não é portável.
                </p>
                <p>
                  O resultado é um mercado B2B com ruído, atrito e risco bilateral. Compradores
                  não sabem se o fornecedor entrega. Fornecedores bons não conseguem provar
                  superioridade real.
                </p>
                <p className="text-ink-100">
                  Esta plataforma converte relação comercial em ativo reputacional reutilizável.
                  Cada negócio concluído com evidência e aceite vira sinal forte para o próximo.
                </p>
              </div>
            </Reveal>
          </div>
        </section>

        {/* §01 COMO FUNCIONA */}
        <ChapterDivider code="§01" title="Como funciona" />
        <section id="como" className="mx-auto max-w-layout px-6 py-12 md:py-20">
          <div className="grid gap-px overflow-hidden rounded-md border border-white/[0.06] md:grid-cols-2 lg:grid-cols-4">
            {[
              {
                code: '00',
                title: 'Perfil verificável',
                body: 'CNPJ, identidade, documentação. Verificação manual com cerimônia visível. Sem badges de autoafirmação.',
              },
              {
                code: '01',
                title: 'Descoberta',
                body: 'Empresas se encontram por categoria, raio de atendimento e nível de verificação. Sem pay-to-play.',
              },
              {
                code: '02',
                title: 'Deal room',
                body: 'Escopo, cotação, aceite, evidência, confirmação. FSM auditável. Cada transição vira log permanente.',
              },
              {
                code: '03',
                title: 'Reputação',
                body: 'Negócios concluídos com aceite mútuo geram reviews bilaterais. Sinais decompostos, sem score único opaco.',
              },
            ].map((step, i) => (
              <Reveal key={step.code} delay={i * 0.08} className="bg-ink-900">
                <div className="group relative flex h-full flex-col gap-3 p-7 transition-colors duration-300 ease-cinematic hover:bg-ink-850">
                  <span className="num-marker text-xs text-amber/80">§{step.code}</span>
                  <h3 className="display-md text-lg text-ink-50">{step.title}</h3>
                  <p className="text-sm text-ink-300 leading-relaxed">{step.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* §02 PRINCÍPIOS */}
        <ChapterDivider code="§02" title="Princípios" />
        <section className="mx-auto max-w-layout px-6 py-12 md:py-20">
          <div className="grid gap-3 md:grid-cols-2">
            {[
              'Reputação vem da execução, não do discurso.',
              'Sinais de confiança precisam ser contextualizados.',
              'A plataforma puxa a transação para dentro.',
              'Evidência precisa ser clara para os dois lados.',
              'Confiança é progressiva, verificável e auditável.',
              'Toda empresa é simultaneamente comprador e fornecedor.',
              'Sem score único opaco — sempre decomposto em sinais.',
              'Auditabilidade é lei. Toda transição vira log.',
            ].map((p, i) => (
              <Reveal key={p} delay={i * 0.05}>
                <div className="flex items-start gap-4 border-b border-white/[0.05] py-4 transition-colors hover:border-amber/30">
                  <span className="num-marker mt-1 text-xs text-amber/60">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <p className="text-base text-ink-200 leading-relaxed">{p}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* §03 CTA FINAL */}
        <section className="relative mx-auto my-12 max-w-layout px-6 py-24 md:py-36">
          <GridBackground fine fade />
          <div className="relative flex flex-col items-center gap-6 text-center">
            <Reveal>
              <TechLabel dot>O loop começa aqui</TechLabel>
            </Reveal>
            <Reveal delay={0.1}>
              <h2 className="display-xl max-w-3xl text-[clamp(2rem,5vw,3.6rem)] text-ink-50">
                Cadastre sua empresa.
                <br />
                Construa reputação que se prova.
              </h2>
            </Reveal>
            <Reveal delay={0.2}>
              <Button asChild size="lg">
                <Link href="/auth/sign-in">Entrar na rede →</Link>
              </Button>
            </Reveal>
          </div>
        </section>

        <footer className="border-t border-white/[0.05] py-10">
          <div className="mx-auto flex max-w-layout flex-wrap items-center justify-between gap-4 px-6">
            <TechLabel>B2B Trust Network · 2026</TechLabel>
            <nav className="flex gap-6 text-xs uppercase tracking-wider text-ink-400">
              <Link href="/legal/privacy" className="hover:text-ink-100">
                Privacidade
              </Link>
              <Link href="/legal/terms" className="hover:text-ink-100">
                Termos
              </Link>
              <Link href="/legal/cookies" className="hover:text-ink-100">
                Cookies
              </Link>
            </nav>
          </div>
        </footer>
      </main>
    </>
  );
}
