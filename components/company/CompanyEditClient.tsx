'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import type { VerificationArtifact } from '@prisma/client';
import type { CompanyWithRelations } from '@/server/repositories/interfaces';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Textarea } from '@/components/ui/Textarea';
import { trpc } from '@/lib/trpc/react';

export function CompanyEditClient({
  company,
  artifacts,
}: {
  company: CompanyWithRelations;
  artifacts: VerificationArtifact[];
}) {
  const router = useRouter();
  const update = trpc.company.updateMine.useMutation();
  const upload = trpc.verification.uploadArtifact.useMutation();
  const [error, setError] = useState<string | null>(null);
  const [artUrl, setArtUrl] = useState('');
  const [artKind, setArtKind] = useState<'TAX_ID_CARD' | 'ADDRESS_PROOF' | 'OTHER'>('TAX_ID_CARD');
  const [artNotes, setArtNotes] = useState('');

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

  async function uploadArtifact() {
    if (!artUrl) return;
    setError(null);
    try {
      await upload.mutateAsync({
        kind: artKind,
        url: artUrl,
        notes: artNotes || undefined,
      });
      setArtUrl('');
      setArtNotes('');
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao subir artefato');
    }
  }

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-6 px-6 py-12">
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

      <Card>
        <CardHeader>
          <CardTitle>Verificação documental</CardTitle>
          <CardDescription>
            Suba cartão CNPJ + comprovante de endereço para passar a status DOC_VERIFIED após
            revisão manual.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {artifacts.length > 0 && (
            <ul className="flex flex-col gap-2">
              {artifacts.map((a) => (
                <li
                  key={a.id}
                  className="flex items-center justify-between rounded-md border border-luma-ink/10 px-3 py-2 text-sm"
                >
                  <div className="min-w-0 flex-1">
                    <a href={a.url} target="_blank" rel="noreferrer" className="truncate underline">
                      {a.kind} · {a.url}
                    </a>
                    {a.notes && <p className="mt-1 text-xs text-luma-ink/60">{a.notes}</p>}
                  </div>
                  <Badge
                    variant={
                      a.status === 'APPROVED'
                        ? 'verified'
                        : a.status === 'REJECTED'
                          ? 'warning'
                          : 'outline'
                    }
                  >
                    {a.status}
                  </Badge>
                </li>
              ))}
            </ul>
          )}

          <div className="rounded-md border border-dashed border-luma-ink/15 p-3">
            <div className="flex flex-col gap-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="artKind">Tipo</Label>
                <select
                  id="artKind"
                  className="h-10 rounded-md border border-luma-ink/15 bg-luma-offwhite px-3 text-sm"
                  value={artKind}
                  onChange={(e) => setArtKind(e.target.value as typeof artKind)}
                >
                  <option value="TAX_ID_CARD">Cartão CNPJ</option>
                  <option value="ADDRESS_PROOF">Comprovante de endereço</option>
                  <option value="OTHER">Outro</option>
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="artUrl">URL do arquivo (público ou signed)</Label>
                <Input
                  id="artUrl"
                  placeholder="https://…"
                  value={artUrl}
                  onChange={(e) => setArtUrl(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="artNotes">Observações (opcional)</Label>
                <Textarea
                  id="artNotes"
                  rows={2}
                  maxLength={500}
                  value={artNotes}
                  onChange={(e) => setArtNotes(e.target.value)}
                />
              </div>
              <Button onClick={uploadArtifact} disabled={!artUrl || upload.isPending}>
                {upload.isPending ? 'Enviando…' : 'Enviar para verificação'}
              </Button>
            </div>
          </div>
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
