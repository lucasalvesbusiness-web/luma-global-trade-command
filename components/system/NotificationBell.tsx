'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

import { Button } from '@/components/ui/Button';
import { TechLabel } from '@/components/ui/TechLabel';
import { trpc } from '@/lib/trpc/react';
import { cn } from '@/lib/utils';

function relativeTime(d: Date | string) {
  const ms = Date.now() - new Date(d).getTime();
  const min = Math.floor(ms / 60000);
  if (min < 1) return 'agora';
  if (min < 60) return `${min}m`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  const unread = trpc.notifications.unreadCount.useQuery(undefined, {
    refetchInterval: 30_000,
    refetchOnWindowFocus: true,
  });
  const list = trpc.notifications.list.useQuery(
    { limit: 20 },
    { enabled: open, refetchOnWindowFocus: false },
  );
  const markRead = trpc.notifications.markRead.useMutation({
    onSuccess: () => {
      unread.refetch();
      list.refetch();
    },
  });
  const markAll = trpc.notifications.markAllRead.useMutation({
    onSuccess: () => {
      unread.refetch();
      list.refetch();
    },
  });

  // Click outside to close.
  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!open) return;
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  const count = unread.data ?? 0;
  const items = list.data ?? [];

  function handleItemClick(id: string) {
    markRead.mutate({ ids: [id] });
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'relative flex h-9 w-9 items-center justify-center rounded-md transition-colors',
          open
            ? 'bg-amber/10 text-amber-glow'
            : 'text-ink-400 hover:bg-white/[0.04] hover:text-ink-100',
        )}
        title={`${count} notificação(ões) não lida(s)`}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
          className="h-4 w-4"
        >
          <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
          <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
        </svg>
        {count > 0 && (
          <span className="absolute right-1.5 top-1.5 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-amber px-1 font-mono text-[8px] font-semibold text-spectre-carbon">
            {count > 9 ? '9+' : count}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute left-full top-0 z-40 ml-3 w-80 origin-top-left rounded-md border border-white/[0.08] bg-ink-900 shadow-2xl">
          <header className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3">
            <TechLabel dot>Notificações</TechLabel>
            {count > 0 && (
              <button
                type="button"
                onClick={() => markAll.mutate()}
                disabled={markAll.isPending}
                className="text-[10px] uppercase tracking-wider text-ink-400 hover:text-amber-glow disabled:opacity-50"
              >
                Marcar todas como lidas
              </button>
            )}
          </header>

          <div className="max-h-96 overflow-y-auto">
            {list.isLoading ? (
              <p className="px-4 py-6 text-center text-xs text-ink-500">Carregando…</p>
            ) : items.length === 0 ? (
              <p className="px-4 py-8 text-center text-xs text-ink-500">
                Sem notificações.
              </p>
            ) : (
              <ul>
                {items.map((n) => {
                  const Inner = (
                    <div
                      className={cn(
                        'flex cursor-pointer items-start gap-3 border-b border-white/[0.04] px-4 py-3 last:border-b-0 transition-colors hover:bg-white/[0.02]',
                        !n.readAt && 'bg-amber/[0.04]',
                      )}
                    >
                      <span
                        className={cn(
                          'mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full',
                          n.readAt ? 'bg-ink-600' : 'bg-amber',
                        )}
                      />
                      <div className="min-w-0 flex-1">
                        <p
                          className={cn(
                            'text-sm leading-snug',
                            n.readAt ? 'text-ink-300' : 'text-ink-100',
                          )}
                        >
                          {n.title}
                        </p>
                        {n.body && (
                          <p className="mt-0.5 line-clamp-2 text-xs text-ink-400">
                            {n.body}
                          </p>
                        )}
                        <p className="mt-1 font-mono text-[9px] uppercase tracking-wider text-ink-500">
                          {relativeTime(n.createdAt)}
                        </p>
                      </div>
                    </div>
                  );
                  return (
                    <li key={n.id} onClick={() => handleItemClick(n.id)}>
                      {n.link ? (
                        <Link href={n.link} onClick={() => setOpen(false)}>
                          {Inner}
                        </Link>
                      ) : (
                        Inner
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <footer className="border-t border-white/[0.06] px-4 py-2.5 text-center">
            <Button asChild variant="ghost" size="sm" className="text-[10px]">
              <Link href="/inbox" onClick={() => setOpen(false)}>
                Ver tudo na caixa →
              </Link>
            </Button>
          </footer>
        </div>
      )}
    </div>
  );
}
