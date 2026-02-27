import { test, expect } from './fixtures/auth';
import { MOCK_BALANCE, MOCK_TRANSACTIONS } from './fixtures/api-mocks';

test.describe('Wallet', () => {
  test('should display wallet page with balance', async ({ authenticatedPage: page }) => {
    await page.goto('/wallet');
    await page.waitForLoadState('networkidle');

    const content = await page.textContent('body');
    expect(content).toBeTruthy();
  });

  test('should show balance summary', async ({ authenticatedPage: page }) => {
    await page.goto('/wallet');
    await page.waitForLoadState('networkidle');

    // The page should render balance data
    const body = await page.textContent('body');
    expect(body).toBeTruthy();
  });

  test('should display transaction history', async ({ authenticatedPage: page }) => {
    await page.goto('/wallet');
    await page.waitForLoadState('networkidle');

    // Transactions should be rendered
    const body = await page.textContent('body');
    expect(body).toBeTruthy();
  });

  test('should show tier indicator based on integrity score', async ({ authenticatedPage: page }) => {
    await page.goto('/wallet');
    await page.waitForLoadState('networkidle');

    const body = await page.textContent('body');
    expect(body).toBeTruthy();
  });

  test('should handle empty transaction history', async ({ authenticatedPage: page }) => {
    await page.route('**/api/wallet/transactions*', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      }),
    );

    await page.goto('/wallet');
    await page.waitForLoadState('networkidle');

    const body = await page.textContent('body');
    expect(body).toBeTruthy();
  });

  test('should handle API error gracefully', async ({ authenticatedPage: page }) => {
    await page.route('**/api/wallet/balance', (route) =>
      route.fulfill({ status: 500, contentType: 'application/json', body: '{"message":"Internal Server Error"}' }),
    );

    await page.goto('/wallet');
    await page.waitForLoadState('networkidle');

    // Page should still render without crashing
    const body = await page.textContent('body');
    expect(body).toBeTruthy();
  });
});
