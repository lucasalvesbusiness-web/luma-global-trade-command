'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, Container, Package } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useMemo } from 'react';

import { useCanvasStore } from '@/lib/canvas/store';
import { findContainer } from '@/data/seed/containers';
import { evaluateLoadPlan } from '@/lib/rules/load-plan';
import { cn } from '@/lib/utils';

/**
 * Dock inferior sempre visível quando estamos no Vale — mesmo sem item ou
 * container, atua como FAB "Abrir Container Builder". Mostra métricas ao vivo
 * quando há dados.
 */
export function LoadPlanTray() {
  const locale = useLocale();
  const t = useTranslations('tray');
  const { loadPlan, builderOpen, openBuilder, reviewOpen } = useCanvasStore();

  const evaluation = useMemo(
    () => evaluateLoadPlan(loadPlan.containerCode, loadPlan.items),
    [loadPlan.containerCode, loadPlan.items],
  );

  const container = loadPlan.containerCode ? findContainer(loadPlan.containerCode) : null;
  const hasAny = loadPlan.items.length > 0 || loadPlan.containerCode !== null;
  const critical = evaluation.alerts.some((a) => a.severity === 'critical');

  // Não aparece quando o Builder ou Review já estão abertos
  if (builderOpen || reviewOpen) return null;

  return (
    <AnimatePresence>
      <motion.button
        type="button"
        key="tray"
        onClick={openBuilder}
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 80, opacity: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1], delay: 0.4 }}
        className={cn(
          'fixed bottom-6 left-1/2 z-20 flex -translate-x-1/2 items-center gap-5',
          'luma-glass rounded-full px-5 py-3 shadow-2xl shadow-black/20',
          'hover:shadow-black/30 transition cursor-pointer',
        )}
      >
        <div className="flex items-center gap-2">
          <Container className="h-4 w-4 text-luma-olive" strokeWidth={1.5} />
          <span className="text-[11px] uppercase tracking-[0.25em] text-luma-ink/70">
            {container
              ? locale === 'pt-br'
                ? container.displayNamePtBr
                : container.displayName
              : t('buildCargo')}
          </span>
        </div>

        {hasAny && (
          <>
            <span className="h-5 w-px bg-luma-ink/15" />
            <div className="flex items-center gap-2 text-[12px] text-luma-ink/80">
              <Package className="h-3.5 w-3.5 text-luma-olive/70" strokeWidth={1.5} />
              <span className="tabular-nums">
                {loadPlan.items.length} {t('items')}
              </span>
            </div>

            <span className="h-5 w-px bg-luma-ink/15" />

            <span className="font-mono text-[13px] tabular-nums text-luma-ink">
              {Math.round(evaluation.metrics.totalWeightKg).toLocaleString(locale)} kg
            </span>

            <span className="h-5 w-px bg-luma-ink/15" />

            <span
              className={cn(
                'rounded-full px-2 py-0.5 text-[11px] tabular-nums',
                evaluation.metrics.occupationPct > 1
                  ? 'bg-[hsl(var(--luma-earth)_/_0.15)] text-[hsl(var(--luma-earth))]'
                  : 'bg-luma-olive/10 text-luma-olive',
              )}
            >
              {Math.round(evaluation.metrics.occupationPct * 100)}%
            </span>

            {critical && (
              <span className="flex items-center gap-1 rounded-full bg-[hsl(var(--luma-earth)_/_0.12)] px-2 py-0.5 text-[11px] text-[hsl(var(--luma-earth))]">
                <AlertTriangle className="h-3 w-3" strokeWidth={1.75} />
                {t('alerts')}
              </span>
            )}
          </>
        )}

        <span className="ml-2 text-[11px] uppercase tracking-[0.22em] text-luma-olive">
          {t('open')}
        </span>
      </motion.button>
    </AnimatePresence>
  );
}
