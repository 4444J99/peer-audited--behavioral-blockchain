# Styx API Customer Guide

Styx exposes a JSON API for creating behavioral contracts, submitting proof media,
routing proof to peer audit, reviewing settlement state, and exporting enterprise
metrics. This guide is written for customer engineering teams integrating with a
hosted Styx environment or operating a private deployment.

Interactive OpenAPI documentation is also available in non-production API
environments at `/api/docs`.

## Base URL

Use the API base URL from your onboarding materials or from
`STYX_API_PUBLIC_URL` in a private deployment:

```text
https://api.example.styx.invalid
```

Routes are mounted at the API root. For example:

```text
GET https://api.example.styx.invalid/health/ready
POST https://api.example.styx.invalid/auth/login
POST https://api.example.styx.invalid/contracts
```

All request and response bodies are JSON unless an endpoint explicitly returns a
server-sent event stream or a pre-signed media upload URL. JSON request bodies are
limited to 1 MB. Proof media is uploaded directly to object storage through
pre-signed URLs.

## Authentication

Most customer endpoints accept either:

- `Authorization: Bearer <access_token>` for server-side and mobile clients.
- First-party browser session cookies issued by `/auth/register`, `/auth/login`,
  or `/auth/enterprise`.

Bearer-token requests do not need CSRF headers. Cookie-authenticated mutating
requests (`POST`, `PUT`, `PATCH`, `DELETE`) must include:

```http
x-csrf-token: <value from styx_csrf_token cookie or /auth/csrf>
```

### Login Flow

`POST /auth/register` and `POST /auth/login` return an access token and also set
browser cookies when called from a browser:

- `styx_auth_token`: HttpOnly access-token cookie, 15 minute max age.
- `styx_refresh_token`: HttpOnly refresh-token cookie scoped to `/auth/refresh`,
  7 day max age.
- `styx_csrf_token`: readable CSRF cookie bound to the active access token.

Use `/auth/refresh` to rotate an expired browser access token when the refresh
cookie is still valid. Use `/auth/logout` to clear browser cookies and revoke
refresh tokens for the session user.

### Register

```bash
curl -sS -X POST "$STYX_API_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "customer.user@example.com",
    "password": "Use-a-real-password-123!",
    "ageConfirmation": true,
    "termsAccepted": true,
    "dateOfBirth": "1990-01-15"
  }'
```

Example response:

```json
{
  "userId": "usr_123",
  "token": "jwt.access.token"
}
```

### Login With Bearer Token

```bash
TOKEN=$(
  curl -sS -X POST "$STYX_API_URL/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"email":"customer.user@example.com","password":"Use-a-real-password-123!"}' \
    | jq -r .token
)

curl -sS "$STYX_API_URL/users/me" \
  -H "Authorization: Bearer $TOKEN"
```

### Browser CSRF Example

```ts
async function apiFetch(path: string, init: RequestInit = {}) {
  const method = String(init.method || "GET").toUpperCase();
  const needsCsrf = ["POST", "PUT", "PATCH", "DELETE"].includes(method);
  const csrf = document.cookie
    .split("; ")
    .find((part) => part.startsWith("styx_csrf_token="))
    ?.split("=")[1];

  return fetch(`${process.env.NEXT_PUBLIC_API_URL}${path}`, {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(needsCsrf && csrf ? { "x-csrf-token": decodeURIComponent(csrf) } : {}),
      ...init.headers,
    },
  });
}
```

## Roles And Access

The API uses role-aware JWTs:

| Role | Typical access |
|------|----------------|
| `USER` | Standard contract, wallet, proof, notification, and profile endpoints. |
| `FURY` | Peer-auditor queue, verdicts, and audit stream endpoints. |
| `ADMIN` | Enterprise-admin B2B endpoints when the user belongs to that enterprise, plus platform operator endpoints. |

Several monetized actions are also guarded by jurisdiction, account status, age,
and identity/KYC policy. For hosted deployments, your onboarding environment will
define which jurisdictions are blocked, refund-only, or full-access.

