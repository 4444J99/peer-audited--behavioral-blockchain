import type {
  ComplianceArtifactStatus,
  MobileBootstrapResponse,
  ReleaseInfoResponse,
  ReferralCodeResponse,
  ReferralStats,
  ReferralReward,
  StyxErrorEnvelope,
} from "@styx/shared/index";
import { getApiBase } from "./runtime-config";
import { isSnapshotMode, snapshotRespond } from "./snapshot";

// In the browser, route through the Next.js /api rewrite proxy (same-origin)
// to avoid cross-origin cookie/CORS issues.  On the server (SSR), call the
// API directly since there's no browser cookie sandbox to worry about.
const WEB_APP_VERSION =
  process.env.NEXT_PUBLIC_STYX_WEB_VERSION ||
  process.env.NEXT_PUBLIC_APP_VERSION ||
  "0.0.0-dev";
const WEB_APP_BUILD =
  process.env.NEXT_PUBLIC_STYX_WEB_BUILD ||
  process.env.NEXT_PUBLIC_BUILD_SHA ||
  "dev";

let currentToken = "";
let currentCsrfToken = "";

export function setAuthToken(token: string) {
  // allow-secret
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

/**
 * The CSRF cookie is deliberately readable (httpOnly: false — double-submit
 * pattern) and its value is deterministic per session, so session hydration
 * can take it straight from the cookie instead of calling GET /auth/csrf on
 * every page load (#891: the per-load call tripped the endpoint's rate limit
 * on ordinary fast navigation).
 */
export function readCsrfCookie(): string | null {
  return readCookie("styx_csrf_token");
}

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const cookies = document.cookie.split(";");
  for (const cookie of cookies) {
    const [rawKey, ...rawValue] = cookie.trim().split("=");
    if (rawKey === name) {
      return decodeURIComponent(rawValue.join("="));
    }
  }
  return null;
}

function getRequestId(res: Response): string | null {
  return (
    res.headers?.get?.("x-styx-request-id") ||
    res.headers?.get?.("x-request-id") ||
    null
  );
}

/**
 * Typed API failure. `status` lets callers distinguish a real answer from an
 * outage (a 403 with code JURISDICTION_BLOCKED is the backend working, not the
 * network failing); `code` is the API's own `error_code` (shared envelope
 * contract) when it was serialized.
 */
export class ApiError extends Error {
  readonly status: number;
  readonly code: string | null;
  readonly traceId: string | null;

  constructor(
    message: string,
    status: number,
    code: string | null = null,
    traceId: string | null = null,
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.traceId = traceId;
  }
}

interface ParsedError {
  message: string;
  code: string | null;
  traceId: string | null;
}

async function parseErrorEnvelope(res: Response): Promise<ParsedError> {
  let message = `API ${res.status}`;
  let code: string | null = null;
  try {
    const contentType = res.headers?.get?.("content-type") || "";
    if (contentType.includes("application/json")) {
      const payload = (await res.json()) as Partial<StyxErrorEnvelope> & {
        error?: { message?: unknown; code?: unknown } | undefined;
        error_description?: unknown;
        code?: unknown;
      };
      const envelopeMessage =
        payload?.message ||
        payload?.error?.message ||
        payload?.error_description ||
        payload?.error;
      const errorCode =
        payload?.error_code || payload?.code || payload?.error?.code;
      if (envelopeMessage) {
        message = `API ${res.status}: ${String(envelopeMessage)}`;
      }
      if (errorCode) {
        message += ` (${String(errorCode)})`;
      }
      if (typeof errorCode === "string" && errorCode.length > 0) {
        code = errorCode;
      }
    } else {
      const text = await res.text();
      if (text) {
        message = `API ${res.status}: ${text}`;
      }
    }
  } catch {
    const text = await res.text().catch(() => "");
    if (text) {
      message = `API ${res.status}: ${text}`;
    }
  }

  const requestId = getRequestId(res);
  if (requestId) {
    message += ` [request_id: ${requestId}]`;
  }
  return { message, code, traceId: requestId };
}

