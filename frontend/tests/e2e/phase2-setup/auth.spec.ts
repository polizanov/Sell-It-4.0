import { test, expect, Page } from '@playwright/test';

/**
 * Helper to fill the phone number in the PhoneInput component.
 * Selects Bulgaria (+359) from the country dropdown, then fills the national number.
 */
async function fillPhone(page: Page, nationalNumber: string) {
  // Type the full Bulgarian number character by character so that
  // react-phone-number-input can detect the country and format it properly
  const phoneInput = page.locator('.PhoneInputInput');
  await phoneInput.click();
  await phoneInput.fill('');
  await phoneInput.pressSequentially(`+359${nationalNumber}`, { delay: 50 });
}

test.describe('Auth - Registration Form Validation', () => {
  test('shows validation errors for empty fields on submit', async ({
    page,
  }) => {
    await page.goto('/register');

    // Click submit without filling any fields
    await page.getByRole('button', { name: /create account/i }).click();

    // Add timeout for validation errors to appear
    await expect(page.getByText('Name is required', { exact: true })).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('Email is required', { exact: true })).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('Phone number is required', { exact: true })).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('Password is required', { exact: true })).toBeVisible({ timeout: 5000 });
    await expect(
      page.getByText('Please confirm your password', { exact: true }),
    ).toBeVisible({ timeout: 5000 });
  });

  test('shows validation error for empty phone field', async ({ page }) => {
    await page.goto('/register');

    // Fill all fields except phone
    await page.getByLabel(/full name/i).fill('Test User');
    await page.getByLabel(/username/i).fill('testuser');
    await page.getByLabel(/email address/i).fill('test@example.com');
    await page.getByLabel(/^password/i).fill('Password123!');
    await page.getByLabel(/confirm password/i).fill('Password123!');

    await page.getByRole('button', { name: /create account/i }).click();

    await expect(
      page.getByText('Phone number is required', { exact: true }),
    ).toBeVisible({ timeout: 5000 });
  });

  test('shows validation error for invalid phone number', async ({ page }) => {
    await page.goto('/register');

    // Fill all fields with an invalid phone number
    await page.getByLabel(/full name/i).fill('Test User');
    await page.getByLabel(/username/i).fill('testuser');
    await page.getByLabel(/email address/i).fill('test@example.com');
    // Type a too-short number to make it invalid
    const phoneInput = page.locator('.PhoneInputInput');
    await phoneInput.click();
    await phoneInput.pressSequentially('+359123', { delay: 50 });
    await page.getByLabel(/^password/i).fill('Password123!');
    await page.getByLabel(/confirm password/i).fill('Password123!');

    await page.getByRole('button', { name: /create account/i }).click();

    await expect(
      page.getByText('Please enter a valid phone number', { exact: true }),
    ).toBeVisible({ timeout: 5000 });
  });

  test('shows password length validation error', async ({ page }) => {
    await page.goto('/register');

    await page.getByLabel(/full name/i).fill('Test User');
    await page.getByLabel(/email address/i).fill('test@example.com');
    await fillPhone(page, '888123456');
    await page.getByLabel(/^password/i).fill('123');
    await page.getByLabel(/confirm password/i).fill('123');

    await page.getByRole('button', { name: /create account/i }).click();

    await expect(
      page.getByText('Password must be at least 8 characters', { exact: true }),
    ).toBeVisible({ timeout: 5000 });
  });

  test('shows passwords do not match error', async ({ page }) => {
    await page.goto('/register');

    await page.getByLabel(/full name/i).fill('Test User');
    await page.getByLabel(/email address/i).fill('test@example.com');
    await fillPhone(page, '888123456');
    await page.getByLabel(/^password/i).fill('Password123!');
    await page.getByLabel(/confirm password/i).fill('differentpassword');

    await page.getByRole('button', { name: /create account/i }).click();

    await expect(page.getByText('Passwords do not match', { exact: true })).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Auth - Login Form Validation', () => {
  test('shows validation errors for empty fields on submit', async ({
    page,
  }) => {
    await page.goto('/login');

    await page.getByRole('button', { name: /login/i }).click();

    await expect(page.getByText('Email is required', { exact: true })).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('Password is required', { exact: true })).toBeVisible({ timeout: 5000 });
  });

  test('shows invalid email error for malformed email', async ({ page }) => {
    await page.goto('/login');

    await page.getByLabel(/email address/i).fill('notanemail');
    await page.getByLabel(/password/i).fill('Password123!');

    await page.getByRole('button', { name: /login/i }).click();

    await expect(
      page.getByText('Please enter a valid email address', { exact: true }),
    ).toBeVisible({ timeout: 5000 });
  });

  test('login with invalid credentials shows error message', async ({
    page,
  }) => {
    await page.goto('/login');

    await page.getByLabel(/email address/i).fill('wrong@example.com');
    await page.getByLabel(/password/i).fill('wrongpassword');

    await page.getByRole('button', { name: /login/i }).click();

    // Wait for the API error message to appear
    await expect(
      page.getByText(/invalid email or password/i),
    ).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Auth - Protected Routes', () => {
  test('unauthenticated user is redirected from /profile to /login', async ({
    page,
  }) => {
    // Make sure there is no auth token
    await page.goto('/login');
    await page.evaluate(() => localStorage.removeItem('token'));

    // Try to navigate to the protected profile page
    await page.goto('/profile');

    // Should be redirected to login
    await expect(page).toHaveURL(/\/login/);
  });
});
