import { test, expect } from '@playwright/test';

test.describe('All Products Page', () => {
  test('loads and displays products from the API', async ({ page }) => {
    await page.goto('/products');

    // Wait for the page heading
    await expect(page.getByRole('heading', { name: 'All Products' })).toBeVisible();

    // Wait for at least one product card to appear (products have "View Details" links)
    await expect(page.getByText('View Details').first()).toBeVisible({ timeout: 10000 });

    // Verify the "Showing X of Y products" text appears
    await expect(page.getByText(/Showing \d+ of \d+ products/)).toBeVisible();
  });

  test('category filter works', async ({ page }) => {
    // First, create a product so there is at least one with a known category.
    // Register and log in a test user.
    await page.goto('/register');

    const timestamp = Date.now();
    const testEmail = `allprodcat+${timestamp}@example.com`;
    const testPassword = 'password123';

    await page.getByLabel(/full name/i).fill('Cat Filter User');
    await page.getByLabel(/email address/i).fill(testEmail);
    await page.getByLabel(/^password/i).fill(testPassword);
    await page.getByLabel(/confirm password/i).fill(testPassword);
    await page.getByRole('button', { name: /create account/i }).click();

    await page.waitForURL(/\/login/, { timeout: 10000 });

    await page.getByLabel(/email address/i).fill(testEmail);
    await page.getByLabel(/password/i).fill(testPassword);
    await page.getByRole('button', { name: /login/i }).click();

    await page.waitForURL('/', { timeout: 10000 });

    // Create a product with category "Electronics"
    await page.goto('/create-product');
    await page.waitForURL(/\/create-product/);

    await page.getByLabel(/product title/i).fill('E2E Filter Test Product');
    await page.getByLabel(/description/i).fill('This product is for testing the category filter');
    await page.getByLabel(/price/i).fill('55.00');
    await page.getByLabel(/category/i).fill('Electronics');
    await page.getByLabel(/condition/i).selectOption('New');

    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'filter-test.jpg',
      mimeType: 'image/jpeg',
      buffer: Buffer.from('fake-image-data'),
    });

    await page.getByRole('button', { name: /create product/i }).click();
    await page.waitForURL(/\/products\//, { timeout: 15000 });

    // Navigate to all products page
    await page.goto('/products');
    await expect(page.getByRole('heading', { name: 'All Products' })).toBeVisible();

    // Wait for products to load
    await expect(page.getByText(/Showing \d+ of \d+ products/)).toBeVisible({ timeout: 10000 });

    // Select category "Electronics" from the filter dropdown
    const categorySelect = page.locator('select');
    await categorySelect.selectOption('Electronics');

    // Wait for the filtered results
    await expect(page.getByText(/Showing \d+ of \d+ products/)).toBeVisible({ timeout: 10000 });

    // The "Clear Filters" button should be visible
    await expect(page.getByText('Clear Filters')).toBeVisible();
  });

  test('search works with debounce', async ({ page }) => {
    // Create a product with a unique title so we can search for it
    await page.goto('/register');

    const timestamp = Date.now();
    const testEmail = `allprodsearch+${timestamp}@example.com`;
    const testPassword = 'password123';

    await page.getByLabel(/full name/i).fill('Search Test User');
    await page.getByLabel(/email address/i).fill(testEmail);
    await page.getByLabel(/^password/i).fill(testPassword);
    await page.getByLabel(/confirm password/i).fill(testPassword);
    await page.getByRole('button', { name: /create account/i }).click();

    await page.waitForURL(/\/login/, { timeout: 10000 });

    await page.getByLabel(/email address/i).fill(testEmail);
    await page.getByLabel(/password/i).fill(testPassword);
    await page.getByRole('button', { name: /login/i }).click();

    await page.waitForURL('/', { timeout: 10000 });

    // Create a product with a unique name
    await page.goto('/create-product');
    await page.waitForURL(/\/create-product/);

    const uniqueTitle = `UniqueSearchable${timestamp}`;
    await page.getByLabel(/product title/i).fill(uniqueTitle);
    await page.getByLabel(/description/i).fill('A product created to test the search feature');
    await page.getByLabel(/price/i).fill('33.00');
    await page.getByLabel(/category/i).fill('Books');
    await page.getByLabel(/condition/i).selectOption('Good');

    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'search-test.jpg',
      mimeType: 'image/jpeg',
      buffer: Buffer.from('fake-image-data'),
    });

    await page.getByRole('button', { name: /create product/i }).click();
    await page.waitForURL(/\/products\//, { timeout: 15000 });

    // Navigate to all products page
    await page.goto('/products');
    await expect(page.getByText(/Showing \d+ of \d+ products/)).toBeVisible({ timeout: 10000 });

    // Type the unique title in the search box
    const searchInput = page.getByPlaceholder('Search products...');
    await searchInput.fill(uniqueTitle);

    // Wait for debounce and filtered result
    await expect(page.getByText(uniqueTitle)).toBeVisible({ timeout: 10000 });

    // Only one product should match
    await expect(page.getByText(/Showing 1 of 1 products/)).toBeVisible({ timeout: 10000 });
  });

  test('Clear Filters works', async ({ page }) => {
    await page.goto('/products');

    // Wait for products to load
    await expect(page.getByText(/Showing \d+ of \d+ products/)).toBeVisible({ timeout: 10000 });

    // Type something in the search input
    const searchInput = page.getByPlaceholder('Search products...');
    await searchInput.fill('somethingToFilter');

    // Wait for the "Clear Filters" button to appear
    await expect(page.getByText('Clear Filters')).toBeVisible({ timeout: 5000 });

    // Click the "Clear Filters" button
    await page.getByText('Clear Filters').click();

    // The search input should be cleared
    await expect(searchInput).toHaveValue('');

    // The "Clear Filters" button should disappear
    await expect(page.getByText('Clear Filters')).not.toBeVisible();
  });

  test('Home page displays featured products from the API', async ({ page }) => {
    await page.goto('/');

    // Wait for the "Featured Products" section heading
    await expect(page.getByRole('heading', { name: 'Featured Products' })).toBeVisible();

    // Wait for at least one product card to appear
    await expect(page.getByText('View Details').first()).toBeVisible({ timeout: 10000 });

    // The "View All Products" button should be visible
    await expect(page.getByRole('button', { name: /view all products/i })).toBeVisible();
  });
});
