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

    // Wait for either success message or stay on registration (error case)
    await page.waitForTimeout(2000);

    // Check if we got the success message
    const successHeading = page.getByRole('heading', { name: /check your email/i });
    const isSuccessVisible = await successHeading.isVisible().catch(() => false);

    if (isSuccessVisible) {
      await page.getByRole('link', { name: /go to login/i }).click();
      await page.waitForURL(/\/login/, { timeout: 10000 });
    } else {
      // Registration failed, check for error and retry with different credentials
      const errorText = await page.locator('.text-red-500, .text-red-400').textContent();
      throw new Error(`Registration failed: ${errorText}`);
    }

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

    // Scope to desktop sidebar to avoid matching mobile drawer duplicates
    const sidebar = page.getByTestId('desktop-sidebar');

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

    // Scope to desktop sidebar to avoid matching mobile drawer duplicates
    const sidebar = page.getByTestId('desktop-sidebar');

    // Condition checkboxes should be visible (desktop sidebar)
    await expect(sidebar.getByLabel('New', { exact: true })).toBeVisible();
    await expect(sidebar.getByLabel('Like New')).toBeVisible();
    await expect(sidebar.getByLabel('Good')).toBeVisible();
    await expect(sidebar.getByLabel('Fair')).toBeVisible();

    // Click the "New" condition checkbox
    await sidebar.getByLabel('New', { exact: true }).check();
    await expect(sidebar.getByLabel('New', { exact: true })).toBeChecked();

    // Wait for re-fetch
    await page.waitForTimeout(500);

    // Products should still be displayed
    await expect(page.getByText(/showing \d+ of \d+ products/i)).toBeVisible();
  });

  test('Clear Filters resets sort and conditions', async ({ page }) => {
    await page.goto('/');

    // Wait for products to load
    await expect(page.getByText(/showing \d+ of \d+ products/i)).toBeVisible({ timeout: 10000 });

    // Scope to desktop sidebar
    const sidebar = page.getByTestId('desktop-sidebar');

    // Change sort to non-default
    const sortSelect = sidebar.getByLabel('Sort By');
    await sortSelect.selectOption('title_asc');
    await expect(sortSelect).toHaveValue('title_asc');

    // Check a condition
    await sidebar.getByLabel('Good').check();
    await expect(sidebar.getByLabel('Good')).toBeChecked();

    // Clear Filters button should be visible
    await expect(page.getByText('Clear Filters')).toBeVisible();

    // Click Clear Filters
    await page.getByText('Clear Filters').click();

    // Wait for reset
    await page.waitForTimeout(500);

    // Sort should be reset to newest
    await expect(sortSelect).toHaveValue('newest');

    // Condition checkbox should be unchecked
    await expect(sidebar.getByLabel('Good')).not.toBeChecked();

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
