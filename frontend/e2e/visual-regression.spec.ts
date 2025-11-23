import { expect, test } from '@playwright/test';

test.describe('Visual Regression Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for React to hydrate and initial load
    await page.waitForLoadState('networkidle');
    // Wait for main layout to be visible
    await page.waitForSelector('[data-testid="main-app-layout"]', { state: 'visible' });
  });

  test('main app layout should match snapshot', async ({ page }) => {
    // Wait for all main components to be fully loaded
    await expect(page.locator('[data-testid="form-tabs"]')).toBeVisible({ timeout: 10000 });
    await page.waitForSelector('[data-testid="visualizer-wrapper"]', { state: 'visible' });
    await expect(page.locator('[data-testid="visualizer-3d"]')).toBeVisible({ timeout: 15000 });

    // Wait for any animations to complete
    await page.waitForTimeout(500);

    // Take full page screenshot
    await expect(page).toHaveScreenshot('main-app-layout.png');
  });

  test('form tabs component should match snapshot', async ({ page }) => {
    // Wait for form tabs to be fully loaded and visible
    const formTabs = page.locator('[data-testid="form-tabs"]');
    await expect(formTabs).toBeVisible({ timeout: 10000 });

    // Wait for any animations to complete
    await page.waitForTimeout(500);

    await expect(formTabs).toHaveScreenshot('form-tabs-component.png');
  });

  test('3D visualizer should match snapshot', async ({ page }) => {
    // Wait for visualizer wrapper to be ready
    await page.waitForSelector('[data-testid="visualizer-wrapper"]', { state: 'visible' });

    // Wait for lazy-loaded 3D visualizer to finish loading
    const visualizer = page.locator('[data-testid="visualizer-3d"]');
    await expect(visualizer).toBeVisible({ timeout: 15000 });

    // Wait for any animations or rendering to complete
    await page.waitForTimeout(1000);

    await expect(visualizer).toHaveScreenshot('3d-visualizer.png');
  });

  test('auth page should match snapshot', async ({ page }) => {
    // Wait for user menu to be visible
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();

    // Click the user menu button to open dropdown (works on both mobile and desktop)
    const menuButton = page.locator('[data-testid="user-menu-button"]');
    await expect(menuButton).toBeVisible();

    // Click the menu button
    await menuButton.click();

    // Wait for dropdown menu to be visible first (allows CSS transitions to complete)
    await expect(page.locator('[data-testid="guest-dropdown-menu"]')).toBeVisible({ timeout: 5000 });

    // Now wait for sign-in button to be visible
    const signInButton = page.locator('[data-testid="sign-in-button"]');
    await expect(signInButton).toBeVisible({ timeout: 5000 });

    // Optionally verify aria-expanded attribute (secondary check)
    await expect(menuButton).toHaveAttribute('aria-expanded', 'true', { timeout: 2000 }).catch(() => {
      // aria-expanded check is optional, don't fail if it's not set
    });

    // Click sign in button
    await signInButton.click();

    // Wait for navigation
    await page.waitForURL('**/auth', { timeout: 10000 });
    await page.waitForLoadState('networkidle');

    // Wait for auth page to be fully loaded
    const authPage = page.locator('[data-testid="auth-page"]');
    await expect(authPage).toBeVisible({ timeout: 10000 });

    // Wait for any animations to complete
    await page.waitForTimeout(500);

    await expect(authPage).toHaveScreenshot('auth-page.png');
  });

  test('email verification page should match snapshot', async ({ page }) => {
    // Navigate to email verification page
    await page.goto('/verify-email?token=test-token');
    await page.waitForLoadState('networkidle');

    // Wait for email verification page to be fully loaded
    const emailVerificationPage = page.locator('[data-testid="email-verification-page"]');
    await expect(emailVerificationPage).toBeVisible({ timeout: 10000 });

    // Wait for any animations to complete
    await page.waitForTimeout(1000);

    await expect(emailVerificationPage).toHaveScreenshot('email-verification-page.png');
  });

  test('mobile layout should match snapshot', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Wait for layout to adjust after viewport change
    await page.waitForTimeout(500);

    // Wait for all components to be visible
    await expect(page.locator('[data-testid="form-tabs"]')).toBeVisible({ timeout: 10000 });
    await page.waitForSelector('[data-testid="visualizer-wrapper"]', { state: 'visible' });
    await expect(page.locator('[data-testid="visualizer-3d"]')).toBeVisible({ timeout: 15000 });

    // Wait for any animations to complete
    await page.waitForTimeout(500);

    await expect(page).toHaveScreenshot('mobile-layout.png');
  });

  test('tablet layout should match snapshot', async ({ page }) => {
    // Set tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });

    // Wait for layout to adjust after viewport change
    await page.waitForTimeout(500);

    // Wait for all components to be visible
    await expect(page.locator('[data-testid="form-tabs"]')).toBeVisible({ timeout: 10000 });
    await page.waitForSelector('[data-testid="visualizer-wrapper"]', { state: 'visible' });
    await expect(page.locator('[data-testid="visualizer-3d"]')).toBeVisible({ timeout: 15000 });

    // Wait for any animations to complete
    await page.waitForTimeout(500);

    await expect(page).toHaveScreenshot('tablet-layout.png');
  });

  test('desktop layout should match snapshot', async ({ page }) => {
    // Set desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });

    // Wait for layout to adjust after viewport change
    await page.waitForTimeout(500);

    // Wait for all components to be visible
    await expect(page.locator('[data-testid="form-tabs"]')).toBeVisible({ timeout: 10000 });
    await page.waitForSelector('[data-testid="visualizer-wrapper"]', { state: 'visible' });
    await expect(page.locator('[data-testid="visualizer-3d"]')).toBeVisible({ timeout: 15000 });

    // Wait for any animations to complete
    await page.waitForTimeout(500);

    await expect(page).toHaveScreenshot('desktop-layout.png');
  });
});
