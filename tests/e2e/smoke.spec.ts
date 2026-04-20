import { expect, test } from '@playwright/test';

test('canvas loads with brand, HUD and destination picker', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText(/Luma × Spectre/i)).toBeVisible();
  await expect(page.getByText(/Global Trade Command/i)).toBeVisible();
  // DestinationPicker visible in intro stage
  await expect(page.getByRole('button', { name: /confirmar destino|confirm destination/i })).toBeVisible();
});

test('locale switcher renders both languages', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'PT' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'EN' })).toBeVisible();
});
