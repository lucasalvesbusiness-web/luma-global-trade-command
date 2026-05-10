'use client';

import { useMemo, useState } from 'react';
import type { AuditEvent } from '@prisma/client';

import { cn } from '@/lib/utils';

const ENTITY_TYPES = ['DealRoom', 'Evidence', 'Review'] as const;
type EntityType = (typeof ENTITY_TYPES)[number];

function timestamp(d: Date | string): string {
  const date = typeof d === 'string' ? new Date(d) : d;
  return date
    .toISOString()
    .replace('T', ' ')
    .replace(/\..*$/, '');
}

export function AuditLog({ events }: { events: AuditEvent[] }) {
  const [filter, setFilter] = useState<EntityType | 'ALL'>('ALL');

  const filtered = useMemo(
    () =>
      filter === 'ALL'
        ? events
        : events.filter((e) => e.entityType === filter),
    [events, filter],
  );

  return (
    <div className="flex h-full flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="tech-label">Audit log</span>
        <span className="num-marker text-[10px] text-ink-500">
          {String(filtered.length).padStart(3, '0')}
        </span>
      </div>

      <div className="flex flex-wrap gap-1">
        {(['ALL', ...ENTITY_TYPES] as const).map((kind) => {
          const active = filter === kind;
          return (
            <button
              key={kind}
              type="button"
              onClick={() => setFilter(kind as EntityType | 'ALL')}
              className={cn(
                'rounded-sm border px-2 py-0.5 text-[9px] uppercase tracking-wider transition-colors',
                active
                  ? 'border-amber/50 bg-amber/10 text-amber-glow'
                  : 'border-white/10 text-ink-400 hover:border-white/25 hover:text-ink-200',
              )}
            >
              {kind === 'ALL' ? 'Tudo' : kind}
            </button>
          );
        })}
      </div>

      <div className="-mx-3 flex-1 overflow-y-auto pr-1">
        {filtered.length === 0 ? (
          <p className="px-3 py-2 text-[11px] text-ink-500">Sem eventos.</p>
        ) : (
          <ul className="font-mono text-[10.5px] leading-relaxed">
            {filtered.map((e) => (
              <li
                key={e.id}
                className="group cursor-default border-l-2 border-transparent px-3 py-1.5 transition-colors hover:border-amber/40 hover:bg-amber/[0.04]"
              >
                <div className="text-ink-500">{timestamp(e.createdAt)}</div>
                <div className="mt-0.5">
                  <span className="text-ink-200">{e.action}</span>
                  {e.fromStatus && e.toStatus && (
                    <span className="ml-2 text-ink-400">
                      {e.fromStatus} → <span className="text-ink-100">{e.toStatus}</span>
                    </span>
                  )}
                </div>
                <div className="text-ink-600">
                  {e.entityType}:{e.entityId.slice(-8)}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
