'use client';

import { AnimatePresence, motion } from 'framer-motion';
import {
  Calendar,
  ChevronRight,
  FileText,
  Leaf,
  Minus,
  Package,
  Plus,
  ShipWheel,
  Snowflake,
  Thermometer,
  Timer,
  Trash2,
} from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useMemo } from 'react';

import { useCanvasStore } from '@/lib/canvas/store';
import { trpc } from '@/lib/trpc/react';
import { cn } from '@/lib/utils';
import { evaluateMany } from '@/lib/rules/product-availability';
import type { ProductSummary } from '@/server/repositories/types';

import { StatusChip } from '@/components/ui/StatusChip';

const CONTAINER_LABEL: Record<string, { pt: string; en: string }> = {
  REEFER_20: { pt: "20' Reefer", en: "20' Reefer" },
  REEFER_40: { pt: "40' Reefer", en: "40' Reefer" },
  REEFER_40_HC: { pt: "40' HC Reefer", en: "40' HC Reefer" },
  DRY_20: { pt: "20' Dry", en: "20' Dry" },
  DRY_40: { pt: "40' Dry", en: "40' Dry" },
};

const CONFIDENCE_LABEL: Record<string, { pt: string; en: string }> = {
  LOW: { pt: 'Baixa', en: 'Low' },
  MEDIUM: { pt: 'Média', en: 'Medium' },
  HIGH: { pt: 'Alta', en: 'High' },
};

function formatTempRange(min: number | null, max: number | null, l: 'pt' | 'en'): string {
  if (min === null && max === null) return l === 'pt' ? 'Ambiente' : 'Ambient';
  if (min !== null && max !== null && min === max) return `${min} °C`;
  if (min !== null && max !== null) return `${min} – ${max} °C`;
  return `${min ?? max} °C`;
}

function formatShelfLife(min: number | null, max: number | null, l: 'pt' | 'en'): string {
  const unit = l === 'pt' ? 'dias' : 'days';
  if (min === null && max === null) return '—';
  if (min !== null && max !== null && min === max) return `${min} ${unit}`;
  if (min !== null && max !== null) return `${min}–${max} ${unit}`;
  return `${min ?? max} ${unit}`;
}

