'use client';

import { AnimatePresence, motion } from 'framer-motion';
import dynamic from 'next/dynamic';

import { useCanvasStore } from '@/lib/canvas/store';

import { CanvasHUD } from '@/components/brand/CanvasHUD';
import { IntroPane } from '@/components/brand/IntroPane';
import { ContainerBuilder } from '@/components/panels/ContainerBuilder';
import { DestinationPicker } from '@/components/panels/DestinationPicker';
import { DestinationPreview } from '@/components/panels/DestinationPreview';
import { LoadPlanTray } from '@/components/panels/LoadPlanTray';
import { ProductRail } from '@/components/panels/ProductRail';
import { ProposalReview } from '@/components/panels/ProposalReview';
import { CloudTransition } from './CloudTransition';

const GlobeCanvas = dynamic(
  () => import('./GlobeCanvas').then((m) => m.GlobeCanvas),
  { ssr: false, loading: () => <MapSkeleton /> },
);

const ValeMap = dynamic(() => import('./ValeMap').then((m) => m.ValeMap), {
  ssr: false,
  loading: () => <MapSkeleton />,
});

function MapSkeleton() {
  return (
    <div className="flex h-full w-full items-center justify-center bg-luma-sand/30">
      <p className="text-[10.5px] uppercase tracking-[0.3em] text-luma-olive/60">
        Carregando mapa…
      </p>
    </div>
  );
}

function LightBackdrop() {
  return (
    <div
      aria-hidden
      className="absolute inset-0 -z-10"
      style={{
        background:
          'linear-gradient(135deg, hsl(var(--luma-offwhite)) 0%, hsl(var(--luma-sand) / 0.45) 55%, hsl(var(--luma-offwhite)) 100%)',
      }}
    />
  );
}

export function CanvasShell() {
  const stage = useCanvasStore((s) => s.stage);
  const valeMapReady = useCanvasStore((s) => s.valeMapReady);
  const setValeMapReady = useCanvasStore((s) => s.setValeMapReady);

  const inIntro = stage === 'intro' || stage === 'destinationSelection';
  const inVale = stage === 'originReveal';
  const inTransit = stage === 'destinationConfirmed' || stage === 'transitToBrazil';

  return (
    <main className="relative min-h-svh overflow-hidden bg-luma-offwhite">
      <LightBackdrop />

      {/* ========= INTRO (split 50/50) ========= */}
      <AnimatePresence>
        {inIntro && (
          <motion.div
            key="intro-layout"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
            className="absolute inset-0 grid grid-cols-1 md:grid-cols-[35%_65%]"
          >
            {/* Esquerda (25%) — brand + picker */}
            <div className="relative flex flex-col justify-between overflow-y-auto">
              <IntroPane />
              <div className="p-5 md:p-7 md:pb-10">
                <DestinationPicker />
              </div>
            </div>

            {/* Direita (75%) — globo maior */}
            <div className="relative h-[55vh] md:h-full">
              <div className="absolute inset-4 overflow-hidden rounded-3xl ring-1 ring-inset ring-luma-ink/10 shadow-[0_32px_80px_-20px_rgba(42,46,39,0.25)] md:inset-6">
                <GlobeCanvas />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ========= VALE (full screen) ========= */}
      <AnimatePresence>
        {inVale && (
          <motion.div
            key="vale-layout"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-0"
          >
            <ValeMap onReady={() => setValeMapReady(true)} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ========= TRANSIÇÃO "NUVENS DESCENDO" ========= */}
      {inTransit && <CloudTransition />}

      {/* Fallback overlay enquanto ValeMap ainda não carregou — evita piscar */}
      <AnimatePresence>
        {inVale && !valeMapReady && (
          <motion.div
            key="vale-loading"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
            className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center bg-luma-offwhite"
          >
            <p className="text-[11px] uppercase tracking-[0.35em] text-luma-olive/70">
              Preparando o Vale…
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* HUD sempre visível */}
      <CanvasHUD />

      {/* Previews de destino só na intro, dispostos na coluna do globo */}
      {inIntro && <DestinationPreview />}

      {/* Overlays do Vale — só aparecem após mapReady */}
      {inVale && valeMapReady && (
        <>
          <ProductRail />
          <LoadPlanTray />
          <ContainerBuilder />
        </>
      )}

      {/* Review modal pode ser aberto em qualquer momento do Vale */}
      {inVale && <ProposalReview />}
    </main>
  );
}
