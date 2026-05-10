'use client';

import dynamic from 'next/dynamic';

export const CityMapLazy = dynamic(
  () => import('@/components/canvas/CityMap').then((m) => m.CityMap),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center bg-ink-900">
        <span className="font-mono text-[11px] uppercase tracking-wider text-ink-400 animate-amber-pulse">
          carregando mapa
        </span>
      </div>
    ),
  },
);
