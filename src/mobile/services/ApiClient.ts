const API_BASE = process.env.STYX_API_URL || 'http://localhost:3000';

let authToken: string | null = null;

export function setAuthToken(token: string | null) {
  authToken = token;
}

export function getAuthToken(): string | null {
  return authToken;
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      ...options?.headers,
    },
    ...options,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API ${res.status}: ${text}`);
  }
  return res.json();
}

export const ApiClient = {
  // Auth
  login: (email: string, password: string) =>
    request<{ userId: string; token: string; integrity: number }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  register: (email: string, password: string) =>
    request<{ userId: string; token: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  // User
  getMe: () =>
    request<{
      userId: string;
      email: string;
      integrity: number;
      tier: string;
      contractCount: number;
      totalStaked: number;
    }>('/users/me'),

  // Contracts
  getContracts: () =>
    request<{
      contracts: Array<{
        id: string;
        category: string;
        description: string;
        stakeAmount: number;
        status: string;
        startDate: string;
        endDate: string;
        proofCount: number;
        graceDaysUsed: number;
      }>;
    }>('/contracts'),

  getContract: (id: string) =>
    request<{
      id: string;
      category: string;
      description: string;
      stakeAmount: number;
      status: string;
      startDate: string;
      endDate: string;
      proofs: Array<{ id: string; timestamp: string; status: string; mediaUrl?: string }>;
      graceDaysUsed: number;
      graceDaysMax: number;
    }>(`/contracts/${id}`),

  createContract: (data: { category: string; description: string; stakeAmount: number; durationDays: number }) =>
    request<{ contractId: string }>('/contracts', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  submitProof: (contractId: string, data: { mediaUri?: string; notes?: string }) =>
    request<{ proofId: string; status: string }>(`/contracts/${contractId}/proof`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  useGraceDay: (contractId: string) =>
    request<{ success: boolean; graceDaysRemaining: number }>(`/contracts/${contractId}/grace-day`, {
      method: 'POST',
    }),

  fileDispute: (contractId: string, reason: string) =>
    request<{ disputeId: string }>(`/contracts/${contractId}/dispute`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    }),

  // Fury
  getFuryQueue: () =>
    request<{
      assignments: Array<{
        id: string;
        contractId: string;
        proofId: string;
        mediaUrl: string;
        category: string;
        submittedAt: string;
      }>;
    }>('/fury/queue'),

  submitVerdict: (assignmentId: string, verdict: 'VERIFY' | 'BURN') =>
    request<{ success: boolean; bounty?: number }>('/fury/verdict', {
      method: 'POST',
      body: JSON.stringify({ assignmentId, verdict }),
    }),

  // Fury Stats
  getFuryStats: () =>
    request<{
      totalAudits: number;
      successfulAudits: number;
      falseAccusations: number;
      accuracy: number;
      totalBountiesEarned: number;
      totalPenaltiesPaid: number;
      netEarnings: number;
      honeypotsCaught: number;
      honeypotsFailedOn: number;
    }>('/fury/stats'),

  // Wallet
  getBalance: () =>
    request<{
      userId: string;
      email: string;
      integrityScore: number;
      allowedTiers: string[];
      ledgerBalance: number;
      status: string;
    }>('/wallet/balance'),

  getWalletHistory: (limit?: number) =>
    request<{ transactions: Array<{ id: string; type: string; amount: number; timestamp: string; description: string }> }>(
      `/wallet/history${limit ? `?limit=${limit}` : ''}`,
    ),

  // Feed / Leaderboard
  getLeaderboard: () =>
    request<{ leaders: Array<{ rank: number; anonymousId: string; integrity: number; completedContracts: number }> }>(
      '/feed/leaderboard',
    ),

  // Notifications
  getNotifications: () =>
    request<{ notifications: Array<{ id: string; type: string; message: string; read: boolean; createdAt: string }> }>(
      '/notifications',
    ),

  // Enterprise SSO
  exchangeEnterpriseToken: (enterpriseToken: string) => // allow-secret
    request<{ userId: string; token: string }>('/auth/enterprise', {
      method: 'POST',
      body: JSON.stringify({ enterpriseToken }), // allow-secret
    }),
};
