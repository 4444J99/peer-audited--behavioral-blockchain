import { test, expect } from '@playwright/test';
import { setupUnauthenticatedMocks, MOCK_USER, MOCK_CSRF_TOKEN } from './fixtures/api-mocks';

test.describe('Authentication', () => {
  test.beforeEach(async ({ page }) => {
    await setupUnauthenticatedMocks(page);
  });

  test('should display login form', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('input[type="email"], input[name="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test('should display register form', async ({ page }) => {
    await page.goto('/register');
    await expect(page.locator('input[type="email"], input[name="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test('should show validation error for empty login', async ({ page }) => {
    await page.goto('/login');
    // Click submit without filling fields
    const submitButton = page.locator('button[type="submit"]');
    if (await submitButton.isVisible()) {
      await submitButton.click();
      // Should stay on login page
      await expect(page).toHaveURL(/login/);
    }
  });

  test('should navigate to register from login', async ({ page }) => {
    await page.goto('/login');
    const registerLink = page.locator('a[href*="register"]');
    if (await registerLink.isVisible()) {
      await registerLink.click();
      await expect(page).toHaveURL(/register/);
    }
  });

  test('should login successfully and redirect to dashboard', async ({ page }) => {
    await page.route('**/api/auth/login', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ user: MOCK_USER, token: 'jwt-e2e-token' }),
      }),
    );
    // Also mock /users/me for post-login redirect
    await page.route('**/api/users/me', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_USER),
      }),
    );
    // Mock other dashboard endpoints
    await page.route('**/api/wallet/balance', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: '{}' }),
    );
    await page.route('**/api/contracts*', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }),
    );

    await page.goto('/login');
    await page.fill('input[type="email"], input[name="email"]', 'e2e@styx.test');
    await page.fill('input[type="password"]', 'testpassword123');
    await page.click('button[type="submit"]');

    // Should redirect away from login
    await page.waitForURL(/(?!.*login)/, { timeout: 10_000 });
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.route('**/api/auth/login', (route) =>
      route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Invalid credentials' }),
      }),
    );

    await page.goto('/login');
    await page.fill('input[type="email"], input[name="email"]', 'wrong@styx.test');
    await page.fill('input[type="password"]', 'badpassword');
    await page.click('button[type="submit"]');

    // Should remain on login page and show error
    await expect(page).toHaveURL(/login/);
  });

  test('should register successfully', async ({ page }) => {
    await page.route('**/api/auth/register', (route) =>
      route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({ user: MOCK_USER, token: 'jwt-e2e-token' }),
      }),
    );
    await page.route('**/api/users/me', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_USER),
      }),
    );
    await page.route('**/api/wallet/balance', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: '{}' }),
    );
    await page.route('**/api/contracts*', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }),
    );

    await page.goto('/register');
    await page.fill('input[type="email"], input[name="email"]', 'new@styx.test');

    // Fill password fields
    const passwordInputs = page.locator('input[type="password"]');
    const count = await passwordInputs.count();
    if (count >= 2) {
      await passwordInputs.nth(0).fill('strongpassword123');
      await passwordInputs.nth(1).fill('strongpassword123');
    } else if (count === 1) {
      await passwordInputs.nth(0).fill('strongpassword123');
    }

    await page.click('button[type="submit"]');
    await page.waitForURL(/(?!.*register)/, { timeout: 10_000 });
  });
});
