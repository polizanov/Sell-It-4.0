import { test, expect } from '@playwright/test';

test.describe('Edit Product', () => {
  test('owner can edit their product and see updated data on the product detail page', async ({
    page,
  }) => {
    // Register and log in a test user
    await page.goto('/register');

    const timestamp = Date.now();
    const testEmail = `edituser+${timestamp}@example.com`;
    const testPassword = 'password123';
    const testUsername = `edituser${timestamp}`;

    await page.getByLabel(/full name/i).fill('Edit Test User');
    await page.getByLabel(/username/i).fill(testUsername);
    await page.getByLabel(/email address/i).fill(testEmail);
    await page.getByLabel(/^password/i).fill(testPassword);
    await page.getByLabel(/confirm password/i).fill(testPassword);
    await page.getByRole('button', { name: /create account/i }).click();

    // Wait for registration and navigate to login
    await page.waitForURL(/\/login/, { timeout: 10000 });

    await page.getByLabel(/email address/i).fill(testEmail);
    await page.getByLabel(/password/i).fill(testPassword);
    await page.getByRole('button', { name: /login/i }).click();

    // Wait for login to complete
    await page.waitForURL('/', { timeout: 10000 });

    // Create a product first
    await page.goto('/create-product');
    await page.waitForURL(/\/create-product/);

    await page.getByLabel(/product title/i).fill('Original E2E Product');
    await page.getByLabel(/description/i).fill('This is the original product description for e2e test');
    await page.getByLabel(/price/i).fill('99.99');
    await page.getByLabel(/category/i).fill('Electronics');
    await page.getByLabel(/condition/i).selectOption('Good');

    // Upload an image
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'test-image.jpg',
      mimeType: 'image/jpeg',
      buffer: Buffer.from('fake-image-data-for-e2e-test'),
    });

    await page.getByRole('button', { name: /create product/i }).click();

    // Wait for navigation to the product detail page
    await page.waitForURL(/\/products\//, { timeout: 10000 });

    // Verify the product was created
    await expect(page.getByText('Original E2E Product')).toBeVisible();
    await expect(page.getByText('$99.99')).toBeVisible();

    // The owner should see the Edit Product button
    const editButton = page.getByText('Edit Product');
    await expect(editButton).toBeVisible();

    // Click the Edit Product button
    await editButton.click();

    // Should navigate to the edit page
    await page.waitForURL(/\/products\/.*\/edit/, { timeout: 10000 });

    // Verify the form is pre-filled
    await expect(page.getByLabel(/product title/i)).toHaveValue('Original E2E Product');
    await expect(page.getByLabel(/price/i)).toHaveValue('99.99');

    // Update the product
    await page.getByLabel(/product title/i).clear();
    await page.getByLabel(/product title/i).fill('Updated E2E Product');

    await page.getByLabel(/price/i).clear();
    await page.getByLabel(/price/i).fill('149.99');

    await page.getByRole('button', { name: /save changes/i }).click();

    // Wait for navigation back to the product detail page
    await page.waitForURL(/\/products\/(?!.*\/edit)/, { timeout: 10000 });

    // Verify the updated data is displayed
    await expect(page.getByText('Updated E2E Product')).toBeVisible();
    await expect(page.getByText('$149.99')).toBeVisible();
  });
});
