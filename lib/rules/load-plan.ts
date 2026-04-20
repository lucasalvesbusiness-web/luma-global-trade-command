/**
 * Rules engine do Load Plan.
 *
 * Avalia um rascunho (container + items) e retorna métricas + alertas.
 * Pura e testável. Respeita briefing §9:
 *  R11 Carga mista gera alerta
 *  R12 Frozen não mistura com fresh sem validação
 *  R13 Dry para dry goods; R14 reefer para frutas frescas
 *  R15 Temperatura incompatível → alerta
 */

import type { ContainerCode, LoadPlanItem } from '@/lib/canvas/types';
import { findContainer } from '@/data/seed/containers';

export type LoadAlert = {
  code:
    | 'OVERWEIGHT'
    | 'OVER_PALLETS'
    | 'TEMPERATURE_CONFLICT'
    | 'FROZEN_FRESH_MIX'
    | 'DRY_REEFER_MISMATCH'
    | 'EMPTY_LOAD';
  severity: 'info' | 'warning' | 'critical';
  messageKey: string; // chave i18n (resolvida na UI)
  messageParams?: Record<string, string | number>;
};

export type LoadMetrics = {
  totalBoxes: number;
  totalPallets: number;
  totalWeightKg: number;
  maxPayloadKg: number | null;
  maxPallets: number | null;
  weightPct: number; // 0..1 (pode passar de 1 em overweight)
  palletPct: number; // 0..1
  /** Ocupação "operacional" — pior caso entre peso e pallets */
  occupationPct: number;
};

export type LoadEvaluation = {
  metrics: LoadMetrics;
  alerts: LoadAlert[];
};

const ZERO_METRICS: LoadMetrics = {
  totalBoxes: 0,
  totalPallets: 0,
  totalWeightKg: 0,
  maxPayloadKg: null,
  maxPallets: null,
  weightPct: 0,
  palletPct: 0,
  occupationPct: 0,
};

function isFrozen(item: LoadPlanItem): boolean {
  return item.tempRangeMaxC !== null && item.tempRangeMaxC <= 0;
}

function isFresh(item: LoadPlanItem): boolean {
  return (
    item.tempRangeMinC !== null &&
    item.tempRangeMaxC !== null &&
    item.tempRangeMinC >= 0 &&
    item.tempRangeMaxC > 0
  );
}

function isDryGood(item: LoadPlanItem): boolean {
  return item.tempRangeMinC === null && item.tempRangeMaxC === null;
}

function isDryContainer(code: ContainerCode): boolean {
  return code === 'C_20_DR' || code === 'C_40_DR';
}

function isReeferContainer(code: ContainerCode): boolean {
  return code === 'C_20_RF' || code === 'C_40_RF' || code === 'C_40_HC_RF';
}

/**
 * Detecta conflito de temperatura: se dois items têm faixas recomendadas que
 * não se sobrepõem, a carga não pode viajar no mesmo container sem review.
 */
function hasTemperatureConflict(items: LoadPlanItem[]): boolean {
  const withRange = items.filter(
    (i) => i.tempRangeMinC !== null && i.tempRangeMaxC !== null,
  );
  if (withRange.length < 2) return false;

  // Encontra interseção de todas as faixas. Se min > max, não há sobreposição.
  let intersectMin = Number.NEGATIVE_INFINITY;
  let intersectMax = Number.POSITIVE_INFINITY;
  for (const i of withRange) {
    intersectMin = Math.max(intersectMin, i.tempRangeMinC!);
    intersectMax = Math.min(intersectMax, i.tempRangeMaxC!);
  }
  return intersectMin > intersectMax;
}

export function evaluateLoadPlan(
  containerCode: ContainerCode | null,
  items: LoadPlanItem[],
): LoadEvaluation {
  if (items.length === 0 && !containerCode) {
    return {
      metrics: ZERO_METRICS,
      alerts: [],
    };
  }

  const container = containerCode ? findContainer(containerCode) : undefined;
  const totalBoxes = items.reduce((s, i) => s + i.qtyBoxes, 0);
  const totalPallets = items.reduce((s, i) => s + i.qtyPallets, 0);
  const totalWeightKg = items.reduce((s, i) => s + i.qtyBoxes * i.boxWeightKg, 0);

  const maxPayloadKg = container?.maxPayloadKg ?? null;
  const maxPallets = container?.maxPallets ?? null;

  const weightPct = maxPayloadKg ? totalWeightKg / maxPayloadKg : 0;
  const palletPct = maxPallets ? totalPallets / maxPallets : 0;
  const occupationPct = Math.max(weightPct, palletPct);

  const metrics: LoadMetrics = {
    totalBoxes,
    totalPallets,
    totalWeightKg,
    maxPayloadKg,
    maxPallets,
    weightPct,
    palletPct,
    occupationPct,
  };

  const alerts: LoadAlert[] = [];

  if (items.length === 0) {
    alerts.push({
      code: 'EMPTY_LOAD',
      severity: 'info',
      messageKey: 'loadPlan.alerts.empty',
    });
    return { metrics, alerts };
  }

  // OVERWEIGHT
  if (maxPayloadKg && totalWeightKg > maxPayloadKg) {
    alerts.push({
      code: 'OVERWEIGHT',
      severity: 'critical',
      messageKey: 'loadPlan.alerts.overweight',
      messageParams: {
        totalKg: Math.round(totalWeightKg),
        maxKg: maxPayloadKg,
        overKg: Math.round(totalWeightKg - maxPayloadKg),
      },
    });
  }

  // OVER PALLETS
  if (maxPallets && totalPallets > maxPallets) {
    alerts.push({
      code: 'OVER_PALLETS',
      severity: 'critical',
      messageKey: 'loadPlan.alerts.overPallets',
      messageParams: {
        total: totalPallets,
        max: maxPallets,
      },
    });
  }

  // FROZEN × FRESH
  const hasFrozen = items.some(isFrozen);
  const hasFresh = items.some(isFresh);
  if (hasFrozen && hasFresh) {
    alerts.push({
      code: 'FROZEN_FRESH_MIX',
      severity: 'critical',
      messageKey: 'loadPlan.alerts.frozenFreshMix',
    });
  }

  // TEMPERATURE CONFLICT (entre items refrigerados/congelados)
  if (hasTemperatureConflict(items)) {
    // Só reportamos se ainda não temos frozen×fresh (seria redundante)
    if (!(hasFrozen && hasFresh)) {
      alerts.push({
        code: 'TEMPERATURE_CONFLICT',
        severity: 'warning',
        messageKey: 'loadPlan.alerts.temperatureConflict',
      });
    }
  }

  // DRY × REEFER mismatch
  if (containerCode) {
    const containerIsDry = isDryContainer(containerCode);
    const containerIsReefer = isReeferContainer(containerCode);

    const hasRefrigerated = items.some((i) => !isDryGood(i));
    const hasDryGoods = items.some(isDryGood);

    if (containerIsDry && hasRefrigerated) {
      alerts.push({
        code: 'DRY_REEFER_MISMATCH',
        severity: 'critical',
        messageKey: 'loadPlan.alerts.dryContainerNeedsReefer',
      });
    }
    if (containerIsReefer && hasDryGoods && !hasRefrigerated) {
      // Apenas dry goods num reefer → ineficiente, não crítico
      alerts.push({
        code: 'DRY_REEFER_MISMATCH',
        severity: 'info',
        messageKey: 'loadPlan.alerts.reeferForDryOnly',
      });
    }
  }

  return { metrics, alerts };
}
