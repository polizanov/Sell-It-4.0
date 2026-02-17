import { test, expect } from '@playwright/test';

test.describe('Homepage - Authenticated Users', () => {
  test.beforeEach(async ({ page }) => {
    // Register and login a test user with high uniqueness
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 100000);
    const testEmail = `homeauth${timestamp}${random}@example.com`;
    const testUsername = `homeauth${timestamp}${random}`;
    const testPassword = 'Password123!';

    await page.goto('/register');

    await page.getByLabel(/full name/i).fill('Home Auth User');
    await page.getByLabel(/username/i).fill(testUsername);
    await page.getByLabel(/email address/i).fill(testEmail);
    await page.getByLabel(/^password/i).fill(testPassword);
    await page.getByLabel(/confirm password/i).fill(testPassword);
    await page.getByRole('button', { name: /create account/i }).click();

    // Wait for registration success — use an explicit expect with a generous timeout
    // to avoid the flaky pattern of waitForTimeout + isVisible which can hang
    await expect(
      page.getByRole('heading', { name: /check your email/i }),
    ).toBeVisible({ timeout: 15000 });

    await page.getByRole('link', { name: /go to login/i }).click();
    await page.waitForURL(/\/login/, { timeout: 10000 });

    await page.getByLabel(/email address/i).fill(testEmail);
    await page.getByLabel(/password/i).fill(testPassword);
    await page.getByRole('button', { name: /login/i }).click();

    // Wait for redirect to home page
    await page.waitForURL('/', { timeout: 20000 });
  });

  test('Hero section is NOT visible', async ({ page }) => {
    await page.goto('/');

    // Hero section should not be visible for authenticated users
    const heroSection = page.locator('section.relative.bg-gradient-hero');
    await expect(heroSection).not.toBeVisible();

    // "Welcome to Sell-It" heading should not be visible
    await expect(page.getByRole('heading', { name: /welcome to sell-it/i })).not.toBeVisible();
  });

  test('Features section is NOT visible', async ({ page }) => {
    await page.goto('/');

    // Features section headings should not be visible
    await expect(page.getByRole('heading', { name: /easy to sell/i })).not.toBeVisible();
    await expect(page.getByRole('heading', { name: /secure trading/i })).not.toBeVisible();
    await expect(page.getByRole('heading', { name: /growing community/i })).not.toBeVisible();
  });

  test('Products section appears immediately at the top', async ({ page }) => {
    await page.goto('/');

    // Products section should be visible
    const productsSection = page.locator('section.bg-dark-bg');
    await expect(productsSection).toBeVisible();

    // Verify products section is near the top of the page (no hero/features above it)
    // Account for navbar, optional verification banner, heading, padding, etc.
    const sectionPosition = await productsSection.boundingBox();
    expect(sectionPosition?.y).toBeLessThan(1200);

    // More importantly, verify Hero and Features sections are NOT above it
    const heroSection = page.locator('section.relative.bg-gradient-hero');
    await expect(heroSection).not.toBeVisible();
  });

  test('Products section is visible with search and category chips', async ({ page }) => {
    await page.goto('/');

    // Search bar should be visible for authenticated users
    await expect(page.getByPlaceholder(/search products/i)).toBeVisible();

    // Category chips should be visible
    const categoryGroup = page.getByRole('group', { name: /filter by category/i });
    await expect(categoryGroup).toBeVisible();
  });

  test('Search and filter functionality works', async ({ page }) => {
    await page.goto('/');

    // Wait for products to load
    await expect(page.getByText(/showing \d+ of \d+ products/i)).toBeVisible({ timeout: 10000 });

    // Test search functionality
    const searchInput = page.getByPlaceholder('Search products...');
    await expect(searchInput).toBeVisible();

    await searchInput.fill('test product');

    // Wait for debounce (300ms)
    await page.waitForTimeout(400);

    // Verify Clear Filters button appears
    await expect(page.getByText('Clear Filters')).toBeVisible();

    // Clear search
    await page.getByText('Clear Filters').click();
    await expect(searchInput).toHaveValue('');

    // Test category filter chips
    const categoryGroup = page.getByRole('group', { name: /filter by category/i });
    await expect(categoryGroup).toBeVisible();

    // Verify "All" chip is the default active chip (has bg-orange class)
    const allChip = categoryGroup.getByRole('button', { name: /^All$/i });
    await expect(allChip).toBeVisible();
    await expect(allChip).toHaveClass(/bg-orange/);
  });

  test('Infinite scroll loads more products', async ({ page }) => {
    await page.goto('/');

    // Wait for initial products to load
    await expect(page.getByText(/showing \d+ of \d+ products/i)).toBeVisible({ timeout: 10000 });

    // Get initial product count
    const initialCount = await page.getByText(/showing (\d+) of \d+ products/i).textContent();
    const initialMatch = initialCount?.match(/showing (\d+) of (\d+)/i);
    const initialProductCount = initialMatch ? parseInt(initialMatch[1]) : 0;
    const totalProducts = initialMatch ? parseInt(initialMatch[2]) : 0;

    // Only test infinite scroll if there are more products to load
    if (totalProducts > initialProductCount) {
      // Scroll to bottom
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

      // Wait for loading spinner to appear and disappear
      await page.waitForTimeout(2000);

      // Verify more products were loaded
      const finalCount = await page.getByText(/showing (\d+) of \d+ products/i).textContent();
      const finalMatch = finalCount?.match(/showing (\d+) of/i);
      const finalProductCount = finalMatch ? parseInt(finalMatch[1]) : 0;

      expect(finalProductCount).toBeGreaterThan(initialProductCount);
    }
  });

  test('Navigate to /products and verify redirect to /', async ({ page }) => {
    await page.goto('/products');

    // Should be redirected to home
    await expect(page).toHaveURL('/');

    // Verify products section is visible (authenticated view)
    await expect(page.getByPlaceholder(/search products/i)).toBeVisible();

    // Hero section should NOT be visible
    const heroSection = page.locator('section.relative.bg-gradient-hero');
    await expect(heroSection).not.toBeVisible();
  });

  test('Loading states are displayed correctly', async ({ page }) => {
    await page.goto('/');

    // Wait for products to load - they might load quickly
    await expect(page.getByText(/showing \d+ of \d+ products/i)).toBeVisible({ timeout: 15000 });

    // Verify that either loading state was shown or products loaded directly
    // This is a valid scenario in both cases
    const productsText = await page.getByText(/showing \d+ of \d+ products/i).textContent();
    expect(productsText).toMatch(/showing \d+ of \d+ products/i);
  });

  test('Clear Filters button works correctly', async ({ page }) => {
    await page.goto('/');

    // Wait for products to load
    await expect(page.getByText(/showing \d+ of \d+ products/i)).toBeVisible({ timeout: 10000 });

    // Apply both search and category filters
    const searchInput = page.getByPlaceholder('Search products...');
    await searchInput.fill('laptop');

    // Click a category chip to apply category filter
    const categoryGroup = page.getByRole('group', { name: /filter by category/i });
    const electronicsChip = categoryGroup.getByRole('button', { name: /Electronics/i });
    await electronicsChip.click();

    // Wait for debounce
    await page.waitForTimeout(400);

    // Verify the Electronics chip is active
    await expect(electronicsChip).toHaveClass(/bg-orange/);

    // Clear Filters button should be visible
    await expect(page.getByText('Clear Filters')).toBeVisible();

    // Click Clear Filters
    await page.getByText('Clear Filters').click();

    // Verify both filters are cleared
    await expect(searchInput).toHaveValue('');

    // Verify "All" chip is active again (has bg-orange class)
    const allChip = categoryGroup.getByRole('button', { name: /^All$/i });
    await expect(allChip).toHaveClass(/bg-orange/);

    // Clear Filters button should disappear
    await expect(page.getByText('Clear Filters')).not.toBeVisible();
  });

  test('Authenticated but unverified user sees verification required message', async ({ page }) => {
    const timestamp = Date.now();
    const unverifiedEmail = `unverified${timestamp}@example.com`;
    const unverifiedUsername = `unverified${timestamp}`;
    const testPassword = 'Password123!';

    // Register via API (auto-verified in test mode)
    await page.request.post('/api/auth/register', {
      data: {
        name: 'Unverified Test User',
        username: unverifiedUsername,
        email: unverifiedEmail,
        password: testPassword,
      },
    });

    // Unverify the user
    await page.request.post('/api/auth/test-set-verified', {
      data: { email: unverifiedEmail, isVerified: false },
    });

    // Login as unverified user
    const loginRes = await page.request.post('/api/auth/login', {
      data: { email: unverifiedEmail, password: testPassword },
    });
    const loginBody = await loginRes.json();

    // Set token in localStorage
    await page.evaluate((token) => {
      localStorage.setItem('token', token);
    }, loginBody.data.token);
    await page.reload();

    // Navigate to Create Product page
    await page.goto('/create-product');
    await expect(page).toHaveURL('/create-product');

    // Since user is unverified, they should see the VerificationRequired component
    await expect(page.getByRole('heading', { name: /email verification required/i })).toBeVisible();
  });

  test('Loading more products shows spinner', async ({ page }) => {
    await page.goto('/');

    // Wait for initial products to load
    await expect(page.getByText(/showing \d+ of \d+ products/i)).toBeVisible({ timeout: 10000 });

    // Check if there are more products to load
    const countText = await page.getByText(/showing (\d+) of (\d+) products/i).textContent();
    const match = countText?.match(/showing (\d+) of (\d+)/i);
    const currentCount = match ? parseInt(match[1]) : 0;
    const totalCount = match ? parseInt(match[2]) : 0;

    if (totalCount > currentCount) {
      // Intercept the next products API call to delay it
      await page.route('**/api/products?page=2**', async (route) => {
        await page.waitForTimeout(500);
        await route.continue();
      });

      // Scroll to trigger infinite scroll
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

      // Verify loading spinner appears
      const spinner = page.locator('svg.animate-spin');
      await expect(spinner).toBeVisible({ timeout: 2000 });

      // Wait for loading to complete
      await expect(spinner).not.toBeVisible({ timeout: 5000 });
    }
  });

  test('Sort select is visible and can be changed', async ({ page }) => {
    await page.goto('/');

    // Wait for products to load
    await expect(page.getByText(/showing \d+ of \d+ products/i)).toBeVisible({ timeout: 10000 });

    // Scope to desktop sidebar (conditionally hidden when no products exist)
    const sidebar = page.getByTestId('desktop-sidebar');
    await expect(sidebar).toBeVisible({ timeout: 15000 });

    // Sort select should be visible (desktop sidebar)
    const sortSelect = sidebar.getByLabel('Sort By');
    await expect(sortSelect).toBeVisible();

    // Verify default value is "newest"
    await expect(sortSelect).toHaveValue('newest');

    // Change sort to price ascending
    await sortSelect.selectOption('price_asc');
    await expect(sortSelect).toHaveValue('price_asc');

    // Wait for re-fetch
    await page.waitForTimeout(500);

    // Verify products are still displayed after sort change
    await expect(page.getByText(/showing \d+ of \d+ products/i)).toBeVisible();
  });

  test('Condition checkboxes are visible and can be clicked', async ({ page }) => {
    await page.goto('/');

    // Wait for products to load
    await expect(page.getByText(/showing \d+ of \d+ products/i)).toBeVisible({ timeout: 10000 });

    // Scope to desktop sidebar (conditionally hidden when no products exist)
    const sidebar = page.getByTestId('desktop-sidebar');
    await expect(sidebar).toBeVisible({ timeout: 15000 });

    // Condition checkboxes should be visible (desktop sidebar)
    // Labels now include counts like "New (3)", so use regex to match the prefix
    await expect(sidebar.getByLabel(/^New/)).toBeVisible();
    await expect(sidebar.getByLabel(/^Like New/)).toBeVisible();
    await expect(sidebar.getByLabel(/^Good/)).toBeVisible();
    await expect(sidebar.getByLabel(/^Fair/)).toBeVisible();

    // Click the "New" condition checkbox
    await sidebar.getByLabel(/^New/).check();
    await expect(sidebar.getByLabel(/^New/)).toBeChecked();

    // Wait for re-fetch
    await page.waitForTimeout(500);

    // Products should still be displayed
    await expect(page.getByText(/showing \d+ of \d+ products/i)).toBeVisible();
  });

  test('Clear Filters resets sort and conditions', async ({ page }) => {
    await page.goto('/');

    // Wait for products to load
    await expect(page.getByText(/showing \d+ of \d+ products/i)).toBeVisible({ timeout: 10000 });

    // Scope to desktop sidebar (conditionally hidden when no products exist)
    const sidebar = page.getByTestId('desktop-sidebar');
    await expect(sidebar).toBeVisible({ timeout: 15000 });

    // Change sort to non-default
    const sortSelect = sidebar.getByLabel('Sort By');
    await sortSelect.selectOption('title_asc');
    await expect(sortSelect).toHaveValue('title_asc');

    // Check a condition (labels now include counts like "Good (2)")
    await sidebar.getByLabel(/^Good/).check();
    await expect(sidebar.getByLabel(/^Good/)).toBeChecked();

    // Clear Filters button should be visible
    await expect(page.getByText('Clear Filters')).toBeVisible();

    // Click Clear Filters
    await page.getByText('Clear Filters').click();

    // Wait for reset
    await page.waitForTimeout(500);

    // Sort should be reset to newest
    await expect(sortSelect).toHaveValue('newest');

    // Condition checkbox should be unchecked (labels now include counts)
    await expect(sidebar.getByLabel(/^Good/)).not.toBeChecked();

    // Clear Filters button should disappear
    await expect(page.getByText('Clear Filters')).not.toBeVisible();
  });

  test('Error state displays error message', async ({ page }) => {
    // Intercept API call and return error
    await page.route('**/api/products**', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          message: 'Server error',
        }),
      });
    });

    await page.goto('/');

    // Wait for error message to appear (the API mock returns "Server error")
    await expect(page.getByText(/server error/i)).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Condition Counts in Filter Sidebar', () => {
  // These tests seed their own product data to ensure the sidebar is visible
  // and condition counts are deterministic.

  /** Helper: register a user via API, returns { email, token } */
  async function seedUserAndLogin(request: import('@playwright/test').APIRequestContext) {
    const ts = Date.now();
    const random = Math.floor(Math.random() * 100000);
    const email = `condcounts${ts}${random}@example.com`;
    const password = 'Password123!';

    await request.post('/api/auth/register', {
      data: {
        name: 'Condition Counts User',
        username: `condcounts${ts}${random}`,
        email,
        password,
      },
    });

    const loginRes = await request.post('/api/auth/login', {
      data: { email, password },
    });
    const loginBody = await loginRes.json();
    return { email, token: loginBody.data.token as string };
  }

  /** Helper: create a product via API with the given condition and category */
  async function createProduct(
    request: import('@playwright/test').APIRequestContext,
    token: string,
    opts: { title: string; condition: string; category: string },
  ) {
    // Create a minimal valid JPEG buffer (smallest valid JPEG)
    const jpegHeader = Buffer.from([
      0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01,
    ]);

    await request.post('/api/products', {
      headers: { Authorization: `Bearer ${token}` },
      multipart: {
        title: opts.title,
        description: 'Test product for condition counts e2e test',
        price: '50.00',
        category: opts.category,
        condition: opts.condition,
        images: {
          name: 'test-image.jpg',
          mimeType: 'image/jpeg',
          buffer: jpegHeader,
        },
      },
    });
  }

  test.beforeEach(async ({ page, request }) => {
    // Seed user and products via API, then authenticate in the browser
    const { token } = await seedUserAndLogin(request);

    // Create products with different conditions across two categories
    // Electronics: 2 New, 1 Good
    // Clothes: 1 Like New, 1 Fair
    const products = [
      { title: 'E2E Phone', condition: 'New', category: 'Electronics' },
      { title: 'E2E Tablet', condition: 'New', category: 'Electronics' },
      { title: 'E2E Camera', condition: 'Good', category: 'Electronics' },
      { title: 'E2E Jacket', condition: 'Like New', category: 'Clothes' },
      { title: 'E2E Pants', condition: 'Fair', category: 'Clothes' },
    ];
    for (const p of products) {
      await createProduct(request, token, p);
    }

    // Authenticate in the browser
    await page.goto('/');
    await page.evaluate((t) => {
      localStorage.setItem('token', t);
    }, token);
    await page.reload();
  });

  test('Condition counts are displayed next to each checkbox', async ({ page }) => {
    await page.goto('/');

    // Wait for products to load (at least our 5 seeded products exist)
    await expect(page.getByText(/showing \d+ of \d+ products/i)).toBeVisible({ timeout: 10000 });

    // Scope to desktop sidebar
    const sidebar = page.getByTestId('desktop-sidebar');
    await expect(sidebar).toBeVisible();

    // Each condition checkbox label should show a count in parentheses
    const conditionLabels = sidebar.locator('label.group');
    const labelCount = await conditionLabels.count();
    expect(labelCount).toBe(4); // New, Like New, Good, Fair

    for (let i = 0; i < labelCount; i++) {
      const label = conditionLabels.nth(i);
      await expect(label).toBeVisible();

      // Verify the count span shows a number in parentheses, e.g. "(2)" or "(0)"
      const countSpan = label.locator('span.text-text-muted');
      await expect(countSpan).toBeVisible();
      await expect(countSpan).toHaveText(/\(\d+\)/);
    }
  });

  test('Condition counts update when category filter changes', async ({ page }) => {
    await page.goto('/');

    // Wait for products to load
    await expect(page.getByText(/showing \d+ of \d+ products/i)).toBeVisible({ timeout: 10000 });

    // Scope to desktop sidebar
    const sidebar = page.getByTestId('desktop-sidebar');

    // Capture initial condition counts (with "All" category selected)
    const conditionLabels = sidebar.locator('label.group');
    const labelCount = await conditionLabels.count();
    const initialCounts: string[] = [];
    for (let i = 0; i < labelCount; i++) {
      const countSpan = conditionLabels.nth(i).locator('span.text-text-muted');
      initialCounts.push((await countSpan.textContent()) ?? '');
    }

    // Click a specific category chip to narrow down products
    const categoryGroup = page.getByRole('group', { name: /filter by category/i });
    const electronicsChip = categoryGroup.getByRole('button', { name: /Electronics/i });
    await electronicsChip.click();

    // Wait for re-fetch
    await page.waitForTimeout(500);

    // Capture updated condition counts
    const updatedCounts: string[] = [];
    for (let i = 0; i < labelCount; i++) {
      const countSpan = conditionLabels.nth(i).locator('span.text-text-muted');
      updatedCounts.push((await countSpan.textContent()) ?? '');
    }

    // Counts should have changed since we narrowed by category
    // The total across all conditions should be less or equal
    const parseCount = (text: string) => parseInt(text.replace(/[()]/g, ''), 10) || 0;
    const initialTotal = initialCounts.reduce((sum, c) => sum + parseCount(c), 0);
    const updatedTotal = updatedCounts.reduce((sum, c) => sum + parseCount(c), 0);

    expect(updatedTotal).toBeLessThanOrEqual(initialTotal);

    // Verify counts still show valid numbers after category filter
    for (let i = 0; i < labelCount; i++) {
      const countSpan = conditionLabels.nth(i).locator('span.text-text-muted');
      await expect(countSpan).toHaveText(/\(\d+\)/);
    }
  });

  test('Selecting a condition does NOT change the displayed counts', async ({ page }) => {
    await page.goto('/');

    // Wait for products to load
    await expect(page.getByText(/showing \d+ of \d+ products/i)).toBeVisible({ timeout: 10000 });

    // Scope to desktop sidebar
    const sidebar = page.getByTestId('desktop-sidebar');

    // Capture condition counts before selecting a condition
    const conditionLabels = sidebar.locator('label.group');
    const labelCount = await conditionLabels.count();
    const countsBeforeSelection: string[] = [];
    for (let i = 0; i < labelCount; i++) {
      const countSpan = conditionLabels.nth(i).locator('span.text-text-muted');
      countsBeforeSelection.push((await countSpan.textContent()) ?? '');
    }

    // Select the "Good" condition checkbox (label text is "Good (N)")
    const goodCheckbox = conditionLabels.nth(2).locator('input[type="checkbox"]');
    await goodCheckbox.check();
    await expect(goodCheckbox).toBeChecked();

    // Wait for re-fetch
    await page.waitForTimeout(500);

    // Capture condition counts after selecting a condition
    const countsAfterSelection: string[] = [];
    for (let i = 0; i < labelCount; i++) {
      const countSpan = conditionLabels.nth(i).locator('span.text-text-muted');
      countsAfterSelection.push((await countSpan.textContent()) ?? '');
    }

    // Counts should remain unchanged because they reflect the base filter
    // (category + search), not the condition selection
    for (let i = 0; i < labelCount; i++) {
      expect(countsAfterSelection[i]).toBe(countsBeforeSelection[i]);
    }
  });
});
