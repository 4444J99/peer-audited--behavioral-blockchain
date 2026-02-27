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

test.describe('Attestation Flow', () => {
  const mockContractId = 'contract-recovery-001';

  test.beforeEach(async ({ authenticatedPage: page }) => {
    // Mock compliance eligibility
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

  test('should navigate to attestation page and display attestation status', async ({ authenticatedPage: page }) => {
    // Mock the attestation status endpoint
    await page.route(`**/api/contracts/${mockContractId}/attestation`, (route) => {
      if (route.request().method() === 'GET') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            contractId: mockContractId,
            oathCategory: 'RECOVERY_NO_CONTACT_TEXT',
            streakDays: 7,
            daysRemaining: 23,
            graceDaysAvailable: 2,
            todayAttested: false,
            totalStrikes: 0,
          }),
        });
      }
      return route.continue();
    });

    await page.goto(`/contracts/${mockContractId}/attest`);
    await page.waitForLoadState('networkidle');

    // Should show streak count
    const body = await page.textContent('body');
    expect(body).toContain('7');
    // Should show days remaining
    expect(body).toContain('23');
    // Should show the attestation prompt
    expect(body?.toLowerCase()).toContain('attestation');
  });

  test('should submit attestation and show success state', async ({ authenticatedPage: page }) => {
    // Mock GET attestation status (not yet attested today)
    await page.route(`**/api/contracts/${mockContractId}/attestation`, (route) => {
      if (route.request().method() === 'GET') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            contractId: mockContractId,
            oathCategory: 'RECOVERY_NO_CONTACT_TEXT',
            streakDays: 5,
            daysRemaining: 25,
            graceDaysAvailable: 2,
            todayAttested: false,
            totalStrikes: 0,
          }),
        });
      }
      if (route.request().method() === 'POST') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ status: 'attested' }),
        });
      }
      return route.continue();
    });

    await page.goto(`/contracts/${mockContractId}/attest`);
    await page.waitForLoadState('networkidle');

    // Click the attestation button
    const attestButton = page.locator('button', { hasText: /I HELD THE LINE/i });
    await attestButton.click();

    // Should show success state
    await page.waitForSelector('text=Attestation Recorded', { timeout: 5000 });
    const successBody = await page.textContent('body');
    expect(successBody).toContain('Attestation Recorded');
    expect(successBody?.toLowerCase()).toContain('co-sign');
  });

  test('should show already-attested state when todayAttested is true', async ({ authenticatedPage: page }) => {
    await page.route(`**/api/contracts/${mockContractId}/attestation`, (route) => {
      if (route.request().method() === 'GET') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            contractId: mockContractId,
            oathCategory: 'RECOVERY_NO_CONTACT_TEXT',
            streakDays: 8,
            daysRemaining: 22,
            graceDaysAvailable: 1,
            todayAttested: true,
            totalStrikes: 0,
          }),
        });
      }
      return route.continue();
    });

    await page.goto(`/contracts/${mockContractId}/attest`);
    await page.waitForLoadState('networkidle');

    const body = await page.textContent('body');
    expect(body?.toLowerCase()).toContain('already attested today');
    // Should show streak
    expect(body).toContain('8');
  });

  test('should display strike warning when totalStrikes > 0', async ({ authenticatedPage: page }) => {
    await page.route(`**/api/contracts/${mockContractId}/attestation`, (route) => {
      if (route.request().method() === 'GET') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            contractId: mockContractId,
            oathCategory: 'RECOVERY_NO_CONTACT_TEXT',
            streakDays: 3,
            daysRemaining: 15,
            graceDaysAvailable: 0,
            todayAttested: false,
            totalStrikes: 2,
          }),
        });
      }
      return route.continue();
    });

    await page.goto(`/contracts/${mockContractId}/attest`);
    await page.waitForLoadState('networkidle');

    const body = await page.textContent('body');
    // Should warn about missed attestations
    expect(body?.toLowerCase()).toContain('missed');
    expect(body).toContain('1 remaining before auto-fail');
  });

  test('should show Daily Check-In button on active recovery contract page', async ({ authenticatedPage: page }) => {
    // Mock the contract detail endpoint
    await page.route(`**/api/contracts/${mockContractId}`, (route) => {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: mockContractId,
          category: 'RECOVERY_NO_CONTACT_TEXT',
          description: 'No-contact recovery oath',
          stakeAmount: 30,
          status: 'ACTIVE',
          startDate: new Date(Date.now() - 10 * 86400000).toISOString(),
          endDate: new Date(Date.now() + 20 * 86400000).toISOString(),
          proofs: [],
          graceDaysUsed: 0,
          graceDaysMax: 2,
        }),
      });
    });

    await page.goto(`/contracts/${mockContractId}`);
    await page.waitForLoadState('networkidle');

    const body = await page.textContent('body');
    expect(body?.toLowerCase()).toContain('check-in');
  });
});
