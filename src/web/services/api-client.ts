const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
const AUTH_TOKEN = process.env.NEXT_PUBLIC_AUTH_TOKEN || 'dev-mock-jwt-token-alpha-omega'; // allow-secret

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${AUTH_TOKEN}`,
      ...options?.headers,
    },
    ...options,
  });
  if (!res.ok) throw new Error(`API ${res.status}: ${await res.text()}`);
  return res.json();
}

export interface CreateContractDto {
  userId: string;
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
  userId: string;
  mediaUri: string;
}

export interface VerdictDto {
  assignmentId: string;
  furyUserId: string;
  verdict: 'PASS' | 'FAIL';
}

export const api = {
  health: () => request<{ status: string }>('/health'),

  getBalance: (userId: string) =>
    request<{
      userId: string;
      email: string;
      integrityScore: number;
      allowedTiers: string[];
      ledgerBalance: number;
      status: string;
    }>(`/wallet/balance?userId=${userId}`),

  getHistory: (userId: string, limit?: number) =>
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
    }> }>(`/wallet/history?userId=${userId}${limit ? `&limit=${limit}` : ''}`),

  getUserContracts: (userId: string) =>
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
    }>>(`/contracts?userId=${userId}`),

  getContract: (id: string) => request(`/contracts/${id}`),

  createContract: (dto: CreateContractDto) =>
    request<{ contractId: string; paymentIntentId: string }>('/contracts', {
      method: 'POST',
      body: JSON.stringify(dto),
    }),

  submitProof: (contractId: string, dto: SubmitProofDto) =>
    request<{ proofId: string; jobId: string }>(`/contracts/${contractId}/proof`, {
      method: 'POST',
      body: JSON.stringify(dto),
    }),

  getFuryAssignments: (furyUserId: string) =>
    request<{ assignments: Array<{
      assignment_id: string;
      proof_id: string;
      assigned_at: string;
      media_uri: string;
      contract_id: string;
      submitted_at: string;
    }> }>(`/fury/queue?furyUserId=${furyUserId}`),

  submitVerdict: (dto: VerdictDto) =>
    request<{ status: string }>('/fury/verdict', {
      method: 'POST',
      body: JSON.stringify(dto),
    }),
};
