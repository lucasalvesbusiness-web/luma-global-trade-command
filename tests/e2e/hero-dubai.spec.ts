/**
 * Hero flow #2 — Dubai Mixed Frozen
 * Buyer: Gulf Premium Foods (UAE → Jebel Ali)
 *
 * Skeleton — flesh out and remove .skip once Hero #1 is stable.
 */

import { expect, test } from '@playwright/test';

test.describe('Hero #2 · Dubai Mixed Frozen', () => {
  test.skip('buyer reaches frozen products for UAE destination', async ({ page }) => {
    await page.goto('/');

    await page.getByLabel(/country|país/i).selectOption('AE');
    await page.getByLabel(/^city|cidade/i).selectOption({ index: 1 });
    await page.getByLabel(/port|porto/i).selectOption('port-jebel-ali');
    await page.getByLabel(/incoterm/i).selectOption('CIF');
    await page.getByLabel(/volume/i).selectOption('20-40');
    await page.getByRole('button', { name: /confirm destination|confirmar destino/i }).click();

    await expect(
      page.getByText(/products for your destination|produtos para o seu destino/i),
    ).toBeVisible({ timeout: 20_000 });

    await expect(page.getByText(/fruit pulp|polpa/i)).toBeVisible();
    await expect(page.getByText(/açaí|acai/i)).toBeVisible();
  });
});
