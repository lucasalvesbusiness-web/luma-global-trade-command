/**
 * Hero flow #3 — Lisbon Dry Goods
 * Buyer: Lusitania Agro Distribution (Portugal → Leixões)
 *
 * Skeleton — flesh out and remove .skip once Hero #1 is stable.
 */

import { expect, test } from '@playwright/test';

test.describe('Hero #3 · Lisbon Dry Goods', () => {
  test.skip('buyer reaches dry goods for Portugal destination', async ({ page }) => {
    await page.goto('/');

    await page.getByLabel(/country|país/i).selectOption('PT');
    await page.getByLabel(/^city|cidade/i).selectOption({ index: 1 });
    await page.getByLabel(/port|porto/i).selectOption('port-leixoes');
    await page.getByLabel(/incoterm/i).selectOption('FOB');
    await page.getByLabel(/volume/i).selectOption('5-20');
    await page.getByRole('button', { name: /confirm destination|confirmar destino/i }).click();

    await expect(
      page.getByText(/products for your destination|produtos para o seu destino/i),
    ).toBeVisible({ timeout: 20_000 });

    await expect(page.getByText(/cassava flour|farinha/i)).toBeVisible();
    await expect(page.getByText(/cassava starch|amido/i)).toBeVisible();
  });
});
