'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

import { CityMapLazy } from '@/components/canvas/CityMapLazy';
import { ConnectedTimeline } from '@/components/home/ConnectedTimeline';
import { NearbyTimeline } from '@/components/home/NearbyTimeline';
import { RadiusSlider } from '@/components/home/RadiusSlider';
import { TechLabel } from '@/components/ui/TechLabel';
import type { HomeCompany } from '@/server/trpc/routers/home';
import { useHomeStore, useHydrateRadius } from '@/lib/home/store';
import { trpc } from '@/lib/trpc/react';
import { TimelineItem } from './TimelineItem';
import { cn } from '@/lib/utils';

export function HomeClient() {
  useHydrateRadius();
  const radiusKm = useHomeStore((s) => s.radiusKm);
  const setHovered = useHomeStore((s) => s.setHovered);
  const setSelected = useHomeStore((s) => s.setSelected);

  const feed = trpc.home.nearbyCompanies.useQuery(
    { radiusKm },
    { staleTime: 5 * 60 * 1000, refetchOnWindowFocus: false },
  );

  // Reset selection when radius changes (different result set).
  useEffect(() => {
    setHovered(null);
    setSelected(null);
  }, [radiusKm, setHovered, setSelected]);

  if (feed.isLoading) {
    return (
      <div className="flex h-[calc(100vh-64px)] w-full items-center justify-center bg-spectre-carbon">
        <span className="font-mono text-[11px] uppercase tracking-wider text-ink-400 animate-amber-pulse">
          calibrando a rede
        </span>
      </div>
    );
  }

  if (feed.data?.reason !== 'ok' || !feed.data.self) {
    // Should be caught by the page's server-side branching, but defend anyway.
    return (
      <div className="flex h-[calc(100vh-64px)] w-full items-center justify-center bg-spectre-carbon p-6 text-center text-sm text-ink-300">
        Sua sede ainda não está geolocalizada. Atualize a localização em{' '}
        <Link href="/c/edit" className="ml-1 text-amber-glow underline">
          /c/edit
        </Link>
        .
      </div>
    );
  }

  const { self, companies } = feed.data;

  return (
    <div className="relative h-[calc(100vh-64px)] w-full overflow-hidden md:h-screen">
      {/* Map fills the viewport behind everything else. */}
      <div className="absolute inset-0 h-full w-full">
        <CityMapLazy self={self} companies={companies} />
      </div>

      {/* Floating control: radius selector top-center */}
      <div className="pointer-events-none absolute left-1/2 top-4 z-10 -translate-x-1/2">
        <RadiusSlider />
      </div>

      {/* Floating timelines */}
      <div className="pointer-events-none absolute left-4 top-20 z-10 hidden md:block">
        <NearbyTimeline companies={companies} />
      </div>
      <div className="pointer-events-none absolute right-4 top-20 z-10 hidden md:block">
        <ConnectedTimeline companies={companies} />
      </div>

      {/* Mobile bottom-sheet with tabs */}
      <MobileSheet companies={companies} />
    </div>
  );
}

function MobileSheet({ companies }: { companies: HomeCompany[] }) {
  const [tab, setTab] = useState<'nearby' | 'connected'>('nearby');
  const [open, setOpen] = useState(false);

  const nearby = companies.filter((c) => !c.isConnected);
  const connected = companies.filter((c) => c.isConnected);
  const items = tab === 'nearby' ? nearby : connected;

  return (
    <div className="md:hidden">
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="surface-graphite absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 items-center gap-3 rounded-full border border-white/[0.08] px-4 py-2 text-xs shadow-2xl"
        >
          <span className="num-marker text-amber-glow">
            {String(connected.length).padStart(2, '0')}
          </span>
          <span className="text-ink-200">conexões</span>
          <span className="text-ink-500">·</span>
          <span className="num-marker text-ink-100">
            {String(nearby.length).padStart(2, '0')}
          </span>
          <span className="text-ink-300">no raio</span>
        </button>
      )}

      {open && (
        <div className="absolute inset-x-0 bottom-0 z-20 flex max-h-[60vh] flex-col rounded-t-lg border border-white/[0.08] surface-graphite shadow-2xl">
          <header className="flex items-center justify-between border-b border-white/[0.05] px-4 py-3">
            <div className="flex gap-2">
              {(
                [
                  { id: 'nearby', label: 'No raio', count: nearby.length },
                  { id: 'connected', label: 'Sua rede', count: connected.length },
                ] as const
              ).map((t) => {
                const active = tab === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTab(t.id)}
                    className={cn(
                      'flex items-center gap-2 rounded-sm border px-2.5 py-1 text-[10px] uppercase tracking-wider transition-colors',
                      active
                        ? 'border-amber/50 bg-amber/10 text-amber-glow'
                        : 'border-white/10 text-ink-400',
                    )}
                  >
                    {t.label}
                    <span className="num-marker">
                      {String(t.count).padStart(2, '0')}
                    </span>
                  </button>
                );
              })}
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Fechar"
              className="text-ink-400 hover:text-ink-100"
            >
              ✕
            </button>
          </header>
          <div className="min-h-0 flex-1 overflow-y-auto">
            {items.length === 0 ? (
              <p className="px-4 py-8 text-center text-xs text-ink-500">
                {tab === 'nearby'
                  ? 'Nenhuma empresa nova no seu raio.'
                  : 'Sem conexões no raio ainda.'}
              </p>
            ) : (
              <ul>
                {items.map((c) => (
                  <li key={c.id}>
                    <TimelineItem
                      company={c}
                      variant={tab === 'connected' ? 'connected' : 'nearby'}
                    />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

void TechLabel;
