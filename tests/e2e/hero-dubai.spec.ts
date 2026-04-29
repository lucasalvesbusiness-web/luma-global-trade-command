/**
 * Hero flow #2 — Dubai Mixed Frozen
 * Buyer: Gulf Premium Foods (UAE → Jebel Ali)
 * Product: Polpa Manga + Açaí, 40' Reefer Frozen
 *
 * Skeleton — flesh out once Hero #1 is stable and seed fixtures are
 * confirmed. Asserts the product rail surfaces frozen products for AE.
 */

import { expect, test } from '@playwright/test';

test.describe('Hero #2 · Dubai Mixed Frozen', () => {
  test.skip('buyer reaches frozen products for UAE destination', async ({ page }) => {
    await page.goto('/');

    await page.getByLabel(/country|país/i).selectOption({ label: /united arab emirates|emirados/i });
    await page.getByLabel(/port|porto/i).selectOption({ label: /jebel ali/i });
    await page.getByRole('button', { name: /confirmar destino|confirm destination/i }).click();

    await expect(
      page.getByText(/products for your destination|produtos para o seu destino/i),
    ).toBeVisible({ timeout: 15_000 });

    // Polpa de fruta and açaí should be visible in the rail
    await expect(page.getByText(/fruit pulp|polpa/i)).toBeVisible();
    await expect(page.getByText(/açaí|acai/i)).toBeVisible();
  });
});