## Request IDs And Errors

You may send a request ID for support correlation:

```http
x-styx-request-id: req_customer_20260620_001
```

Every response echoes `x-request-id` and `x-styx-request-id`.

Most application errors use this envelope:

```json
{
  "error_code": "BAD_REQUEST",
  "message": "Validation failed",
  "trace_id": "req_customer_20260620_001",
  "details": {
    "issues": ["stakeAmount must not be less than 0.01"]
  }
}
```

Common status codes:

| Status | Meaning |
|--------|---------|
| `400` | Invalid input, invalid state transition, or failed proof integrity screening. |
| `401` | Missing, invalid, or expired authentication. |
| `403` | CSRF failure, role failure, account-status restriction, compliance block, or enterprise-scope mismatch. |
| `404` | Resource not found or not visible to the authenticated user. |
| `409` | Conflict such as duplicate proof media or duplicate survey submission. |
| `429` | Rate limit exceeded. |
| `503` | Dependency or provider unavailable. |

## End-To-End Contract Workflow

### 1. Check Environment And Eligibility

```bash
curl -sS "$STYX_API_URL/health/ready"
curl -sS "$STYX_API_URL/meta/release"
curl -sS "$STYX_API_URL/compliance/eligibility"
```

`/compliance/eligibility` uses request context such as geo headers or IP-derived
state. Hosted web traffic commonly receives these headers from the edge provider.

### 2. Create A Contract

`stakeAmount` is provided in USD. The server stores money with cent precision and
may return cents on settlement and peer-auditor endpoints.

```bash
curl -sS -X POST "$STYX_API_URL/contracts" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "oathCategory": "Biological",
    "verificationMethod": "photo",
    "stakeAmount": 30,
    "durationDays": 30,
    "healthMetrics": {
      "currentWeightLbs": 180,
      "heightInches": 70,
      "targetWeightLbs": 170
    },
    "pricing": {
      "plan": "MVP_39"
    }
  }'
```

Example response:

```json
{
  "contractId": "con_123",
  "paymentIntentId": "pi_123"
}
```

Notes:

- Contract creation requires an authenticated active user.
- Jurisdiction policy may block creation or place the user in refund-only mode.
- Identity verification can be required for commitments above the configured
  micro-commitment threshold.
- Recovery contracts can include `recoveryMetadata` with an accountability
  partner email and safety acknowledgments.
- Cohort programs can include `cohort` metadata with `cohortId`, mode, optional
  pod ID, and display alias.

### 3. Upload Proof Media

The preferred flow is pre-signed upload through `/proofs`.

Request an upload URL:

```bash
curl -sS -X POST "$STYX_API_URL/proofs/upload-url" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "contractId": "con_123",
    "contentType": "image/jpeg",
    "description": "Day 7 compliance proof"
  }'
```

Example response:

```json
{
  "proofId": "prf_123",
  "uploadUrl": "https://object-storage.example/upload/...",
  "storageKey": "proofs/prf_123/1709123456789.jpg",
  "expiresInSeconds": 300
}
```

Upload the file directly to the returned URL:

```bash
curl -sS -X PUT "$UPLOAD_URL" \
  -H "Content-Type: image/jpeg" \
  --data-binary "@proof.jpg"
```

Confirm the upload:

```bash
curl -sS -X POST "$STYX_API_URL/proofs/prf_123/confirm-upload" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "storageKey": "proofs/prf_123/1709123456789.jpg",
    "deviceMetadata": {
      "platform": "ios",
      "captureMode": "camera",
      "appVersion": "1.0.0"
    }
  }'
```

Successful confirmation routes the proof to peer audit:

```json
{
  "proofId": "prf_123",
  "status": "PENDING_REVIEW",
  "furyRouteJobId": "job_123",
  "flags": []
}
```

If media fails integrity or duplicate screening, the API returns `400` or `409`.
Some failures place the proof in `MANUAL_REVIEW` for human triage.

A legacy direct-media endpoint also exists:

```http
POST /contracts/:id/proof
```

