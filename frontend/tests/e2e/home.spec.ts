import { test, expect } from '@playwright/test';

test.describe('Home Page', () => {
  test('should display the home page title', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Sell-It' })).toBeVisible();
  });

  test('should display the subtitle', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('Your marketplace for buying and selling.')).toBeVisible();
  });
});
