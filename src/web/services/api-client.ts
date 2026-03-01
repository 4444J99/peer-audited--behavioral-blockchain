import type { MobileBootstrapResponse, ReleaseInfoResponse } from '@styx/shared/index';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
const WEB_APP_VERSION = process.env.NEXT_PUBLIC_STYX_WEB_VERSION || process.env.NEXT_PUBLIC_APP_VERSION || '0.0.0-dev';
const WEB_APP_BUILD = process.env.NEXT_PUBLIC_STYX_WEB_BUILD || process.env.NEXT_PUBLIC_BUILD_SHA || 'dev';

let currentToken = '';
let currentCsrfToken = '';

export function setAuthToken(token: string) { // allow-secret
  currentToken = token;
}

export function getAuthToken(): string {
  return currentToken;
}

export function setCsrfToken(token: string) {
  currentCsrfToken = token;
}

export function getCsrfToken(): string {
  return currentCsrfToken;
}

function readCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const [rawKey, ...rawValue] = cookie.trim().split('=');
    if (rawKey === name) {
      return decodeURIComponent(rawValue.join('='));
    }
  }
  return null;
}

function getRequestId(res: Response): string | null {
  return res.headers?.get?.('x-styx-request-id') || res.headers?.get?.('x-request-id') || null;
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
    const text = await res.text().catch(() => '');
    if (text) {
      message = `API ${res.status}: ${text}`;
    }
  }

  const requestId = getRequestId(res);
  if (requestId) {
    message += ` [request_id: ${requestId}]`;
  }
  return message;
}

let isRefreshing = false;

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const method = String(options?.method || 'GET').toUpperCase();
  const needsCsrf = method === 'POST' || method === 'PUT' || method === 'PATCH' || method === 'DELETE';
  const csrfToken = currentCsrfToken || readCookie('styx_csrf_token') || '';
  const mergedHeaders = {
    'Content-Type': 'application/json',
    'x-styx-platform': 'web',
    'x-styx-app-version': WEB_APP_VERSION,
    'x-styx-build': WEB_APP_BUILD,
    ...(currentToken ? { Authorization: `Bearer ${currentToken}` } : {}),
    ...(needsCsrf && csrfToken ? { 'x-csrf-token': csrfToken } : {}),
    ...options?.headers,
  };
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    credentials: options?.credentials ?? 'include',
    headers: mergedHeaders,
  });

  // Auto-refresh on 401 (except for the refresh endpoint itself)
  if (res.status === 401 && path !== '/auth/refresh' && !isRefreshing) {
    isRefreshing = true;
    try {
      await refreshToken();
      isRefreshing = false;
      // Retry the original request
      return request<T>(path, options);
    } catch {
      isRefreshing = false;
      throw new Error(await parseErrorMessage(res));
    }
  }

  if (!res.ok) throw new Error(await parseErrorMessage(res));
  if (res.status === 204) return undefined as T;
  const contentType = res.headers?.get?.('content-type') || '';
  if (contentType.includes('application/json') || contentType === '') {
    return res.json();
  }
  return (await res.text()) as T;
}

async function refreshToken(): Promise<void> {
  const res = await fetch(`${API_BASE}/auth/refresh`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok) throw new Error('Refresh failed');
}

export interface CreateContractDto {
  oathCategory: string;
  verificationMethod: string;
  stakeAmount: number;
  durationDays: number;
  healthMetrics?: {
    currentWeightLbs: number;
    heightInches: number;
    targetWeightLbs: number;
  };
}

export interface SubmitProofDto {
  mediaUri: string;
}

export interface VerdictDto {
  assignmentId: string;
  verdict: 'PASS' | 'FAIL';
  confidence?: number;
  flagged?: boolean;
}

export interface LeaderboardEntry {
  id: string;
  email: string;
  integrity_score: number;
  created_at: string;
}

