import { expect, test } from '@playwright/test';

test('home page loads with Luma brand and tagline', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText(/Luma × Spectre/i)).toBeVisible();
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
});
