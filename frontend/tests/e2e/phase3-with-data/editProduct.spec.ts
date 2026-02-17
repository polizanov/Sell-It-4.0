import { test, expect, Page } from '@playwright/test';

/**
 * Helper to fill the phone number in the PhoneInput component.
 * Selects Bulgaria (+359) from the country dropdown, then fills the national number.
 */
async function fillPhone(page: Page, nationalNumber: string) {
  const phoneInput = page.locator('.PhoneInputInput');
  await phoneInput.click();
  await phoneInput.fill('');
  await phoneInput.pressSequentially(`+359${nationalNumber}`, { delay: 50 });
}

test.describe('Edit Product', () => {
  test('owner can edit their product and see updated data on the product detail page', async ({
    page,
  }) => {
    // Register and log in a test user
    await page.goto('/register');

    const timestamp = Date.now();
    const testEmail = `edituser+${timestamp}@example.com`;
    const testPassword = 'Password123!';
    const testUsername = `edituser${timestamp}`;

    await page.getByLabel(/full name/i).fill('Edit Test User');
    await page.getByLabel(/username/i).fill(testUsername);
    await page.getByLabel(/email address/i).fill(testEmail);
    await fillPhone(page, '888200001');
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

    // Create a product first
    await page.goto('/create-product');
    await page.waitForURL(/\/create-product/);

    await page.getByLabel(/product title/i).fill('Original E2E Product');
    await page.getByLabel(/description/i).fill('This is the original product description for e2e test');
    await page.getByLabel(/price/i).fill('99.99');
    await page.getByLabel(/category/i).selectOption('Electronics');
    await page.getByLabel(/condition/i).selectOption('Good');

    // Upload an image
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'test-image.jpg',
      mimeType: 'image/jpeg',
      buffer: Buffer.from([0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01]),
    });

    await page.getByRole('button', { name: /create product/i }).click();

    // Wait for navigation to the product detail page
    await page.waitForURL(/\/products\//, { timeout: 10000 });

    // Verify the product was created
    await expect(page.getByText('Original E2E Product')).toBeVisible();
    await expect(page.getByText('$99.99')).toBeVisible();

    // The owner should see the Edit Product icon button
    const editButton = page.getByLabel('Edit product');
    await expect(editButton).toBeVisible();

    // Click the Edit Product icon button to open modal
    await editButton.click();

    // Wait for the edit modal to appear
    const modal = page.getByRole('dialog');
    await expect(modal).toBeVisible({ timeout: 5000 });

    // Verify the form is pre-filled
    await expect(modal.getByLabel(/product title/i)).toHaveValue('Original E2E Product');
    await expect(modal.getByLabel(/price/i)).toHaveValue('99.99');

    // Update the product
    await modal.getByLabel(/product title/i).clear();
    await modal.getByLabel(/product title/i).fill('Updated E2E Product');

    await modal.getByLabel(/price/i).clear();
    await modal.getByLabel(/price/i).fill('149.99');

    await modal.getByRole('button', { name: /save changes/i }).click();

    // Wait for modal to close and product detail to refresh
    await expect(modal).not.toBeVisible({ timeout: 10000 });

    // Verify the updated data is displayed on the product detail page
    await expect(page.getByText('Updated E2E Product')).toBeVisible();
    await expect(page.getByText('$149.99')).toBeVisible();
  });
});
