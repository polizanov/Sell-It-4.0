import { test, expect } from '@playwright/test';

/**
 * E2E tests for unverified user restrictions.
 *
 * Flow: register a new user (unverified by default), login, and verify restrictions.
 */

const uniqueSuffix = Date.now();
const testUser = {
  name: 'Unverified E2E User',
  username: `unverifede2e${uniqueSuffix}`,
  email: `unverifede2e${uniqueSuffix}@example.com`,
  password: 'Password123!',
};

test.describe('Unverified User Restrictions', () => {
  test.beforeEach(async ({ page }) => {
    // Register a new user (unverified by default)
    const registerRes = await page.request.post('/api/auth/register', {
      data: {
        name: testUser.name,
        username: testUser.username,
        email: testUser.email,
        password: testUser.password,
      },
    });
    // Ignore if already registered (409/400)
    if (registerRes.ok()) {
      const body = await registerRes.json();
      expect(body.success).toBe(true);
    }

    // In test mode, users are auto-verified. Unverify for this test.
    await page.request.post('/api/auth/test-set-verified', {
      data: { email: testUser.email, isVerified: false }
    });

    // Login as unverified user
    const loginRes = await page.request.post('/api/auth/login', {
      data: {
        email: testUser.email,
        password: testUser.password,
      },
    });
    const loginBody = await loginRes.json();
    expect(loginBody.success).toBe(true);
    expect(loginBody.data.isVerified).toBe(false);

    // Set the token in localStorage
    await page.goto('/');
    await page.evaluate((token) => {
      localStorage.setItem('token', token);
    }, loginBody.data.token);

    // Reload to pick up the token
    await page.reload();
    await page.waitForLoadState('networkidle');
  });

  test('shows verification banner on homepage', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('alert')).toBeVisible();
    await expect(page.getByText(/your email is not verified/i)).toBeVisible();
  });

  test('navbar hides Create Product and My Favourites links', async ({ page }) => {
    await page.goto('/');

    // My Profile should be visible
    await expect(page.getByRole('link', { name: /my profile/i })).toBeVisible();

    // Create Product and My Favourites should NOT be visible
    await expect(page.getByRole('link', { name: /create product/i })).not.toBeVisible();
    await expect(page.getByRole('link', { name: /my favourites/i })).not.toBeVisible();
  });

  test('navigating directly to /create-product shows verification required page', async ({ page }) => {
    await page.goto('/create-product');
    await expect(page.getByRole('heading', { name: /email verification required/i })).toBeVisible();
  });

  test('navigating directly to /favourites shows verification required page', async ({ page }) => {
    await page.goto('/favourites');
    await expect(page.getByRole('heading', { name: /email verification required/i })).toBeVisible();
  });

  test('verification banner can be dismissed', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('alert')).toBeVisible();

    await page.getByLabel(/dismiss/i).click();
    await expect(page.getByRole('alert')).not.toBeVisible();
  });
});
