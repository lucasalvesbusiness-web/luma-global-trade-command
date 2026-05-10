'use client';

import { useState } from 'react';

import { Button } from '@/components/ui/Button';
import { trpc } from '@/lib/trpc/react';
import { cn } from '@/lib/utils';

export function WatchButton({ targetCompanyId }: { targetCompanyId: string }) {
  const isWatchingQ = trpc.watch.isWatching.useQuery(
    { targetCompanyId },
    { staleTime: 30_000 },
  );
  const toggle = trpc.watch.toggle.useMutation({
    onSuccess: () => isWatchingQ.refetch(),
  });
  const [error, setError] = useState<string | null>(null);

  const watching = isWatchingQ.data ?? false;

  async function handleClick() {
    setError(null);
    try {
      await toggle.mutateAsync({ targetCompanyId });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro');
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        variant={watching ? 'subtle' : 'outline'}
        size="sm"
        onClick={handleClick}
        disabled={toggle.isPending}
        className={cn(watching && 'border-amber/40 text-amber-glow')}
      >
        {watching ? '✓ Acompanhando' : '+ Acompanhar'}
      </Button>
      {error && <p className="text-[10px] text-destructive">{error}</p>}
    </div>
  );
}
