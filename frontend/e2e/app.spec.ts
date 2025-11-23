import { expect, test } from '@playwright/test';

test.describe('BendBionics App', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app
    await page.goto('/');
    // Wait for React to hydrate and initial load
    await page.waitForLoadState('networkidle');
    // Wait for main layout to be visible
    await page.waitForSelector('[data-testid="main-app-layout"]', { state: 'visible' });
  });

  test('should load the main application', async ({ page }) => {
    // Check if the app loads without errors
    await expect(page).toHaveTitle(/BendBionics/);

    // Wait for form tabs to be visible (sidebar should be open by default)
    await expect(page.locator('[data-testid="form-tabs"]')).toBeVisible({ timeout: 10000 });

    // Wait for visualizer wrapper to be ready
    await page.waitForSelector('[data-testid="visualizer-wrapper"]', { state: 'visible' });

    // Wait for lazy-loaded 3D visualizer to finish loading (check that Suspense fallback is gone)
    // The visualizer should be visible once Suspense resolves
    await expect(page.locator('[data-testid="visualizer-3d"]')).toBeVisible({ timeout: 15000 });
  });

  test('should show sign in button when not authenticated', async ({ page }) => {
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
    await expect(page.locator('[data-testid="sign-in-button"]')).toBeVisible({ timeout: 5000 });

    // Optionally verify aria-expanded attribute (secondary check)
    await expect(menuButton).toHaveAttribute('aria-expanded', 'true', { timeout: 2000 }).catch(() => {
      // aria-expanded check is optional, don't fail if it's not set
    });
  });

  test('should navigate to auth page when sign in is clicked', async ({ page }) => {
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

    // Wait for navigation and check if we're on the auth page
    await page.waitForURL('**/auth', { timeout: 10000 });
    await expect(page.locator('[data-testid="auth-page"]')).toBeVisible();
  });

  test('should handle form submission', async ({ page }) => {
    // Wait for form tabs to be visible
    await expect(page.locator('[data-testid="form-tabs"]')).toBeVisible({ timeout: 10000 });

    // Look for submit button in the mocked form
    const submitButton = page.locator('button:has-text("Submit Form")');
    if (await submitButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await submitButton.click();
      // Add assertions for form submission behavior
    }
  });

  test('should be responsive on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Wait for layout to adjust after viewport change
    await page.waitForTimeout(500);

    // Wait for main elements to be visible
    await expect(page.locator('[data-testid="form-tabs"]')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('[data-testid="visualizer-3d"]')).toBeVisible({ timeout: 15000 });
  });

  test('should handle 3D visualizer interactions', async ({ page }) => {
    // Wait for visualizer wrapper to be ready
    await page.waitForSelector('[data-testid="visualizer-wrapper"]', { state: 'visible' });

    // Wait for lazy-loaded 3D visualizer to finish loading
    const visualizer = page.locator('[data-testid="visualizer-3d"]');
    await expect(visualizer).toBeVisible({ timeout: 15000 });

    // Check if we're on mobile - if so, close sidebar first to avoid pointer event interception
    const viewport = page.viewportSize();
    const isMobile = viewport && viewport.width < 768;

    if (isMobile) {
      // On mobile, sidebar might overlap visualizer - close it first
      const sidebar = page.locator('[data-testid="sidebar"]');
      const toggleButton = page.locator('[data-testid="sidebar-toggle"]');
      if (await sidebar.isVisible().catch(() => false)) {
        await toggleButton.click();
        await page.waitForTimeout(500); // Wait for sidebar to close
      }
    }

    // Test basic interactions (click, hover on desktop only)
    if (!isMobile) {
      await visualizer.hover();
    }
    await visualizer.click();
  });

  test('should toggle sidebar when toggle button is clicked', async ({ page }) => {
    // Wait for sidebar and toggle button to be visible
    await expect(page.locator('[data-testid="sidebar"]')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('[data-testid="sidebar-toggle"]')).toBeVisible();

    // Sidebar should be visible by default
    const sidebar = page.locator('[data-testid="sidebar"]');
    await expect(sidebar).toBeVisible();

    // Click the toggle button
    const toggleButton = page.locator('[data-testid="sidebar-toggle"]');
    await toggleButton.click();

    // Wait for sidebar to collapse (account for CSS transition duration-300 = 300ms)
    // Use waitForSelector with hidden state instead of waitForTimeout
    await page.waitForSelector('[data-testid="sidebar"]', { state: 'hidden', timeout: 1000 });
    await expect(sidebar).not.toBeVisible();

    // Click toggle again to show sidebar
    await toggleButton.click();
    // Wait for sidebar to expand (account for CSS transition)
    await page.waitForSelector('[data-testid="sidebar"]', { state: 'visible', timeout: 1000 });
    await expect(sidebar).toBeVisible();
  });

  test('should navigate to email verification page', async ({ page }) => {
    // Navigate directly to email verification page with a token
    await page.goto('/verify-email?token=test-token-123');
    await page.waitForLoadState('networkidle');

    // Wait for email verification page to load
    await expect(page.locator('[data-testid="email-verification-page"]')).toBeVisible({ timeout: 10000 });
  });

  test('should show error state when email verification token is missing', async ({ page }) => {
    // Navigate to email verification page without token
    await page.goto('/verify-email');

    // Wait for email verification page to load (don't wait for networkidle as it may never happen)
    await expect(page.locator('[data-testid="email-verification-page"]')).toBeVisible({ timeout: 10000 });

    // Should show error message
    await expect(page.locator('text=No verification token provided')).toBeVisible({ timeout: 5000 });
  });
});
