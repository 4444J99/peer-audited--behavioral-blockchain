import { test as base, Page } from '@playwright/test';
import { setupAuthenticatedMocks, MOCK_USER } from './api-mocks';
import { seedAuthCookie } from './auth-cookie';

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

    // Authenticate the way the app actually gates: src/web/proxy.ts guards
    // protected routes on the presence of the `styx_auth_token` cookie
    // (server-side, so it cannot see localStorage or client-side route mocks).
    // The previous `localStorage.styx_token` injection was inert — the app
    // reads no such key — which is why authenticated specs landed on /login.
    await seedAuthCookie(page);

    await use(page);
  },
});

export { expect } from '@playwright/test';