Use it only when your integration already has an approved `mediaUri`.

### 4. Track Contract And Proof State

```bash
curl -sS "$STYX_API_URL/contracts" \
  -H "Authorization: Bearer $TOKEN"

curl -sS "$STYX_API_URL/contracts/con_123" \
  -H "Authorization: Bearer $TOKEN"

curl -sS "$STYX_API_URL/contracts/con_123/proofs" \
  -H "Authorization: Bearer $TOKEN"

curl -sS "$STYX_API_URL/proofs/prf_123/processing-status" \
  -H "Authorization: Bearer $TOKEN"
```

### 5. Preview Settlement And Reconcile

After a contract is resolved, customers with access can inspect settlement
breakdown and ledger state:

```bash
curl -sS "$STYX_API_URL/payments/settlement/con_123/preview" \
  -H "Authorization: Bearer $TOKEN"

curl -sS "$STYX_API_URL/payments/settlement/con_123/status" \
  -H "Authorization: Bearer $TOKEN"

curl -sS "$STYX_API_URL/payments/reconcile/con_123" \
  -H "Authorization: Bearer $TOKEN"
```

Settlement previews return cent-denominated fields:

```json
{
  "contractId": "con_123",
  "stakeAmountCents": 3000,
  "platformFeeCents": 900,
  "bountyPoolCents": 2100,
  "userRefundCents": 0,
  "dispositionMode": "REFUND",
  "actualAction": "REFUND",
  "status": "FAILED"
}
```

## Real-Time Streams

Server-sent event (SSE) endpoints do not rely on long-lived query credentials.
Use short-lived, single-use tickets.

Preferred browser flow:

```bash
curl -sS -X POST "$STYX_API_URL/notifications/stream-cookie" \
  -H "Authorization: Bearer $TOKEN" \
  -c cookies.txt
```

Then subscribe with credentials:

```ts
const events = new EventSource(`${apiBaseUrl}/notifications/stream`, {
  withCredentials: true,
});

events.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log(data);
};
```

Fallback ticket flow:

```bash
TICKET=$(
  curl -sS -X POST "$STYX_API_URL/notifications/stream-ticket" \
    -H "Authorization: Bearer $TOKEN" \
    | jq -r .ticket
)

curl -N "$STYX_API_URL/notifications/stream?ticket=$TICKET"
```

The same pattern is available for peer-auditor assignments:

```http
POST /fury/stream-cookie
POST /fury/stream-ticket
GET  /fury/stream
```

Tickets expire in about 60 seconds, are scoped to one stream, and are consumed
only after scope and expiry validation pass.

## Enterprise Reporting

B2B endpoints require an authenticated `ADMIN` user whose `enterprise_id` matches
the requested enterprise. The path `enterpriseId` is never trusted by itself.

### Metrics

```bash
curl -sS "$STYX_API_URL/b2b/metrics/ent_123" \
  -H "Authorization: Bearer $TOKEN"
```

Example response:

```json
{
  "enterpriseId": "ent_123",
  "totalContracts": 128,
  "completedContracts": 91,
  "failedContracts": 14,
  "activeContracts": 23,
  "completionRate": 71,
  "avgIntegrityScore": 74,
  "totalEmployees": 42
}
```

### Billing

```http
GET /b2b/billing/:enterpriseId
```

Current response shape:

```json
{
  "enterpriseId": "ent_123",
  "plan": "CONSUMPTION",
  "events": [],
  "totalDue": 0,
  "currency": "USD"
}
```

### HR Export

```http
GET /b2b/export/hr/:enterpriseId
```

Per-employee rows are pseudonymized and suppressed when the cohort is smaller
than the configured k-anonymity threshold. Suppressed exports return aggregate
metrics and an empty `employees` array.

### Data Lake Snapshot

```bash
curl -sS "$STYX_API_URL/b2b/datalake/ent_123?start=2026-01-01&end=2026-04-01" \
  -H "Authorization: Bearer $TOKEN"
```

The response includes `contractMetrics`, `behavioralTrends`, and
`cohortAnalysis`. Small groups are suppressed to reduce re-identification risk.

