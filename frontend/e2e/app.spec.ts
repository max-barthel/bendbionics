import { expect, test } from '@playwright/test';

test.describe('Soft Robot App', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app
    await page.goto('/');
  });

  test('should load the main application', async ({ page }) => {
    // Check if the app loads without errors
    await expect(page).toHaveTitle(/Soft Robot/);

    // Check for main UI elements
    await expect(page.locator('[data-testid="form-tabs"]')).toBeVisible();
    await expect(page.locator('[data-testid="visualizer-3d"]')).toBeVisible();
  });

  test('should show sign in button when not authenticated', async ({ page }) => {
    // Wait for the app to load
    await page.waitForLoadState('networkidle');

    // Check for sign in button
    await expect(page.getByText('Sign In')).toBeVisible();
  });

  test('should navigate to auth page when sign in is clicked', async ({ page }) => {
    // Wait for the app to load
    await page.waitForLoadState('networkidle');

    // Click sign in button
    await page.getByText('Sign In').click();

    // Check if we're on the auth page
    await expect(page.locator('[data-testid="auth-page"]')).toBeVisible();
  });

  test('should handle form submission', async ({ page }) => {
    // Wait for the app to load
    await page.waitForLoadState('networkidle');

    // Check if form tabs are visible
    await expect(page.locator('[data-testid="form-tabs"]')).toBeVisible();

    // Look for submit button in the mocked form
    const submitButton = page.locator('button:has-text("Submit Form")');
    if (await submitButton.isVisible()) {
      await submitButton.click();
      // Add assertions for form submission behavior
    }
  });

  test('should be responsive on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Check if main elements are still visible
    await expect(page.locator('[data-testid="form-tabs"]')).toBeVisible();
    await expect(page.locator('[data-testid="visualizer-3d"]')).toBeVisible();
  });

  test('should handle 3D visualizer interactions', async ({ page }) => {
    // Wait for the app to load
    await page.waitForLoadState('networkidle');

    // Check if 3D visualizer is present
    const visualizer = page.locator('[data-testid="visualizer-3d"]');
    await expect(visualizer).toBeVisible();

    // Test basic interactions (click, hover)
    await visualizer.hover();
    await visualizer.click();
  });
});