export const api = {
  health: () => request<{ status: string }>('/health'),
  getMobileBootstrap: () => request<MobileBootstrapResponse>('/mobile/bootstrap'),
  getReleaseInfo: () => request<ReleaseInfoResponse>('/meta/release'),

  // Auth
  register: (email: string, password: string, opts?: { ageConfirmation?: boolean; termsAccepted?: boolean; dateOfBirth?: string }) => // allow-secret
    request<{ userId: string; token: string }>('/auth/register', { // allow-secret
      method: 'POST',
      body: JSON.stringify({ email, password, ...opts }),
    }),

  login: (email: string, password: string) => // allow-secret
    request<{ userId: string; token: string }>('/auth/login', { // allow-secret
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  logout: () =>
    request<{ status: string }>('/auth/logout', {
      method: 'POST',
    }),

  getCsrf: () =>
    request<{ csrfToken: string }>('/auth/csrf'),

  // Wallet — no more userId query params
  getBalance: () =>
    request<{
      userId: string;
      email: string;
      integrityScore: number;
      allowedTiers: string[];
      ledgerBalance: number;
      status: string;
    }>('/wallet/balance'),

  getHistory: (limit?: number) =>
    request<{ transactions: Array<{
      id: string;
      debit_account_id: string;
      credit_account_id: string;
      amount: string;
      contract_id: string;
      metadata: Record<string, unknown>;
      created_at: string;
      debit_account_name: string;
      credit_account_name: string;
    }> }>(`/wallet/history${limit ? `?limit=${limit}` : ''}`),

  // Contracts — userId comes from JWT
  getUserContracts: () =>
    request<Array<{
      id: string;
      user_id: string;
      oath_category: string;
      verification_method: string;
      stake_amount: string;
      status: string;
      duration_days: number;
      started_at: string;
      ends_at: string;
      created_at: string;
    }>>('/contracts'),

  getContract: (id: string) => request<{
    id: string;
    user_id: string;
    oath_category: string;
    verification_method: string;
    stake_amount: string;
    status: string;
    duration_days: number;
    started_at: string;
    ends_at: string;
    created_at: string;
    email: string;
    integrity_score: number;
    grace_days_used?: number;
  }>(`/contracts/${id}`),

  createContract: (dto: CreateContractDto | Record<string, unknown>) =>
    request<{ contractId: string; paymentIntentId: string }>('/contracts', {
      method: 'POST',
      body: JSON.stringify(dto),
    }),

  submitProof: (contractId: string, dto: SubmitProofDto) =>
    request<{ proofId: string; jobId: string; rejected?: boolean; reason?: string }>(`/contracts/${contractId}/proof`, {
      method: 'POST',
      body: JSON.stringify(dto),
    }),

  disputeContract: (contractId: string) =>
    request<{ appealStatus: string; paymentIntentId: string }>(`/contracts/${contractId}/dispute`, {
      method: 'POST',
    }),

  // Fury — userId comes from JWT
  getFuryAssignments: () =>
    request<{ assignments: Array<{
      assignmentId: string;
      proofId: string;
      assignedAt: string;
      contractId: string;
      submittedAt: string;
      contentType: string | null;
      description: string | null;
      viewUrl: string | null;
    }> }>('/fury/queue'),

  submitVerdict: (dto: VerdictDto) =>
    request<{ status: string; honeypotReveal?: { wasHoneypot: boolean; wasCorrect: boolean } }>('/fury/verdict', {
      method: 'POST',
      body: JSON.stringify(dto),
    }),

  // Users
  getMe: () => request<{
    id: string;
    email: string;
    integrity_score: number;
    role: string;
    status: string;
    created_at: string;
    compliance?: {
      kyc_status: string;
      age_verification_status: string;
      identity_provider: string | null;
      identity_verification_id: string | null;
      identity_verified_at: string | null;
      is_kyc_verified: boolean;
      is_age_verified: boolean;
    };
  }>('/users/me'),

  getLeaderboard: (limit?: number, period?: string) => {
    const params = new URLSearchParams();
    if (limit) params.set('limit', String(limit));
    if (period) params.set('period', period);
    const qs = params.toString();
    return request<LeaderboardEntry[]>(`/users/leaderboard${qs ? `?${qs}` : ''}`);
  },

  // Notifications
  getNotifications: () =>
    request<Array<{
      id: string;
      type: string;
      title: string;
      body: string | null;
      read: boolean;
      created_at: string;
    }>>('/notifications'),

  getUnreadCount: () =>
    request<{ count: number }>('/notifications/unread-count'),

  requestNotificationStreamTicket: () =>
    request<{ ticket: string; expiresInSeconds: number }>('/notifications/stream-ticket', {
      method: 'POST',
    }),

  issueNotificationStreamCookie: () =>
    request<{ expiresInSeconds: number }>('/notifications/stream-cookie', {
      method: 'POST',
      credentials: 'include',
    }),

  markNotificationRead: (id: string) =>
    request<{ status: string }>(`/notifications/${id}/read`, { method: 'POST' }),

  // B2B Enterprise
  getEnterpriseMetrics: (enterpriseId: string) =>
    request<{
      enterpriseId: string;
      totalContracts: number;
      completedContracts: number;
      failedContracts: number;
      activeContracts: number;
      completionRate: number;
      avgIntegrityScore: number;
      totalEmployees: number;
    }>(`/b2b/metrics/${enterpriseId}`),

  getEnterpriseBilling: (enterpriseId: string) =>
    request<{
      enterpriseId: string;
      plan: string;
      events: unknown[];
      totalDue: number;
      currency: string;
    }>(`/b2b/billing/${enterpriseId}`),

  // Billing — ticket purchase
  purchaseTicket: (contractId: string) =>
    request<{ paymentIntentId: string; amount: number }>(`/contracts/${contractId}/ticket`, {
      method: 'POST',
    }),

  // Grace day
  useGraceDay: (contractId: string) =>
    request<{ newDeadline: string }>(`/contracts/${contractId}/grace-day`, {
      method: 'POST',
    }),

  // Proofs for a contract
  getContractProofs: (contractId: string) =>
    request<Array<{
      id: string;
      status: string;
      media_uri: string;
      submitted_at: string;
    }>>(`/contracts/${contractId}/proofs`),

  // Admin
  injectHoneypot: () =>
    request<{ status: string; jobId: string }>('/admin/honeypot', { method: 'POST' }),

  banUser: (userId: string, reason: string) =>
    request('/admin/ban/' + userId, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    }),

  adminResolve: (contractId: string, outcome: 'COMPLETED' | 'FAILED') =>
    request('/admin/resolve/' + contractId, {
      method: 'POST',
      body: JSON.stringify({ outcome }),
    }),

  getAdminStats: () =>
    request<{
      totalUsers: number;
      activeContracts: number;
      pendingProofs: number;
      avgIntegrity: number;
    }>('/admin/stats'),

  getDisputes: () =>
    request<Array<{
      id: string;
      contract_id: string;
      user_id: string;
      media_uri: string;
      status: string;
      submitted_at: string;
      email: string;
      oath_category: string;
    }>>('/admin/disputes'),

  // User profile / history
  getIntegrityHistory: () =>
    request<Array<{
      event_type: string;
      payload: Record<string, unknown>;
      created_at: string;
    }>>('/users/me/history'),

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

  // AI
  grillMe: (slideContent: string) =>
    request<{ questions: string[] }>('/ai/grill-me', {
      method: 'POST',
      body: JSON.stringify({ slideContent }),
    }),

  eli5: (text: string) =>
    request<{ explanation: string }>('/ai/eli5', {
      method: 'POST',
      body: JSON.stringify({ text }),
    }),

  // Fury stats (earnings, accuracy)
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

  requestFuryStreamTicket: () =>
    request<{ ticket: string; expiresInSeconds: number }>('/fury/stream-ticket', {
      method: 'POST',
    }),

  issueFuryStreamCookie: () =>
    request<{ expiresInSeconds: number }>('/fury/stream-cookie', {
      method: 'POST',
      credentials: 'include',
    }),

  // Attestations (Recovery stream)
  getAttestationStatus: (contractId: string) =>
    request<{
      contractId: string;
      oathCategory: string;
      streakDays: number;
      daysRemaining: number;
      graceDaysAvailable: number;
      todayAttested: boolean;
      totalStrikes: number;
    }>(`/contracts/${contractId}/attestation`),

  submitAttestation: (contractId: string) =>
    request<{ status: string }>(`/contracts/${contractId}/attestation`, {
      method: 'POST',
    }),

  // Public feed (no auth)
  getPublicFeed: (limit?: number) =>
    request<{ events: Array<{
      id: string;
      type: string;
      message: string;
      timestamp: string;
    }> }>(`/feed${limit ? `?limit=${limit}` : ''}`),
};