### Register And Test Enterprise Webhooks

```bash
curl -sS -X POST "$STYX_API_URL/b2b/webhook/register" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "enterpriseId": "ent_123",
    "url": "https://customer.example.com/styx/webhook"
  }'

curl -sS -X POST "$STYX_API_URL/b2b/webhook/test" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "enterpriseId": "ent_123",
    "url": "https://customer.example.com/styx/webhook"
  }'
```

Webhook targets must use `http` or `https`, must not include credentials, and
must not resolve to loopback, private, link-local, localhost, or obfuscated IP
addresses. Delivery uses up to 3 attempts with exponential backoff.

Webhook deliveries include:

```http
Content-Type: application/json
X-Styx-Timestamp: 1781971200
X-Styx-Signature: <hex hmac sha256>
```

The signature is:

```text
hex_hmac_sha256(webhook_signing_secret, timestamp + "." + raw_body)
```

Node verification example:

```ts
import { createHmac, timingSafeEqual } from "crypto";

export function verifyStyxWebhook(input: {
  timestamp: string;
  rawBody: string;
  signature: string;
  secret: string;
}) {
  const now = Math.floor(Date.now() / 1000);
  const ts = Number(input.timestamp);
  if (!Number.isFinite(ts) || Math.abs(now - ts) > 5 * 60) return false;

  const expected = createHmac("sha256", input.secret)
    .update(`${input.timestamp}.${input.rawBody}`)
    .digest("hex");

  const expectedBuf = Buffer.from(expected);
  const actualBuf = Buffer.from(input.signature);
  return (
    expectedBuf.length === actualBuf.length &&
    timingSafeEqual(expectedBuf, actualBuf)
  );
}
```

## Endpoint Reference

Auth requirements use these labels:

- `Public`: no customer token required.
- `User`: authenticated active user unless a route notes a narrower condition.
- `FURY`: authenticated peer-auditor role.
- `Enterprise Admin`: `ADMIN` role plus matching enterprise membership.
- `Operator`: platform/admin-only or service-to-service.

### Health, Bootstrap, Public Metadata

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| `GET` | `/health/live` | Public | Liveness check. |
| `GET` | `/health/ready` | Public | Readiness plus database and Redis checks. Returns `503` when dependencies are degraded. |
| `GET` | `/health` | Public | Combined health response. |
| `GET` | `/mobile/bootstrap` | Public | Mobile environment, feature flags, labels, and release metadata. |
| `GET` | `/meta/release` | Public | API version, environment, build SHA, feature flags, timestamp. |
| `GET` | `/compliance/eligibility` | Public | Jurisdiction and compliance decision for the current request context. |

### Auth

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| `POST` | `/auth/register` | Public | Create a user, enforce age and terms acceptance, return access token, set browser cookies. Rate limit: 5/min. |
| `POST` | `/auth/login` | Public | Authenticate and return access token, set browser cookies. Rate limit: 5/min. |
| `POST` | `/auth/enterprise` | Public | Exchange a dedicated enterprise SSO assertion for a Styx session. Rate limit: 5/min. |
| `POST` | `/auth/refresh` | Browser cookie | Rotate access and refresh cookies. Rate limit: 5/min. |
| `POST` | `/auth/logout` | Browser cookie | Clear cookies and revoke refresh tokens when possible. Rate limit: 5/min. |
| `GET` | `/auth/csrf` | Browser cookie | Reissue the session-bound CSRF token. Rate limit: 5/min. |

