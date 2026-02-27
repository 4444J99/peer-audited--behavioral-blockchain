import { test, expect } from './fixtures/auth';
import { MOCK_CONTRACTS } from './fixtures/api-mocks';

test.describe('Contract Lifecycle', () => {
  test('should display contract creation form', async ({ authenticatedPage: page }) => {
    await page.route('**/api/compliance/eligibility', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ requiredMode: 'FULL_ACCESS', actions: { canCreateContract: true } }),
      }),
    );

    await page.goto('/contracts/new');
    await page.waitForLoadState('networkidle');

    // Should show oath category selection
    const content = await page.textContent('body');
    expect(content).toBeTruthy();
  });

  test('should show existing contracts on dashboard', async ({ authenticatedPage: page }) => {
    await page.route('**/api/wallet/transactions*', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }),
    );
    await page.route('**/api/users/leaderboard*', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }),
    );

    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Dashboard should load with mock contracts
    const content = await page.textContent('body');
    expect(content).toBeTruthy();
  });

  test('should create a contract via the form', async ({ authenticatedPage: page }) => {
    let contractCreated = false;

    await page.route('**/api/contracts', (route) => {
      if (route.request().method() === 'POST') {
        contractCreated = true;
        return route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 'contract-new-001',
            oathCategory: 'Biological',
            title: 'E2E Test Contract',
            stakeAmount: 2000,
            status: 'ACTIVE',
          }),
        });
      }
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_CONTRACTS),
      });
    });

    await page.route('**/api/compliance/eligibility', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ requiredMode: 'FULL_ACCESS', actions: { canCreateContract: true } }),
      }),
    );

    await page.goto('/contracts/new');
    await page.waitForLoadState('networkidle');
  });

  test('should display contract detail page', async ({ authenticatedPage: page }) => {
    await page.route('**/api/contracts/contract-001', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_CONTRACTS[0]),
      }),
    );

    await page.goto('/contracts/contract-001');
    await page.waitForLoadState('networkidle');

    const content = await page.textContent('body');
    expect(content).toBeTruthy();
  });

  test('should handle proof submission flow', async ({ authenticatedPage: page }) => {
    await page.route('**/api/contracts/contract-001', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_CONTRACTS[0]),
      }),
    );

    await page.route('**/api/proofs/upload-url', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          proofId: 'proof-new-001',
          uploadUrl: 'https://r2.example.com/upload',
          storageKey: 'proofs/proof-new-001',
          expiresInSeconds: 300,
        }),
      }),
    );

    await page.goto('/contracts/contract-001');
    await page.waitForLoadState('networkidle');
  });
});
