'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import type { VerificationArtifact } from '@prisma/client';
import type { CompanyWithRelations } from '@/server/repositories/interfaces';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { TechLabel } from '@/components/ui/TechLabel';
import { Textarea } from '@/components/ui/Textarea';
import { trpc } from '@/lib/trpc/react';
import { cn } from '@/lib/utils';
import { TeamSection } from './TeamSection';

type Section = 'identity' | 'location' | 'description' | 'offerings' | 'verification' | 'team';

const SECTIONS: Array<{ id: Section; code: string; label: string; available: boolean }> = [
  { id: 'identity', code: '00', label: 'Identidade', available: true },
  { id: 'location', code: '01', label: 'Localização', available: true },
  { id: 'description', code: '02', label: 'Descrição', available: true },
  { id: 'offerings', code: '03', label: 'Ofertas', available: false },
  { id: 'verification', code: '04', label: 'Verificação', available: true },
  { id: 'team', code: '05', label: 'Equipe', available: true },
];

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
  const [active, setActive] = useState<Section>('identity');
  const [error, setError] = useState<string | null>(null);
  const [savedFlash, setSavedFlash] = useState<Section | null>(null);

  // Identity
  const [tradeName, setTradeName] = useState(company.tradeName ?? '');
  const [heroImageUrl, setHeroImageUrl] = useState(company.heroImageUrl ?? '');
  // Location
  const [city, setCity] = useState(company.city ?? '');
  const [stateCode, setStateCode] = useState(company.state ?? '');
  const [latitude, setLatitude] = useState(company.latitude?.toString() ?? '');
  const [longitude, setLongitude] = useState(company.longitude?.toString() ?? '');
  const [radius, setRadius] = useState(company.serviceRadiusKm?.toString() ?? '');
  // Description
  const [description, setDescription] = useState(company.description ?? '');
  // Verification artifact
  const [artUrl, setArtUrl] = useState('');
  const [artKind, setArtKind] = useState<'TAX_ID_CARD' | 'ADDRESS_PROOF' | 'OTHER'>('TAX_ID_CARD');
  const [artNotes, setArtNotes] = useState('');

  function flashSaved(section: Section) {
    setSavedFlash(section);
    window.setTimeout(() => setSavedFlash(null), 1800);
  }

  function num(s: string) {
    if (!s) return undefined;
    const n = Number(s);
    return Number.isFinite(n) ? n : undefined;
  }

  async function saveSection(section: Section) {
    setError(null);
    try {
      if (section === 'identity') {
        await update.mutateAsync({
          tradeName: tradeName || null,
          heroImageUrl: heroImageUrl || null,
        });
      } else if (section === 'location') {
        await update.mutateAsync({
          city: city || null,
          state: stateCode || null,
          latitude: num(latitude) ?? null,
          longitude: num(longitude) ?? null,
          serviceRadiusKm: num(radius) ?? null,
        });
      } else if (section === 'description') {
        await update.mutateAsync({ description: description || null });
      }
      flashSaved(section);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar');
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
    <main className="mx-auto max-w-layout px-6 py-10 md:px-10">
      <header className="mb-8">
        <TechLabel dot className="mb-2">
          {company.slug}
        </TechLabel>
        <h1 className="display-xl text-3xl text-ink-50 md:text-4xl">{company.legalName}</h1>
        <p className="mt-2 text-sm text-ink-400">Edite os dados da sua empresa.</p>
      </header>

      <div className="grid gap-6 md:grid-cols-[220px_minmax(0,1fr)]">
        {/* Section nav */}
        <aside className="md:sticky md:top-6 md:self-start">
          <ol className="flex flex-row gap-1 overflow-x-auto md:flex-col">
            {SECTIONS.map((s) => {
              const isActive = active === s.id;
              return (
                <li key={s.id}>
                  <button
                    type="button"
                    onClick={() => s.available && setActive(s.id)}
                    disabled={!s.available}
                    className={cn(
                      'flex w-full items-center gap-3 whitespace-nowrap rounded-md border-l-2 px-3 py-2 text-left text-[11px] uppercase tracking-wider transition-colors',
                      isActive
                        ? 'border-amber bg-amber/[0.06] text-amber-glow'
                        : 'border-transparent text-ink-400 hover:bg-white/[0.03] hover:text-ink-200',
                      !s.available && 'opacity-40',
                    )}
                  >
                    <span className="num-marker text-[10px]">§{s.code}</span>
                    <span className="flex-1">{s.label}</span>
                    {!s.available && <span className="text-[9px] text-ink-500">P7</span>}
                  </button>
                </li>
              );
            })}
          </ol>
        </aside>

        {/* Section content */}
        <div className="rounded-md border border-white/[0.07] bg-ink-900 p-6 md:p-8">
          {error && (
            <p className="mb-4 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
              {error}
            </p>
          )}

          {active === 'identity' && (
            <SectionWrap title="Identidade" code="00" saved={savedFlash === 'identity'}>
              <ReadOnlyRow label="Razão social" value={company.legalName} />
              <ReadOnlyRow label="CNPJ" value={company.taxId} />
              <Field
                label="Nome fantasia"
                value={tradeName}
                onChange={setTradeName}
                placeholder="ex: Refrigera Sul"
              />
              <Field
                label="Foto de capa (URL)"
                value={heroImageUrl}
                onChange={setHeroImageUrl}
                placeholder="https://… (aparece no popup do mapa)"
              />
              <SaveButton onClick={() => saveSection('identity')} pending={update.isPending} />
            </SectionWrap>
          )}

          {active === 'location' && (
            <SectionWrap title="Localização" code="01" saved={savedFlash === 'location'}>
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <Field label="Cidade" value={city} onChange={setCity} />
                </div>
                <Field label="UF" value={stateCode} onChange={setStateCode} maxLength={2} />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <Field
                  label="Latitude"
                  type="number"
                  step="0.000001"
                  value={latitude}
                  onChange={setLatitude}
                />
                <Field
                  label="Longitude"
                  type="number"
                  step="0.000001"
                  value={longitude}
                  onChange={setLongitude}
                />
                <Field
                  label="Raio (km)"
                  type="number"
                  min="1"
                  value={radius}
                  onChange={setRadius}
                />
              </div>
              <SaveButton onClick={() => saveSection('location')} pending={update.isPending} />
            </SectionWrap>
          )}

          {active === 'description' && (
            <SectionWrap title="Descrição" code="02" saved={savedFlash === 'description'}>
              <div className="flex flex-col gap-2">
                <Label htmlFor="desc">Descrição pública</Label>
                <Textarea
                  id="desc"
                  rows={8}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
              <SaveButton
                onClick={() => saveSection('description')}
                pending={update.isPending}
              />
            </SectionWrap>
          )}

          {active === 'verification' && (
            <SectionWrap
              title="Verificação documental"
              code="04"
              saved={false}
              hint="Suba cartão CNPJ + comprovante de endereço. Após revisão manual, sua empresa passa a DOC_VERIFIED."
            >
              {artifacts.length > 0 && (
                <ul className="flex flex-col gap-1 font-mono text-[11px]">
                  {artifacts.map((a) => (
                    <li
                      key={a.id}
                      className="flex items-center gap-3 rounded-md border border-white/[0.07] bg-ink-850 px-3 py-2"
                    >
                      <span className="w-20 shrink-0 text-[10px] uppercase tracking-wider text-ink-400">
                        {a.kind === 'TAX_ID_CARD'
                          ? 'cnpj'
                          : a.kind === 'ADDRESS_PROOF'
                            ? 'endereço'
                            : 'outro'}
                      </span>
                      <a
                        href={a.url}
                        target="_blank"
                        rel="noreferrer"
                        className="min-w-0 flex-1 truncate text-ink-200 underline decoration-amber/30 underline-offset-4 hover:text-amber-glow"
                      >
                        {a.url}
                      </a>
                      <span
                        className={cn(
                          'rounded-sm border px-2 py-0.5 text-[9px] uppercase tracking-wider',
                          a.status === 'APPROVED'
                            ? 'border-amber/40 bg-amber/10 text-amber-glow'
                            : a.status === 'REJECTED'
                              ? 'border-yellow-500/40 bg-yellow-500/10 text-yellow-300'
                              : 'border-white/15 bg-ink-800 text-ink-300',
                        )}
                      >
                        {a.status}
                      </span>
                    </li>
                  ))}
                </ul>
              )}

              <div className="rounded-md border border-dashed border-white/10 p-4">
                <TechLabel className="mb-3">Subir artefato</TechLabel>
                <div className="grid gap-3 md:grid-cols-[180px_1fr]">
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="artKind">Tipo</Label>
                    <select
                      id="artKind"
                      className="h-10 rounded-md border border-white/10 bg-ink-800 px-2 text-xs text-ink-100 focus:border-amber/60 focus:outline-none"
                      value={artKind}
                      onChange={(e) => setArtKind(e.target.value as typeof artKind)}
                    >
                      <option value="TAX_ID_CARD">Cartão CNPJ</option>
                      <option value="ADDRESS_PROOF">Comprovante de endereço</option>
                      <option value="OTHER">Outro</option>
                    </select>
                  </div>
                  <Field label="URL do arquivo" value={artUrl} onChange={setArtUrl} />
                </div>
                <div className="mt-3 flex flex-col gap-1.5">
                  <Label htmlFor="artNotes">Observações (opcional)</Label>
                  <Textarea
                    id="artNotes"
                    rows={2}
                    maxLength={500}
                    value={artNotes}
                    onChange={(e) => setArtNotes(e.target.value)}
                  />
                </div>
                <Button
                  onClick={uploadArtifact}
                  disabled={!artUrl || upload.isPending}
                  size="sm"
                  className="mt-3"
                >
                  {upload.isPending ? 'Enviando…' : 'Enviar para verificação →'}
                </Button>
              </div>
            </SectionWrap>
          )}

          {active === 'team' && <TeamSection />}
        </div>
      </div>
    </main>
  );
}

function SectionWrap({
  title,
  code,
  saved,
  hint,
  children,
}: {
  title: string;
  code: string;
  saved: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-5">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="num-marker text-xs text-amber/80">§{code}</span>
          <h2 className="display-md text-lg text-ink-50">{title}</h2>
        </div>
        {saved && (
          <span className="num-marker text-[10px] text-amber-glow animate-amber-pulse">
            ✓ salvo
          </span>
        )}
      </header>
      {hint && <p className="text-xs leading-relaxed text-ink-400">{hint}</p>}
      {children}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = 'text',
  ...rest
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'type'>) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label>{label}</Label>
      <Input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        {...rest}
      />
    </div>
  );
}

function ReadOnlyRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-white/[0.04] py-3">
      <Label>{label}</Label>
      <span className="font-mono text-xs text-ink-200">{value}</span>
    </div>
  );
}

function SaveButton({ onClick, pending }: { onClick: () => void; pending: boolean }) {
  return (
    <div className="flex justify-end pt-2">
      <Button onClick={onClick} disabled={pending}>
        {pending ? 'Salvando…' : 'Salvar →'}
      </Button>
    </div>
  );
}
