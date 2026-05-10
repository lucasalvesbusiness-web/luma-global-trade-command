'use client';

import type { HomeCompany } from '@/server/trpc/routers/home';
import { TechLabel } from '@/components/ui/TechLabel';
import { TimelineItem } from './TimelineItem';

export function ConnectedTimeline({ companies }: { companies: HomeCompany[] }) {
  const connected = companies.filter((c) => c.isConnected);

  return (
    <aside
      className="surface-graphite pointer-events-auto flex max-h-[calc(100vh-220px)] w-[320px] flex-col overflow-hidden rounded-md border border-amber/30 shadow-2xl backdrop-blur"
      aria-labelledby="connected-heading"
    >
      <header className="flex items-center justify-between border-b border-amber/20 bg-amber/[0.04] px-4 py-3">
        <div>
          <TechLabel dot id="connected-heading">
            Sua rede
          </TechLabel>
          <p className="mt-0.5 font-mono text-[10px] uppercase tracking-wider text-amber-glow/80">
            no raio
          </p>
        </div>
        <span className="num-marker text-sm text-amber-glow">
          {String(connected.length).padStart(2, '0')}
        </span>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {connected.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <p className="text-xs text-ink-400">
              Você ainda não tem conexões no raio.
            </p>
            <p className="mt-2 text-[10px] text-ink-500">
              Acompanhe empresas ou feche um deal pra começar.
            </p>
          </div>
        ) : (
          <ul>
            {connected.map((c) => (
              <li key={c.id}>
                <TimelineItem company={c} variant="connected" />
              </li>
            ))}
          </ul>
        )}
      </div>
    </aside>
  );
}
