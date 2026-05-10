'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Textarea } from '@/components/ui/Textarea';
import { trpc } from '@/lib/trpc/react';

type Modality = 'ONE_OFF' | 'RECURRING' | 'PRODUCT_SUPPLY';

export function OpenDealDialog({
  supplierSlug,
  supplierName,
  availableModalities,
}: {
  supplierSlug: string;
  supplierName: string;
  availableModalities: Modality[];
}) {
  const router = useRouter();
  const open = trpc.dealRoom.open.useMutation();
  const [show, setShow] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [template, setTemplate] = useState<Modality>(availableModalities[0] ?? 'ONE_OFF');

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    const summary = String(fd.get('summary') ?? '');
    const title = String(fd.get('title') ?? '').trim();
    if (!title || summary.length < 8) {
      setError('Preencha título e resumo (mínimo 8 caracteres).');
      return;
    }

    let scopePayload: unknown;
    if (template === 'ONE_OFF') {
      scopePayload = { summary };
    } else if (template === 'RECURRING') {
      scopePayload = { summary, cadence: 'MONTHLY', cyclesCount: 3 };
    } else {
      scopePayload = {
        summary,
        itemDescription: title,
        quantity: 1,
        unit: 'un',
      };
    }

    try {
      const created = await open.mutateAsync({
        supplierCompanySlug: supplierSlug,
        template,
        title,
        scopePayload,
      });
      router.push(`/d/${created.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao abrir deal');
    }
  }

  if (!show) {
    return (
      <Button onClick={() => setShow(true)}>Abrir deal com {supplierName}</Button>
    );
  }

  return (
    <div className="rounded-lg border border-white/15 bg-ink-850 p-4">
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="title">Título do deal</Label>
          <Input id="title" name="title" required maxLength={160} />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label>Modalidade</Label>
          <div className="flex gap-2">
            {availableModalities.map((m) => {
              const labels: Record<Modality, string> = {
                ONE_OFF: 'Pontual',
                RECURRING: 'Recorrente',
                PRODUCT_SUPPLY: 'Fornecimento',
              };
              const active = m === template;
              return (
                <button
                  key={m}
                  type="button"
                  onClick={() => setTemplate(m)}
                  className={
                    'flex-1 rounded-md border px-2 py-1.5 text-xs transition-colors ' +
                    (active
                      ? 'border-white/15 bg-ink-900 text-ink-50'
                      : 'border-white/15 text-ink-200 hover:border-white/30')
                  }
                >
                  {labels[m]}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="summary">Resumo / escopo inicial</Label>
          <Textarea id="summary" name="summary" rows={3} required minLength={8} />
        </div>

        {error && (
          <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
            {error}
          </p>
        )}

        <div className="flex gap-2">
          <Button type="submit" disabled={open.isPending}>
            {open.isPending ? 'Abrindo…' : 'Abrir deal'}
          </Button>
          <Button type="button" variant="outline" onClick={() => setShow(false)}>
            Cancelar
          </Button>
        </div>
      </form>
    </div>
  );
}
