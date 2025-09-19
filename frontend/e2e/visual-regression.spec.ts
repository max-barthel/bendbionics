import { expect, test } from '@playwright/test';

test.describe('Visual Regression Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('main app layout should match snapshot', async ({ page }) => {
    // Take full page screenshot
    await expect(page).toHaveScreenshot('main-app-layout.png');
  });

  test('form tabs component should match snapshot', async ({ page }) => {
    const formTabs = page.locator('[data-testid="form-tabs"]');
    await expect(formTabs).toHaveScreenshot('form-tabs-component.png');
  });

  test('3D visualizer should match snapshot', async ({ page }) => {
    const visualizer = page.locator('[data-testid="visualizer-3d"]');
    await expect(visualizer).toHaveScreenshot('3d-visualizer.png');
  });

  test('auth page should match snapshot', async ({ page }) => {
    // Navigate to auth page
    await page.getByText('Sign In').click();
    await page.waitForLoadState('networkidle');

    const authPage = page.locator('[data-testid="auth-page"]');
    await expect(authPage).toHaveScreenshot('auth-page.png');
  });

  test('mobile layout should match snapshot', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(500); // Wait for layout to adjust

    await expect(page).toHaveScreenshot('mobile-layout.png');
  });

  test('tablet layout should match snapshot', async ({ page }) => {
    // Set tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(500); // Wait for layout to adjust

    await expect(page).toHaveScreenshot('tablet-layout.png');
  });

  test('desktop layout should match snapshot', async ({ page }) => {
    // Set desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.waitForTimeout(500); // Wait for layout to adjust

    await expect(page).toHaveScreenshot('desktop-layout.png');
  });
});
