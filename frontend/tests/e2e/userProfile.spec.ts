import { test, expect } from '@playwright/test';

test.describe('User Profile', () => {
  test('Contact Seller navigates to seller profile', async ({ page }) => {
    // Register and log in a test user
    await page.goto('/register');

    const timestamp = Date.now();
    const testName = 'Seller Test User';
    const testUsername = `sellertest${timestamp}`;
    const testEmail = `sellertest+${timestamp}@example.com`;
    const testPassword = 'password123';

    await page.getByLabel(/full name/i).fill(testName);
    await page.getByLabel(/username/i).fill(testUsername);
    await page.getByLabel(/email address/i).fill(testEmail);
    await page.getByLabel(/^password/i).fill(testPassword);
    await page.getByLabel(/confirm password/i).fill(testPassword);
    await page.getByRole('button', { name: /create account/i }).click();

    await page.waitForURL(/\/login/, { timeout: 10000 });

    await page.getByLabel(/email address/i).fill(testEmail);
    await page.getByLabel(/password/i).fill(testPassword);
    await page.getByRole('button', { name: /login/i }).click();

    await page.waitForURL('/', { timeout: 10000 });

    // Create a product
    await page.goto('/create-product');
    await page.waitForURL(/\/create-product/);

    await page.getByLabel(/product title/i).fill('Test Profile Product');
    await page.getByLabel(/description/i).fill('A product for testing the seller profile link');
    await page.getByLabel(/price/i).fill('99.99');
    await page.getByLabel(/category/i).selectOption('Electronics');
    await page.getByLabel(/condition/i).selectOption('New');

    // Upload a test image
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'test.jpg',
      mimeType: 'image/jpeg',
      buffer: Buffer.from('fake-image-data'),
    });

    await page.getByRole('button', { name: /create product/i }).click();

    // Wait for redirect to product detail page
    await page.waitForURL(/\/products\//, { timeout: 10000 });

    // Click Contact Seller
    await page.getByRole('button', { name: /contact seller/i }).click();

    // Should navigate to seller profile
    await expect(page).toHaveURL(new RegExp(`/profile/${testUsername}`));
    await expect(page.getByText('Seller Profile')).toBeVisible();
  });

  test('Shows User Not Found for non-existent username', async ({ page }) => {
    await page.goto('/profile/nonexistentuser12345');

    await expect(page.getByText('User Not Found')).toBeVisible({ timeout: 10000 });
    await expect(
      page.getByText("Sorry, the user you're looking for doesn't exist."),
    ).toBeVisible();
  });
});