let isRefreshing = false;

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const method = String(options?.method || "GET").toUpperCase();

  // The Cloudflare snapshot has no API behind it. Every call is answered from
  // fixtures captured off a verified demo run, and writes are refused in plain
  // language rather than faked -- see services/snapshot.ts. Inlined at build time,
  // so a normal build never reaches this branch.
  if (isSnapshotMode()) {
    const snapshot = await snapshotRespond<T>(path, method);
    if (snapshot.ok) return snapshot.data;
    throw new ApiError(snapshot.message, snapshot.status, null, null);
  }

  const needsCsrf =
    method === "POST" ||
    method === "PUT" ||
    method === "PATCH" ||
    method === "DELETE";
  const csrfToken = currentCsrfToken || readCookie("styx_csrf_token") || "";
  const mergedHeaders = {
    "Content-Type": "application/json",
    "x-styx-platform": "web",
    "x-styx-app-version": WEB_APP_VERSION,
    "x-styx-build": WEB_APP_BUILD,
    ...(currentToken ? { Authorization: `Bearer ${currentToken}` } : {}),
    ...(needsCsrf && csrfToken ? { "x-csrf-token": csrfToken } : {}),
    ...options?.headers,
  };
  let res: Response;
  try {
    res = await fetch(`${getApiBase()}${path}`, {
      ...options,
      credentials: options?.credentials ?? "include",
      headers: mergedHeaders,
    });
  } catch {
    throw new ApiError(
      "Styx service is temporarily unavailable. Please try again shortly.",
      0,
      null,
      null,
    );
  }

  // Auto-refresh on 401 (except for the refresh endpoint itself)
  if (res.status === 401 && path !== "/auth/refresh" && !isRefreshing) {
    isRefreshing = true;
    try {
      await refreshToken();
      isRefreshing = false;
      // Retry the original request
      return request<T>(path, options);
    } catch {
      isRefreshing = false;
      const parsed = await parseErrorEnvelope(res);
      throw new ApiError(parsed.message, res.status, parsed.code, parsed.traceId);
    }
  }

  if (!res.ok) {
    const parsed = await parseErrorEnvelope(res);
    throw new ApiError(parsed.message, res.status, parsed.code, parsed.traceId);
  }
  if (res.status === 204) return undefined as T;
  const contentType = res.headers?.get?.("content-type") || "";
  if (contentType.includes("application/json") || contentType === "") {
    return res.json();
  }
  return (await res.text()) as T;
}

async function refreshToken(): Promise<void> {
  const res = await fetch(`${getApiBase()}/auth/refresh`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) throw new Error("Refresh failed");
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
  verdict: "PASS" | "FAIL";
  confidence?: number;
  flagged?: boolean;
}

/** A PENDING accountability_partners row joined to the contract it covers. */
export interface PartnerInvitation {
  id: string;
  contract_id: string;
  partner_user_id: string | null;
  partner_email: string | null;
  status: string;
  invited_at: string | null;
  accepted_at: string | null;
  oath_category: string;
  stake_amount: string;
  owner_email: string;
}

/** An ACTIVE partnership from the partner's side of the relationship. */
export interface Partnership {
  id: string;
  contract_id: string;
  status: string;
  accepted_at: string | null;
  oath_category: string;
  stake_amount: string;
  ends_at: string | null;
  contract_status: string;
  owner_email: string;
}

/** A partner_checkins row, serialized by AccountabilityPartnerService. */
export interface PartnerCheckIn {
  id: string;
  contractId: string;
  partnerId: string;
  type: "SCHEDULED" | "EMERGENCY" | "STREAK_MILESTONE";
  status: "PENDING" | "COMPLETED" | "MISSED" | "ESCALATED";
  scheduledAt: string;
  completedAt?: string;
  message?: string;
}

export interface AccountabilityStatus {
  partners: Array<{
    email: string;
    status: string;
    partner_user_id: string;
  }>;
  history: Array<{
    id: string;
    contract_id: string;
    actor_id: string;
    event_type: string;
    payload: Record<string, unknown> | null;
    created_at: string;
  }>;
}

export interface LeaderboardEntry {
  id: string;
  email: string;
  integrity_score: number;
  created_at: string;
}

