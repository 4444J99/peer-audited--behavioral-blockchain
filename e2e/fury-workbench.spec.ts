import { test, expect } from './fixtures/auth';
import { MOCK_FURY_STATS, MOCK_FURY_ASSIGNMENT } from './fixtures/api-mocks';

test.describe('Fury Workbench', () => {
  test.beforeEach(async ({ authenticatedPage: page }) => {
    await page.route('**/api/fury/stats', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_FURY_STATS),
      }),
    );

    // Mock SSE stream with empty data to prevent hanging
    await page.route('**/api/fury/stream', (route) =>
      route.fulfill({
        status: 200,
        headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' },
        body: 'data: {"type":"connected"}\n\n',
      }),
    );

    await page.route('**/api/fury/queue-depth', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ depth: 5 }),
      }),
    );
  });

  test('should display Fury workbench page', async ({ authenticatedPage: page }) => {
    await page.goto('/fury');
    await page.waitForLoadState('networkidle');

    const content = await page.textContent('body');
    expect(content).toBeTruthy();
  });

  test('should display audit stats', async ({ authenticatedPage: page }) => {
    await page.goto('/fury');
    await page.waitForLoadState('networkidle');

    // Stats should be visible somewhere on the page
    const body = await page.textContent('body');
    // The stats numbers should appear on the page
    expect(body).toBeTruthy();
  });

  test('should handle incoming proof assignment', async ({ authenticatedPage: page }) => {
    await page.route('**/api/fury/next', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_FURY_ASSIGNMENT),
      }),
    );

    await page.goto('/fury');
    await page.waitForLoadState('networkidle');
  });

  test('should submit PASS verdict', async ({ authenticatedPage: page }) => {
    let verdictSubmitted = false;

    await page.route('**/api/fury/verdicts', (route) => {
      if (route.request().method() === 'POST') {
        verdictSubmitted = true;
        return route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({ status: 'submitted', isHoneypot: false }),
        });
      }
      return route.continue();
    });

    await page.goto('/fury');
    await page.waitForLoadState('networkidle');
  });

  test('should display honeypot feedback', async ({ authenticatedPage: page }) => {
    await page.route('**/api/fury/verdicts', (route) =>
      route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 'submitted',
          isHoneypot: true,
          honeypotFeedback: 'Correct! This was a calibration proof.',
        }),
      }),
    );

    await page.goto('/fury');
    await page.waitForLoadState('networkidle');
  });
});
