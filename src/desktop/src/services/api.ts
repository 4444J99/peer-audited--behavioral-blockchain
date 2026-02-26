import type { ReleaseInfoResponse } from '@styx/shared/index';

const API_BASE =
  ((globalThis as any)?.__STYX_API_URL__ as string | undefined) ||
  (typeof process !== 'undefined' ? process.env.STYX_DESKTOP_API_URL : undefined) ||
  'http://localhost:3000';
const DESKTOP_APP_VERSION =
  (typeof process !== 'undefined' ? process.env.STYX_DESKTOP_APP_VERSION : undefined) ||
  '0.0.0-dev';
const DESKTOP_APP_BUILD =
  (typeof process !== 'undefined' ? process.env.STYX_DESKTOP_BUILD : undefined) ||
  'dev';

let authToken = '';

export function setToken(token: string) {
  authToken = token;
}

export function getToken(): string {
  return authToken;
}

export function clearToken(): void {
  authToken = '';
}

export function getApiBase(): string {
  return API_BASE;
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

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const headers = {
    'Content-Type': 'application/json',
    'x-styx-platform': 'desktop',
    'x-styx-app-version': DESKTOP_APP_VERSION,
    'x-styx-build': DESKTOP_APP_BUILD,
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

export const api = {
  // Auth
  login: (email: string, password: string) =>
    request<{ userId: string; token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  getReleaseInfo: () =>
    request<ReleaseInfoResponse>('/meta/release'),

  // Admin
  getAdminStats: () =>
    request<{
      totalUsers: number;
      activeContracts: number;
      pendingProofs: number;
      avgIntegrity: number;
    }>('/admin/stats'),

  getTruthLog: (limit?: number) =>
    request<{ transactions: any[] }>(
      `/wallet/history${limit ? `?limit=${limit}` : ''}`,
    ),

  banUser: (userId: string, reason: string) =>
    request<{ success: boolean }>(`/admin/ban/${userId}`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    }),

  injectHoneypot: () =>
    request<{ status: string; jobId: string }>('/admin/honeypot', {
      method: 'POST',
    }),

  resolveContract: (contractId: string, outcome: string) =>
    request<{ success: boolean }>(`/admin/resolve/${contractId}`, {
      method: 'POST',
      body: JSON.stringify({ outcome }),
    }),

  // B2B
  getEnterpriseMetrics: (id: string) =>
    request<any>(`/b2b/metrics/${id}`),

  getEnterpriseBilling: (id: string) =>
    request<any>(`/b2b/billing/${id}`),

  requestNotificationStreamTicket: () =>
    request<{ ticket: string; expiresInSeconds: number }>('/notifications/stream-ticket', {
      method: 'POST',
    }),

  issueNotificationStreamCookie: () =>
    request<{ expiresInSeconds: number }>('/notifications/stream-cookie', {
      method: 'POST',
      credentials: 'include',
    }),

  getEnterpriseKeys: () =>
    request<{ keys: Array<{ id: string; enterprise: string; createdAt: string; active: boolean; keyPreview?: string }> }>(
      '/b2b/keys',
    ),

  generateApiKey: (enterpriseId: string) =>
    request<{ key: string }>('/b2b/keys', {
      method: 'POST',
      body: JSON.stringify({ enterpriseId }),
    }),

  revokeApiKey: (keyId: string) =>
    request<{ success: boolean }>(`/b2b/keys/${keyId}`, {
      method: 'DELETE',
    }),
};