/**
 * A queued intentional break on a recovery contract (TKT-P1-005). `status` is
 * the row's stored value except for the one case the server derives: a
 * PENDING_COOLDOWN row whose `unlock_at` has passed is returned as UNLOCKED.
 * The client renders that field as given — it never decides the lock state
 * from its own clock, which can be wrong or deliberately wound forward.
 */
export interface RecoveryBreakRequest {
  id: string;
  contract_id: string;
  requested_at: string;
  unlock_at: string;
  reason: string | null;
  status: "PENDING_COOLDOWN" | "UNLOCKED" | "CANCELLED" | "CONSUMED";
}

export interface DangerWindow {
  type: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  message: string;
}

export interface ProtectionRecommendation {
  type: string;
  action: string;
  description: string;
}

export interface ContractDangerStatus {
  contractId: string;
  inDangerZone: boolean;
  windows: DangerWindow[];
  recommendations: ProtectionRecommendation[];
}

/**
 * One ACTIVE contract as GET /dashboard/progress reports it. `stake_amount` and
 * `streak` arrive as strings: Postgres serializes NUMERIC and COUNT(*) (BIGINT)
 * as text to preserve precision the JSON number type would lose.
 */
export interface ActiveContractProgress {
  id: string;
  oath_category: string;
  status: string;
  stake_amount: string;
  duration_days: number;
  started_at: string;
  ends_at: string;
  streak: string;
}

export interface DashboardProgress {
  activeContracts: ActiveContractProgress[];
  protectedVaultBalanceCents: number;
  summary: {
    totalActiveStakeUsd: number;
    longestStreak: number;
  };
}

