'use client';

import dynamic from 'next/dynamic';

export const CompanyMapLazy = dynamic(
  () => import('@/components/canvas/CompanyMap').then((m) => m.CompanyMap),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-72 w-full items-center justify-center rounded-lg bg-luma-sand/30 text-sm text-luma-ink/50">
        carregando mapa…
      </div>
    ),
  },
);
