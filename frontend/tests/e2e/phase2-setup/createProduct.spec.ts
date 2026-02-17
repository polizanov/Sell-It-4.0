import { test, expect, Page } from '@playwright/test';

/**
 * Helper to fill the phone number in the PhoneInput component.
 * Selects Bulgaria (+359) from the country dropdown, then types the national number.
 */
async function fillPhone(page: Page, nationalNumber: string) {
  // Click the phone input and type the full Bulgarian number character by character
  // so that react-phone-number-input can detect the country and format it properly
  const phoneInput = page.locator('.PhoneInputInput');
  await phoneInput.click();
  await phoneInput.fill('');
  await phoneInput.pressSequentially(`+359${nationalNumber}`, { delay: 50 });
}

test.describe('Create Product', () => {
  test('unauthenticated user visiting /create-product is redirected to /login', async ({
    page,
  }) => {
    // Make sure there is no auth token
    await page.goto('/login');
    await page.evaluate(() => localStorage.removeItem('token'));

    // Try to navigate to the protected create-product page
    await page.goto('/create-product');

    // Should be redirected to login
    await expect(page).toHaveURL(/\/login/);
  });

  test('shows validation errors for empty fields on submit', async ({ page }) => {
    // Register and log in a test user to access the protected route
    await page.goto('/register');

    const timestamp = Date.now();
    const testEmail = `testuser+${timestamp}@example.com`;
    const testPassword = 'Password123!';

    await page.getByLabel(/full name/i).fill('Test User');
    await page.getByLabel(/username/i).fill(`testuser${timestamp}`);
    await page.getByLabel(/email address/i).fill(testEmail);
    await fillPhone(page, '888100001');
    await page.getByLabel(/^password/i).fill(testPassword);
    await page.getByLabel(/confirm password/i).fill(testPassword);
    await page.getByRole('button', { name: /create account/i }).click();

    // Wait for registration success and click "Go to Login"
    await expect(page.getByRole('heading', { name: /check your email/i })).toBeVisible({ timeout: 10000 });
    await page.getByRole('link', { name: /go to login/i }).click();

    await page.getByLabel(/email address/i).fill(testEmail);
    await page.getByLabel(/password/i).fill(testPassword);
    await page.getByRole('button', { name: /login/i }).click();

    // Wait for login to complete and redirect to home
    await page.waitForURL('/', { timeout: 10000 });

    // Now navigate to create-product
    await page.goto('/create-product');
    await page.waitForURL(/\/create-product/);

    // Click submit without filling any fields
    await page.getByRole('button', { name: /create product/i }).click();

    // Check for validation errors
    await expect(page.getByText('Title is required')).toBeVisible();
    await expect(page.getByText('Description is required')).toBeVisible();
    await expect(page.getByText('Price is required')).toBeVisible();
    await expect(page.getByText('Category is required')).toBeVisible();
    await expect(page.getByText('Condition is required')).toBeVisible();
    await expect(page.getByText('At least one image is required')).toBeVisible();
  });

  test('form renders all required fields', async ({ page }) => {
    // Register and log in a test user to access the protected route
    await page.goto('/register');

    const timestamp = Date.now();
    const testEmail = `testuser+${timestamp}@example.com`;
    const testPassword = 'Password123!';

    await page.getByLabel(/full name/i).fill('Test User');
    await page.getByLabel(/username/i).fill(`testuser${timestamp}`);
    await page.getByLabel(/email address/i).fill(testEmail);
    await fillPhone(page, '888100002');
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

    // Navigate to create-product
    await page.goto('/create-product');
    await page.waitForURL(/\/create-product/);

    // Verify all form fields are rendered
    await expect(page.getByLabel(/product title/i)).toBeVisible();
    await expect(page.getByLabel(/description/i)).toBeVisible();
    await expect(page.getByLabel(/price/i)).toBeVisible();
    await expect(page.getByLabel(/category/i)).toBeVisible();
    await expect(page.getByLabel(/condition/i)).toBeVisible();
    await expect(page.getByLabel(/add image/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /create product/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /cancel/i })).toBeVisible();
  });
});
