import { Page } from '@playwright/test';

// Canonical mock data matching src/web/services/api-client.ts types

export const MOCK_USER = {
  id: 'user-e2e-test-001',
  email: 'e2e@styx.test',
  username: 'e2e-tester',
  integrityScore: 72,
  createdAt: '2026-01-15T00:00:00Z',
};

export const MOCK_BALANCE = {
  available: 15000,
  pending: 5000,
  escrow: 3000,
  currency: 'USD',
  integrityScore: 72,
  tier: 'TIER_2_STANDARD',
  accountStatus: 'ACTIVE',
};

export const MOCK_CONTRACTS = [
  {
    id: 'contract-001',
    oathCategory: 'Biological',
    title: 'Run 5K daily',
    stakeAmount: 5000,
    status: 'ACTIVE',
    startDate: '2026-02-01T00:00:00Z',
    endDate: '2026-03-01T00:00:00Z',
    verificationMethod: 'FURY_NETWORK',
    proofCount: 12,
    requiredProofs: 28,
  },
  {
    id: 'contract-002',
    oathCategory: 'Cognitive',
    title: 'Read 30 minutes daily',
    stakeAmount: 2000,
    status: 'COMPLETED',
    startDate: '2026-01-01T00:00:00Z',
    endDate: '2026-01-31T00:00:00Z',
    verificationMethod: 'FURY_NETWORK',
    proofCount: 28,
    requiredProofs: 28,
  },
];

export const MOCK_TRANSACTIONS = [
  {
    id: 'txn-001',
    type: 'STAKE_DEPOSIT',
    amount: 5000,
    currency: 'USD',
    description: 'Stake deposit for contract-001',
    createdAt: '2026-02-01T00:00:00Z',
  },
  {
    id: 'txn-002',
    type: 'ESCROW_RELEASE',
    amount: 2000,
    currency: 'USD',
    description: 'Escrow release for contract-002',
    createdAt: '2026-02-01T12:00:00Z',
  },
];

export const MOCK_FURY_STATS = {
  totalAudits: 45,
  accuracy: 0.93,
  totalEarnings: 9000,
  bountiesEarned: 22,
  honeypotsIdentified: 3,
  currentStreak: 7,
};

export const MOCK_FURY_ASSIGNMENT = {
  proofId: 'proof-fury-001',
  contractId: 'contract-fury-001',
  mediaUrl: 'https://r2.example.com/signed/proof.jpg',
  mediaType: 'image/jpeg',
  oathCategory: 'Biological',
  description: 'Morning run GPS track',
  submittedAt: '2026-02-27T08:00:00Z',
};

export const MOCK_LEADERBOARD = [
  { rank: 1, username: 'styx_alpha', integrityScore: 350, completedContracts: 42 },
  { rank: 2, username: 'styx_beta', integrityScore: 280, completedContracts: 35 },
  { rank: 3, username: 'styx_gamma', integrityScore: 210, completedContracts: 28 },
];

export const MOCK_CSRF_TOKEN = 'csrf-e2e-test-token';

export const MOCK_DASHBOARD_PROGRESS = {
  activeContracts: [],
  protectedVaultBalanceCents: 0,
  summary: {
    totalActiveStakeUsd: 0,
    longestStreak: 0,
  },
};

export const MOCK_STREAK_CHAIN = {
  days: [],
  currentStreak: 0,
  longestStreak: 0,
  neverMissTwiceActive: false,
  penaltyMultiplier: 1,
};

export const MOCK_WALLET_HISTORY = { transactions: [] };

export const MOCK_IDENTITY_OATH_STATE = {
  oathCategory: 'Biological',
  oath: null,
  completed: false,
  archetypes: [],
};

export const MOCK_ENDOWED_PROGRESS = {
  contractId: 'contract-001',
  realProgress: 0,
  endowedBoost: 0,
  displayProgress: 0,
  currentTier: 'TIER_1',
  nextTierAt: 100,
  motivation: '',
  downscaling: { multiplier: 1, reason: '' },
};

export const MOCK_ACCOUNTABILITY_STATUS = { partners: [], history: [] };

export const MOCK_RECOVERY_LOCK_STATUS = { activeRequest: null };

export const MOCK_DANGER_ZONE_STATUS = {
  timezone: 'UTC',
  inDangerZone: false,
  contracts: [],
};

export const MOCK_FURY_QUEUE = { assignments: [] };

export const MOCK_NOTIFICATIONS: unknown[] = [];

