'use client';

import { useState } from 'react';

import type { Company, VerificationArtifact } from '@prisma/client';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { trpc } from '@/lib/trpc/react';

type Item = VerificationArtifact & { company: Company };

export function VerificationsAdminClient({ initialItems }: { initialItems: Item[] }) {
  const [items, setItems] = useState(initialItems);
  const review = trpc.verification.review.useMutation();

  async function handleReview(id: string, status: 'APPROVED' | 'REJECTED') {
    await review.mutateAsync({ artifactId: id, status });
    setItems((prev) => prev.filter((it) => it.id !== id));
  }

  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      <header className="mb-6">
        <p className="text-xs uppercase tracking-wider text-luma-ink/50">Admin</p>
        <h1 className="font-display text-2xl">Verificações pendentes</h1>
      </header>

      {items.length === 0 ? (
        <p className="text-sm text-luma-ink/60">Nenhuma verificação pendente no momento.</p>
      ) : (
        <ul className="flex flex-col gap-4">
          {items.map((item) => (
            <li key={item.id}>
              <Card>
                <CardHeader>
                  <CardTitle>{item.company.tradeName ?? item.company.legalName}</CardTitle>
                  <p className="text-xs uppercase tracking-wider text-luma-ink/50">
                    {item.kind} · CNPJ {item.company.taxId}
                  </p>
                </CardHeader>
                <CardContent>
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm underline"
                  >
                    Ver artefato
                  </a>
                  {item.notes && (
                    <p className="mt-2 text-sm text-luma-ink/70">{item.notes}</p>
                  )}
                  <div className="mt-4 flex gap-2">
                    <Button
                      onClick={() => handleReview(item.id, 'APPROVED')}
                      disabled={review.isPending}
                    >
                      Aprovar
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleReview(item.id, 'REJECTED')}
                      disabled={review.isPending}
                    >
                      Rejeitar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
