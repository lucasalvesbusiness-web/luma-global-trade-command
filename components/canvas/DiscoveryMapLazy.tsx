'use client';

import dynamic from 'next/dynamic';

export const DiscoveryMapLazy = dynamic(
  () => import('@/components/canvas/DiscoveryMap').then((m) => m.DiscoveryMap),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center rounded-lg bg-luma-sand/30 text-sm text-luma-ink/50">
        carregando mapa…
      </div>
    ),
  },
);
