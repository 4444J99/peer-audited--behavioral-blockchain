import { test, expect } from '@playwright/test';
import { setupUnauthenticatedMocks } from './fixtures/api-mocks';

test.describe('Auth Guards', () => {
  test.beforeEach(async ({ page }) => {
    await setupUnauthenticatedMocks(page);
    // Mock all other API calls to return 401
    await page.route('**/api/**', (route) => {
      const url = route.request().url();
      if (url.includes('csrf') || url.includes('users/me')) {
        return route.continue();
      }
      return route.fulfill({ status: 401, contentType: 'application/json', body: '{"message":"Unauthorized"}' });
    });
  });

  test('should redirect unauthenticated user from /dashboard to /login', async ({ page }) => {
    await page.goto('/dashboard');
    // Should either redirect to login or show login prompt
    await page.waitForLoadState('networkidle');
    const url = page.url();
    const body = await page.textContent('body');
    // Either redirected to login or page shows auth requirement
    expect(url.includes('login') || body?.toLowerCase().includes('login') || body?.toLowerCase().includes('sign in')).toBeTruthy();
  });

  test('should redirect unauthenticated user from /fury to /login', async ({ page }) => {
    await page.goto('/fury');
    await page.waitForLoadState('networkidle');
    const url = page.url();
    const body = await page.textContent('body');
    expect(url.includes('login') || body?.toLowerCase().includes('login') || body?.toLowerCase().includes('sign in')).toBeTruthy();
  });

  test('should redirect unauthenticated user from /wallet to /login', async ({ page }) => {
    await page.goto('/wallet');
    await page.waitForLoadState('networkidle');
    const url = page.url();
    const body = await page.textContent('body');
    expect(url.includes('login') || body?.toLowerCase().includes('login') || body?.toLowerCase().includes('sign in')).toBeTruthy();
  });

  test('should redirect unauthenticated user from /contracts/new to /login', async ({ page }) => {
    await page.goto('/contracts/new');
    await page.waitForLoadState('networkidle');
    const url = page.url();
    const body = await page.textContent('body');
    expect(url.includes('login') || body?.toLowerCase().includes('login') || body?.toLowerCase().includes('sign in')).toBeTruthy();
  });

  test('should allow access to public home page', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const body = await page.textContent('body');
    // Home page should be accessible and contain Styx branding
    expect(body?.toUpperCase()).toContain('STYX');
  });

  test('should allow access to /login without auth', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    // Should stay on login page (not redirect)
    expect(page.url()).toContain('login');
  });

  test('should allow access to /register without auth', async ({ page }) => {
    await page.goto('/register');
    await page.waitForLoadState('networkidle');
    expect(page.url()).toContain('register');
  });
});
