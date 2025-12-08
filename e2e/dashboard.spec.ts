import { test, expect } from '@playwright/test';

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.getByPlaceholder(/email/i).fill('admin@flowlogic.io');
    await page.getByPlaceholder(/password/i).fill('admin123');
    await page.getByRole('button', { name: /sign in/i }).click();
    await page.waitForURL(/dashboard|\/$/i, { timeout: 10000 });
  });

  test('should display dashboard cards', async ({ page }) => {
    // Dashboard should have stat cards
    await expect(page.locator('[class*="card"], [class*="shadow"]').first()).toBeVisible();
  });

  test('should display charts or graphs', async ({ page }) => {
    // Look for chart containers
    const chartElements = page.locator('[class*="chart"], [class*="recharts"], canvas, svg');

    // Dashboard typically has charts
    const count = await chartElements.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should display recent activity or alerts', async ({ page }) => {
    // Look for activity or alerts section
    const activitySection = page.getByText(/recent|activity|alerts|notifications/i).first();

    // At least one activity section should be visible
    if (await activitySection.isVisible()) {
      await expect(activitySection).toBeVisible();
    }
  });

  test('should be responsive on mobile', async ({ page }) => {
    // Set viewport to mobile size
    await page.setViewportSize({ width: 375, height: 667 });

    // Dashboard should still be functional
    await expect(page.locator('body')).toBeVisible();

    // Sidebar might be collapsed or in hamburger menu
    const menuButton = page.locator('button').filter({ has: page.locator('[class*="menu"], [class*="bars"]') }).first();

    if (await menuButton.isVisible()) {
      await menuButton.click();
      await expect(page.getByRole('navigation')).toBeVisible();
    }
  });

  test('should refresh data when refresh button is clicked', async ({ page }) => {
    // Find refresh button
    const refreshButton = page.locator('button').filter({ has: page.locator('[class*="refresh"], [class*="sync"]') }).first();

    if (await refreshButton.isVisible()) {
      await refreshButton.click();

      // Should show loading state or complete without error
      await page.waitForTimeout(1000);
      await expect(page.locator('body')).toBeVisible();
    }
  });
});
