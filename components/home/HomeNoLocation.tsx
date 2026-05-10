import Link from 'next/link';

import { Button } from '@/components/ui/Button';
import { GridBackground } from '@/components/ui/GridBackground';
import { TechLabel } from '@/components/ui/TechLabel';

export function HomeNoLocation({ reason }: { reason: 'no-coords' | 'no-company' }) {
  return (
    <main className="relative flex min-h-[calc(100vh-64px)] items-center justify-center overflow-hidden bg-spectre-carbon p-6">
      <GridBackground fade radial />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 60% 50% at 50% 30%, rgba(201,169,104,0.07), transparent 60%)',
        }}
      />

      <div className="surface-graphite relative w-full max-w-md overflow-hidden rounded-md border border-white/[0.07] p-8 text-center">
        <div className="tick-tl text-amber" />
        <div className="tick-tr text-amber" />
        <div className="tick-bl text-amber" />
        <div className="tick-br text-amber" />

        <TechLabel dot className="mb-3 justify-center">
          TimeLine
        </TechLabel>

        {reason === 'no-company' ? (
          <>
            <h1 className="display-xl mb-3 text-2xl text-ink-50">
              Crie sua empresa primeiro.
            </h1>
            <p className="mb-6 text-sm text-ink-300">
              A TimeLine é a vista do seu bairro a partir da sua sede. Vamos cadastrar
              a sua empresa para começar.
            </p>
            <Button asChild>
              <Link href="/start">Cadastrar empresa →</Link>
            </Button>
          </>
        ) : (
          <>
            <h1 className="display-xl mb-3 text-2xl text-ink-50">
              Adicione a localização da sua sede.
            </h1>
            <p className="mb-6 text-sm text-ink-300">
              A TimeLine centraliza o mapa na sede da sua empresa e mostra empresas
              vizinhas no raio. Adicione latitude e longitude para começar.
            </p>
            <Button asChild>
              <Link href="/c/edit">Adicionar localização →</Link>
            </Button>
          </>
        )}
      </div>
    </main>
  );
}