function formatDate(date: Date | string, locale: string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat(locale === 'pt-br' ? 'pt-BR' : 'en-US', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(d);
}

export function ProductRail() {
  const locale = useLocale();
  const l = locale === 'pt-br' ? 'pt' : 'en';
  const t = useTranslations('productRail');

  const { stage, destination, selectedProductSlug, openPassport, closePassport } =
    useCanvasStore();

  const countryIso2 = destination.countryIso2;
  const visible = stage === 'originReveal' && Boolean(countryIso2);

  const productsQ = trpc.catalog.list.useQuery(undefined, { enabled: visible });
  const availabilityQ = trpc.availability.list.useQuery(undefined, { enabled: visible });
  const compliancesQ = trpc.compliance.previewsForCountry.useQuery(
    countryIso2 ? { countryIso2 } : { countryIso2: '' },
    { enabled: visible && Boolean(countryIso2) },
  );

  const loading = productsQ.isLoading || availabilityQ.isLoading || compliancesQ.isLoading;

  const products = useMemo(() => productsQ.data ?? [], [productsQ.data]);
  const availabilities = useMemo(() => availabilityQ.data ?? [], [availabilityQ.data]);
  const compliances = useMemo(() => compliancesQ.data ?? [], [compliancesQ.data]);

  const evaluation = useMemo(() => {
    const byProduct = new Map(compliances.map((c) => [c.productSlug, c]));
    return evaluateMany(
      products.map((p) => p.slug),
      availabilities,
      byProduct,
    );
  }, [products, availabilities, compliances]);

  const orderedProducts = useMemo(() => {
    const rank: Record<string, number> = {
      AVAILABLE_NOW: 0,
      LIMITED_AVAILABILITY: 1,
      PRE_RESERVE_OPEN: 2,
      UNDER_TECHNICAL_VALIDATION: 3,
      UNDER_CONSULTATION: 4,
      NOT_AVAILABLE_FOR_DESTINATION: 5,
    };
    return [...products].sort((a, b) => {
      const ra = rank[evaluation.get(a.slug)?.effectiveStatus ?? 'UNDER_CONSULTATION'] ?? 99;
      const rb = rank[evaluation.get(b.slug)?.effectiveStatus ?? 'UNDER_CONSULTATION'] ?? 99;
      if (ra !== rb) return ra - rb;
      return a.name.localeCompare(b.name);
    });
  }, [products, evaluation]);

  const onCardClick = (slug: string) => {
    if (selectedProductSlug === slug) closePassport();
    else openPassport(slug);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.aside
          key="product-rail"
          initial={{ opacity: 0, x: 32 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 32 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
          className={cn(
            'fixed z-20 flex flex-col',
            'right-4 top-24 bottom-4 md:right-6 md:top-28 md:bottom-6',
            'w-[min(420px,calc(100vw-2rem))]',
          )}
        >
          <header className="luma-glass rounded-t-2xl border-b border-black/5 px-5 py-4">
            <p className="text-[0.65rem] uppercase tracking-[0.3em] text-luma-olive/80">
              {t('eyebrow')}
            </p>
            <h2 className="mt-1 font-display text-xl font-light text-luma-ink leading-tight">
              {t('title')}
            </h2>
            <p className="mt-1 text-[11.5px] text-luma-ink/60">{t('subjectToValidation')}</p>
          </header>

          <div className="luma-glass flex-1 overflow-y-auto rounded-b-2xl shadow-xl shadow-black/10">
            {loading && (
              <div className="flex h-full items-center justify-center p-8">
                <p className="text-xs uppercase tracking-[0.3em] text-luma-ink/50">
                  {t('loading')}
                </p>
              </div>
            )}

            {!loading && orderedProducts.length === 0 && (
              <div className="flex h-full items-center justify-center p-8 text-center">
                <p className="text-sm text-luma-ink/60">{t('empty')}</p>
              </div>
            )}

            {!loading && orderedProducts.length > 0 && (
              <ul className="divide-y divide-black/5">
                {orderedProducts.map((product) => (
                  <ProductRow
                    key={product.id}
                    product={product}
                    status={
                      evaluation.get(product.slug)?.effectiveStatus ?? 'UNDER_CONSULTATION'
                    }
                    band={evaluation.get(product.slug)?.bestVolumeTonsBand ?? null}
                    expanded={selectedProductSlug === product.slug}
                    onClick={() => onCardClick(product.slug)}
                    locale={locale}
                    l={l}
                  />
                ))}
              </ul>
            )}
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}

function ProductRow({
  product,
  status,
  band,
  expanded,
  onClick,
  locale,
  l,
}: {
  product: ProductSummary;
  status: string;
  band: string | null;
  expanded: boolean;
  onClick: () => void;
  locale: string;
  l: 'pt' | 'en';
}) {
  const t = useTranslations('productRail');
  const { loadPlan } = useCanvasStore();
  const notAvailable = status === 'NOT_AVAILABLE_FOR_DESTINATION';
  const isFrozen = product.tempRangeMaxC !== null && product.tempRangeMaxC <= 0;
  const containerLbl =
    CONTAINER_LABEL[product.recommendedContainerKind]?.[l] ?? product.recommendedContainerKind;

  const itemsInPlan = loadPlan.items.filter((it) => it.productSlug === product.slug);

  return (
    <li className={cn('transition', notAvailable && 'opacity-60')}>
      {/* Header clicável */}
      <button
        type="button"
        onClick={onClick}
        disabled={notAvailable}
        className={cn(
          'w-full px-5 py-4 text-left transition',
          !notAvailable && 'hover:bg-luma-sand/30 cursor-pointer',
          notAvailable && 'cursor-not-allowed',
          expanded && 'bg-luma-sand/40',
        )}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="font-display text-base font-medium text-luma-ink leading-tight">
              {product.name}
            </p>
            {product.summary && !expanded && (
              <p className="mt-1 line-clamp-2 text-[12px] leading-relaxed text-luma-ink/65">
                {product.summary}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <StatusChip kind="availability" code={status} />
            <ChevronRight
              className={cn(
                'h-3.5 w-3.5 text-luma-ink/45 transition',
                expanded && 'rotate-90',
              )}
              strokeWidth={1.75}
            />
          </div>
        </div>

        {!expanded && (
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] text-luma-ink/70">
            <span className="inline-flex items-center gap-1">
              {isFrozen ? (
                <Snowflake className="h-3 w-3" strokeWidth={1.5} />
              ) : (
                <Thermometer className="h-3 w-3" strokeWidth={1.5} />
              )}
              {formatTempRange(product.tempRangeMinC, product.tempRangeMaxC, l)}
            </span>
            <span className="inline-flex items-center gap-1">
              <ShipWheel className="h-3 w-3" strokeWidth={1.5} />
              {containerLbl}
            </span>
            {band && (
              <span className="inline-flex items-center gap-1">
                <Package className="h-3 w-3" strokeWidth={1.5} />
                {band}
              </span>
            )}
            {itemsInPlan.length > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full bg-luma-olive/10 px-2 py-0.5 text-[10px] text-luma-olive">
                {itemsInPlan.length}× {t('inPlan')}
              </span>
            )}
          </div>
        )}
      </button>

      {/* Conteúdo expandido */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden bg-white/40"
          >
            <div className="px-5 py-4 space-y-4">
              {product.summary && (
                <p className="text-[12.5px] leading-relaxed text-luma-ink/75">
                  {product.summary}
                </p>
              )}

              <div className="grid grid-cols-2 gap-2">
                <QuickStat
                  icon={
                    isFrozen ? (
                      <Snowflake className="h-3 w-3" />
                    ) : (
                      <Thermometer className="h-3 w-3" />
                    )
                  }
                  label={t('temperature')}
                  value={formatTempRange(product.tempRangeMinC, product.tempRangeMaxC, l)}
                />
                <QuickStat
                  icon={<Timer className="h-3 w-3" />}
                  label={t('shelfLife')}
                  value={formatShelfLife(product.shelfLifeDaysMin, product.shelfLifeDaysMax, l)}
                />
                <QuickStat
                  icon={<ShipWheel className="h-3 w-3" />}
                  label={t('container')}
                  value={containerLbl}
                />
                <QuickStat
                  icon={<Package className="h-3 w-3" />}
                  label={t('volume')}
                  value={band ?? '—'}
                />
              </div>

              {/* Variedades + ações */}
              <DetailPanel product={product} locale={locale} l={l} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </li>
  );
}

function QuickStat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg bg-white/60 px-2.5 py-1.5 ring-1 ring-inset ring-black/5">
      <div className="flex items-center gap-1 text-[9px] uppercase tracking-[0.18em] text-luma-olive/80">
        {icon}
        {label}
      </div>
      <p className="mt-0.5 text-[12px] font-medium text-luma-ink">{value}</p>
    </div>
  );
}

/**
 * Painel de detalhamento — consome tRPC passport + compliance.
 * Mostra variedades com +/- de qty para as que estão no plano; Add para as que não estão.
 * Também lista availabilities, harvest windows e compliance preview de forma compacta.
 */
function DetailPanel({
  product,
  locale,
  l,
}: {
  product: ProductSummary;
  locale: string;
  l: 'pt' | 'en';
}) {
  const t = useTranslations('productRail');
  const { destination, loadPlan, addLoadItem, updateLoadItem, removeLoadItem } =
    useCanvasStore();

  const passportQ = trpc.catalog.passport.useQuery(
    { slug: product.slug },
    { staleTime: 60_000 },
  );
  const complianceQ = trpc.compliance.previewFor.useQuery(
    destination.countryIso2
      ? { productSlug: product.slug, countryIso2: destination.countryIso2 }
      : { productSlug: '', countryIso2: 'XX' },
    { enabled: Boolean(destination.countryIso2), staleTime: 60_000 },
  );

  const data = passportQ.data;
  const compliance = complianceQ.data;

  if (!data) {
    return (
      <p className="text-[11px] uppercase tracking-[0.28em] text-luma-ink/50">
        {t('loading')}
      </p>
    );
  }

  const getItem = (varietyId: string) =>
    loadPlan.items.find(
      (it) => it.productSlug === product.slug && it.varietyId === varietyId,
    );

  const handleAdd = (v: (typeof data.product.varieties)[number]) => {
    addLoadItem({
      productSlug: product.slug,
      productName: product.name,
      varietyId: v.id,
      varietyName: v.name,
      boxWeightKg: v.boxWeightKg,
      recommendedContainerKind: product.recommendedContainerKind,
      tempRangeMinC: product.tempRangeMinC,
      tempRangeMaxC: product.tempRangeMaxC,
      qtyBoxes: 100,
      qtyPallets: 1,
    });
  };

  return (
    <div className="space-y-4">
      {/* Variedades com qty */}
      <section>
        <SectionLabel>{t('varieties')}</SectionLabel>
        <ul className="mt-1.5 space-y-1.5">
          {data.product.varieties.map((v) => {
            const item = getItem(v.id);
            return (
              <li
                key={v.id}
                className="rounded-lg bg-white/60 px-3 py-2 ring-1 ring-inset ring-black/5"
              >
                <div className="flex items-center gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-[12.5px] font-medium text-luma-ink leading-tight">
                      {v.name}
                    </p>
                    <p className="text-[10.5px] text-luma-ink/55 tabular-nums">
                      {v.boxWeightKg} kg/cx · {v.palletConfig ?? '—'}
                    </p>
                  </div>
                  {item ? (
                    <button
                      onClick={() => removeLoadItem(item.localId)}
                      aria-label={t('remove')}
                      className="rounded-md p-1 text-luma-ink/45 transition hover:bg-luma-earth/10 hover:text-luma-earth"
                    >
                      <Trash2 className="h-3.5 w-3.5" strokeWidth={1.5} />
                    </button>
                  ) : (
                    <button
                      onClick={() => handleAdd(v)}
                      className="inline-flex items-center gap-1 rounded-md bg-luma-olive px-2 py-1 text-[11px] font-medium text-luma-offwhite transition hover:brightness-110"
                    >
                      <Plus className="h-3 w-3" strokeWidth={1.75} />
                      {t('add')}
                    </button>
                  )}
                </div>
                {item && (
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <QtyField
                      label={t('boxes')}
                      value={item.qtyBoxes}
                      step={10}
                      onChange={(n) => updateLoadItem(item.localId, { qtyBoxes: n })}
                    />
                    <QtyField
                      label={t('pallets')}
                      value={item.qtyPallets}
                      step={1}
                      onChange={(n) => updateLoadItem(item.localId, { qtyPallets: n })}
                    />
                  </div>
                )}
                {item && (
                  <p className="mt-1.5 text-[10.5px] text-luma-ink/55 tabular-nums">
                    {(item.qtyBoxes * item.boxWeightKg).toLocaleString(locale)} kg
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      </section>

      {/* Availability */}
      {data.availabilities.length > 0 && (
        <section>
          <SectionLabel>{t('availability')}</SectionLabel>
          <ul className="mt-1.5 space-y-1">
            {data.availabilities.slice(0, 3).map((a) => (
              <li
                key={a.id}
                className="flex flex-wrap items-center gap-x-3 gap-y-0.5 rounded-md bg-white/40 px-2.5 py-1.5 text-[11px] ring-1 ring-inset ring-black/5"
              >
                <span className="font-medium text-luma-ink">{a.originName}</span>
                {a.varietyName && (
                  <span className="text-luma-ink/55">· {a.varietyName}</span>
                )}
                <span className="ml-auto tabular-nums text-luma-ink/75">
                  {a.volumeTonsBand}
                </span>
                <StatusChip kind="availability" code={a.status} />
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Harvest windows */}
      {data.harvestWindows.length > 0 && (
        <section>
          <SectionLabel>
            <Calendar className="h-3 w-3" strokeWidth={1.5} />
            {t('harvest')}
          </SectionLabel>
          <ul className="mt-1.5 space-y-0.5">
            {data.harvestWindows.slice(0, 3).map((h, idx) => (
              <li
                key={idx}
                className="flex flex-wrap items-center gap-x-2 text-[11px] text-luma-ink/75"
              >
                <span>
                  {h.varietyName ?? '—'} — {formatDate(h.startDate, locale)} →{' '}
                  {formatDate(h.endDate, locale)}
                </span>
                <span className="text-luma-ink/50">
                  · {CONFIDENCE_LABEL[h.confidence]?.[l] ?? h.confidence}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Field updates */}
      {data.fieldUpdates.length > 0 && (
        <section>
          <SectionLabel>
            <Leaf className="h-3 w-3" strokeWidth={1.5} />
            {t('field')}
          </SectionLabel>
          <ul className="mt-1.5 space-y-1">
            {data.fieldUpdates.slice(0, 2).map((fu) => (
              <li key={fu.id} className="text-[11px] text-luma-ink/75">
                <span className="font-medium text-luma-ink">{fu.originName}</span>
                {' — '}
                <span>{fu.stage.replaceAll('_', ' ').toLowerCase()}</span>
                {fu.conditionNote && (
                  <span className="text-luma-ink/55"> · {fu.conditionNote}</span>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Documents */}
      {compliance && (
        <section>
          <SectionLabel>
            <FileText className="h-3 w-3" strokeWidth={1.5} />
            {t('documents')}
          </SectionLabel>
          <p className="mt-1 text-[10.5px] text-luma-ink/55">
            {compliance.countryName} · {compliance.documents.length} {t('docsExpected')}
          </p>
          <p className="mt-0.5 line-clamp-2 text-[11px] text-luma-ink/70">
            {compliance.documents.map((d) => d.code).join(' · ')}
          </p>
        </section>
      )}
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="flex items-center gap-1 text-[9.5px] uppercase tracking-[0.2em] text-luma-olive/80">
      {children}
    </p>
  );
}

function QtyField({
  label,
  value,
  step,
  onChange,
}: {
  label: string;
  value: number;
  step: number;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <label className="text-[0.55rem] uppercase tracking-[0.18em] text-luma-olive/80">
        {label}
      </label>
      <div className="mt-0.5 flex items-center overflow-hidden rounded-md ring-1 ring-inset ring-black/10 bg-white/70">
        <button
          type="button"
          onClick={() => onChange(Math.max(0, value - step))}
          className="p-1 text-luma-ink/60 transition hover:bg-luma-sand/60"
        >
          <Minus className="h-2.5 w-2.5" strokeWidth={1.75} />
        </button>
        <input
          type="number"
          min={0}
          step={step}
          value={value}
          onChange={(e) => onChange(Math.max(0, Number(e.target.value) || 0))}
          className="w-full bg-transparent px-1 py-1 text-center text-[11.5px] tabular-nums text-luma-ink outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
        />
        <button
          type="button"
          onClick={() => onChange(value + step)}
          className="p-1 text-luma-ink/60 transition hover:bg-luma-sand/60"
        >
          <Plus className="h-2.5 w-2.5" strokeWidth={1.75} />
        </button>
      </div>
    </div>
  );
}