### Users And Compliance

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| `GET` | `/users/me` | User | Current profile, integrity score, role, status, and compliance summary. |
| `GET` | `/users/me/compliance` | User | KYC and age-verification status. |
| `POST` | `/users/me/compliance/identity/start` | User | Start identity verification. Body: `mode`, `returnUrl`, `refreshUrl`. |
| `POST` | `/users/me/compliance/identity/mock-complete` | User, non-production only | Complete mock verification in local/dev/test. Disabled in production. |
| `GET` | `/users/me/history` | User | Contract and integrity history. |
| `PATCH` | `/users/me/password` | User | Change password. Body: `currentPassword`, `newPassword`. |
| `PATCH` | `/users/me/settings` | User | Update notification preferences. |
| `GET` | `/users/me/data-export` | User | GDPR-style user data export. Rate limit: 3/min. |
| `DELETE` | `/users/me` | User | Request account deletion. |
| `POST` | `/users/me/self-exclusion` | User | Activate self-exclusion for `durationDays`. |
| `POST` | `/users/me/pregnancy-exclusion` | User | Toggle pregnancy exclusion for penalty-bearing contracts. |
| `GET` | `/users/leaderboard` | Public | Public integrity leaderboard. Query: `limit`, `period`. Rate limit: 30/min. |
| `GET` | `/users/:id` | User | Authenticated lookup of another user's public profile. Rate limit: 30/min. |

### Contracts

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| `GET` | `/contracts` | User | List the authenticated user's contracts. |
| `POST` | `/contracts` | User | Create a behavioral contract and funding intent. |
| `GET` | `/contracts/:id` | User | Get one visible contract. |
| `GET` | `/contracts/:id/proofs` | User | List proof submissions for a contract. |
| `POST` | `/contracts/:id/proof` | User | Submit a legacy proof by `mediaUri`. Rate limit: 10/min. |
| `POST` | `/contracts/:id/grace-day` | User | Use a grace day. |
| `POST` | `/contracts/:id/dispute` | User | File a dispute against a verdict. |
| `POST` | `/contracts/:id/ticket` | User | Purchase a single-contract ticket. |
| `GET` | `/contracts/:id/attestation` | User | Get recovery attestation status. |
| `POST` | `/contracts/:id/attestation` | User | Submit daily attestation with optional emotional tracking. Rate limit: 5/min. |
| `POST` | `/contracts/:id/whoop/scored` | User | Submit Whoop `SCORED` or `UNSCORED` state. Rate limit: 20/min. |
| `GET` | `/contracts/invitations` | User | List pending accountability-partner invitations. |
| `POST` | `/contracts/:id/partner/accept` | User | Accept an accountability-partner invitation. |
| `POST` | `/contracts/:id/attestation/cosign` | User | Co-sign an attestation as an accountability partner. |
| `POST` | `/contracts/:id/double-down` | User | Increase an active contract commitment. Body: `amount`. |
| `POST` | `/contracts/:id/medical-exemption` | User | Request a compassionate medical exemption. |
| `POST` | `/contracts/bounty/:linkId` | Public link | Submit evidence through a whistleblower bounty link. Rate limit: 5/min. |
| `GET` | `/contracts/:id/recovery/lock-status` | User | Get recovery-break timelock state. |
| `POST` | `/contracts/:id/recovery/break-request` | User | Queue a 24 hour timelocked intentional break. |
| `POST` | `/contracts/:id/recovery/break-cancel` | User | Cancel a pending recovery break. |
| `GET` | `/contracts/:id/recovery/penalty-preview` | User | Preview recovery penalty amount. |
| `POST` | `/contracts/:id/accountability/invite` | User | Invite an accountability partner. |
| `POST` | `/contracts/:id/accountability/respond` | User | Accept or decline an accountability invitation. |
| `POST` | `/contracts/:id/recovery/veto-break` | User | Veto a pending recovery break as partner. |
| `GET` | `/contracts/:id/accountability/status` | User | Get accountability-partner status and history. |
| `POST` | `/contracts/:id/survey` | User | Submit `BASELINE` or `FINAL` survey responses. |
| `GET` | `/contracts/:id/survey` | User | Get survey responses for a contract. |
| `GET` | `/contracts/cohorts/:cohortId/snapshot` | User | Get cohort roster and pod snapshot. |
| `POST` | `/contracts/cohorts/:cohortId/waitlist` | User | Join or update waitlist entry. |
| `GET` | `/contracts/cohorts/:cohortId/waitlist/position` | User | Get current user's waitlist position. |
| `GET` | `/contracts/cohorts/:cohortId/waitlist` | User | Get a cohort waitlist. |

