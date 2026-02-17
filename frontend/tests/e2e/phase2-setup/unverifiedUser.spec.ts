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
  phone: `+35988${String(uniqueSuffix).slice(-7)}`,
};

test.describe('Unverified User Restrictions (email unverified)', () => {
  test.beforeEach(async ({ page }) => {
    // Register a new user (auto-verified in test mode)
    const registerRes = await page.request.post('/api/auth/register', {
      data: {
        name: testUser.name,
        username: testUser.username,
        email: testUser.email,
        password: testUser.password,
        phone: testUser.phone,
      },
    });
    // Ignore if already registered (409/400)
    if (registerRes.ok()) {
      const body = await registerRes.json();
      expect(body.success).toBe(true);
    }

    // In test mode, users are auto-verified. Unverify for this test.
    await page.request.post('/api/auth/test-set-verified', {
      data: { email: testUser.email, isVerified: false, isPhoneVerified: false },
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
    await expect(page.getByText(/your email and phone number are not verified/i)).toBeVisible();
  });

  test('FAB is visible for unverified authenticated user', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByLabel(/create new product listing/i)).toBeVisible();
  });

  test('clicking FAB shows verify prompt when email and phone are unverified', async ({ page }) => {
    await page.goto('/');
    await page.getByLabel(/create new product listing/i).click();

    // Verify the prompt dialog appears
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: 5000 });
    await expect(page.getByText(/you need to verify both your email and phone number to add a product/i)).toBeVisible();
  });

  test('navigating directly to /create-product shows email verification required page', async ({ page }) => {
    await page.goto('/create-product');
    await expect(page.getByRole('heading', { name: /email verification required/i })).toBeVisible();
  });

  test('navigating directly to /favourites shows email verification required page', async ({ page }) => {
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

test.describe('Unverified User Restrictions (email verified, phone not verified)', () => {
  const phoneSuffix = Date.now() + 1;
  const phoneUser = {
    name: 'Phone Unverified E2E User',
    username: `phoneunverif${phoneSuffix}`,
    email: `phoneunverif${phoneSuffix}@example.com`,
    password: 'Password123!',
    phone: `+35989${String(phoneSuffix).slice(-7)}`,
  };

  test.beforeEach(async ({ page }) => {
    // Register user (auto-verified in test mode)
    const registerRes = await page.request.post('/api/auth/register', {
      data: {
        name: phoneUser.name,
        username: phoneUser.username,
        email: phoneUser.email,
        password: phoneUser.password,
        phone: phoneUser.phone,
      },
    });
    if (registerRes.ok()) {
      const body = await registerRes.json();
      expect(body.success).toBe(true);
    }

    // Set email verified but phone unverified
    await page.request.post('/api/auth/test-set-verified', {
      data: { email: phoneUser.email, isVerified: true, isPhoneVerified: false },
    });

    // Login
    const loginRes = await page.request.post('/api/auth/login', {
      data: {
        email: phoneUser.email,
        password: phoneUser.password,
      },
    });
    const loginBody = await loginRes.json();
    expect(loginBody.success).toBe(true);
    expect(loginBody.data.isVerified).toBe(true);
    expect(loginBody.data.isPhoneVerified).toBe(false);

    // Set the token in localStorage
    await page.goto('/');
    await page.evaluate((token) => {
      localStorage.setItem('token', token);
    }, loginBody.data.token);

    // Reload to pick up the token
    await page.reload();
    await page.waitForLoadState('networkidle');
  });

  test('shows phone verification banner on homepage', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('alert')).toBeVisible();
    await expect(page.getByText(/your phone number is not verified/i)).toBeVisible();
  });

  test('FAB is visible', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByLabel(/create new product listing/i)).toBeVisible();
  });

  test('clicking FAB shows phone verify prompt', async ({ page }) => {
    await page.goto('/');
    await page.getByLabel(/create new product listing/i).click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: 5000 });
    await expect(page.getByText(/verify your phone number to add a product/i)).toBeVisible();
  });

  test('navigating to /create-product shows phone verification required', async ({ page }) => {
    await page.goto('/create-product');
    await expect(page.getByRole('heading', { name: /phone verification required/i })).toBeVisible();
  });

  test('navigating to /favourites is allowed (only requires email)', async ({ page }) => {
    await page.goto('/favourites');
    // Should NOT show verification required since email is verified
    await expect(page.getByRole('heading', { name: /verification required/i })).not.toBeVisible();
  });
});
