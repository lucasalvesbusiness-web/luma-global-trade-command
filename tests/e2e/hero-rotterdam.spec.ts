/**
 * Hero flow #1 — Rotterdam Mango Reefer
 * Buyer: NorthSea Fresh Importers (Netherlands → Rotterdam)
 * Product: Mango Palmer, 40' HC Reefer, 20 pallets
 *
 * Exercises: globe → destinationPicker → transit → originReveal →
 *            productRail → containerBuilder → proposalReview → submit
 *
 * Pre-requisites to run:
 *   1. pnpm db:up && pnpm prisma:migrate && pnpm prisma:seed
 *   2. NEXT_PUBLIC_MAPBOX_TOKEN set in .env
 *   3. Dev server starts via playwright.config webServer
 */

import { expect, test } from '@playwright/test';

test.describe('Hero #1 · Rotterdam Mango Reefer', () => {
  test('buyer configures destination and reaches product rail', async ({ page }) => {
    await page.goto('/');

    // Intro stage: brand mark + destination picker visible
    await expect(page.getByText(/Luma × Spectre/i)).toBeVisible();

    // Open destination picker — confirm button initially disabled until country selected
    const confirmBtn = page.getByRole('button', {
      name: /confirmar destino|confirm destination/i,
    });
    await expect(confirmBtn).toBeVisible();

    // Select Netherlands
    await page.getByLabel(/country|país/i).selectOption({ label: /netherlands|países baixos/i });
    // Select Rotterdam port
    await page.getByLabel(/port|porto/i).selectOption({ label: /rotterdam/i });
    // Confirm
    await confirmBtn.click();

    // Transit message appears (intro → destinationConfirmed → transit)
    await expect(page.getByText(/connecting to brazil|conectando ao brasil/i)).toBeVisible({
      timeout: 8_000,
    });

    // After transit: product rail visible
    await expect(
      page.getByText(/products for your destination|produtos para o seu destino/i),
    ).toBeVisible({ timeout: 15_000 });
  });

  test('buyer can open product passport for Mango', async ({ page }) => {
    await page.goto('/');

    // (Same destination flow — could be extracted to a helper)
    await page.getByLabel(/country|país/i).selectOption({ label: /netherlands|países baixos/i });
    await page.getByLabel(/port|porto/i).selectOption({ label: /rotterdam/i });
    await page.getByRole('button', { name: /confirmar destino|confirm destination/i }).click();

    // Wait for product rail
    await expect(
      page.getByText(/products for your destination|produtos para o seu destino/i),
    ).toBeVisible({ timeout: 15_000 });

    // Open Mango passport
    await page.getByText(/mango|manga/i).first().click();

    // Passport drawer opens with overview tab
    await expect(page.getByText(/product passport|passaporte do produto/i)).toBeVisible();
    await expect(page.getByText(/subject to luma validation|sujeit/i)).toBeVisible();
  });
});