/**
 * Set up standard API route mocks for authenticated pages.
 * Call this before navigating to any authenticated route.
 *
 * Every endpoint reachable from an authenticated page must be mocked here.
 * Any route left unmatched falls through to Next's /api/:path* rewrite,
 * which proxies to the docker-compose-only `styx-api` hostname — a host
 * that does not resolve in the CI runner, so unmocked calls fail with
 * `getaddrinfo EAI_AGAIN styx-api` instead of a clean 200/404. That failure
 * surface is what previously made `e2e_browsers` fail on any PR touching
 * src/web/ (see PR #952), even though the failing PR's own diff was
 * unrelated to these endpoints.
 */
export async function setupAuthenticatedMocks(page: Page) {
  // Register this catch-all first so it stays lowest-priority: Playwright runs
  // matching route handlers in reverse registration order, so the specific mocks
  // below win first and any newly added authenticated /api/* call fails fast here
  // with an actionable error instead of falling through to the Next.js rewrite
  // and surfacing as `getaddrinfo EAI_AGAIN styx-api` in CI.
  await page.route('**/api/**', (route) =>
    route.fulfill({
      status: 501,
      contentType: 'application/json',
      body: JSON.stringify({
        error: `Unmocked API route in e2e test: ${route.request().method()} ${route.request().url()}. Add a specific page.route() mock in setupAuthenticatedMocks() for this endpoint.`,
      }),
    }),
  );

  await page.route('**/api/auth/csrf', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ csrfToken: MOCK_CSRF_TOKEN }),
    }),
  );

  await page.route('**/api/auth/refresh', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ userId: MOCK_USER.id, token: 'jwt-e2e-refreshed-token' }), // allow-secret: static e2e mock fixture, not a real credential
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
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(MOCK_BALANCE),
    }),
  );

  await page.route('**/api/wallet/history*', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(MOCK_WALLET_HISTORY),
    }),
  );

  await page.route('**/api/contracts*', (route) => {
    if (route.request().method() === 'GET') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_CONTRACTS),
      });
    }
    return route.continue();
  });

  await page.route('**/api/contracts/*/accountability/status', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(MOCK_ACCOUNTABILITY_STATUS),
    }),
  );

  await page.route('**/api/behavioral/retention/endowed-progress/*', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(MOCK_ENDOWED_PROGRESS),
    }),
  );

  await page.route('**/api/onboarding/identity-oath*', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(MOCK_IDENTITY_OATH_STATE),
    }),
  );

  await page.route('**/api/dashboard/progress', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(MOCK_DASHBOARD_PROGRESS),
    }),
  );

  await page.route('**/api/dashboard/streak', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(MOCK_STREAK_CHAIN),
    }),
  );

  await page.route('**/api/wallet/transactions*', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(MOCK_TRANSACTIONS),
    }),
  );

  await page.route('**/api/users/leaderboard*', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(MOCK_LEADERBOARD),
    }),
  );

  await page.route('**/api/fury/stats', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(MOCK_FURY_STATS),
    }),
  );

  await page.route('**/api/fury/queue*', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(MOCK_FURY_QUEUE),
    }),
  );

  await page.route('**/api/fury/stream-cookie', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ expiresInSeconds: 3600 }),
    }),
  );

  await page.route('**/api/fury/stream-ticket', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ ticket: 'e2e-fury-stream-ticket', expiresInSeconds: 60 }),
    }),
  );

  await page.route('**/api/contracts/*/recovery/lock-status', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(MOCK_RECOVERY_LOCK_STATUS),
    }),
  );

  await page.route('**/api/behavioral/retention/danger-zone', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(MOCK_DANGER_ZONE_STATUS),
    }),
  );

  // Bare `*` in a glob never crosses `/`, so `**/api/notifications*` would
  // miss `/notifications/unread-count`. Register the collection route and
  // the sub-path routes separately.
  await page.route('**/api/notifications', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(MOCK_NOTIFICATIONS),
    }),
  );

  await page.route('**/api/notifications/unread-count', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ count: 0 }),
    }),
  );

  await page.route('**/api/notifications/stream-ticket', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ ticket: 'e2e-notifications-stream-ticket', expiresInSeconds: 60 }),
    }),
  );

  await page.route('**/api/notifications/stream-cookie', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ expiresInSeconds: 3600 }),
    }),
  );

  await page.route('**/api/notifications/*/read', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ status: 'ok' }),
    }),
  );
}

/**
 * Set up unauthenticated API mocks (returns 401 for protected endpoints).
 */
export async function setupUnauthenticatedMocks(page: Page) {
  await page.route('**/api/auth/csrf', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ csrfToken: MOCK_CSRF_TOKEN }),
    }),
  );

  await page.route('**/api/users/me', (route) =>
    route.fulfill({ status: 401, contentType: 'application/json', body: '{"message":"Unauthorized"}' }),
  );
}
