const API_BASE = 'http://localhost:3000';

let authToken = '';

export function setToken(token: string) {
  authToken = token;
}

export function getToken(): string {
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

export const api = {
  // Auth
  login: (email: string, password: string) =>
    request<{ userId: string; token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

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

  getEnterpriseKeys: () =>
    request<{ keys: Array<{ id: string; key: string; enterprise: string; createdAt: string; active: boolean }> }>(
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
