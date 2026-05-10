'use client';

import { useMemo } from 'react';

import { CompanyCard } from '@/components/discovery/CompanyCard';
import { DiscoveryMapLazy } from '@/components/canvas/DiscoveryMapLazy';
import { Filters } from '@/components/discovery/Filters';
import { useDiscoveryStore } from '@/lib/discovery/store';
import { trpc } from '@/lib/trpc/react';

export function DiscoveryClient() {
  const filters = useDiscoveryStore((s) => s.filters);

  const input = useMemo(() => {
    return {
      query: filters.query || undefined,
      categories: filters.categories.length > 0 ? filters.categories : undefined,
      modalities: filters.modalities.length > 0 ? filters.modalities : undefined,
      minVerification:
        filters.minVerification === 'UNVERIFIED' ? undefined : filters.minVerification,
      centerLat: filters.centerLat,
      centerLng: filters.centerLng,
      radiusKm: filters.radiusKm,
    };
  }, [filters]);

  const search = trpc.discovery.search.useQuery(input, {
    placeholderData: (prev) => prev,
  });

  const results = search.data ?? [];

  return (
    <main className="mx-auto flex h-screen max-w-7xl flex-col gap-4 px-6 py-6">
      <header className="flex items-baseline justify-between">
        <div>
          <p className="text-xs uppercase tracking-wider text-ink-400">Descobrir</p>
          <h1 className="font-display text-2xl">Empresas verificáveis</h1>
        </div>
        <p className="text-xs text-ink-300">
          {search.isFetching ? 'buscando…' : `${results.length} resultado(s)`}
        </p>
      </header>

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 lg:grid-cols-[320px_1fr_1fr]">
        <aside className="overflow-y-auto">
          <Filters />
        </aside>

        <section className="flex flex-col gap-3 overflow-y-auto pr-1">
          {results.length === 0 && !search.isFetching ? (
            <p className="rounded-lg border border-dashed border-white/15 p-6 text-center text-sm text-ink-400">
              Nenhuma empresa encontrada com os filtros atuais.
            </p>
          ) : (
            results.map((c) => <CompanyCard key={c.id} company={c} />)
          )}
        </section>

        <section className="hidden h-full lg:block">
          <DiscoveryMapLazy companies={results} className="h-full w-full overflow-hidden rounded-lg" />
        </section>
      </div>
    </main>
  );
}