### Proof Media

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| `POST` | `/proofs/upload-url` | User | Create a pending proof and return pre-signed upload URL. Rate limit: 10/min. |
| `POST` | `/proofs/:id/confirm-upload` | User | Confirm media upload, run integrity checks, route to peer audit. |
| `GET` | `/proofs/:id` | User | Get proof details and signed view URL when visible. |
| `GET` | `/proofs/:id/processing-status` | User | Read video/redaction processing status. |
| `POST` | `/proofs/:id/processing-complete` | Operator | Internal service callback. Requires `x-internal-token` and `x-proof-challenge`. |

### Peer Audit

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| `GET` | `/fury/queue` | FURY or ADMIN | Get pending audit assignments. |
| `GET` | `/fury/stats` | FURY or ADMIN | Get audit counts, accuracy, bounties, penalties, and honeypot performance. Monetary values are cents. |
| `POST` | `/fury/verdict` | FURY | Submit `PASS` or `FAIL` for an assigned proof. |
| `GET` | `/fury/review/:assignmentId/mask-audit` | FURY or ADMIN | Get redaction provenance for an assignment. |
| `POST` | `/fury/stream-ticket` | FURY | Issue short-lived SSE ticket. |
| `POST` | `/fury/stream-cookie` | FURY | Issue short-lived HttpOnly SSE cookie. |
| `GET` | `/fury/stream` | FURY stream ticket or cookie | SSE stream for assignment updates. |
| `POST` | `/fury/enforcement/appeals/:caseId` | User | Appeal an enforcement penalty. |
| `POST` | `/fury/enforcement/evaluate` | Operator | Evaluate collusion incidents and apply enforcement. |

### Wallet And Ledger

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| `GET` | `/wallet/balance` | User | Balance, integrity score, allowed tiers, account status. Balance is USD. |
| `GET` | `/wallet/history` | User | Ledger transaction history. Query: `limit` from 1 to 100, default 50. Amounts are signed USD. |

### Payments And Settlement

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| `GET` | `/payments/disposition-policy/effective` | User | Effective payout disposition policy for the current jurisdiction. |
| `GET` | `/payments/settlement/:contractId/preview` | User | Settlement quote for a resolved contract. |
| `GET` | `/payments/settlement/:contractId/status` | User | Settlement runs and ledger entries for a contract. |
| `GET` | `/payments/reconcile/:contractId` | User | Verify ledger and real-money rail balance for a contract. |
| `GET` | `/payments/custody-report` | User | Custody review report. Query: `start`, `end`. Access should be limited by deployment policy. |
| `POST` | `/payments/settlement/:contractId/execute` | Operator | Manually dispatch settlement. |
| `POST` | `/payments/webhook` | Stripe | Stripe payment and dispute webhook receiver. Configure this in Stripe, do not call it from customer clients. |

### Enterprise

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| `GET` | `/b2b/metrics/:enterpriseId` | Enterprise Admin | Enterprise completion and integrity metrics. |
| `GET` | `/b2b/billing/:enterpriseId` | Enterprise Admin | Read-only billing summary. |
| `POST` | `/b2b/webhook/register` | Enterprise Admin | Register webhook URL. |
| `POST` | `/b2b/webhook/test` | Enterprise Admin | Send signed test webhook event. |
| `GET` | `/b2b/export/hr/:enterpriseId` | Enterprise Admin | Pseudonymized HR export with small-cohort suppression. |
| `GET` | `/b2b/datalake/:enterpriseId` | Enterprise Admin | Time-bounded analytics snapshot. Query: `start`, `end`. |

