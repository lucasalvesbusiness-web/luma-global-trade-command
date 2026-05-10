'use client';

import dynamic from 'next/dynamic';

export const DiscoveryMapLazy = dynamic(
  () => import('@/components/canvas/DiscoveryMap').then((m) => m.DiscoveryMap),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center rounded-lg bg-ink-850 text-sm text-ink-400">
        carregando mapa…
      </div>
    ),
  },
);
