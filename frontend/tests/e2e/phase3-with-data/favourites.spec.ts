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

test.describe('Favourites', () => {
  test('User can favourite a product and see it on My Favourites page', async ({ page }) => {
    const timestamp = Date.now();

    // Register user A (product owner) and login
    await page.goto('/register');

    const userAEmail = `favownera+${timestamp}@example.com`;
    const userAPassword = 'Password123!';

    await page.getByLabel(/full name/i).fill('Favourite Owner A');
    await page.getByLabel(/username/i).fill(`favownera${timestamp}`);
    await page.getByLabel(/email address/i).fill(userAEmail);
    await fillPhone(page, '888400001');
    await page.getByLabel(/^password/i).fill(userAPassword);
    await page.getByLabel(/confirm password/i).fill(userAPassword);
    await page.getByRole('button', { name: /create account/i }).click();

    await expect(page.getByRole('heading', { name: /check your email/i })).toBeVisible({ timeout: 10000 });
    await page.getByRole('link', { name: /go to login/i }).click();

    await page.getByLabel(/email address/i).fill(userAEmail);
    await page.getByLabel(/password/i).fill(userAPassword);
    await page.getByRole('button', { name: /login/i }).click();

    await page.waitForURL('/', { timeout: 10000 });

    // Create a product
    await page.goto('/create-product');
    await page.waitForURL(/\/create-product/);

    await page.getByLabel(/product title/i).fill('Fav Test Product');
    await page.getByLabel(/description/i).fill('This is a product for the favourites E2E test');
    await page.getByLabel(/price/i).fill('79.99');
    await page.getByLabel(/category/i).selectOption('Electronics');
    await page.getByLabel(/condition/i).selectOption('New');

    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'test-product.jpg',
      mimeType: 'image/jpeg',
      buffer: Buffer.from([0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01]),
    });

    await page.getByRole('button', { name: /create product/i }).click();

    // Wait for redirect to product detail page and capture the URL
    await page.waitForURL(/\/products\//, { timeout: 15000 });
    const productUrl = page.url();

    // Logout user A
    await page.getByRole('button', { name: /logout/i }).click();

    // Register user B and login
    await page.goto('/register');

    const userBEmail = `favuserb+${timestamp}@example.com`;
    const userBPassword = 'Password123!';

    await page.getByLabel(/full name/i).fill('Favourite User B');
    await page.getByLabel(/username/i).fill(`favuserb${timestamp}`);
    await page.getByLabel(/email address/i).fill(userBEmail);
    await fillPhone(page, '888400002');
    await page.getByLabel(/^password/i).fill(userBPassword);
    await page.getByLabel(/confirm password/i).fill(userBPassword);
    await page.getByRole('button', { name: /create account/i }).click();

    await expect(page.getByRole('heading', { name: /check your email/i })).toBeVisible({ timeout: 10000 });
    await page.getByRole('link', { name: /go to login/i }).click();

    await page.getByLabel(/email address/i).fill(userBEmail);
    await page.getByLabel(/password/i).fill(userBPassword);
    await page.getByRole('button', { name: /login/i }).click();

    await page.waitForURL('/', { timeout: 10000 });

    // Navigate to the product detail page
    await page.goto(productUrl);

    // Wait for product to load
    await expect(page.getByText('Fav Test Product')).toBeVisible({ timeout: 10000 });

    // Click the heart button to add to favourites and wait for API response
    const addButton = page.getByRole('button', { name: /add to favourites/i });
    await expect(addButton).toBeVisible({ timeout: 10000 });

    const [favouriteResponse] = await Promise.all([
      page.waitForResponse((resp) => resp.url().includes('/api/favourites') && resp.status() === 201),
      addButton.click(),
    ]);
    expect(favouriteResponse.ok()).toBeTruthy();

    // Verify heart becomes filled
    await expect(
      page.getByRole('button', { name: /remove from favourites/i }),
    ).toBeVisible({ timeout: 10000 });

    // Navigate to My Favourites page
    await page.goto('/favourites');

    // Verify the product title appears
    await expect(page.getByText('Fav Test Product')).toBeVisible({ timeout: 10000 });
  });

  test('User can unfavourite a product', async ({ page }) => {
    const timestamp = Date.now();

    // Register user A (product owner) and login
    await page.goto('/register');

    const userAEmail = `unfavownera+${timestamp}@example.com`;
    const userAPassword = 'Password123!';

    await page.getByLabel(/full name/i).fill('Unfav Owner A');
    await page.getByLabel(/username/i).fill(`unfavownera${timestamp}`);
    await page.getByLabel(/email address/i).fill(userAEmail);
    await fillPhone(page, '888400003');
    await page.getByLabel(/^password/i).fill(userAPassword);
    await page.getByLabel(/confirm password/i).fill(userAPassword);
    await page.getByRole('button', { name: /create account/i }).click();

    await expect(page.getByRole('heading', { name: /check your email/i })).toBeVisible({ timeout: 10000 });
    await page.getByRole('link', { name: /go to login/i }).click();

    await page.getByLabel(/email address/i).fill(userAEmail);
    await page.getByLabel(/password/i).fill(userAPassword);
    await page.getByRole('button', { name: /login/i }).click();

    await page.waitForURL('/', { timeout: 10000 });

    // Create a product
    await page.goto('/create-product');
    await page.waitForURL(/\/create-product/);

    await page.getByLabel(/product title/i).fill('Unfav Test Product');
    await page.getByLabel(/description/i).fill('This is a product for the unfavourite E2E test');
    await page.getByLabel(/price/i).fill('59.99');
    await page.getByLabel(/category/i).selectOption('Electronics');
    await page.getByLabel(/condition/i).selectOption('Good');

    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'test-product.jpg',
      mimeType: 'image/jpeg',
      buffer: Buffer.from([0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01]),
    });

    await page.getByRole('button', { name: /create product/i }).click();
    await page.waitForURL(/\/products\//, { timeout: 15000 });
    const productUrl = page.url();

    // Logout user A
    await page.getByRole('button', { name: /logout/i }).click();

    // Register user B and login
    await page.goto('/register');

    const userBEmail = `unfavuserb+${timestamp}@example.com`;
    const userBPassword = 'Password123!';

    await page.getByLabel(/full name/i).fill('Unfav User B');
    await page.getByLabel(/username/i).fill(`unfavuserb${timestamp}`);
    await page.getByLabel(/email address/i).fill(userBEmail);
    await fillPhone(page, '888400004');
    await page.getByLabel(/^password/i).fill(userBPassword);
    await page.getByLabel(/confirm password/i).fill(userBPassword);
    await page.getByRole('button', { name: /create account/i }).click();

    await expect(page.getByRole('heading', { name: /check your email/i })).toBeVisible({ timeout: 10000 });
    await page.getByRole('link', { name: /go to login/i }).click();

    await page.getByLabel(/email address/i).fill(userBEmail);
    await page.getByLabel(/password/i).fill(userBPassword);
    await page.getByRole('button', { name: /login/i }).click();

    await page.waitForURL('/', { timeout: 10000 });

    // Navigate to product
    await page.goto(productUrl);
    await expect(page.getByText('Unfav Test Product')).toBeVisible({ timeout: 10000 });

    // Click heart to favourite
    const addButton = page.getByRole('button', { name: /add to favourites/i });
    await expect(addButton).toBeVisible({ timeout: 10000 });
    await addButton.click();

    // Verify it becomes filled
    await expect(
      page.getByRole('button', { name: /remove from favourites/i }),
    ).toBeVisible({ timeout: 10000 });

    // Click heart again to unfavourite
    await page.getByRole('button', { name: /remove from favourites/i }).click();

    // Verify it becomes outline again
    await expect(
      page.getByRole('button', { name: /add to favourites/i }),
    ).toBeVisible({ timeout: 10000 });
  });

  test('Owner does not see favourite button on own product', async ({ page }) => {
    const timestamp = Date.now();

    // Register user, login
    await page.goto('/register');

    const ownerEmail = `favowner+${timestamp}@example.com`;
    const ownerPassword = 'Password123!';

    await page.getByLabel(/full name/i).fill('Owner User');
    await page.getByLabel(/username/i).fill(`favowner${timestamp}`);
    await page.getByLabel(/email address/i).fill(ownerEmail);
    await fillPhone(page, '888400005');
    await page.getByLabel(/^password/i).fill(ownerPassword);
    await page.getByLabel(/confirm password/i).fill(ownerPassword);
    await page.getByRole('button', { name: /create account/i }).click();

    await expect(page.getByRole('heading', { name: /check your email/i })).toBeVisible({ timeout: 10000 });
    await page.getByRole('link', { name: /go to login/i }).click();

    await page.getByLabel(/email address/i).fill(ownerEmail);
    await page.getByLabel(/password/i).fill(ownerPassword);
    await page.getByRole('button', { name: /login/i }).click();

    await page.waitForURL('/', { timeout: 10000 });

    // Create a product
    await page.goto('/create-product');
    await page.waitForURL(/\/create-product/);

    await page.getByLabel(/product title/i).fill('Owner Product');
    await page.getByLabel(/description/i).fill('This is the owners own product for testing');
    await page.getByLabel(/price/i).fill('39.99');
    await page.getByLabel(/category/i).selectOption('Electronics');
    await page.getByLabel(/condition/i).selectOption('New');

    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'test-product.jpg',
      mimeType: 'image/jpeg',
      buffer: Buffer.from([0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01]),
    });

    await page.getByRole('button', { name: /create product/i }).click();
    await page.waitForURL(/\/products\//, { timeout: 15000 });

    // Wait for the product to load
    await expect(page.getByText('Owner Product')).toBeVisible({ timeout: 10000 });

    // Verify no favourite button exists
    const favouriteButton = page.getByRole('button', { name: /favourites/i });
    await expect(favouriteButton).not.toBeVisible();
  });
});
