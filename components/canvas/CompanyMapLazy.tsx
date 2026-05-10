'use client';

import dynamic from 'next/dynamic';

export const CompanyMapLazy = dynamic(
  () => import('@/components/canvas/CompanyMap').then((m) => m.CompanyMap),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-72 w-full items-center justify-center rounded-lg bg-ink-850 text-sm text-ink-400">
        carregando mapa…
      </div>
    ),
  },
);
