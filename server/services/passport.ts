/**
 * Passport service — compõe dados de múltiplos repositórios para o
 * Product Passport do comprador. Evita round trips e centraliza a
 * lógica de "o que um passport precisa mostrar".
 */

import type { Repositories } from '@/server/repositories';
import type { PassportData } from '@/server/repositories/types';

export async function loadProductPassport(
  slug: string,
  repos: Repositories,
): Promise<PassportData | null> {
  const product = await repos.catalog.findProductBySlug(slug);
  if (!product) return null;

  const [availabilities, harvestWindows] = await Promise.all([
    repos.availability.listForProduct(slug),
    repos.availability.harvestWindowsForProduct(slug),
  ]);

  // Conjunto das origens que têm availability (ou janela de colheita) deste produto.
  const originSlugs = new Set<string>();
  for (const a of availabilities) originSlugs.add(a.originSlug);
  for (const h of harvestWindows) originSlugs.add(h.originSlug);

  const fieldUpdates = await repos.field.latestByOriginSlugs([...originSlugs]);

  return {
    product,
    availabilities,
    harvestWindows,
    fieldUpdates,
  };
}
