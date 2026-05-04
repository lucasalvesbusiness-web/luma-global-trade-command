'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ArrowRight } from 'lucide-react';

import { trpc } from '@/lib/trpc/react';
import { cn } from '@/lib/utils';

const inputCls =
  'w-full rounded-md border border-black/10 bg-white/80 px-3 py-2 text-[13.5px] text-luma-ink outline-none focus:border-luma-olive focus:ring-2 focus:ring-luma-olive/25';
const labelCls =
  'text-[0.62rem] uppercase tracking-[0.24em] text-luma-olive/80 font-medium';

const INCOTERMS = ['FOB', 'CFR', 'CIF', 'DAP', 'DDP', 'EXW'];

export function OnboardingClient({
  company,
  countries,
  products,
}: {
  company: {
    legalName: string;
    displayName: string | null;
    city: string | null;
    address: string | null;
    contactPhone: string | null;
    defaultIncoterm: string | null;
    estimatedMonthlyVolume: string | null;
    productsOfInterest: string[];
    targetMarkets: string[];
  };
  countries: { iso2: string; name: string }[];
  products: { slug: string; name: string }[];
}) {
  const router = useRouter();
  const completeM = trpc.buyer.completeOnboarding.useMutation({
    onSuccess: () => {
      router.replace('/');
      router.refresh();
    },
  });

  const [displayName, setDisplayName] = useState(company.displayName ?? '');
  const [city, setCity] = useState(company.city ?? '');
  const [address, setAddress] = useState(company.address ?? '');
  const [phone, setPhone] = useState(company.contactPhone ?? '');
  const [incoterm, setIncoterm] = useState(company.defaultIncoterm ?? '');
  const [volume, setVolume] = useState(company.estimatedMonthlyVolume ?? '');
  const [productsSel, setProductsSel] = useState<string[]>(company.productsOfInterest);
  const [markets, setMarkets] = useState<string[]>(company.targetMarkets);

  function toggle(arr: string[], v: string, setter: (n: string[]) => void) {
    setter(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);
  }

  return (
    <main className="min-h-svh flex items-center justify-center p-6 bg-luma-offwhite">
      <div
        aria-hidden
        className="absolute inset-0 -z-10"
        style={{
          background:
            'radial-gradient(ellipse at 30% 30%, hsl(var(--luma-sand) / 0.55) 0%, hsl(var(--luma-offwhite)) 70%)',
        }}
      />
      <div className="luma-glass w-full max-w-2xl rounded-2xl p-8 shadow-xl shadow-black/10">
        <p className="text-[0.68rem] uppercase tracking-[0.4em] text-luma-olive/80">
          Onboarding
        </p>
        <h1 className="mt-2 font-display text-2xl font-light text-luma-ink">
          Bem-vindo, {company.legalName}
        </h1>
        <p className="mt-2 text-[13px] leading-relaxed text-luma-ink/65">
          Para personalizar seu canvas, complete os dados abaixo. Você pode editar
          depois.
        </p>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            completeM.mutate({
              displayName: displayName.trim() || undefined,
              city: city.trim() || undefined,
              address: address.trim() || undefined,
              contactPhone: phone.trim() || undefined,
              defaultIncoterm: incoterm.trim() || undefined,
              estimatedMonthlyVolume: volume.trim() || undefined,
              productsOfInterest: productsSel,
              targetMarkets: markets,
            });
          }}
          className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-2"
        >
          <div className="md:col-span-2">
            <label className={labelCls}>Nome de exibição</label>
            <input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder={company.legalName}
              className={cn(inputCls, 'mt-1')}
            />
          </div>
          <div>
            <label className={labelCls}>Cidade</label>
            <input
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className={cn(inputCls, 'mt-1')}
            />
          </div>
          <div>
            <label className={labelCls}>Telefone</label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className={cn(inputCls, 'mt-1')}
            />
          </div>
          <div className="md:col-span-2">
            <label className={labelCls}>Endereço</label>
            <input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className={cn(inputCls, 'mt-1')}
            />
          </div>
          <div>
            <label className={labelCls}>Incoterm padrão</label>
            <select
              value={incoterm}
              onChange={(e) => setIncoterm(e.target.value)}
              className={cn(inputCls, 'mt-1')}
            >
              <option value="">Selecione…</option>
              {INCOTERMS.map((i) => (
                <option key={i} value={i}>
                  {i}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls}>Volume mensal estimado</label>
            <input
              value={volume}
              onChange={(e) => setVolume(e.target.value)}
              placeholder="Ex: 200 ton, 5 contêineres"
              className={cn(inputCls, 'mt-1')}
            />
          </div>

          <div className="md:col-span-2">
            <label className={labelCls}>Produtos de interesse</label>
            <div className="mt-1 flex flex-wrap gap-1.5">
              {products.map((p) => {
                const on = productsSel.includes(p.slug);
                return (
                  <button
                    type="button"
                    key={p.slug}
                    onClick={() => toggle(productsSel, p.slug, setProductsSel)}
                    className={cn(
                      'rounded-full px-2.5 py-1 text-[11.5px] font-medium ring-1 ring-inset transition',
                      on
                        ? 'bg-luma-olive text-white ring-luma-olive'
                        : 'bg-white/70 text-luma-ink/75 ring-black/10 hover:text-luma-ink',
                    )}
                  >
                    {p.name}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="md:col-span-2">
            <label className={labelCls}>Mercados de destino</label>
            <div className="mt-1 max-h-40 overflow-auto rounded-md bg-white/60 p-2 ring-1 ring-inset ring-black/5">
              <div className="flex flex-wrap gap-1.5">
                {countries.map((c) => {
                  const on = markets.includes(c.iso2);
                  return (
                    <button
                      type="button"
                      key={c.iso2}
                      onClick={() => toggle(markets, c.iso2, setMarkets)}
                      className={cn(
                        'rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset transition',
                        on
                          ? 'bg-luma-olive text-white ring-luma-olive'
                          : 'bg-white/70 text-luma-ink/75 ring-black/10 hover:text-luma-ink',
                      )}
                    >
                      {c.name}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {completeM.error && (
            <div className="md:col-span-2 rounded-md bg-red-50 px-3 py-2 text-[12.5px] text-red-700 ring-1 ring-inset ring-red-200">
              {completeM.error.message}
            </div>
          )}

          <div className="md:col-span-2 mt-2 flex justify-end">
            <button
              type="submit"
              disabled={completeM.isPending}
              className="inline-flex items-center gap-1.5 rounded-full bg-luma-olive px-4 py-2 text-[12.5px] font-medium text-white shadow-sm transition hover:opacity-90 disabled:opacity-50"
            >
              {completeM.isPending ? 'Salvando…' : 'Concluir e acessar'}
              <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.5} />
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
