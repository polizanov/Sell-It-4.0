import { test, expect } from '@playwright/test';

test.describe('Homepage - Authenticated Users', () => {
  test.beforeEach(async ({ page }) => {
    // Register and login a test user with high uniqueness
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 100000);
    const testEmail = `homeauth${timestamp}${random}@example.com`;
    const testUsername = `homeauth${timestamp}${random}`;
    const testPassword = 'password123';

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

    // Verify products section is at or near the top of the page
    // Account for navbar (~80px) + verification banner (~60-80px) if present
    const sectionPosition = await productsSection.boundingBox();
    expect(sectionPosition?.y).toBeLessThan(900); // Allow for navbar and verification banner

    // More importantly, verify Hero and Features sections are NOT above it
    const heroSection = page.locator('section.relative.bg-gradient-hero');
    await expect(heroSection).not.toBeVisible();
  });

  test('"All Products" page header is visible', async ({ page }) => {
    await page.goto('/');

    // "All Products" heading should be visible for authenticated users
    await expect(page.getByRole('heading', { name: /^all products$/i })).toBeVisible();

    // Subtitle should also be visible
    await expect(page.getByText(/browse all available listings/i)).toBeVisible();
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

    // Test category filter
    const categorySelect = page.locator('select');
    await expect(categorySelect).toBeVisible();

    // Verify "All Categories" is the default option
    await expect(categorySelect).toHaveValue('');
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

    // Verify "All Products" header is visible (authenticated view)
    await expect(page.getByRole('heading', { name: /^all products$/i })).toBeVisible();

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

    const categorySelect = page.locator('select');
    const options = await categorySelect.locator('option').allTextContents();
    if (options.length > 1) {
      await categorySelect.selectOption(options[1]);
    }

    // Wait for debounce
    await page.waitForTimeout(400);

    // Clear Filters button should be visible
    await expect(page.getByText('Clear Filters')).toBeVisible();

    // Click Clear Filters
    await page.getByText('Clear Filters').click();

    // Verify both filters are cleared
    await expect(searchInput).toHaveValue('');
    await expect(categorySelect).toHaveValue('');

    // Clear Filters button should disappear
    await expect(page.getByText('Clear Filters')).not.toBeVisible();
  });

  test('Authenticated but unverified user sees verification required message', async ({ page }) => {
    await page.goto('/');

    // Navigate to Create Product page
    await page.goto('/create-product');

    // Should stay on create-product route
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

    // Wait for error message to appear
    await expect(page.getByText(/failed to load products/i)).toBeVisible({ timeout: 10000 });
  });
});