### Notifications And Public Feed

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| `GET` | `/notifications` | User | List current user's notifications. |
| `GET` | `/notifications/unread-count` | User | Unread count. |
| `POST` | `/notifications/:id/read` | User | Mark one notification read. |
| `POST` | `/notifications/stream-ticket` | User | Issue short-lived SSE ticket. |
| `POST` | `/notifications/stream-cookie` | User | Issue short-lived HttpOnly SSE cookie. |
| `GET` | `/notifications/stream` | User stream ticket or cookie | SSE stream for notifications. |
| `GET` | `/feed` | Public | Anonymized public event feed. Query: `limit`. |
| `GET` | `/feed/stream` | Public | SSE stream of anonymized public events. |

### Realms, Social, Behavioral, Oracles

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| `GET` | `/realms` | Public | List behavioral realms with aggregate stats. |
| `GET` | `/realms/:slug` | Public | Realm detail. |
| `GET` | `/realms/:slug/contracts` | User | Current user's contracts in a realm. |
| `GET` | `/social/profile/me` | User | Current user's pseudonymous social profile. |
| `GET` | `/social/profile/:userId` | Public | Pseudonymous social profile. |
| `GET` | `/social/leaderboard` | Public | Tavern Board integrity leaderboard. |
| `GET` | `/behavioral/commitment-devices/catalog` | Public | Available commitment devices. |
| `POST` | `/behavioral/commitment-devices/:deviceId/subscribe` | User | Subscribe to a commitment device. |
| `DELETE` | `/behavioral/commitment-devices/:deviceId/subscribe` | User | Cancel a commitment-device subscription. |
| `GET` | `/behavioral/crab-bucket/risk` | User | Analyze current user's self-sabotage risk. |
| `GET` | `/behavioral/habituation/:contractId` | User | Detect habituation signals for a contract. |
| `POST` | `/behavioral/swaps` | User | Propose a behavior swap. |
| `POST` | `/oracles/healthkit/samples` | User | Ingest trusted HealthKit or Health Connect samples for contract verification. |

### Support, AI, Crisis, And Operator Routes

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| `POST` | `/ai/grill-me` | User | Generate challenge questions from provided text. |
| `POST` | `/ai/eli5` | User | Simplify provided text. |
| `POST` | `/crisis/escalate` | User | Self-report crisis escalation and receive intervention resources. |
| `POST` | `/compliance/medical-exemption/request` | User | Request a medical exemption by contract ID. |
| `POST` | `/compliance/medical-exemption/approve` | Operator | Approve medical exemption. |
| `POST` | `/compliance/identity/webhooks/stripe` | Stripe | Stripe Identity webhook receiver. |
| `GET/POST/PATCH` | `/admin/*` | Operator | Platform operations: crisis events, jurisdictions, kill switch, disputes, users, reconciliation, anomaly scan, stats, honeypots, bans, and manual resolution. |

## Webhook And Provider Endpoints

These endpoints are public at the network layer because external providers call
them, but they require provider signatures or internal shared tokens:

| Path | Caller | Protection |
|------|--------|------------|
| `/payments/webhook` | Stripe Payments | `Stripe-Signature` verified with `STRIPE_WEBHOOK_SECRET`. Duplicate event IDs are ignored. |
| `/compliance/identity/webhooks/stripe` | Stripe Identity | `Stripe-Signature` verified by the identity provider service. |
| `/proofs/:id/processing-complete` | Internal media processor | `x-internal-token` plus per-proof `x-proof-challenge`. |

Do not call these endpoints from browser, mobile, or customer server clients.

## Operational Notes For Customer Integrations

- Default rate limit is 60 requests per minute per route bucket unless a stricter
  endpoint-specific limit is listed above.
- Send `x-styx-platform`, `x-styx-app-version`, and `x-styx-build` when available
  to improve support traceability.
- Store bearer tokens as secrets. Do not put access tokens or SSE tickets in logs.
- Prefer SSE cookies over query tickets for browsers. Use query tickets only when
  the client cannot attach credentials to EventSource.
- Treat webhook raw body bytes as immutable until after signature verification.
- Money response units vary by endpoint: wallet history and balance use USD;
  settlement, reconciliation, and peer-auditor earnings use cents.
- In production, mock identity verification endpoints are disabled.
- Swagger at `/api/docs` is intentionally non-production only.
