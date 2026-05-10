'use client';

import Link from 'next/link';
import { useState } from 'react';

import { TechLabel } from '@/components/ui/TechLabel';
import { trpc } from '@/lib/trpc/react';
import { cn } from '@/lib/utils';

type Scope = 'all' | 'watching' | 'my';

const TYPE_LABELS: Record<string, string> = {
  DEAL_CONFIRMED: 'concluiu um negócio',
  COMPANY_VERIFIED: 'foi verificada',
  COMPANY_JOINED: 'entrou na rede',
};

const TYPE_DOT: Record<string, string> = {
  DEAL_CONFIRMED: 'bg-amber',
  COMPANY_VERIFIED: 'bg-amber-glow',
  COMPANY_JOINED: 'bg-ink-300',
};

function relativeTime(d: Date | string) {
  const ms = Date.now() - new Date(d).getTime();
  const min = Math.floor(ms / 60000);
  if (min < 1) return 'agora';
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}h`;
  const days = Math.floor(h / 24);
  if (days < 30) return `${days}d`;
  const months = Math.floor(days / 30);
  return `${months}m`;
}

export function ActivityFeed() {
  const [scope, setScope] = useState<Scope>('all');
  const feed = trpc.activity.feed.useQuery({ scope, limit: 20 });

  const events = feed.data ?? [];

  return (
    <section className="rounded-md border border-white/[0.07] bg-ink-850/60">
      <header className="flex items-center justify-between border-b border-white/[0.05] px-5 py-3">
        <div className="flex items-center gap-3">
          <span className="num-marker text-xs text-amber/80">§02</span>
          <h2 className="display-md text-sm text-ink-100">Atividade da rede</h2>
        </div>
        <div className="flex gap-1">
          {(
            [
              { id: 'all', label: 'Toda rede' },
              { id: 'watching', label: 'Acompanho' },
              { id: 'my', label: 'Minha' },
            ] as const
          ).map((t) => {
            const active = scope === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setScope(t.id as Scope)}
                className={cn(
                  'rounded-sm border px-2 py-0.5 text-[9px] uppercase tracking-wider transition-colors',
                  active
                    ? 'border-amber/50 bg-amber/10 text-amber-glow'
                    : 'border-white/10 text-ink-400 hover:border-white/25 hover:text-ink-200',
                )}
              >
                {t.label}
              </button>
            );
          })}
        </div>
      </header>

      <div className="px-5 py-3">
        {events.length === 0 ? (
          <p className="py-6 text-center text-xs text-ink-500">
            {feed.isLoading
              ? 'Carregando…'
              : scope === 'watching'
                ? 'Você ainda não acompanha nenhuma empresa.'
                : 'Sem atividade recente.'}
          </p>
        ) : (
          <ul className="flex flex-col">
            {events.map((e) => {
              const meta = (e.metadata as { title?: string; role?: string } | null) ?? {};
              return (
                <li
                  key={e.id}
                  className="group flex items-start gap-3 border-b border-white/[0.04] py-3 last:border-b-0"
                >
                  <span
                    className={cn(
                      'mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full',
                      TYPE_DOT[e.type] ?? 'bg-ink-500',
                    )}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm leading-relaxed text-ink-200">
                      <Link
                        href={`/c/${e.actor.slug}`}
                        className="text-ink-100 hover:text-amber-glow"
                      >
                        {e.actor.tradeName ?? e.actor.legalName}
                      </Link>{' '}
                      <span className="text-ink-400">
                        {TYPE_LABELS[e.type] ?? e.type.toLowerCase()}
                      </span>
                      {e.subject && e.type === 'DEAL_CONFIRMED' && (
                        <>
                          {' '}
                          <span className="text-ink-400">
                            {meta.role === 'BUYER' ? 'comprando de' : 'vendendo para'}
                          </span>{' '}
                          <Link
                            href={`/c/${e.subject.slug}`}
                            className="text-ink-100 hover:text-amber-glow"
                          >
                            {e.subject.tradeName ?? e.subject.legalName}
                          </Link>
                        </>
                      )}
                      {meta.title && (
                        <span className="ml-2 italic text-ink-400">— {meta.title}</span>
                      )}
                    </p>
                    <p className="mt-0.5 text-[10px] text-ink-500">
                      {relativeTime(e.createdAt)} atrás
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}