export const api = {
  health: () => request<{ status: string }>("/health"),
  getMobileBootstrap: () =>
    request<MobileBootstrapResponse>("/mobile/bootstrap"),
  getReleaseInfo: () => request<ReleaseInfoResponse>("/meta/release"),
  getComplianceArtifacts: () =>
    request<ComplianceArtifactStatus[]>("/compliance/artifacts"),

  // Auth
  register: (
    email: string,
    password: string,
    opts?: {
      ageConfirmation?: boolean;
      termsAccepted?: boolean;
      dateOfBirth?: string;
    }, // allow-secret
  ) =>
    request<{ userId: string; token: string }>("/auth/register", {
      // allow-secret
      method: "POST",
      body: JSON.stringify({ email, password, ...opts }),
    }),

  login: (
    email: string,
    password: string, // allow-secret
  ) =>
    request<{ userId: string; token: string }>("/auth/login", {
      // allow-secret
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  logout: () =>
    request<{ status: string }>("/auth/logout", {
      method: "POST",
    }),

  getCsrf: () => request<{ csrfToken: string }>("/auth/csrf"),

  // Wallet — no more userId query params
  getBalance: () =>
    request<{
      id: string;
      email: string;
      integrity_score: number;
      allowed_tiers: string[];
      ledger_balance: number;
      status: string;
    }>("/wallet/balance"),

  getHistory: (limit?: number) =>
    request<{
      transactions: Array<{
        id: string;
        type: string;
        amount: number;
        timestamp: string;
        description: string;
      }>;
    }>(`/wallet/history${limit ? `?limit=${limit}` : ""}`),

  // Contracts — userId comes from JWT
  getUserContracts: () =>
    request<
      Array<{
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
        proof_count: number;
      }>
    >("/contracts"),

  getContract: (id: string) =>
    request<{
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
      proof_count: number;
      proofs: Array<{
        id: string;
        timestamp: string;
        status: string;
        media_url: string | null;
      }>;
      grace_days_max: number;
    }>(`/contracts/${id}`),

  // `downscaling.multiplier` is advisory only — it is rendered as stake guidance
  // and never applied to a submitted amount (see lib/stake-guidance.ts).
  getEndowedProgress: (contractId: string) =>
    request<{
      contractId: string;
      realProgress: number;
      endowedBoost: number;
      displayProgress: number;
      currentTier: string;
      nextTierAt: number;
      motivation: string;
      downscaling: { multiplier: number; reason: string };
    }>(`/behavioral/retention/endowed-progress/${contractId}`),

  createContract: (dto: CreateContractDto | Record<string, unknown>) =>
    request<{ contractId: string; paymentIntentId: string }>("/contracts", {
      method: "POST",
      body: JSON.stringify(dto),
    }),

  submitProof: (contractId: string, dto: SubmitProofDto) =>
    request<{
      proofId: string;
      jobId: string;
      rejected?: boolean;
      reason?: string;
    }>(`/contracts/${contractId}/proof`, {
      method: "POST",
      body: JSON.stringify(dto),
    }),

  // paymentIntentId is null while appeals are free (DR-004) — there is no hold
  // to reference.
  disputeContract: (contractId: string) =>
    request<{ appealStatus: string; paymentIntentId: string | null }>(
      `/contracts/${contractId}/dispute`,
      {
        method: "POST",
      },
    ),

  // Recovery timelock (TKT-P1-005). A recovery contract cannot be broken on
  // impulse: the break is queued, and only the 24h cooldown expiring unlocks
  // it. `activeRequest` is null when nothing has ever been queued.
  getRecoveryLockStatus: (contractId: string) =>
    request<{ activeRequest: RecoveryBreakRequest | null }>(
      `/contracts/${contractId}/recovery/lock-status`,
    ),

  requestRecoveryBreak: (contractId: string, reason: string) =>
    request<RecoveryBreakRequest>(
      `/contracts/${contractId}/recovery/break-request`,
      {
        method: "POST",
        body: JSON.stringify({ reason }),
      },
    ),

  cancelRecoveryBreak: (contractId: string) =>
    request<{ success: boolean; request: RecoveryBreakRequest }>(
      `/contracts/${contractId}/recovery/break-cancel`,
      {
        method: "POST",
      },
    ),

  // Danger windows are evaluated per user across every ACTIVE contract, so
  // there is no per-contract route to call — a caller scoped to one contract
  // filters the `contracts` array itself.
  getDangerZoneStatus: () =>
    request<{
      timezone: string;
      inDangerZone: boolean;
      contracts: ContractDangerStatus[];
    }>("/behavioral/retention/danger-zone"),

  // Fury — userId comes from JWT
  getFuryAssignments: () =>
    request<{
      assignments: Array<{
        assignmentId: string;
        proofId: string;
        assignedAt: string;
        contractId: string;
        submittedAt: string;
        contentType: string | null;
        description: string | null;
        viewUrl: string | null;
      }>;
    }>("/fury/queue"),

  submitVerdict: (dto: VerdictDto) =>
    request<{
      status: string;
      honeypotReveal?: { wasHoneypot: boolean; wasCorrect: boolean };
    }>("/fury/verdict", {
      method: "POST",
      body: JSON.stringify(dto),
    }),

  // Users
  getMe: () =>
    request<{
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
    }>("/users/me"),

  getLeaderboard: (limit?: number, period?: string) => {
    const params = new URLSearchParams();
    if (limit) params.set("limit", String(limit));
    if (period) params.set("period", period);
    const qs = params.toString();
    return request<LeaderboardEntry[]>(
      `/users/leaderboard${qs ? `?${qs}` : ""}`,
    );
  },

  // Notifications
  getNotifications: () =>
    request<
      Array<{
        id: string;
        type: string;
        title: string;
        body: string | null;
        read: boolean;
        created_at: string;
      }>
    >("/notifications"),

  getUnreadCount: () =>
    request<{ count: number }>("/notifications/unread-count"),

  requestNotificationStreamTicket: () =>
    request<{ ticket: string; expiresInSeconds: number }>(
      "/notifications/stream-ticket",
      {
        method: "POST",
      },
    ),

  issueNotificationStreamCookie: () =>
    request<{ expiresInSeconds: number }>("/notifications/stream-cookie", {
      method: "POST",
      credentials: "include",
    }),

  markNotificationRead: (id: string) =>
    request<{ status: string }>(`/notifications/${id}/read`, {
      method: "POST",
    }),

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
    request<{ paymentIntentId: string; amount: number }>(
      `/contracts/${contractId}/ticket`,
      {
        method: "POST",
      },
    ),

  // Grace day
  useGraceDay: (contractId: string) =>
    request<{ newDeadline: string }>(`/contracts/${contractId}/grace-day`, {
      method: "POST",
    }),

  // Proofs for a contract
  getContractProofs: (contractId: string) =>
    request<
      Array<{
        id: string;
        status: string;
        media_uri: string;
        submitted_at: string;
      }>
    >(`/contracts/${contractId}/proofs`),

  // Admin
  injectHoneypot: () =>
    request<{ status: string; jobId: string }>("/admin/honeypot", {
      method: "POST",
    }),

  banUser: (userId: string, reason: string) =>
    request("/admin/ban/" + userId, {
      method: "POST",
      body: JSON.stringify({ reason }),
    }),

  adminResolve: (contractId: string, outcome: "COMPLETED" | "FAILED") =>
    request("/admin/resolve/" + contractId, {
      method: "POST",
      body: JSON.stringify({ outcome }),
    }),

  getAdminStats: () =>
    request<{
      totalUsers: number;
      activeContracts: number;
      pendingProofs: number;
      avgIntegrity: number;
    }>("/admin/stats"),

  escalateCrisis: (userId: string, trigger: string) =>
    request<{
      message: string;
      resources: Array<{ name: string; contact: string; instructions: string }>;
      actionTaken: string;
      escalated: boolean;
    }>("/crisis/escalate", {
      method: "POST",
      body: JSON.stringify({ userId, trigger }),
    }),

  getCrisisEvents: (limit?: number) =>
    request<{
      events: Array<{
        id: string;
        user_id: string;
        severity: string;
        trigger: string;
        matched_keywords: string;
        escalated: boolean;
        created_at: string;
      }>;
    }>(`/admin/crisis/events${limit ? `?limit=${limit}` : ""}`),

  getJurisdictions: () =>
    request<{
      jurisdictions: Array<{
        code: string;
        name: string;
        tier: string;
        disposition_mode: string;
        updated_at: string;
      }>;
    }>("/admin/jurisdictions"),

  updateJurisdiction: (
    code: string,
    data: { tier?: string; dispositionMode?: string },
  ) =>
    request<{
      jurisdiction: {
        code: string;
        name: string;
        tier: string;
        disposition_mode: string;
        updated_at: string;
      };
    }>(`/admin/jurisdictions/${code}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  getKillSwitch: () =>
    request<{ refundOnlyMode: boolean }>("/admin/kill-switch"),

  setKillSwitch: (enabled: boolean) =>
    request<{ refundOnlyMode: boolean; message: string }>(
      "/admin/kill-switch",
      {
        method: "POST",
        body: JSON.stringify({ enabled }),
      },
    ),

  getDisputes: () =>
    request<
      Array<{
        id: string;
        contract_id: string;
        user_id: string;
        media_uri: string;
        status: string;
        submitted_at: string;
        email: string;
        oath_category: string;
      }>
    >("/admin/disputes"),

  // User profile / history
  getIntegrityHistory: () =>
    request<
      Array<{
        event_type: string;
        payload: Record<string, unknown>;
        created_at: string;
      }>
    >("/users/me/history"),

  // Settings
  changePassword: (
    currentPassword: string,
    newPassword: string, // allow-secret
  ) =>
    request<{ status: string }>("/users/me/password", {
      method: "PATCH",
      body: JSON.stringify({ currentPassword, newPassword }),
    }),

  updateSettings: (settings: {
    emailNotifications?: boolean;
    pushNotifications?: boolean;
  }) =>
    request<{ status: string }>("/users/me/settings", {
      method: "PATCH",
      body: JSON.stringify(settings),
    }),

  deleteAccount: () =>
    request<{ status: string }>("/users/me", {
      method: "DELETE",
    }),

  // Responsible use (TKT-P1-009): both endpoints existed server-side with
  // enforcement in contract creation; this is their first client surface.
  setSelfExclusion: (durationDays: number) =>
    request<{ status: string; expiresAt: string }>("/users/me/self-exclusion", {
      method: "POST",
      body: JSON.stringify({ durationDays }),
    }),

  setPregnancyExclusion: (active: boolean) =>
    request<{ status: string }>("/users/me/pregnancy-exclusion", {
      method: "POST",
      body: JSON.stringify({ active }),
    }),

  // AI
  grillMe: (slideContent: string) =>
    request<{ questions: string[] }>("/ai/grill-me", {
      method: "POST",
      body: JSON.stringify({ slideContent }),
    }),

  eli5: (text: string) =>
    request<{ explanation: string }>("/ai/eli5", {
      method: "POST",
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
    }>("/fury/stats"),

  requestFuryStreamTicket: () =>
    request<{ ticket: string; expiresInSeconds: number }>(
      "/fury/stream-ticket",
      {
        method: "POST",
      },
    ),

  issueFuryStreamCookie: () =>
    request<{ expiresInSeconds: number }>("/fury/stream-cookie", {
      method: "POST",
      credentials: "include",
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
      method: "POST",
    }),

  // Accountability partners (TKT-P1-017). The endpoints were guarded and
  // tested server-side with no web caller at all; these are their first
  // browser surface. Routes mirror the mobile ApiClient where both exist.
  getPartnerInvitations: () =>
    request<PartnerInvitation[]>("/contracts/invitations"),

  getPartnerships: () => request<Partnership[]>("/contracts/partnerships"),

  // Accepting goes through /partner/accept rather than
  // /accountability/respond: it also claims an email-only invitation by
  // stamping partner_user_id, which the respond path requires to already
  // be set. Declining has no equivalent, so it uses respond.
  acceptPartnerInvitation: (contractId: string) =>
    request<{ status: string }>(`/contracts/${contractId}/partner/accept`, {
      method: "POST",
    }),

  respondToPartnerInvite: (contractId: string, accept: boolean) =>
    request<{ success: boolean; status: string }>(
      `/contracts/${contractId}/accountability/respond`,
      {
        method: "POST",
        body: JSON.stringify({ accept }),
      },
    ),

  cosignAttestation: (contractId: string) =>
    request<{ status: string }>(`/contracts/${contractId}/attestation/cosign`, {
      method: "POST",
    }),

  vetoRecoveryBreak: (contractId: string) =>
    request<{ success: boolean; message: string }>(
      `/contracts/${contractId}/recovery/veto-break`,
      {
        method: "POST",
      },
    ),

  invitePartner: (contractId: string, email: string) =>
    request<{ success: boolean; partnerId: string }>(
      `/contracts/${contractId}/accountability/invite`,
      {
        method: "POST",
        body: JSON.stringify({ email }),
      },
    ),

  getAccountabilityStatus: (contractId: string) =>
    request<AccountabilityStatus>(
      `/contracts/${contractId}/accountability/status`,
    ),

  // Behavioral-retention check-ins. Both endpoints authorize either
  // participant, so the partner and the owner reach the same thread.
  getPartnerCheckIns: (contractId: string, limit?: number) =>
    request<PartnerCheckIn[]>(
      `/behavioral/retention/partners/check-ins/${contractId}${limit ? `?limit=${limit}` : ""}`,
    ),

  completePartnerCheckIn: (checkInId: string, message: string) =>
    request<PartnerCheckIn>("/behavioral/retention/partners/check-in", {
      method: "POST",
      body: JSON.stringify({ checkInId, message }),
    }),

  // Referrals
  getReferralCode: () =>
    request<ReferralCodeResponse>("/referrals/code"),

  getReferralStats: () =>
    request<{
      totalReferrals: number;
      rewardedReferrals: number;
      pendingReferrals: number;
      totalRewardCents: number;
      rewards: ReferralReward[];
    }>("/referrals/rewards"),

  issueLeaderboardStreamCookie: () =>
    request<{ expiresInSeconds: number }>(
      "/dashboard/leaderboard/stream-cookie",
      {
        method: "POST",
        credentials: "include",
      },
    ),

  // Goal gradient
  getDashboardProgress: () =>
    request<DashboardProgress>("/dashboard/progress"),

  // Streak Chain
  getStreakChain: () =>
    request<{
      days: Array<{ date: string; attested: boolean; graceUsed: boolean; chainBroken: boolean }>;
      currentStreak: number;
      longestStreak: number;
      neverMissTwiceActive: boolean;
      penaltyMultiplier: number;
    }>("/dashboard/streak"),

  // Public feed (no auth)
  getPublicFeed: (limit?: number) =>
    request<{
      events: Array<{
        id: string;
        type: string;
        message: string;
        timestamp: string;
      }>;
    }>(`/feed${limit ? `?limit=${limit}` : ""}`),
};
