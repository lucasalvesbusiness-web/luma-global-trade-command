'use client';

import type { HomeCompany } from '@/server/trpc/routers/home';
import { TechLabel } from '@/components/ui/TechLabel';
import { TimelineItem } from './TimelineItem';
import { useHomeStore } from '@/lib/home/store';

export function NearbyTimeline({ companies }: { companies: HomeCompany[] }) {
  const setRadius = useHomeStore((s) => s.setRadius);
  const radiusKm = useHomeStore((s) => s.radiusKm);

  const nearby = companies.filter((c) => !c.isConnected);

  return (
    <aside
      className="surface-graphite pointer-events-auto flex max-h-[calc(100vh-220px)] w-[320px] flex-col overflow-hidden rounded-md border border-white/[0.08] shadow-2xl backdrop-blur"
      aria-labelledby="nearby-heading"
    >
      <header className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3">
        <div>
          <TechLabel id="nearby-heading">No raio · não conectadas</TechLabel>
          <p className="mt-0.5 num-marker text-[10px] text-ink-500">
            raio {radiusKm} km
          </p>
        </div>
        <span className="num-marker text-sm text-ink-100">
          {String(nearby.length).padStart(2, '0')}
        </span>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {nearby.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <p className="text-xs text-ink-400">
              Nenhuma nova empresa no seu raio.
            </p>
            {radiusKm < 25 && (
              <button
                type="button"
                onClick={() => setRadius((radiusKm < 10 ? 10 : 25) as 10 | 25)}
                className="mt-3 text-[11px] uppercase tracking-wider text-amber-glow hover:underline"
              >
                Aumentar raio →
              </button>
            )}
          </div>
        ) : (
          <ul>
            {nearby.map((c) => (
              <li key={c.id}>
                <TimelineItem company={c} variant="nearby" />
              </li>
            ))}
          </ul>
        )}
      </div>
    </aside>
  );
}
