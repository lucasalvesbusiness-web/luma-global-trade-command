'use client';

import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertTriangle,
  Info,
  ShipWheel,
  Snowflake,
  Thermometer,
  X,
} from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useMemo } from 'react';

import { useCanvasStore } from '@/lib/canvas/store';
import { findContainer, seedContainerTypes } from '@/data/seed/containers';
import { evaluateLoadPlan, type LoadAlert } from '@/lib/rules/load-plan';
import { cn } from '@/lib/utils';

import { IsometricContainer } from '@/components/canvas/IsometricContainer';

/**
 * Container Builder — painel lateral esquerdo compacto.
 * Quantidades são controladas no ProductRail (cada variedade). Aqui o
 * Builder mostra o container, métricas ao vivo, itens como lista read-only
 * e alertas. Tudo visível sem scroll em viewports ≥ 720px de altura.
 */
export function ContainerBuilder() {
  const locale = useLocale();
  const t = useTranslations('builder');

  const {
    builderOpen,
    closeBuilder,
    loadPlan,
    setContainer,
    clearLoadPlan,
    openReview,
  } = useCanvasStore();

  const container = loadPlan.containerCode ? findContainer(loadPlan.containerCode) : null;

  const evaluation = useMemo(
    () => evaluateLoadPlan(loadPlan.containerCode, loadPlan.items),
    [loadPlan.containerCode, loadPlan.items],
  );

  const hasCritical = evaluation.alerts.some((a) => a.severity === 'critical');
  const canReview = loadPlan.items.length > 0 && loadPlan.containerCode !== null;

  return (
    <AnimatePresence>
      {builderOpen && (
        <motion.aside
          key="builder-panel"
          initial={{ opacity: 0, x: -32 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -32 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className={cn(
            'fixed z-20 flex flex-col',
            'left-4 top-24 bottom-20 md:left-6 md:top-28 md:bottom-24',
            'w-[min(380px,calc(100vw-2rem))]',
          )}
        >
          {/* Header */}
          <header className="luma-glass rounded-t-2xl border-b border-black/5 px-4 py-3 flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-[0.62rem] uppercase tracking-[0.3em] text-luma-olive/80">
                {t('eyebrow')}
              </p>
              <h2 className="mt-0.5 font-display text-lg font-light text-luma-ink leading-tight">
                {t('title')}
              </h2>
            </div>
            <button
              onClick={closeBuilder}
              aria-label={t('close')}
              className="rounded-full bg-white/60 p-1.5 text-luma-ink/70 shadow-sm transition hover:bg-white/90"
            >
              <X className="h-3.5 w-3.5" strokeWidth={1.75} />
            </button>
          </header>

          {/* Body — compacto, sem rolagem em telas ≥ 720px */}
          <div className="luma-glass flex-1 overflow-y-auto shadow-xl shadow-black/10 divide-y divide-black/5">
            {/* Seletor de container */}
            <section className="px-4 py-3">
              <SectionLabel>{t('selectContainer')}</SectionLabel>
              <div className="mt-2 grid grid-cols-2 gap-1.5">
                {seedContainerTypes.map((c) => {
                  const selected = loadPlan.containerCode === c.code;
                  return (
                    <button
                      key={c.code}
                      type="button"
                      onClick={() => setContainer(c.code)}
                      className={cn(
                        'rounded-lg px-2 py-2 text-left text-[11px] transition ring-1 ring-inset',
                        selected
                          ? 'bg-luma-olive/10 ring-luma-olive/40 text-luma-ink'
                          : 'bg-white/55 ring-black/5 text-luma-ink/80 hover:bg-white/80',
                      )}
                    >
                      <div className="flex items-center gap-1">
                        {c.supportsReefer ? (
                          <Snowflake className="h-3 w-3 text-luma-river" strokeWidth={1.5} />
                        ) : (
                          <ShipWheel className="h-3 w-3 text-luma-earth" strokeWidth={1.5} />
                        )}
                        <span className="font-medium leading-tight">
                          {locale === 'pt-br' ? c.displayNamePtBr : c.displayName}
                        </span>
                      </div>
                      <p className="mt-0.5 text-[9.5px] text-luma-ink/55 tabular-nums">
                        {c.maxPallets} pal · {(c.maxPayloadKg / 1000).toFixed(1)} t
                      </p>
                    </button>
                  );
                })}
              </div>
            </section>

            {/* Vista cutaway */}
            <section className="px-4 py-3">
              <SectionLabel>{t('preview')}</SectionLabel>
              <div className="mt-2">
                <IsometricContainer
                  container={container ?? null}
                  items={loadPlan.items}
                  occupationPct={evaluation.metrics.occupationPct}
                  alertsCritical={hasCritical}
                />
              </div>
              <p className="mt-1.5 text-[10px] leading-relaxed text-luma-ink/55">
                {t('approximationDisclaimer')}
              </p>
            </section>

            {/* Métricas */}
            <section className="grid grid-cols-3 gap-1.5 px-4 py-3">
              <Metric
                label={t('metrics.weight')}
                value={`${Math.round(evaluation.metrics.totalWeightKg).toLocaleString(locale)} kg`}
                sub={
                  evaluation.metrics.maxPayloadKg
                    ? `${Math.round(evaluation.metrics.weightPct * 100)}%`
                    : '—'
                }
                over={evaluation.metrics.weightPct > 1}
              />
              <Metric
                label={t('metrics.pallets')}
                value={`${evaluation.metrics.totalPallets}`}
                sub={evaluation.metrics.maxPallets ? `/ ${evaluation.metrics.maxPallets}` : '—'}
                over={evaluation.metrics.palletPct > 1}
              />
              <Metric
                label={t('metrics.occupation')}
                value={`${Math.round(evaluation.metrics.occupationPct * 100)}%`}
                sub=""
                over={evaluation.metrics.occupationPct > 1}
              />
            </section>

            {/* Items — read-only (quantidades vivem no ProductRail) */}
            <section className="px-4 py-3">
              <SectionLabel>
                {t('loadItems')} ({loadPlan.items.length})
              </SectionLabel>
              {loadPlan.items.length === 0 ? (
                <p className="mt-2 rounded-lg border border-dashed border-luma-ink/15 px-3 py-3 text-center text-[11px] text-luma-ink/55">
                  {t('emptyItemsHint')}
                </p>
              ) : (
                <ul className="mt-2 space-y-1">
                  {loadPlan.items.map((it) => (
                    <li
                      key={it.localId}
                      className="flex items-center justify-between gap-2 rounded-md bg-white/55 px-2.5 py-1.5 text-[11.5px] ring-1 ring-inset ring-black/5"
                    >
                      <span className="min-w-0 flex-1 truncate">
                        <span className="font-medium text-luma-ink">{it.productName}</span>
                        <span className="text-luma-ink/55"> · {it.varietyName}</span>
                      </span>
                      <span className="tabular-nums text-luma-ink/70">
                        {it.qtyBoxes}×{it.qtyPallets}pal
                      </span>
                    </li>
                  ))}
                </ul>
              )}
              {container?.supportsReefer && (
                <div className="mt-2 flex items-center gap-1.5 text-[10.5px] text-luma-ink/65">
                  <Thermometer className="h-3 w-3" strokeWidth={1.5} />
                  <span>
                    {t('configuredTemp')}:{' '}
                    <span className="tabular-nums">
                      {loadPlan.configuredTempC !== null
                        ? `${loadPlan.configuredTempC} °C`
                        : '—'}
                    </span>
                  </span>
                </div>
              )}
            </section>

            {/* Alertas */}
            {evaluation.alerts.length > 0 && (
              <section className="px-4 py-3 space-y-1.5">
                <SectionLabel className="text-luma-earth/80">{t('alerts')}</SectionLabel>
                {evaluation.alerts.map((a, i) => (
                  <AlertCard key={i} alert={a} />
                ))}
              </section>
            )}
          </div>

          {/* Footer */}
          <footer className="luma-glass rounded-b-2xl border-t border-black/5 px-4 py-3 space-y-1.5">
            <button
              type="button"
              onClick={openReview}
              disabled={!canReview}
              className={cn(
                'group flex w-full items-center justify-center gap-2 rounded-md px-4 py-2 text-[13px] font-medium transition',
                canReview
                  ? 'bg-luma-olive text-luma-offwhite shadow-sm hover:brightness-110'
                  : 'bg-luma-ink/10 text-luma-ink/45 cursor-not-allowed',
              )}
            >
              {t('reviewAndSubmit')}
            </button>
            <div className="flex items-center justify-between gap-2">
              <button
                onClick={clearLoadPlan}
                className="text-[10px] uppercase tracking-[0.2em] text-luma-ink/55 transition hover:text-luma-earth"
              >
                {t('clearAll')}
              </button>
              <p className="text-[9.5px] uppercase tracking-[0.22em] text-luma-ink/55">
                {t('subjectToValidation')}
              </p>
            </div>
          </footer>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}

function SectionLabel({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <p
      className={cn(
        'text-[0.58rem] uppercase tracking-[0.26em] text-luma-olive/80',
        className,
      )}
    >
      {children}
    </p>
  );
}

function Metric({
  label,
  value,
  sub,
  over,
}: {
  label: string;
  value: string;
  sub: string;
  over: boolean;
}) {
  return (
    <div
      className={cn(
        'rounded-lg px-2 py-1.5 ring-1 ring-inset',
        over
          ? 'bg-[hsl(var(--luma-earth)_/_0.08)] ring-[hsl(var(--luma-earth)_/_0.35)]'
          : 'bg-white/55 ring-black/5',
      )}
    >
      <p className="text-[0.5rem] uppercase tracking-[0.18em] text-luma-olive/80 leading-tight">
        {label}
      </p>
      <p className="font-mono text-[11.5px] tabular-nums text-luma-ink leading-tight mt-0.5">
        {value}
      </p>
      {sub && <p className="text-[9px] text-luma-ink/55 leading-tight mt-0.5">{sub}</p>}
    </div>
  );
}

function AlertCard({ alert }: { alert: LoadAlert }) {
  const t = useTranslations();
  const Icon = alert.severity === 'critical' ? AlertTriangle : Info;
  const tone =
    alert.severity === 'critical'
      ? 'bg-[hsl(var(--luma-earth)_/_0.1)] text-[hsl(var(--luma-earth))] ring-[hsl(var(--luma-earth)_/_0.3)]'
      : alert.severity === 'warning'
        ? 'bg-[hsl(var(--luma-sun)_/_0.12)] text-[hsl(var(--luma-earth))] ring-[hsl(var(--luma-sun)_/_0.35)]'
        : 'bg-[hsl(var(--luma-sand)_/_0.55)] text-[hsl(var(--luma-ink)_/_0.75)] ring-black/5';
  const message = t(alert.messageKey, alert.messageParams as never);
  return (
    <div
      className={cn(
        'flex items-start gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] leading-relaxed ring-1 ring-inset',
        tone,
      )}
    >
      <Icon className="mt-0.5 h-3 w-3 flex-shrink-0" strokeWidth={1.75} />
      <p>{message}</p>
    </div>
  );
}
