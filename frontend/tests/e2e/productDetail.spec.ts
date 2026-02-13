import { test, expect } from '@playwright/test';

test.describe('Product Detail Page', () => {
  test('loads and displays product data', async ({ page }) => {
    // First, create a product so there is one to view.
    // Register and log in a test user.
    await page.goto('/register');

    const timestamp = Date.now();
    const testEmail = `detailuser+${timestamp}@example.com`;
    const testPassword = 'password123';

    await page.getByLabel(/full name/i).fill('Detail Test User');
    await page.getByLabel(/email address/i).fill(testEmail);
    await page.getByLabel(/^password/i).fill(testPassword);
    await page.getByLabel(/confirm password/i).fill(testPassword);
    await page.getByRole('button', { name: /create account/i }).click();

    await page.waitForURL(/\/login/, { timeout: 10000 });

    await page.getByLabel(/email address/i).fill(testEmail);
    await page.getByLabel(/password/i).fill(testPassword);
    await page.getByRole('button', { name: /login/i }).click();

    await page.waitForURL('/', { timeout: 10000 });

    // Navigate to create product page and create a product
    await page.goto('/create-product');
    await page.waitForURL(/\/create-product/);

    await page.getByLabel(/product title/i).fill('E2E Detail Test Product');
    await page.getByLabel(/description/i).fill('This is a product for the E2E detail page test');
    await page.getByLabel(/price/i).fill('99.99');
    await page.getByLabel(/category/i).fill('Electronics');
    await page.getByLabel(/condition/i).selectOption('New');

    // Upload a test image
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'test-product.jpg',
      mimeType: 'image/jpeg',
      buffer: Buffer.from('fake-image-data'),
    });

    await page.getByRole('button', { name: /create product/i }).click();

    // Wait for navigation to the product detail page
    await page.waitForURL(/\/products\//, { timeout: 15000 });

    // Verify the product detail page displays the created product data
    await expect(page.getByText('E2E Detail Test Product')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('$99.99')).toBeVisible();
    await expect(
      page.getByText('This is a product for the E2E detail page test'),
    ).toBeVisible();
    await expect(page.getByText('Detail Test User')).toBeVisible();
  });

  test('shows "Product Not Found" for non-existent product ID', async ({ page }) => {
    // Navigate to a product detail page with a valid ObjectId that does not exist
    await page.goto('/products/000000000000000000000000');

    await expect(page.getByText('Product Not Found')).toBeVisible({ timeout: 10000 });
    await expect(
      page.getByText("Sorry, the product you're looking for doesn't exist."),
    ).toBeVisible();
  });

  test('"Back to Products" link works', async ({ page }) => {
    // Navigate to a non-existent product to show the "not found" view with the back link
    await page.goto('/products/000000000000000000000000');

    await expect(page.getByText('Product Not Found')).toBeVisible({ timeout: 10000 });

    // Click the "Back to Products" button
    await page.getByRole('button', { name: /back to products/i }).click();

    await expect(page).toHaveURL(/\/products$/);
  });
});
