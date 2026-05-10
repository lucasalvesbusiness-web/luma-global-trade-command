'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Textarea } from '@/components/ui/Textarea';
import { trpc } from '@/lib/trpc/react';

const WEDGE_CATEGORIES = [
  'Climatização',
  'Refrigeração',
  'Elétrica',
  'Manutenção predial',
  'Segurança eletrônica',
  'TI para PMEs',
  'Audiovisual corporativo',
  'Comunicação visual',
] as const;

type Modality = 'ONE_OFF' | 'RECURRING' | 'PRODUCT_SUPPLY';

type OfferingDraft = {
  category: string;
  modality: Modality;
};

export function OnboardingClient() {
  const router = useRouter();
  const create = trpc.company.create.useMutation();
  const [error, setError] = useState<string | null>(null);
  const [offerings, setOfferings] = useState<OfferingDraft[]>([
    { category: WEDGE_CATEGORIES[0], modality: 'ONE_OFF' },
  ]);

  function toggleOffering(category: string) {
    setOfferings((prev) => {
      const exists = prev.find((o) => o.category === category);
      if (exists) return prev.filter((o) => o.category !== category);
      return [...prev, { category, modality: 'ONE_OFF' }];
    });
  }

  function setModality(category: string, modality: Modality) {
    setOfferings((prev) =>
      prev.map((o) => (o.category === category ? { ...o, modality } : o)),
    );
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    // Offerings opcionais: empresa sem ofertas = só compradora.

    const lat = fd.get('latitude');
    const lng = fd.get('longitude');
    const radius = fd.get('serviceRadiusKm');

    try {
      const company = await create.mutateAsync({
        legalName: String(fd.get('legalName') ?? ''),
        tradeName: (fd.get('tradeName') as string) || undefined,
        taxId: String(fd.get('taxId') ?? ''),
        description: (fd.get('description') as string) || undefined,
        city: (fd.get('city') as string) || undefined,
        state: (fd.get('state') as string) || undefined,
        latitude: lat ? Number(lat) : undefined,
        longitude: lng ? Number(lng) : undefined,
        serviceRadiusKm: radius ? Number(radius) : undefined,
        offerings: offerings.map((o) => ({ category: o.category, modality: o.modality })),
      });
      router.push(`/c/${company.slug}`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao criar empresa';
      setError(message);
    }
  }

  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <Card>
        <CardHeader>
          <CardTitle>Cadastrar empresa</CardTitle>
          <CardDescription>
            Vamos montar seu perfil verificável. Você poderá editar tudo depois.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <Section title="Identidade">
              <Field label="Razão social" name="legalName" required />
              <Field label="Nome fantasia" name="tradeName" />
              <Field label="CNPJ (apenas dígitos)" name="taxId" required pattern="[0-9./-]{14,18}" />
            </Section>

            <Section title="Localização">
              <div className="grid grid-cols-2 gap-3">
                <Field label="Cidade" name="city" />
                <Field label="UF" name="state" maxLength={2} />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <Field label="Latitude" name="latitude" type="number" step="0.000001" />
                <Field label="Longitude" name="longitude" type="number" step="0.000001" />
                <Field label="Raio (km)" name="serviceRadiusKm" type="number" min="1" />
              </div>
            </Section>

            <Section title="Descrição">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="description">O que sua empresa faz</Label>
                <Textarea id="description" name="description" rows={4} />
              </div>
            </Section>

            <Section title="Categorias de atuação">
              <p className="text-xs text-ink-300">
                Selecione as categorias do wedge que sua empresa atende e a modalidade.
              </p>
              <div className="flex flex-col gap-2">
                {WEDGE_CATEGORIES.map((cat) => {
                  const selected = offerings.find((o) => o.category === cat);
                  return (
                    <div
                      key={cat}
                      className="flex items-center justify-between rounded-md border border-white/10 bg-ink-900 px-3 py-2"
                    >
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={!!selected}
                          onChange={() => toggleOffering(cat)}
                        />
                        {cat}
                      </label>
                      {selected && (
                        <select
                          className="rounded border border-white/15 bg-ink-900 px-2 py-1 text-xs"
                          value={selected.modality}
                          onChange={(e) => setModality(cat, e.target.value as Modality)}
                        >
                          <option value="ONE_OFF">Pontual</option>
                          <option value="RECURRING">Recorrente</option>
                          <option value="PRODUCT_SUPPLY">Fornecimento</option>
                        </select>
                      )}
                    </div>
                  );
                })}
              </div>
            </Section>

            {error && (
              <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </p>
            )}

            <Button type="submit" disabled={create.isPending}>
              {create.isPending ? 'Criando empresa…' : 'Criar empresa'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="flex flex-col gap-3 border-t border-white/5 pt-4 first:border-t-0 first:pt-0">
      <legend className="text-xs font-medium uppercase tracking-wider text-ink-400">
        {title}
      </legend>
      {children}
    </fieldset>
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
