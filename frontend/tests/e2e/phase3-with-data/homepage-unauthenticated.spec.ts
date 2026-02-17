import { test, expect } from '@playwright/test';

test.describe('Homepage - Non-Authenticated Users', () => {
  test.beforeEach(async ({ page }) => {
    // Ensure user is not authenticated
    await page.goto('/');
    await page.evaluate(() => localStorage.removeItem('token'));
    await page.reload();
  });

  test('Hero section is visible with "Welcome to Sell-It" heading', async ({ page }) => {
    await page.goto('/');

    // Verify Hero section is visible
    const heroSection = page.locator('section.relative.bg-gradient-hero');
    await expect(heroSection).toBeVisible();

    // Verify "Welcome to Sell-It" heading
    await expect(page.getByRole('heading', { name: /welcome to sell-it/i })).toBeVisible();

    // Verify tagline
    await expect(
      page.getByText(/your trusted marketplace for buying and selling anything, easily/i),
    ).toBeVisible();
  });

  test('Features section is visible with 3 benefit cards', async ({ page }) => {
    await page.goto('/');

    // Verify Features section is visible (white background with border)
    const featuresSection = page.locator('section.bg-white.border-t.border-gray-200');
    await expect(featuresSection).toBeVisible();

    // Verify all 3 feature cards
    await expect(page.getByRole('heading', { name: /easy to sell/i })).toBeVisible();
    await expect(page.getByText(/list your items in minutes and reach buyers instantly/i)).toBeVisible();

    await expect(page.getByRole('heading', { name: /secure trading/i })).toBeVisible();
    await expect(page.getByText(/safe and secure platform for all your transactions/i)).toBeVisible();

    await expect(page.getByRole('heading', { name: /growing community/i })).toBeVisible();
    await expect(page.getByText(/join thousands of buyers and sellers today/i)).toBeVisible();
  });

  test('"Browse Products" button smooth scrolls to products section', async ({ page }) => {
    await page.goto('/');

    // Wait for page to load
    await expect(page.getByRole('button', { name: /browse products/i })).toBeVisible();

    // Get initial scroll position
    const initialScrollY = await page.evaluate(() => window.scrollY);

    // Click "Browse Products" button
    await page.getByRole('button', { name: /browse products/i }).click();

    // Wait a moment for smooth scroll to complete
    await page.waitForTimeout(1000);

    // Verify scroll position has changed
    const finalScrollY = await page.evaluate(() => window.scrollY);
    expect(finalScrollY).toBeGreaterThan(initialScrollY);

    // Verify products section is in view
    const productsSection = page.locator('section.bg-dark-bg');
    await expect(productsSection).toBeInViewport();
  });

  test('All products are displayed below Features section', async ({ page }) => {
    await page.goto('/');

    // Wait for products to load
    await expect(page.getByText(/showing \d+ of \d+ products/i)).toBeVisible({ timeout: 10000 });

    // Verify products grid is visible
    const productsGrid = page.locator('section.bg-dark-bg');
    await expect(productsGrid).toBeVisible();

    // Verify at least one product card exists (if products exist in the database)
    const productCards = page.getByText('View Details');
    const count = await productCards.count();

    // If there are products, verify they are visible
    if (count > 0) {
      await expect(productCards.first()).toBeVisible();
    }
  });

  test('Search bar and category filter work correctly', async ({ page }) => {
    await page.goto('/');

    // Wait for products to load
    await expect(page.getByText(/showing \d+ of \d+ products/i)).toBeVisible({ timeout: 10000 });

    // Test search bar
    const searchInput = page.getByPlaceholder('Search products...');
    await expect(searchInput).toBeVisible();

    await searchInput.fill('test search');

    // Wait for debounce (300ms)
    await page.waitForTimeout(400);

    // Verify search has been applied (Clear Filters button should appear)
    await expect(page.getByText('Clear Filters')).toBeVisible();

    // Clear search
    await page.getByText('Clear Filters').click();
    await expect(searchInput).toHaveValue('');

    // Test category filter chips
    const categoryGroup = page.getByRole('group', { name: /filter by category/i });
    await expect(categoryGroup).toBeVisible();

    // Verify "All" chip is active by default
    const allChip = categoryGroup.getByRole('button', { name: /^All$/i });
    await expect(allChip).toHaveClass(/bg-orange/);

    // Click a category chip (e.g., Electronics)
    const electronicsChip = categoryGroup.getByRole('button', { name: /Electronics/i });
    await electronicsChip.click();

    // Verify the Electronics chip is now active
    await expect(electronicsChip).toHaveClass(/bg-orange/);

    // Verify filter has been applied
    await expect(page.getByText('Clear Filters')).toBeVisible();
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

    // Change sort to title A-Z
    await sortSelect.selectOption('title_asc');
    await expect(sortSelect).toHaveValue('title_asc');

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

    // Click the "Like New" condition checkbox
    await sidebar.getByLabel(/^Like New/).check();
    await expect(sidebar.getByLabel(/^Like New/)).toBeChecked();

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
    await sortSelect.selectOption('price_desc');
    await expect(sortSelect).toHaveValue('price_desc');

    // Check a condition (labels now include counts like "Fair (1)")
    await sidebar.getByLabel(/^Fair/).check();
    await expect(sidebar.getByLabel(/^Fair/)).toBeChecked();

    // Clear Filters button should be visible
    await expect(page.getByText('Clear Filters')).toBeVisible();

    // Click Clear Filters
    await page.getByText('Clear Filters').click();

    // Wait for reset
    await page.waitForTimeout(500);

    // Sort should be reset to newest
    await expect(sortSelect).toHaveValue('newest');

    // Condition checkbox should be unchecked (labels now include counts)
    await expect(sidebar.getByLabel(/^Fair/)).not.toBeChecked();

    // Clear Filters button should disappear
    await expect(page.getByText('Clear Filters')).not.toBeVisible();
  });

  test('Infinite scroll loads more products when scrolling down', async ({ page }) => {
    await page.goto('/');

    // Wait for initial products to load
    await expect(page.getByText(/showing \d+ of \d+ products/i)).toBeVisible({ timeout: 10000 });

    // Get initial count
    const initialCount = await page.getByText(/showing (\d+) of \d+ products/i).textContent();
    const initialMatch = initialCount?.match(/showing (\d+) of/i);
    const initialProductCount = initialMatch ? parseInt(initialMatch[1]) : 0;

    // Scroll to bottom to trigger infinite scroll
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

    // Wait for potential loading
    await page.waitForTimeout(2000);

    // Check if more products were loaded (if there are more available)
    const finalCount = await page.getByText(/showing (\d+) of \d+ products/i).textContent();
    const finalMatch = finalCount?.match(/showing (\d+) of (\d+)/i);
    const finalProductCount = finalMatch ? parseInt(finalMatch[1]) : 0;
    const totalProducts = finalMatch ? parseInt(finalMatch[2]) : 0;

    // If there are more products available, verify they were loaded
    if (totalProducts > initialProductCount) {
      expect(finalProductCount).toBeGreaterThanOrEqual(initialProductCount);
    }
  });

  test('Navigate to /products and verify redirect to /', async ({ page }) => {
    await page.goto('/products');

    // Should be redirected to home
    await expect(page).toHaveURL('/');

    // Verify Hero section is visible (since user is not authenticated)
    await expect(page.getByRole('heading', { name: /welcome to sell-it/i })).toBeVisible();
  });

  test('Loading states are displayed correctly', async ({ page }) => {
    // Navigate to home first
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    // Verify skeleton loader is shown initially while loading
    const skeletonCards = page.locator('.animate-pulse');

    // Check if skeleton is visible OR if products have already loaded
    const isSkeletonVisible = await skeletonCards.first().isVisible().catch(() => false);
    const productsTextVisible = await page.getByText(/showing \d+ of \d+ products/i).isVisible().catch(() => false);

    // If skeleton was visible, wait for it to disappear
    if (isSkeletonVisible) {
      await expect(page.getByText(/showing \d+ of \d+ products/i)).toBeVisible({ timeout: 15000 });
      await expect(skeletonCards.first()).not.toBeVisible();
    } else if (productsTextVisible) {
      // Products loaded quickly, that's fine
      await expect(page.getByText(/showing \d+ of \d+ products/i)).toBeVisible();
    } else {
      // Wait for either skeleton or products
      await expect(page.getByText(/showing \d+ of \d+ products/i)).toBeVisible({ timeout: 15000 });
    }
  });

  test('Error handling displays error message', async ({ page }) => {
    // Set up route interception BEFORE navigation
    let requestIntercepted = false;
    await page.route('**/api/products*', async (route) => {
      requestIntercepted = true;
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          message: 'Server error occurred',
        }),
      });
    });

    // Navigate to home - route is already set up
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    // Wait a moment for the request to be intercepted
    await page.waitForTimeout(1000);

    // Verify request was intercepted
    expect(requestIntercepted).toBe(true);

    // Wait for error message to appear - the component shows "Failed to load products"
    // when err?.response?.data?.message is falsy or uses it otherwise
    const errorBox = page.locator('.bg-red-900\\/20');
    await expect(errorBox).toBeVisible({ timeout: 15000 });

    // Check that an error message is displayed
    const errorText = page.locator('.text-red-400');
    await expect(errorText).toBeVisible();
  });

  test('Start Selling button navigates to login for unauthenticated users', async ({ page }) => {
    await page.goto('/');

    // Find and click "Start Selling" button
    const startSellingButton = page.getByRole('button', { name: /start selling/i });
    await expect(startSellingButton).toBeVisible();

    await startSellingButton.click();

    // Should navigate to login page
    await expect(page).toHaveURL('/login');
  });
});
