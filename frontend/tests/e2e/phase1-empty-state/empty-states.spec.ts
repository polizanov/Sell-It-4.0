import { test, expect } from '@playwright/test';

test.describe('Home (unauthenticated, no products)', () => {
  test('shows empty product count', async ({ page }) => {
    await page.goto('/');

    await expect(
      page.getByText(/Showing 0 of 0 products|No products found/),
    ).toBeVisible({ timeout: 10000 });
  });

  test('shows "No Products Found" in grid', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByText('No Products Found')).toBeVisible({ timeout: 10000 });
    await expect(
      page.getByText('There are no products to display at the moment.'),
    ).toBeVisible();
  });

  test('desktop sidebar is NOT visible when no products exist', async ({ page }) => {
    await page.goto('/');

    // Wait for page to finish loading (either shows "0 of 0" or "No products found")
    await expect(
      page.getByText(/Showing 0 of 0 products|No products found/),
    ).toBeVisible({ timeout: 10000 });

    // Desktop sidebar should not be rendered when there are no products and no active filters
    const sidebar = page.getByTestId('desktop-sidebar');
    await expect(sidebar).not.toBeVisible();
  });
});

test.describe('Home (authenticated, no products)', () => {
  test('shows empty products for logged-in user', async ({ page }) => {
    const ts = Date.now();
    const email = `emptyauth${ts}@example.com`;
    const password = 'Password123!';

    // Register via API
    const registerRes = await page.request.post('/api/auth/register', {
      data: {
        name: 'Empty Auth User',
        username: `emptyauth${ts}`,
        email,
        password,
        phone: `+35988${String(ts).slice(-7)}`,
      },
    });
    expect(registerRes.ok()).toBeTruthy();

    // Login via API
    const loginRes = await page.request.post('/api/auth/login', {
      data: { email, password },
    });
    const loginBody = await loginRes.json();
    expect(loginBody.success).toBe(true);

    // Set token in localStorage
    await page.goto('/');
    await page.evaluate((token) => {
      localStorage.setItem('token', token);
    }, loginBody.data.token);
    await page.reload();

    await expect(
      page.getByText(/Showing 0 of 0 products|No products found/),
    ).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('No Products Found')).toBeVisible();
  });
});

test.describe('My Favourites (no favourites)', () => {
  let token: string;

  test.beforeEach(async ({ page }) => {
    const ts = Date.now();
    const random = Math.floor(Math.random() * 10000);
    const email = `emptyfav${ts}${random}@example.com`;
    const password = 'Password123!';

    const registerRes = await page.request.post('/api/auth/register', {
      data: {
        name: 'Empty Fav User',
        username: `emptyfav${ts}${random}`,
        email,
        password,
        phone: `+35989${String(ts).slice(-7)}`,
      },
    });
    expect(registerRes.ok()).toBeTruthy();

    const loginRes = await page.request.post('/api/auth/login', {
      data: { email, password },
    });
    const loginBody = await loginRes.json();
    expect(loginBody.success).toBe(true);
    token = loginBody.data.token;

    await page.goto('/');
    await page.evaluate((t) => {
      localStorage.setItem('token', t);
    }, token);
    await page.reload();
  });

  test('shows empty favourites with heart icon', async ({ page }) => {
    await page.goto('/favourites');

    await expect(page.getByText('No favourites yet')).toBeVisible({ timeout: 10000 });
    await expect(
      page.getByText('Browse products and tap the heart icon to save them here.'),
    ).toBeVisible();
  });

  test('Browse Products button navigates to home', async ({ page }) => {
    await page.goto('/favourites');

    await expect(page.getByText('No favourites yet')).toBeVisible({ timeout: 10000 });

    await page.getByRole('link', { name: /browse products/i }).click();

    // /products redirects to /
    await expect(page).toHaveURL('/');
  });

  test('shows "0 saved products" count', async ({ page }) => {
    await page.goto('/favourites');

    await expect(page.getByText('0 saved products')).toBeVisible({ timeout: 10000 });
  });
});

test.describe('My Profile (no products)', () => {
  test('shows "No Products Yet" for verified user', async ({ page }) => {
    const ts = Date.now();
    const email = `emptyprofile${ts}@example.com`;
    const password = 'Password123!';

    const registerRes = await page.request.post('/api/auth/register', {
      data: {
        name: 'Empty Profile User',
        username: `emptyprofile${ts}`,
        email,
        password,
        phone: `+35987${String(ts).slice(-7)}`,
      },
    });
    expect(registerRes.ok()).toBeTruthy();

    const loginRes = await page.request.post('/api/auth/login', {
      data: { email, password },
    });
    const loginBody = await loginRes.json();
    expect(loginBody.success).toBe(true);

    await page.goto('/');
    await page.evaluate((t) => {
      localStorage.setItem('token', t);
    }, loginBody.data.token);
    await page.reload();

    await page.goto('/profile');

    await expect(page.getByText('No Products Yet')).toBeVisible({ timeout: 10000 });
    await expect(
      page.getByText("You haven't listed any products yet"),
    ).toBeVisible();
    await expect(page.getByText('0 listings')).toBeVisible();
  });

  test('shows verify email prompt for unverified user', async ({ page }) => {
    const ts = Date.now();
    const email = `unverifiedprofile${ts}@example.com`;
    const password = 'Password123!';

    const registerRes = await page.request.post('/api/auth/register', {
      data: {
        name: 'Unverified Profile User',
        username: `unverifiedprofile${ts}`,
        email,
        password,
        phone: `+35988${String(ts + 1).slice(-7)}`,
      },
    });
    expect(registerRes.ok()).toBeTruthy();

    // Set user as unverified (email and phone)
    await page.request.post('/api/auth/test-set-verified', {
      data: { email, isVerified: false, isPhoneVerified: false },
    });

    const loginRes = await page.request.post('/api/auth/login', {
      data: { email, password },
    });
    const loginBody = await loginRes.json();
    expect(loginBody.success).toBe(true);

    await page.goto('/');
    await page.evaluate((t) => {
      localStorage.setItem('token', t);
    }, loginBody.data.token);
    await page.reload();

    await page.goto('/profile');

    await expect(page.getByText('No Products Yet')).toBeVisible({ timeout: 10000 });
    await expect(
      page.getByText('Verify your email to start listing products.'),
    ).toBeVisible();
  });
});
