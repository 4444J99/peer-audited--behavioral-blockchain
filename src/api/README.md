# Styx API Core (The Brain) - Ironclad Directive

## 1. Module Definition
This is the **Central Nervous System** of Styx. It handles all logic, financial movement, and verification consensus. It is a NestJS application.

## 2. Core Mandates
1.  **Double-Entry Only**: No money moves without a debit and a credit. See `src/api/services/ledger/`.
2.  **Idempotency**: All `POST` requests (especially financial) must be idempotent.
3.  **Read-Only Oracles**: We never write to HealthKit/Plaid. We only read and verify.
4.  **Fury Anonymity**: The API must **never** expose the identity of a Fury to a User (or vice-versa).

## 3. Architecture & Dependency Graph
- **Framework**: NestJS (IoC Container).
- **Persistence**: PostgreSQL (via TypeORM or Prisma).
- **Async Processing**: BullMQ (Redis) for the Fury Router.
- **External APIs**: Stripe Connect (Payment), Plaid (Balance), Cloudflare R2 (Media).

## 4. API Service Map
- `services/ledger/`: The immutable financial core.
- `services/escrow/`: The FBO interface (Stripe Connect).
- `services/fury-router/`: The consensus engine (Assigns 3 Furies, aggregates verdicts).
- `services/health/`: The Oracle ingestion point (filters Manual Data).
- `services/anomaly/`: The AI Fraud Detection layer.
- `services/geofencing/`: IP-based jurisdiction blocking.

## 5. API Contracts (Gold Standard)
### `POST /v1/contracts/stake`
- **Input**: `{ "habitId": "gym_streak", "amount": 5000, "currency": "USD" }` (Amount in cents)
- **Output**: `{ "contractId": "ct_123", "status": "escrow_locked", "fbo_tx_id": "tx_999" }`
- **Error**: `402 Payment Required` (Insufficient funds), `403 Forbidden` (BMI too low).

### `POST /v1/fury/audit/:taskId`
- **Input**: `{ "verdict": "pass" | "fail", "confidence": 0.95, "tags": ["blurry", "wrong_date"] }`
- **Output**: `{ "status": "recorded", "consensus_pending": true }`

## 6. Error Handling Strategy
- Use **Global Exception Filters**.
- All errors must return standardized JSON: `{ "error_code": "ERR_INSUFFICIENT_FUNDS", "message": "...", "trace_id": "..." }`.
- **Critical Failures** (e.g., Ledger mismatch) must trigger a PagerDuty/Slack alert immediately.

## 7. Testing Protocols
- **Unit**: Jest for all Services. `npm run test:unit`.
- **Integration**: Supertest against a Dockerized Postgres. `npm run test:int`.
- **Load**: `k6` script to hammer the `POST /audit` endpoint.
