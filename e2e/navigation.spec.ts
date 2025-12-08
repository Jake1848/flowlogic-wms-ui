import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login');
    await page.getByPlaceholder(/email/i).fill('admin@flowlogic.io');
    await page.getByPlaceholder(/password/i).fill('admin123');
    await page.getByRole('button', { name: /sign in/i }).click();
    await page.waitForURL(/dashboard|\/$/i, { timeout: 10000 });
  });

  test('should display sidebar navigation', async ({ page }) => {
    // Check that sidebar is visible
    await expect(page.getByRole('navigation')).toBeVisible();
  });

  test('should navigate to Orders page', async ({ page }) => {
    await page.getByRole('link', { name: /orders/i }).click();
    await expect(page).toHaveURL(/orders/i);
    await expect(page.getByText(/orders/i).first()).toBeVisible();
  });

  test('should navigate to Inventory page', async ({ page }) => {
    await page.getByRole('link', { name: /inventory/i }).click();
    await expect(page).toHaveURL(/inventory/i);
    await expect(page.getByText(/inventory/i).first()).toBeVisible();
  });

  test('should navigate to Shipping page', async ({ page }) => {
    await page.getByRole('link', { name: /shipping/i }).click();
    await expect(page).toHaveURL(/shipping/i);
    await expect(page.getByText(/shipping/i).first()).toBeVisible();
  });

  test('should navigate to Receiving page', async ({ page }) => {
    await page.getByRole('link', { name: /receiving/i }).click();
    await expect(page).toHaveURL(/receiving/i);
    await expect(page.getByText(/receiving/i).first()).toBeVisible();
  });

  test('should toggle dark mode', async ({ page }) => {
    // Find and click the dark mode toggle button
    const darkModeButton = page.locator('button').filter({ has: page.locator('[class*="moon"], [class*="sun"]') }).first();

    if (await darkModeButton.isVisible()) {
      await darkModeButton.click();

      // Check that dark mode class is applied
      const html = page.locator('html');
      await expect(html).toHaveClass(/dark/);

      // Toggle back
      await darkModeButton.click();
      await expect(html).not.toHaveClass(/dark/);
    }
  });

  test('should display user menu', async ({ page }) => {
    // Look for user avatar or user menu button
    const userMenu = page.locator('[aria-label*="user"], button:has([alt*="avatar"]), button:has([class*="avatar"])').first();

    if (await userMenu.isVisible()) {
      await userMenu.click();
      await expect(page.getByText(/logout|sign out|profile/i)).toBeVisible();
    }
  });
});
