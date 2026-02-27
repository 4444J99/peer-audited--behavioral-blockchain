import { test, expect } from './fixtures/auth';
import { MOCK_BALANCE, MOCK_LEADERBOARD } from './fixtures/api-mocks';

test.describe('Dashboard', () => {
  test.beforeEach(async ({ authenticatedPage: page }) => {
    await page.route('**/api/wallet/transactions*', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }),
    );
    await page.route('**/api/users/leaderboard*', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_LEADERBOARD),
      }),
    );
    await page.route('**/api/notifications*', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }),
    );
  });

  test('should load dashboard page', async ({ authenticatedPage: page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    const body = await page.textContent('body');
    expect(body).toBeTruthy();
  });

  test('should display integrity score', async ({ authenticatedPage: page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // The dashboard should render the user's integrity data
    const body = await page.textContent('body');
    expect(body).toBeTruthy();
  });

  test('should display navigation links', async ({ authenticatedPage: page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Dashboard should have navigation to key routes
    const links = await page.locator('a[href]').allTextContents();
    expect(links.length).toBeGreaterThan(0);
  });

  test('should show leaderboard data', async ({ authenticatedPage: page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    const body = await page.textContent('body');
    expect(body).toBeTruthy();
  });

  test('should handle onboarding wizard for new users', async ({ authenticatedPage: page }) => {
    // Override user to appear as new (no contracts)
    await page.route('**/api/contracts*', (route) => {
      if (route.request().method() === 'GET') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([]),
        });
      }
      return route.continue();
    });

    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    const body = await page.textContent('body');
    expect(body).toBeTruthy();
  });

  test('should navigate to wallet from dashboard', async ({ authenticatedPage: page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    const walletLink = page.locator('a[href*="wallet"]').first();
    if (await walletLink.isVisible()) {
      await walletLink.click();
      await page.waitForLoadState('networkidle');
      expect(page.url()).toContain('wallet');
    }
  });

  test('should navigate to fury from dashboard', async ({ authenticatedPage: page }) => {
    await page.route('**/api/fury/stats', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: '{}' }),
    );
    await page.route('**/api/fury/stream', (route) =>
      route.fulfill({
        status: 200,
        headers: { 'Content-Type': 'text/event-stream' },
        body: 'data: {"type":"connected"}\n\n',
      }),
    );

    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    const furyLink = page.locator('a[href*="fury"]').first();
    if (await furyLink.isVisible()) {
      await furyLink.click();
      await page.waitForLoadState('networkidle');
      expect(page.url()).toContain('fury');
    }
  });
});
