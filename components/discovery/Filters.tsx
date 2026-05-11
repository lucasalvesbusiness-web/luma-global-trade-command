'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import {
  COMPANY_SIZE_LABELS,
  DELIVERY_MODE_LABELS,
  TARGET_SEGMENT_LABELS,
  useDiscoveryStore,
  WEDGE_CATEGORIES,
  type CompanySize,
  type DeliveryMode,
  type TargetSegment,
} from '@/lib/discovery/store';

export function Filters() {
  const { filters, setFilter, setLocation } = useDiscoveryStore();

  function toggleCategory(cat: string) {
    const next = filters.categories.includes(cat)
      ? filters.categories.filter((c) => c !== cat)
      : [...filters.categories, cat];
    setFilter('categories', next);
  }

  function toggleModality(m: 'ONE_OFF' | 'RECURRING' | 'PRODUCT_SUPPLY') {
    const next = filters.modalities.includes(m)
      ? filters.modalities.filter((x) => x !== m)
      : [...filters.modalities, m];
    setFilter('modalities', next);
  }

  function toggleSize(s: CompanySize) {
    const next = filters.companySizes.includes(s)
      ? filters.companySizes.filter((x) => x !== s)
      : [...filters.companySizes, s];
    setFilter('companySizes', next);
  }

  function toggleDelivery(d: DeliveryMode) {
    const next = filters.deliveryModes.includes(d)
      ? filters.deliveryModes.filter((x) => x !== d)
      : [...filters.deliveryModes, d];
    setFilter('deliveryModes', next);
  }

  function toggleSegment(s: TargetSegment) {
    const next = filters.targetSegments.includes(s)
      ? filters.targetSegments.filter((x) => x !== s)
      : [...filters.targetSegments, s];
    setFilter('targetSegments', next);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Filtros</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="search-query">Buscar</Label>
          <Input
            id="search-query"
            placeholder="nome, descrição…"
            value={filters.query}
            onChange={(e) => setFilter('query', e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label>Categorias</Label>
          <div className="flex flex-wrap gap-1.5">
            {WEDGE_CATEGORIES.map((cat) => {
              const active = filters.categories.includes(cat);
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => toggleCategory(cat)}
                  className={
                    'rounded-full border px-2.5 py-1 text-xs transition-colors ' +
                    (active
                      ? 'border-white/15 bg-ink-900 text-ink-50'
                      : 'border-white/15 text-ink-200 hover:border-white/30')
                  }
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label>Modalidade</Label>
          <div className="flex gap-1.5">
            {(['ONE_OFF', 'RECURRING', 'PRODUCT_SUPPLY'] as const).map((m) => {
              const active = filters.modalities.includes(m);
              const labels = { ONE_OFF: 'Pontual', RECURRING: 'Recorrente', PRODUCT_SUPPLY: 'Fornecimento' };
              return (
                <button
                  key={m}
                  type="button"
                  onClick={() => toggleModality(m)}
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
          <Label>Verificação mínima</Label>
          <select
            className="h-10 rounded-md border border-white/15 bg-ink-900 px-3 text-sm"
            value={filters.minVerification}
            onChange={(e) =>
              setFilter('minVerification', e.target.value as typeof filters.minVerification)
            }
          >
            <option value="UNVERIFIED">Qualquer</option>
            <option value="EMAIL_VERIFIED">Email verificado</option>
            <option value="DOC_VERIFIED">Documentação verificada</option>
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label>Porte da empresa</Label>
          <div className="flex flex-wrap gap-1.5">
            {(Object.keys(COMPANY_SIZE_LABELS) as CompanySize[]).map((s) => {
              const active = filters.companySizes.includes(s);
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => toggleSize(s)}
                  className={
                    'rounded-full border px-2.5 py-1 text-xs transition-colors ' +
                    (active
                      ? 'border-white/15 bg-ink-900 text-ink-50'
                      : 'border-white/15 text-ink-200 hover:border-white/30')
                  }
                >
                  {COMPANY_SIZE_LABELS[s]}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label>Modo de entrega</Label>
          <div className="flex gap-1.5">
            {(Object.keys(DELIVERY_MODE_LABELS) as DeliveryMode[]).map((d) => {
              const active = filters.deliveryModes.includes(d);
              return (
                <button
                  key={d}
                  type="button"
                  onClick={() => toggleDelivery(d)}
                  className={
                    'flex-1 rounded-md border px-2 py-1.5 text-xs transition-colors ' +
                    (active
                      ? 'border-white/15 bg-ink-900 text-ink-50'
                      : 'border-white/15 text-ink-200 hover:border-white/30')
                  }
                >
                  {DELIVERY_MODE_LABELS[d]}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label>Atende qual público</Label>
          <div className="flex flex-wrap gap-1.5">
            {(Object.keys(TARGET_SEGMENT_LABELS) as TargetSegment[]).map((s) => {
              const active = filters.targetSegments.includes(s);
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => toggleSegment(s)}
                  className={
                    'rounded-full border px-2.5 py-1 text-xs transition-colors ' +
                    (active
                      ? 'border-white/15 bg-ink-900 text-ink-50'
                      : 'border-white/15 text-ink-200 hover:border-white/30')
                  }
                >
                  {TARGET_SEGMENT_LABELS[s]}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="min-deals">Mín. deals confirmados</Label>
            <Input
              id="min-deals"
              type="number"
              min={0}
              placeholder="0"
              value={filters.minConfirmedDeals ?? ''}
              onChange={(e) =>
                setFilter(
                  'minConfirmedDeals',
                  e.target.value ? Number(e.target.value) : undefined,
                )
              }
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="has-evidence">Evidência aprovada</Label>
            <label
              htmlFor="has-evidence"
              className="flex h-10 items-center gap-2 rounded-md border border-white/15 bg-ink-900 px-3 text-xs text-ink-200"
            >
              <input
                id="has-evidence"
                type="checkbox"
                checked={filters.hasEvidence}
                onChange={(e) => setFilter('hasEvidence', e.target.checked)}
                className="accent-amber"
              />
              <span>Apenas com evidência</span>
            </label>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label>Geo (lat, lng, raio km)</Label>
          <div className="grid grid-cols-3 gap-2">
            <Input
              type="number"
              step="0.000001"
              placeholder="lat"
              value={filters.centerLat ?? ''}
              onChange={(e) =>
                setLocation(
                  e.target.value ? Number(e.target.value) : undefined,
                  filters.centerLng,
                  filters.radiusKm,
                )
              }
            />
            <Input
              type="number"
              step="0.000001"
              placeholder="lng"
              value={filters.centerLng ?? ''}
              onChange={(e) =>
                setLocation(
                  filters.centerLat,
                  e.target.value ? Number(e.target.value) : undefined,
                  filters.radiusKm,
                )
              }
            />
            <Input
              type="number"
              min="1"
              placeholder="km"
              value={filters.radiusKm ?? ''}
              onChange={(e) =>
                setLocation(
                  filters.centerLat,
                  filters.centerLng,
                  e.target.value ? Number(e.target.value) : undefined,
                )
              }
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
