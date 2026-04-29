/**
 * Hero flow #3 — Lisbon Dry Goods
 * Buyer: Lusitania Agro Distribution (Portugal → Leixões)
 * Product: Cassava flour + starch, 40' Dry container
 *
 * Skeleton — exercises the dry-container path (no reefer temperature
 * requirements) and Portugal-specific compliance preview.
 */

import { expect, test } from '@playwright/test';

test.describe('Hero #3 · Lisbon Dry Goods', () => {
  test.skip('buyer reaches dry goods for Portugal destination', async ({ page }) => {
    await page.goto('/');

    await page.getByLabel(/country|país/i).selectOption({ label: /portugal/i });
    await page.getByLabel(/port|porto/i).selectOption({ label: /leixões|leixoes/i });
    await page.getByRole('button', { name: /confirmar destino|confirm destination/i }).click();

    await expect(
      page.getByText(/products for your destination|produtos para o seu destino/i),
    ).toBeVisible({ timeout: 15_000 });

    await expect(page.getByText(/cassava flour|farinha/i)).toBeVisible();
    await expect(page.getByText(/cassava starch|amido/i)).toBeVisible();
  });
});
