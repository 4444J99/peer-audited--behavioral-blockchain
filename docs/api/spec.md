# Styx API Specification

Base URL: `http://localhost:3000`

All authenticated endpoints require `Authorization: Bearer <JWT>` header unless marked as **Public**.

---

## Health

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/health` | Public | Service health check |

## Auth

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/auth/register` | Public | Create user account (email + password). Returns `{ userId, token }`. Rate-limited: 5/min. |
| POST | `/auth/login` | Public | Authenticate and issue JWT. Returns `{ userId, token }`. Rate-limited: 5/min. |

## Users

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/users/me` | JWT | Get authenticated user profile (email, integrity score, tier, contract stats) |
| GET | `/users/me/history` | JWT | Get user's contract and integrity history |
| PATCH | `/users/me/password` | JWT | Change password. Body: `{ currentPassword, newPassword }` |
| PATCH | `/users/me/settings` | JWT | Update notification preferences. Body: `{ emailNotifications?, pushNotifications? }` |
| DELETE | `/users/me` | JWT | Request account deletion |
| GET | `/users/leaderboard` | Public | Anonymized integrity leaderboard. Query: `?limit=10`. Rate-limited: 30/min. |
| GET | `/users/:id` | Public | Get public profile for a user |

## Contracts

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/contracts` | JWT | List authenticated user's contracts |
| POST | `/contracts` | JWT | Create behavioral contract. Body: `{ oathCategory, verificationMethod, stakeAmount, durationDays, healthMetrics? }`. Returns `{ contractId, paymentIntentId }` |
| GET | `/contracts/:id` | JWT | Get contract details (joined with user info) |
| GET | `/contracts/:id/proofs` | JWT | List all proofs submitted for a contract |
| POST | `/contracts/:id/proof` | JWT | Submit proof media. Body: `{ mediaUri }`. Rate-limited: 10/min. Returns `{ proofId, jobId }` |
| POST | `/contracts/:id/grace-day` | JWT | Use a grace day (max 2/month). Returns `{ newDeadline }` |
| POST | `/contracts/:id/dispute` | JWT | File appeal against verdict ($5 fee). Returns `{ appealStatus, paymentIntentId }` |
| POST | `/contracts/:id/ticket` | JWT | Purchase single-contract ticket via IAP ($4.99) |

## Fury (Peer Audit Network)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/fury/queue` | JWT | Get pending audit assignments for the authenticated Fury reviewer |
| POST | `/fury/verdict` | JWT | Submit verdict. Body: `{ assignmentId, verdict: 'PASS' \| 'FAIL' }`. Returns `{ status }` |

## Wallet

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/wallet/balance` | JWT | Get user balance, integrity score, and allowed tiers |
| GET | `/wallet/history` | JWT | Get ledger transaction history. Query: `?limit=50` (max 100) |

## Notifications

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/notifications` | JWT | Get user notifications |
| GET | `/notifications/unread-count` | JWT | Get unread notification count |
| GET | `/notifications/stream` | JWT | SSE stream for real-time notifications |
| POST | `/notifications/:id/read` | JWT | Mark a notification as read |

## Feed

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/feed` | Public | Anonymized public event feed. Query: `?limit=50` (max 100) |

## AI

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/ai/grill-me` | JWT | Generate VC-style questions for pitch content. Body: `{ slideContent }` |
| POST | `/ai/eli5` | JWT | Simplify a concept. Body: `{ text }` |

## Admin

All admin endpoints require `ADMIN` role.

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/admin/honeypot` | JWT + ADMIN | Inject known-fail proof for Fury QA |
| POST | `/admin/ban/:userId` | JWT + ADMIN | Permanently ban a user. Body: `{ reason }` |
| POST | `/admin/resolve/:contractId` | JWT + ADMIN | Manually resolve contract. Body: `{ outcome: 'COMPLETED' \| 'FAILED' }` |
| GET | `/admin/stats` | JWT + ADMIN | Platform statistics (active users, contracts, pending proofs, avg integrity) |

## B2B (Enterprise)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/b2b/metrics/:enterpriseId` | JWT | Get enterprise compliance metrics |
| GET | `/b2b/billing/:enterpriseId` | JWT | Get consumption-based billing summary |
| POST | `/b2b/webhook/register` | JWT | Register enterprise webhook URL. Body: `{ enterpriseId, url }` |
| POST | `/b2b/webhook/test` | JWT | Send test webhook event. Body: `{ url }` |

## Payments (Stripe Webhooks)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/payments/webhook` | Public (Stripe signature) | Stripe webhook receiver. Handles: `payment_intent.succeeded`, `payment_intent.payment_failed`, `charge.dispute.created` |
