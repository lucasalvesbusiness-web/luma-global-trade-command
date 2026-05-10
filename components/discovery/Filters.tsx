'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { useDiscoveryStore, WEDGE_CATEGORIES } from '@/lib/discovery/store';

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
                      ? 'border-luma-ink bg-luma-ink text-luma-offwhite'
                      : 'border-luma-ink/15 text-luma-ink/70 hover:border-luma-ink/30')
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
                      ? 'border-luma-ink bg-luma-ink text-luma-offwhite'
                      : 'border-luma-ink/15 text-luma-ink/70 hover:border-luma-ink/30')
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
            className="h-10 rounded-md border border-luma-ink/15 bg-luma-offwhite px-3 text-sm"
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
