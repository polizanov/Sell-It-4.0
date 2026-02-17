import { test, expect } from '@playwright/test';

test.describe('Navigation - Desktop and Mobile', () => {
  test.describe('Desktop Navigation', () => {
    test.use({ viewport: { width: 1280, height: 720 } });

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

    test('Mobile menu opens and closes correctly', async ({ page }) => {
      await page.goto('/');

      // Open menu
      const openButton = page.locator('button[aria-label="Open menu"]');
      await expect(openButton).toBeVisible();
      await openButton.click();

      // Menu should slide in (not have -translate-x-full class)
      const menuPanel = page.locator('div.fixed.top-0.left-0.bottom-0:not([data-testid="filter-drawer"])');
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
      const menuPanel = page.locator('div.fixed.top-0.left-0.bottom-0:not([data-testid="filter-drawer"])');
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

      const menuPanel = page.locator('div.fixed.top-0.left-0.bottom-0:not([data-testid="filter-drawer"])');
      await expect(menuPanel).toBeVisible();

      // Verify Login link has active styling in mobile menu
      const mobileLoginLink = menuPanel.getByRole('link', { name: /^login$/i });
      await expect(mobileLoginLink).toHaveClass(/text-orange/);
      await expect(mobileLoginLink).toHaveClass(/bg-orange\/10/);
    });
  });
});
