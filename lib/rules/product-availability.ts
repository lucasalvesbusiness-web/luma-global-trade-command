/**
 * Rules engine — disponibilidade efetiva de produto para destino.
 *
 * Princípio (plano §17, doc 06, briefing §9):
 *   R1. Produto só aparece como disponível se for compatível com o país.
 *   R2. Na dúvida, "UNDER_CONSULTATION" — nunca prometer o que não validamos.
 *   R3. O sistema nunca garante entrega.
 *   R4. A proposta do comprador não é pedido — sempre "subject to Luma validation".
 *
 * Esta função é pura, tipada e testável. Não faz I/O nem toca no Prisma.
 */

import type {
  AvailabilitySummary,
  AvailabilityStatus,
  CompliancePreview,
} from '@/server/repositories/types';

export type EffectiveStatus = AvailabilityStatus;

/** Ranking informativo para escolher "o melhor" status quando há múltiplas availabilities. */
const STATUS_RANK: Record<EffectiveStatus, number> = {
  AVAILABLE_NOW: 0,
  LIMITED_AVAILABILITY: 1,
  PRE_RESERVE_OPEN: 2,
  UNDER_TECHNICAL_VALIDATION: 3,
  UNDER_CONSULTATION: 4,
  NOT_AVAILABLE_FOR_DESTINATION: 5,
};

function bestOf(a: EffectiveStatus, b: EffectiveStatus): EffectiveStatus {
  return STATUS_RANK[a] <= STATUS_RANK[b] ? a : b;
}

export type ProductAvailabilityEvaluation = {
  productSlug: string;
  effectiveStatus: EffectiveStatus;
  bestVolumeTonsBand: string | null;
  /** IDs das availabilities consideradas — útil para debug/inspeção interna */
  sourceAvailabilityIds: string[];
  reason: 'ACTIVE_AVAILABILITY' | 'NO_AVAILABILITY' | 'COMPLIANCE_BLOCKED' | 'NO_COMPLIANCE_PREVIEW';
};

/**
 * Avalia o status efetivo de um produto para um país de destino.
 *
 * @param productSlug       slug do produto
 * @param availabilities    availabilities ativas (já filtradas no horizonte temporal relevante)
 * @param compliancePreview preview de compliance (produto × país). `null` = ainda não modelado.
 */
export function evaluateProductAvailability(
  productSlug: string,
  availabilities: AvailabilitySummary[],
  compliancePreview: CompliancePreview | null,
): ProductAvailabilityEvaluation {
  const productAvail = availabilities.filter((a) => a.productSlug === productSlug);

  // R1: sem compliance preview para este país → marcamos como "sob consulta",
  // não como "não disponível" — a Luma pode validar sob demanda.
  if (!compliancePreview) {
    return {
      productSlug,
      effectiveStatus: productAvail.length > 0 ? 'UNDER_CONSULTATION' : 'NOT_AVAILABLE_FOR_DESTINATION',
      bestVolumeTonsBand: productAvail[0]?.volumeTonsBand ?? null,
      sourceAvailabilityIds: productAvail.map((a) => a.id),
      reason: productAvail.length > 0 ? 'NO_COMPLIANCE_PREVIEW' : 'NO_AVAILABILITY',
    };
  }

  // R1: se compliance.status === 'BLOCKED' → NOT_AVAILABLE
  if (compliancePreview.status === 'BLOCKED') {
    return {
      productSlug,
      effectiveStatus: 'NOT_AVAILABLE_FOR_DESTINATION',
      bestVolumeTonsBand: null,
      sourceAvailabilityIds: productAvail.map((a) => a.id),
      reason: 'COMPLIANCE_BLOCKED',
    };
  }

  // Sem availability mas compliance OK → ainda sob consulta (colheita futura, etc.)
  if (productAvail.length === 0) {
    return {
      productSlug,
      effectiveStatus: 'UNDER_CONSULTATION',
      bestVolumeTonsBand: null,
      sourceAvailabilityIds: [],
      reason: 'NO_AVAILABILITY',
    };
  }

  // Reduzimos as múltiplas availabilities a um status "melhor".
  const best = productAvail.reduce<EffectiveStatus>(
    (acc, a) => bestOf(acc, a.status as EffectiveStatus),
    'NOT_AVAILABLE_FOR_DESTINATION',
  );

  // Se compliance ainda é preview (status intermediário), rebaixamos AVAILABLE_NOW
  // para algo que deixe claro que falta validação final.
  const compliancePartial =
    compliancePreview.status === 'REQUIREMENTS_PENDING' ||
    compliancePreview.status === 'DOCUMENTATION_REQUIRED';

  const effective: EffectiveStatus =
    compliancePartial && best === 'AVAILABLE_NOW' ? 'UNDER_TECHNICAL_VALIDATION' : best;

  // Escolhe a "melhor" faixa de volume (a que corresponde ao status efetivo)
  const bestMatch =
    productAvail.find((a) => a.status === effective) ?? productAvail[0] ?? null;

  return {
    productSlug,
    effectiveStatus: effective,
    bestVolumeTonsBand: bestMatch?.volumeTonsBand ?? null,
    sourceAvailabilityIds: productAvail.map((a) => a.id),
    reason: 'ACTIVE_AVAILABILITY',
  };
}

/**
 * Aplica a regra acima para um conjunto de produtos em um destino.
 * Retorna Map<productSlug, evaluation>.
 */
export function evaluateMany(
  productSlugs: string[],
  availabilities: AvailabilitySummary[],
  previewsByProduct: Map<string, CompliancePreview | null>,
): Map<string, ProductAvailabilityEvaluation> {
  const out = new Map<string, ProductAvailabilityEvaluation>();
  for (const slug of productSlugs) {
    out.set(
      slug,
      evaluateProductAvailability(slug, availabilities, previewsByProduct.get(slug) ?? null),
    );
  }
  return out;
}
