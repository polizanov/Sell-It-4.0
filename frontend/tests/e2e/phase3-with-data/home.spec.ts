import { test, expect } from '@playwright/test';

test.describe('Home Page', () => {
  test('should display the home page title', async ({ page }) => {
    await page.goto('/');
    // Clear any existing auth token to ensure we see the hero section
    await page.evaluate(() => localStorage.removeItem('token'));
    await page.reload();
    await expect(page.getByRole('heading', { name: /welcome to sell-it/i })).toBeVisible();
  });

  test('should display the subtitle', async ({ page }) => {
    await page.goto('/');
    // Clear any existing auth token to ensure we see the hero section
    await page.evaluate(() => localStorage.removeItem('token'));
    await page.reload();
    await expect(
      page.getByText('Your trusted marketplace for buying and selling anything, easily'),
    ).toBeVisible();
  });
});
