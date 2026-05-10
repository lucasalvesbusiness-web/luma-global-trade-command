'use client';

import { useEffect, useRef, useState } from 'react';

import { Button } from '@/components/ui/Button';
import { TechLabel } from '@/components/ui/TechLabel';
import { Textarea } from '@/components/ui/Textarea';
import { trpc } from '@/lib/trpc/react';
import { cn } from '@/lib/utils';

type Message = {
  id: string;
  body: string;
  createdAt: Date;
  author: {
    id: string;
    name: string | null;
    email: string;
    companyId: string | null;
  };
};

function initials(nameOrEmail: string) {
  const base = nameOrEmail.split('@')[0] ?? nameOrEmail;
  const parts = base.replace(/[._-]/g, ' ').trim().split(/\s+/);
  if (parts.length >= 2 && parts[0] && parts[1]) {
    return (parts[0][0]! + parts[1][0]!).toUpperCase();
  }
  return base.slice(0, 2).toUpperCase();
}

function formatTime(d: Date | string) {
  const date = new Date(d);
  return date.toLocaleString('pt-BR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function MessageThread({
  dealRoomId,
  viewerCompanyId,
  viewerUserId,
}: {
  dealRoomId: string;
  viewerCompanyId: string;
  viewerUserId: string;
}) {
  const messagesQ = trpc.dealRoom.messages.useQuery(
    { dealRoomId },
    { refetchInterval: 8000, refetchOnWindowFocus: true },
  );
  const send = trpc.dealRoom.sendMessage.useMutation({
    onSuccess: () => {
      messagesQ.refetch();
    },
  });

  const [body, setBody] = useState('');
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll on new messages.
  useEffect(() => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messagesQ.data?.length]);

  async function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault();
    if (!body.trim()) return;
    setError(null);
    try {
      await send.mutateAsync({ dealRoomId, body: body.trim() });
      setBody('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao enviar');
    }
  }

  function handleKey(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }

  const messages = (messagesQ.data ?? []) as Message[];

  return (
    <div className="flex h-full max-h-[60vh] flex-col">
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto pr-1"
        aria-live="polite"
      >
        {messagesQ.isLoading && messages.length === 0 ? (
          <p className="px-4 py-8 text-center text-xs text-ink-500">
            Carregando mensagens…
          </p>
        ) : messages.length === 0 ? (
          <div className="rounded-md border border-dashed border-white/10 px-6 py-12 text-center">
            <TechLabel className="mb-2">Sem mensagens</TechLabel>
            <p className="text-xs text-ink-400">
              Use este canal para alinhar escopo, prazos e pendências.
              <br />A contraparte é notificada por email se a conversa esfria por mais de 24h.
            </p>
          </div>
        ) : (
          <ul className="flex flex-col gap-4 py-2">
            {messages.map((m) => {
              const isMe = m.author.id === viewerUserId;
              const isMyCompany = m.author.companyId === viewerCompanyId;
              return (
                <li
                  key={m.id}
                  className={cn('flex gap-3', isMyCompany ? 'justify-end' : 'justify-start')}
                >
                  {!isMyCompany && (
                    <span className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-white/15 bg-ink-800 font-mono text-[10px] text-ink-300">
                      {initials(m.author.name ?? m.author.email)}
                    </span>
                  )}
                  <div
                    className={cn(
                      'flex max-w-[75%] flex-col gap-1',
                      isMyCompany ? 'items-end' : 'items-start',
                    )}
                  >
                    <div className="flex items-center gap-2 text-[9px] uppercase tracking-wider text-ink-500">
                      <span className="text-ink-300">
                        {isMe ? 'você' : (m.author.name ?? 'contraparte')}
                      </span>
                      <span className="font-mono">{formatTime(m.createdAt)}</span>
                    </div>
                    <div
                      className={cn(
                        'rounded-md border px-3 py-2 text-sm leading-relaxed whitespace-pre-line',
                        isMyCompany
                          ? 'border-amber/30 bg-amber/[0.06] text-ink-50'
                          : 'border-white/10 bg-ink-850 text-ink-100',
                      )}
                    >
                      {m.body}
                    </div>
                  </div>
                  {isMyCompany && (
                    <span className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-amber/40 bg-amber/10 font-mono text-[10px] text-amber-glow">
                      {initials(m.author.name ?? m.author.email)}
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <form
        onSubmit={handleSubmit}
        className="mt-4 flex flex-col gap-2 border-t border-white/[0.06] pt-4"
      >
        <Textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onKeyDown={handleKey}
          placeholder="Escreva. Enter envia, Shift+Enter quebra linha."
          rows={3}
          maxLength={4000}
          disabled={send.isPending}
        />
        {error && (
          <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-1.5 text-[10px] text-destructive">
            {error}
          </p>
        )}
        <div className="flex items-center justify-between">
          <span className="num-marker text-[10px] text-ink-500">
            {body.length}/4000
          </span>
          <Button type="submit" size="sm" disabled={!body.trim() || send.isPending}>
            {send.isPending ? 'Enviando…' : 'Enviar →'}
          </Button>
        </div>
      </form>
    </div>
  );
}
