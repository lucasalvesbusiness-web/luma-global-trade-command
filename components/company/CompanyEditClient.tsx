'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import type { CompanyWithRelations } from '@/server/repositories/interfaces';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Textarea } from '@/components/ui/Textarea';
import { trpc } from '@/lib/trpc/react';

export function CompanyEditClient({ company }: { company: CompanyWithRelations }) {
  const router = useRouter();
  const update = trpc.company.updateMine.useMutation();
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    const num = (k: string) => {
      const v = fd.get(k);
      if (v === null || v === '') return undefined;
      const n = Number(v);
      return Number.isFinite(n) ? n : undefined;
    };

    try {
      await update.mutateAsync({
        tradeName: (fd.get('tradeName') as string) || null,
        description: (fd.get('description') as string) || null,
        city: (fd.get('city') as string) || null,
        state: (fd.get('state') as string) || null,
        latitude: num('latitude') ?? null,
        longitude: num('longitude') ?? null,
        serviceRadiusKm: num('serviceRadiusKm') ?? null,
      });
      router.push(`/company/${company.slug}`);
      router.refresh();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao atualizar';
      setError(message);
    }
  }

  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <Card>
        <CardHeader>
          <CardTitle>Editar empresa</CardTitle>
          <CardDescription>{company.legalName}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Field label="Nome fantasia" name="tradeName" defaultValue={company.tradeName ?? ''} />

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                name="description"
                defaultValue={company.description ?? ''}
                rows={4}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Cidade" name="city" defaultValue={company.city ?? ''} />
              <Field
                label="UF"
                name="state"
                maxLength={2}
                defaultValue={company.state ?? ''}
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <Field
                label="Latitude"
                name="latitude"
                type="number"
                step="0.000001"
                defaultValue={company.latitude?.toString() ?? ''}
              />
              <Field
                label="Longitude"
                name="longitude"
                type="number"
                step="0.000001"
                defaultValue={company.longitude?.toString() ?? ''}
              />
              <Field
                label="Raio (km)"
                name="serviceRadiusKm"
                type="number"
                min="1"
                defaultValue={company.serviceRadiusKm?.toString() ?? ''}
              />
            </div>

            {error && (
              <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </p>
            )}

            <Button type="submit" disabled={update.isPending}>
              {update.isPending ? 'Salvando…' : 'Salvar'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}

function Field({
  label,
  name,
  ...props
}: { label: string; name: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} name={name} {...props} />
    </div>
  );
}
