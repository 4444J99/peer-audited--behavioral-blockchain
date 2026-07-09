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

/**
 * Set up standard API route mocks for authenticated pages.
 * Call this before navigating to any authenticated route.
 */
export async function setupAuthenticatedMocks(page: Page) {
  await page.route('**/api/auth/csrf', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ csrfToken: MOCK_CSRF_TOKEN }),
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
