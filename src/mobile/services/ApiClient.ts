import { API_BASE } from '../config/api';
import type { MobileBootstrapResponse, ReleaseInfoResponse } from '@styx/shared/index';

let authToken: string | null = null;

const MOBILE_APP_VERSION = process.env.EXPO_PUBLIC_STYX_MOBILE_VERSION || '0.0.0-dev';
const MOBILE_APP_BUILD = process.env.EXPO_PUBLIC_STYX_MOBILE_BUILD || 'dev';

export function setAuthToken(token: string | null) {
  authToken = token;
}

export function getAuthToken(): string | null {
  return authToken;
}

function getRequestId(res: Response): string | null {
  return (
    res.headers?.get?.('x-styx-request-id') ||
    res.headers?.get?.('x-request-id') ||
    null
  );
}

async function parseErrorMessage(res: Response): Promise<string> {
  let message = `API ${res.status}`;
  try {
    const contentType = res.headers?.get?.('content-type') || '';
    if (contentType.includes('application/json')) {
      const payload = await res.json();
      const envelopeMessage =
        payload?.message ||
        payload?.error?.message ||
        payload?.error_description ||
        payload?.error;
      const errorCode =
        payload?.error_code ||
        payload?.code ||
        payload?.error?.code;
      if (envelopeMessage) {
        message = `API ${res.status}: ${String(envelopeMessage)}`;
      }
      if (errorCode) {
        message += ` (${String(errorCode)})`;
      }
    } else {
      const text = await res.text();
      if (text) {
        message = `API ${res.status}: ${text}`;
      }
    }
  } catch {
    const fallbackText = await res.text().catch(() => '');
    if (fallbackText) {
      message = `API ${res.status}: ${fallbackText}`;
    }
  }

  const requestId = getRequestId(res);
  if (requestId) {
    message += ` [request_id: ${requestId}]`;
  }
  return message;
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const headers = {
    'Content-Type': 'application/json',
    'x-styx-platform': 'ios',
    'x-styx-app-version': MOBILE_APP_VERSION,
    'x-styx-build': MOBILE_APP_BUILD,
    ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
    ...((options?.headers as Record<string, string> | undefined) || {}),
  };
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });
  if (!res.ok) {
    throw new Error(await parseErrorMessage(res));
  }
  if (res.status === 204) {
    return undefined as T;
  }
  const contentType = res.headers?.get?.('content-type') || '';
  if (contentType.includes('application/json') || contentType === '') {
    return res.json();
  }
  return (await res.text()) as T;
}

export const ApiClient = {
  getMobileBootstrap: () =>
    request<MobileBootstrapResponse>('/mobile/bootstrap'),

  getReleaseInfo: () =>
    request<ReleaseInfoResponse>('/meta/release'),

  // Auth
  login: (email: string, password: string) =>
    request<{ userId: string; token: string; integrity: number }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  register: (data: { email: string; password: string; ageConfirmation: boolean; termsAccepted: boolean; dateOfBirth: string }) =>
    request<{ userId: string; token: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // User
  getMe: () =>
    request<{
      id: string;
      email: string;
      integrity_score: number;
      tier: string;
      contract_count: number;
      total_staked: number;
    }>('/users/me'),
getContracts: () =>
  request<Array<{
    id: string;
    oath_category: string;
    description: string;
    stake_amount: number;
    status: string;
    started_at: string;
    ends_at: string;
    proof_count: number;
    grace_days_used: number;
  }>>('/contracts'),

  getContract: (id: string) =>
    request<{
      id: string;
      oath_category: string;
      description: string;
      stake_amount: number;
      status: string;
      started_at: string;
      ends_at: string;
      metadata: any;
      proof_count: number;
      proofs: Array<{ id: string; timestamp: string; status: string; media_url?: string }>;
      grace_days_used: number;
      grace_days_max: number;
    }>(`/contracts/${id}`),

  createContract: (data: {
    oathCategory: string;
    verificationMethod: string;
    stakeAmount: number;
    durationDays: number;
    description: string;
    recoveryMetadata?: {
      accountabilityPartnerEmail: string;
      noContactIdentifiers?: string[];
      acknowledgments: {
        voluntary: boolean;
        noMinors: boolean;
        noDependents: boolean;
        noLegalObligations: boolean;
      };
    };
  }) =>
    request<{ contractId: string; bountyLink?: string }>('/contracts', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  submitProof: (contractId: string, data: { mediaUri: string }) =>
    request<{ proofId: string; jobId: string; rejected?: boolean; reason?: string }>(`/contracts/${contractId}/proof`, {
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
      id: string;
      email: string;
      integrity_score: number;
      allowed_tiers: string[];
      ledger_balance: number;
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

  // Settings
  changePassword: (currentPassword: string, newPassword: string) => // allow-secret
    request<{ status: string }>('/users/me/password', {
      method: 'PATCH',
      body: JSON.stringify({ currentPassword, newPassword }),
    }),

  updateSettings: (settings: { emailNotifications?: boolean; pushNotifications?: boolean }) =>
    request<{ status: string }>('/users/me/settings', {
      method: 'PATCH',
      body: JSON.stringify(settings),
    }),

  deleteAccount: () =>
    request<{ status: string }>('/users/me', {
      method: 'DELETE',
    }),

  // Attestations (Recovery stream)
  getAttestationStatus: (contractId: string) =>
    request<{
      contract_id: string;
      oath_category: string;
      streak_days: number;
      days_remaining: number;
      grace_days_available: number;
      today_attested: boolean;
      total_strikes: number;
    }>(`/contracts/${contractId}/attestation`),

  submitAttestation: (contractId: string) =>
    request<{ status: string }>(`/contracts/${contractId}/attestation`, {
      method: 'POST',
    }),

  // Push notifications
  registerPushToken: (pushToken: string) => // allow-secret
    request<{ status: string }>('/users/me/push-token', {
      method: 'PUT',
      body: JSON.stringify({ token: pushToken }), // allow-secret
    }),

  // Enterprise SSO
  exchangeEnterpriseToken: (enterpriseToken: string) => // allow-secret
    request<{ userId: string; token: string }>('/auth/enterprise', {
      method: 'POST',
      body: JSON.stringify({ enterpriseToken }), // allow-secret
    }),

  // Accountability Partner
  getPendingInvitations: () =>
    request<any[]>('/contracts/invitations'),

  acceptPartnerInvitation: (contractId: string) =>
    request<{ status: string }>(`/contracts/${contractId}/partner/accept`, {
      method: 'POST',
    }),

  cosignAttestation: (contractId: string) =>
    request<{ status: string }>(`/contracts/${contractId}/attestation/cosign`, {
      method: 'POST',
    }),

  // Self-Exclusion
  setSelfExclusion: (durationDays: number) =>
    request<{ status: string; expiresAt: string }>('/users/me/self-exclusion', {
      method: 'POST',
      body: JSON.stringify({ durationDays }),
    }),
};
