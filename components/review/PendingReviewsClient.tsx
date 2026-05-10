'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Label } from '@/components/ui/Label';
import { Textarea } from '@/components/ui/Textarea';
import { trpc } from '@/lib/trpc/react';

type Item = {
  id: string;
  dealId: string;
  dealTitle: string;
  ratedCompany: { slug: string; legalName: string; tradeName: string | null };
};

export function PendingReviewsClient({ items }: { items: Item[] }) {
  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <header className="mb-6">
        <p className="text-xs uppercase tracking-wider text-luma-ink/50">Avaliações pendentes</p>
        <h1 className="font-display text-2xl">Avalie as contrapartes</h1>
        <p className="mt-2 text-sm text-luma-ink/60">
          Avaliações vinculadas a negócios concluídos compõem reputação contextual. Sem deal
          confirmado, não há review.
        </p>
      </header>

      {items.length === 0 ? (
        <p className="rounded-lg border border-dashed border-luma-ink/15 p-8 text-center text-sm text-luma-ink/60">
          Sem avaliações pendentes.
        </p>
      ) : (
        <ul className="flex flex-col gap-4">
          {items.map((it) => (
            <li key={it.id}>
              <ReviewForm item={it} />
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}

function ReviewForm({ item }: { item: Item }) {
  const router = useRouter();
  const submit = trpc.review.submit.useMutation();
  const [rating, setRating] = useState<number | null>(null);
  const [comment, setComment] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    if (!rating) {
      setError('Selecione uma nota.');
      return;
    }
    try {
      await submit.mutateAsync({
        reviewId: item.id,
        rating,
        comment: comment || undefined,
      });
      setDone(true);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro');
    }
  }

  if (done) {
    return (
      <Card>
        <CardContent className="py-6 text-center text-sm text-luma-ink/60">
          Obrigado. Sua avaliação foi registrada.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{item.ratedCompany.tradeName ?? item.ratedCompany.legalName}</CardTitle>
        <p className="text-xs text-luma-ink/60">
          Deal:{' '}
          <Link className="underline" href={`/deals/${item.dealId}`}>
            {item.dealTitle}
          </Link>
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label>Nota</Label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setRating(n)}
                  className={
                    'h-9 w-9 rounded-md border text-sm transition-colors ' +
                    (rating !== null && n <= rating
                      ? 'border-luma-ink bg-luma-ink text-luma-offwhite'
                      : 'border-luma-ink/15 text-luma-ink/50 hover:border-luma-ink/30')
                  }
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`comment-${item.id}`}>Comentário (opcional)</Label>
            <Textarea
              id={`comment-${item.id}`}
              rows={3}
              maxLength={1000}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
          </div>

          {error && (
            <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
              {error}
            </p>
          )}

          <Button type="submit" disabled={submit.isPending || !rating}>
            {submit.isPending ? 'Enviando…' : 'Enviar avaliação'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
