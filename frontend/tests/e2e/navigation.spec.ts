import { test, expect } from '@playwright/test';

test.describe('Navigation - Desktop and Mobile', () => {
  test.describe('Desktop Navigation', () => {
    test.use({ viewport: { width: 1280, height: 720 } });

    test('"All Products" link is removed from desktop navigation (unauthenticated)', async ({
      page,
    }) => {
      // Ensure user is not authenticated
      await page.goto('/');
      await page.evaluate(() => localStorage.removeItem('token'));
      await page.reload();

      // Wait for navbar to load
      const navbar = page.locator('nav.hidden.md\\:flex');
      await expect(navbar).toBeVisible();

      // Verify "All Products" link does not exist
      const allProductsLink = navbar.getByRole('link', { name: /^all products$/i });
      await expect(allProductsLink).not.toBeVisible();

      // Verify Logo link exists (serves as home link)
      await expect(navbar.getByRole('link', { name: /sell-it/i })).toBeVisible();

      // Verify "Login" and "Register" links exist for unauthenticated users
      await expect(navbar.getByRole('link', { name: /login/i })).toBeVisible();
      await expect(navbar.getByRole('button', { name: /register/i })).toBeVisible();
    });

    test('"All Products" link is removed from desktop navigation (authenticated)', async ({
      page,
    }) => {
      // Register and login a test user
      const timestamp = Date.now();
      const random = Math.floor(Math.random() * 100000);
      const testEmail = `navdesktop${timestamp}${random}@example.com`;
      const testUsername = `navdesktop${timestamp}${random}`;
      const testPassword = 'Password123!';

      await page.goto('/register');

      await page.getByLabel(/full name/i).fill('Nav Desktop User');
      await page.getByLabel(/username/i).fill(testUsername);
      await page.getByLabel(/email address/i).fill(testEmail);
      await page.getByLabel(/^password/i).fill(testPassword);
      await page.getByLabel(/confirm password/i).fill(testPassword);
      await page.getByRole('button', { name: /create account/i }).click();

      // Wait for success message and click "Go to Login"
      await expect(page.getByRole('heading', { name: /check your email/i })).toBeVisible({ timeout: 10000 });
      await page.getByRole('link', { name: /go to login/i }).click();

      await page.getByLabel(/email address/i).fill(testEmail);
      await page.getByLabel(/password/i).fill(testPassword);
      await page.getByRole('button', { name: /login/i }).click();

      await page.waitForURL('/', { timeout: 20000 });

      // Wait for navbar to load
      const navbar = page.locator('nav.hidden.md\\:flex');
      await expect(navbar).toBeVisible();

      // Verify "All Products" link does not exist
      const allProductsLink = navbar.getByRole('link', { name: /^all products$/i });
      await expect(allProductsLink).not.toBeVisible();

      // Verify authenticated user links exist
      await expect(navbar.getByRole('link', { name: /sell-it/i })).toBeVisible();
      await expect(navbar.getByRole('link', { name: /my profile/i })).toBeVisible();
      await expect(navbar.getByRole('button', { name: /logout/i })).toBeVisible();

      // Verified users see My Favourites (auto-verified in test mode)
      await expect(navbar.getByRole('link', { name: /my favourites/i })).toBeVisible();

      // Create Product is not a nav link (it's a FAB button)
      await expect(navbar.getByRole('link', { name: /create product/i })).not.toBeVisible();
    });

    test('Logo link navigates to home page', async ({ page }) => {
      await page.goto('/login');

      const navbar = page.locator('nav.hidden.md\\:flex');
      const logoLink = navbar.getByRole('link', { name: /sell-it/i });

      // Click Logo link
      await logoLink.click();

      // Should navigate to home page
      await expect(page).toHaveURL('/');
    });
  });

  test.describe('Mobile Navigation', () => {
    test.use({ viewport: { width: 375, height: 667 } });

    test('"All Products" link is removed from mobile menu (unauthenticated)', async ({ page }) => {
      // Ensure user is not authenticated
      await page.goto('/');
      await page.evaluate(() => localStorage.removeItem('token'));
      await page.reload();

      // Open mobile menu
      const menuButton = page.locator('button[aria-label="Open menu"]');
      await expect(menuButton).toBeVisible();
      await menuButton.click();

      // Wait for menu panel to open
      const menuPanel = page.locator('div.fixed.top-0.left-0.bottom-0');
      await expect(menuPanel).toBeVisible();

      // Verify "All Products" link does not exist in mobile menu
      const allProductsLink = menuPanel.getByRole('link', { name: /^all products$/i });
      await expect(allProductsLink).not.toBeVisible();

      // Verify "Login" and "Register" links exist for unauthenticated users
      await expect(menuPanel.getByRole('link', { name: /login/i })).toBeVisible();
      await expect(menuPanel.getByRole('link', { name: /register/i })).toBeVisible();
    });

    test('"All Products" link is removed from mobile menu (authenticated)', async ({ page }) => {
      // Register and login a test user
      const timestamp = Date.now();
      const random = Math.floor(Math.random() * 100000);
      const testEmail = `navmobile${timestamp}${random}@example.com`;
      const testUsername = `navmobile${timestamp}${random}`;
      const testPassword = 'Password123!';

      await page.goto('/register');

      await page.getByLabel(/full name/i).fill('Nav Mobile User');
      await page.getByLabel(/username/i).fill(testUsername);
      await page.getByLabel(/email address/i).fill(testEmail);
      await page.getByLabel(/^password/i).fill(testPassword);
      await page.getByLabel(/confirm password/i).fill(testPassword);
      await page.getByRole('button', { name: /create account/i }).click();

      // Wait for success message and click "Go to Login"
      await expect(page.getByRole('heading', { name: /check your email/i })).toBeVisible({ timeout: 10000 });
      await page.getByRole('link', { name: /go to login/i }).click();

      await page.getByLabel(/email address/i).fill(testEmail);
      await page.getByLabel(/password/i).fill(testPassword);
      await page.getByRole('button', { name: /login/i }).click();

      await page.waitForURL('/', { timeout: 20000 });

      // Open mobile menu
      const menuButton = page.locator('button[aria-label="Open menu"]');
      await expect(menuButton).toBeVisible();
      await menuButton.click();

      // Wait for menu panel to open
      const menuPanel = page.locator('div.fixed.top-0.left-0.bottom-0');
      await expect(menuPanel).toBeVisible();

      // Verify "All Products" link does not exist in mobile menu
      const allProductsLink = menuPanel.getByRole('link', { name: /^all products$/i });
      await expect(allProductsLink).not.toBeVisible();

      // Verify authenticated user links exist
      await expect(menuPanel.getByRole('link', { name: /my profile/i })).toBeVisible();
      await expect(menuPanel.getByRole('button', { name: /logout/i })).toBeVisible();

      // Verified users see My Favourites (auto-verified in test mode)
      await expect(menuPanel.getByRole('link', { name: /my favourites/i })).toBeVisible();

      // Create Product is not a nav link (it's a FAB button)
      await expect(menuPanel.getByRole('link', { name: /create product/i })).not.toBeVisible();
    });

    test('Mobile menu opens and closes correctly', async ({ page }) => {
      await page.goto('/');

      // Open menu
      const openButton = page.locator('button[aria-label="Open menu"]');
      await expect(openButton).toBeVisible();
      await openButton.click();

      // Menu should slide in (not have -translate-x-full class)
      const menuPanel = page.locator('div.fixed.top-0.left-0.bottom-0');
      await expect(menuPanel).toBeVisible();
      await expect(menuPanel).not.toHaveClass(/-translate-x-full/);

      // Close menu by clicking backdrop
      const backdrop = page.locator('div.fixed.inset-0.bg-black\\/70');
      await backdrop.click();

      // Menu should slide out (have -translate-x-full class)
      await expect(menuPanel).toHaveClass(/-translate-x-full/);
    });

    test('Clicking a link in mobile menu closes the menu', async ({ page }) => {
      await page.goto('/');

      // Open mobile menu
      const menuButton = page.locator('button[aria-label="Open menu"]');
      await menuButton.click();

      // Wait for menu to slide in
      const menuPanel = page.locator('div.fixed.top-0.left-0.bottom-0');
      await expect(menuPanel).toBeVisible();
      await expect(menuPanel).not.toHaveClass(/-translate-x-full/);

      // Click "Login" link (available for unauthenticated users)
      const loginLink = menuPanel.getByRole('link', { name: /login/i });
      await loginLink.click();

      // Menu should slide out
      await expect(menuPanel).toHaveClass(/-translate-x-full/);
    });

    test('Logo link navigates to home from mobile', async ({ page }) => {
      await page.goto('/login');

      // Click the Logo in the mobile top bar (not inside the slide-in menu)
      const topBar = page.locator('div.md\\:hidden div.fixed.top-0');
      const logoLink = topBar.getByRole('link', { name: /sell-it/i });
      await logoLink.click();

      // Should navigate to home page
      await expect(page).toHaveURL('/');
    });
  });

  test.describe('Navigation State Highlighting', () => {
    test('Login link is highlighted when on login page (desktop)', async ({ page }) => {
      await page.goto('/login');

      // Desktop navbar - verify Login link has active styling
      const desktopLoginLink = page.locator('nav.hidden.md\\:flex').getByRole('link', { name: /^login$/i });
      await expect(desktopLoginLink).toHaveClass(/text-orange/);
      await expect(desktopLoginLink).toHaveClass(/bg-orange\/10/);
    });

    test('Login link is highlighted when on login page (mobile)', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/login');

      // Open mobile menu
      const menuButton = page.locator('button[aria-label="Open menu"]');
      await menuButton.click();

      const menuPanel = page.locator('div.fixed.top-0.left-0.bottom-0');
      await expect(menuPanel).toBeVisible();

      // Verify Login link has active styling in mobile menu
      const mobileLoginLink = menuPanel.getByRole('link', { name: /^login$/i });
      await expect(mobileLoginLink).toHaveClass(/text-orange/);
      await expect(mobileLoginLink).toHaveClass(/bg-orange\/10/);
    });
  });
});
