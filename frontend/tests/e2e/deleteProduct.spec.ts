import { test, expect } from '@playwright/test';

test.describe('Delete Product', () => {
  test('owner can delete their product and is redirected to products page', async ({ page }) => {
    // Register and log in a test user
    await page.goto('/register');

    const timestamp = Date.now();
    const testEmail = `deleteuser+${timestamp}@example.com`;
    const testPassword = 'Password123!';
    const testUsername = `deluser${timestamp}`;

    await page.getByLabel(/full name/i).fill('Delete Test User');
    await page.getByLabel(/username/i).fill(testUsername);
    await page.getByLabel(/email address/i).fill(testEmail);
    await page.getByLabel(/^password/i).fill(testPassword);
    await page.getByLabel(/confirm password/i).fill(testPassword);
    await page.getByRole('button', { name: /create account/i }).click();

    // Wait for registration success and click "Go to Login"
    await expect(page.getByRole('heading', { name: /check your email/i })).toBeVisible({ timeout: 10000 });
    await page.getByRole('link', { name: /go to login/i }).click();

    await page.getByLabel(/email address/i).fill(testEmail);
    await page.getByLabel(/password/i).fill(testPassword);
    await page.getByRole('button', { name: /login/i }).click();

    // Wait for login to complete
    await page.waitForURL('/', { timeout: 10000 });

    // Create a product
    await page.goto('/create-product');
    await page.waitForURL(/\/create-product/);

    await page.getByLabel(/product title/i).fill('Product To Delete E2E');
    await page.getByLabel(/description/i).fill('This product will be deleted in the e2e test');
    await page.getByLabel(/price/i).fill('49.99');
    await page.getByLabel(/category/i).fill('Electronics');
    await page.getByLabel(/condition/i).selectOption('Good');

    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'test-image.jpg',
      mimeType: 'image/jpeg',
      buffer: Buffer.from([0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01]),
    });

    await page.getByRole('button', { name: /create product/i }).click();
    await page.waitForURL(/\/products\//, { timeout: 10000 });

    // Verify product was created
    await expect(page.getByText('Product To Delete E2E')).toBeVisible();

    // Click the delete button (trash icon)
    const deleteButton = page.getByLabel('Delete product');
    await expect(deleteButton).toBeVisible();
    await deleteButton.click();

    // Verify confirmation dialog appears
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByText(/Are you sure you want to delete/)).toBeVisible();

    // Click the Delete button in the dialog
    await page.getByRole('button', { name: /^Delete$/i }).click();

    // Should redirect to /products which redirects to / (home page)
    await page.waitForURL('/', { timeout: 10000 });
  });

  test('non-owner does not see delete button', async ({ page }) => {
    // Register user 1 (owner)
    await page.goto('/register');
    const timestamp = Date.now();

    await page.getByLabel(/full name/i).fill('Owner User');
    await page.getByLabel(/username/i).fill(`owner${timestamp}`);
    await page.getByLabel(/email address/i).fill(`owner+${timestamp}@example.com`);
    await page.getByLabel(/^password/i).fill('Password123!');
    await page.getByLabel(/confirm password/i).fill('Password123!');
    await page.getByRole('button', { name: /create account/i }).click();
    await expect(page.getByRole('heading', { name: /check your email/i })).toBeVisible({ timeout: 10000 });
    await page.getByRole('link', { name: /go to login/i }).click();

    await page.getByLabel(/email address/i).fill(`owner+${timestamp}@example.com`);
    await page.getByLabel(/password/i).fill('Password123!');
    await page.getByRole('button', { name: /login/i }).click();
    await page.waitForURL('/', { timeout: 10000 });

    // Create product
    await page.goto('/create-product');
    await page.waitForURL(/\/create-product/);
    await page.getByLabel(/product title/i).fill('Owner Only Product');
    await page.getByLabel(/description/i).fill('This product belongs to the owner');
    await page.getByLabel(/price/i).fill('99.99');
    await page.getByLabel(/category/i).fill('Electronics');
    await page.getByLabel(/condition/i).selectOption('New');

    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'test-image.jpg',
      mimeType: 'image/jpeg',
      buffer: Buffer.from([0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01]),
    });

    await page.getByRole('button', { name: /create product/i }).click();
    await page.waitForURL(/\/products\//, { timeout: 10000 });
    const productUrl = page.url();

    // Verify owner can see delete button
    await expect(page.getByLabel('Delete product')).toBeVisible();

    // Log out by clearing localStorage and navigating away
    await page.evaluate(() => localStorage.clear());

    // Register and log in as user 2
    await page.goto('/register');
    await page.getByLabel(/full name/i).fill('Non Owner');
    await page.getByLabel(/username/i).fill(`nonowner${timestamp}`);
    await page.getByLabel(/email address/i).fill(`nonowner+${timestamp}@example.com`);
    await page.getByLabel(/^password/i).fill('Password123!');
    await page.getByLabel(/confirm password/i).fill('Password123!');
    await page.getByRole('button', { name: /create account/i }).click();
    await expect(page.getByRole('heading', { name: /check your email/i })).toBeVisible({ timeout: 10000 });
    await page.getByRole('link', { name: /go to login/i }).click();

    await page.getByLabel(/email address/i).fill(`nonowner+${timestamp}@example.com`);
    await page.getByLabel(/password/i).fill('Password123!');
    await page.getByRole('button', { name: /login/i }).click();
    await page.waitForURL('/', { timeout: 10000 });

    // Navigate to the product created by user 1
    await page.goto(productUrl);
    await expect(page.getByText('Owner Only Product')).toBeVisible();

    // Non-owner should NOT see delete button
    await expect(page.getByLabel('Delete product')).not.toBeVisible();
  });
});
