'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { Button } from '@/components/ui/Button';
import { trpc } from '@/lib/trpc/react';

export function InvitationActionClient({
  token,
  companySlug,
}: {
  token: string;
  companySlug: string;
}) {
  const router = useRouter();
  const accept = trpc.members.acceptByToken.useMutation();
  const [error, setError] = useState<string | null>(null);

  async function handleAccept() {
    setError(null);
    try {
      await accept.mutateAsync({ token });
      router.push(`/c/${companySlug}`);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro');
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-3">
        <Button onClick={handleAccept} disabled={accept.isPending} size="lg" className="flex-1">
          {accept.isPending ? 'Entrando…' : 'Aceitar convite →'}
        </Button>
      </div>
      {error && (
        <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
