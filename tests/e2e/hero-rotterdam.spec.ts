/**
 * Hero flow #1 — Rotterdam Mango Reefer
 * Buyer: NorthSea Fresh Importers (Netherlands → Rotterdam)
 *
 * Pre-requisites:
 *   pnpm db:up && pnpm prisma:migrate && pnpm prisma:seed
 *   NEXT_PUBLIC_MAPBOX_TOKEN set in .env
 */

import { expect, test, type Page } from '@playwright/test';

async function pickRotterdam(page: Page) {
  await page.goto('/');

  // selects use ISO2 / port-id / enum value as <option value="...">
  await page.getByLabel(/country|país/i).selectOption('NL');
  await page.getByLabel(/^city|cidade/i).selectOption({ index: 1 }); // first available city
  await page.getByLabel(/port|porto/i).selectOption('port-rotterdam');
  await page.getByLabel(/incoterm/i).selectOption('FOB');
  await page.getByLabel(/volume|estimated volume|volume estimado/i).selectOption('20-40');

  await page.getByRole('button', { name: /confirm destination|confirmar destino/i }).click();
}

test.describe('Hero #1 · Rotterdam Mango Reefer', () => {
  test('intro renders LUMA brand + destination picker', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByRole('heading', { name: 'LUMA' })).toBeVisible();
    await expect(page.getByText(/Global Trade Command/i)).toBeVisible();

    // confirm button is disabled before fields filled
    const confirmBtn = page.getByRole('button', {
      name: /confirm destination|confirmar destino/i,
    });
    await expect(confirmBtn).toBeVisible();
    await expect(confirmBtn).toBeDisabled();
  });

  test('buyer configures destination and reaches product rail', async ({ page }) => {
    await pickRotterdam(page);

    // After confirmDestination → transit stage shows i18n key canvas.transiting
    await expect(
      page.getByText(/connecting to brazil|conectando ao brasil/i),
    ).toBeVisible({ timeout: 10_000 });

    // Then product rail (productRail.title)
    await expect(
      page.getByText(/products for your destination|produtos para o seu destino/i),
    ).toBeVisible({ timeout: 20_000 });
  });

  test('buyer can expand Mango row to see varieties + availability', async ({ page }) => {
    await pickRotterdam(page);

    await expect(
      page.getByText(/products for your destination|produtos para o seu destino/i),
    ).toBeVisible({ timeout: 20_000 });

    // Click on Mango card — expands inline detail panel
    await page.getByRole('button', { name: /mango|manga/i }).first().click();

    // Expanded panel surfaces varieties + availability sections
    // (productRail.varieties + productRail.availability i18n keys)
    await expect(
      page.getByText(/^varieties$|^variedades$/i).first(),
    ).toBeVisible({ timeout: 5_000 });
    await expect(
      page.getByText(/^availability$|^disponibilidade$/i).first(),
    ).toBeVisible();
  });
});
