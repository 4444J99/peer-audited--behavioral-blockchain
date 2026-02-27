import { test as base, Page } from '@playwright/test';
import { setupAuthenticatedMocks, MOCK_USER, MOCK_CSRF_TOKEN } from './api-mocks';

/**
 * Extended test fixture providing an authenticated page.
 * Uses Playwright route interception to mock authentication endpoints.
 */
export const test = base.extend<{ authenticatedPage: Page }>({
  authenticatedPage: async ({ page }, use) => {
    // Mock login endpoint
    await page.route('**/api/auth/login', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user: MOCK_USER,
          token: 'jwt-e2e-test-token',
        }),
      }),
    );

    // Mock register endpoint
    await page.route('**/api/auth/register', (route) =>
      route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          user: MOCK_USER,
          token: 'jwt-e2e-test-token',
        }),
      }),
    );

    // Set up all authenticated endpoint mocks
    await setupAuthenticatedMocks(page);

    // Inject auth token into localStorage before navigation
    await page.addInitScript(() => {
      localStorage.setItem('styx_token', 'jwt-e2e-test-token');
    });

    await use(page);
  },
});

export { expect } from '@playwright/test';
