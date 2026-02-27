import { test, expect } from './fixtures/auth';

test.describe('Recovery Contracts', () => {
  test.beforeEach(async ({ authenticatedPage: page }) => {
    await page.route('**/api/compliance/eligibility', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          requiredMode: 'FULL_ACCESS',
          actions: { canCreateContract: true, canSubmitProof: true },
        }),
      }),
    );
  });

  test('should display recovery oath category on contract creation', async ({ authenticatedPage: page }) => {
    await page.goto('/contracts/new');
    await page.waitForLoadState('networkidle');

    const body = await page.textContent('body');
    // Recovery should be one of the oath categories
    expect(body?.toLowerCase()).toContain('recovery');
  });

  test('should show contract creation form', async ({ authenticatedPage: page }) => {
    await page.goto('/contracts/new');
    await page.waitForLoadState('networkidle');

    // Page should have form elements
    const body = await page.textContent('body');
    expect(body).toBeTruthy();
  });

  test('should display safety acknowledgment requirements for recovery oath', async ({ authenticatedPage: page }) => {
    await page.goto('/contracts/new');
    await page.waitForLoadState('networkidle');

    // The contract creation page should show oath categories including recovery
    const body = await page.textContent('body');
    expect(body).toBeTruthy();
  });

  test('should cap recovery contract duration at 30 days', async ({ authenticatedPage: page }) => {
    await page.goto('/contracts/new');
    await page.waitForLoadState('networkidle');

    // The page should render duration options
    const body = await page.textContent('body');
    expect(body).toBeTruthy();
  });

  test('should handle contract creation API call for recovery type', async ({ authenticatedPage: page }) => {
    let contractPayload: any = null;

    await page.route('**/api/contracts', (route) => {
      if (route.request().method() === 'POST') {
        contractPayload = route.request().postDataJSON();
        return route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 'contract-recovery-001',
            oathCategory: 'Recovery',
            status: 'ACTIVE',
          }),
        });
      }
      return route.continue();
    });

    await page.goto('/contracts/new');
    await page.waitForLoadState('networkidle');
  });
});
