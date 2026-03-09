---
generated: true
department: ENG
artifact_id: E5
governing_sop: "SOP--performance-testing.md"
phase: hardening
product: styx
date: "2026-03-08"
---

# Load Test Report

This document defines the load testing strategy for Styx, including scenarios, target metrics, infrastructure constraints, and tooling. Load test results will be appended as dated sections as tests are executed.

## 1. Objectives

Styx handles real money in FBO escrow. Performance degradation is not merely a UX issue -- it is a financial integrity risk. A slow ledger write under load could produce phantom money (see Gate 01). The goals of load testing are:

1. Establish baseline latency and throughput under normal conditions
2. Identify the breaking point of each critical subsystem
3. Validate that ledger integrity holds under concurrent writes
4. Size infrastructure (PostgreSQL connections, Redis memory, Render instances) for beta launch
5. Produce evidence for the beta-readiness contract (see `docs/planning/planning--beta-readiness-contract.md`)

## 2. Test Scenarios

### 2.1 Contract Creation Under Load

**Description:** Simulates concurrent users creating behavioral contracts with funded stakes. Each contract creation triggers: Zod validation, PostgreSQL write (contracts + ledger entries), Stripe PaymentIntent creation, BullMQ job enqueue (Fury assignment scheduling).

**Flow:**
1. Authenticate (JWT)
2. POST `/api/contracts` with valid oath payload
3. Confirm 201 response with contract ID
4. Verify ledger entry created (GET `/api/ledger/:contractId`)

**Assertions:**
- No 5xx errors under any load profile
- Ledger balance invariant holds (debits = credits) at all times
- No duplicate contract IDs
- Stripe PaymentIntent created for every contract

### 2.2 Fury Audit Queue Throughput

**Description:** Measures BullMQ job processing rate for Fury audit assignments. When a contract's verification window opens, a job is enqueued to assign auditors. The worker must: query eligible auditors, check conflict-of-interest rules, assign 5 auditors, notify via SSE.

**Flow:**
1. Pre-seed N contracts with open verification windows
2. Trigger batch assignment (POST `/api/fury/assign-batch`)
3. Measure time to drain the queue
4. Verify all assignments satisfy quorum and conflict rules

**Assertions:**
- Queue drain time scales linearly (not exponentially) with contract count
- No auditor assigned to their own contract
- Round-robin fairness within 10% deviation
- SSE notifications delivered within 5s of assignment

### 2.3 Ledger Transaction Integrity Under Concurrent Writes

**Description:** The most critical scenario. Multiple concurrent contract settlements writing to the double-entry ledger simultaneously. Must verify that no phantom money is created and all balances reconcile.

**Flow:**
1. Pre-seed 100 active contracts with funded vaults
2. Trigger 100 simultaneous settlement requests
3. Query ledger totals after all settle
4. Compare against expected balances

**Assertions:**
- Total debits = total credits (zero tolerance)
- No lost writes (every settlement produces exactly 2 ledger entries)
- No deadlocks (PostgreSQL advisory locks hold under contention)
- Settlement latency < 2s at p99

### 2.4 Stripe Webhook Processing

**Description:** Simulates burst webhook delivery from Stripe (payment confirmations, disputes, refunds). Styx must process each webhook idempotently and update the ledger accordingly.

**Flow:**
1. Send N signed webhook events to POST `/api/webhooks/stripe`
2. Verify each event processed exactly once (idempotency key check)
3. Verify ledger entries created for payment events
4. Verify dispute handling triggers contract freeze

**Assertions:**
- No duplicate processing (idempotency)
- Webhook processing time < 500ms per event at p95
- Queue backpressure does not cause Stripe retry storms
- Failed webhook processing triggers dead-letter queue, not silent drop

### 2.5 SSE Notification Delivery

**Description:** Measures Server-Sent Events delivery under concurrent connections. Users receive real-time notifications for: contract status changes, Fury audit assignments, proof submission confirmations, escrow movements.

**Flow:**
1. Establish N SSE connections (GET `/api/events/stream`)
2. Trigger M contract events
3. Measure delivery latency per connection
4. Verify no dropped events

**Assertions:**
- Connection establishment < 200ms at p95
- Event delivery latency < 1s at p95
- No dropped events under normal load
- Graceful degradation (queue + retry) under overload

## 3. Target Metrics

| Metric | Normal | Peak | Stress | Spike |
|--------|--------|------|--------|-------|
| **Concurrent users** | 100 | 1,000 | 5,000 | Burst to 2,000 in 10s |
| **API p50 latency** | < 50ms | < 100ms | < 300ms | < 500ms |
| **API p95 latency** | < 150ms | < 300ms | < 1s | < 2s |
| **API p99 latency** | < 300ms | < 1s | < 3s | < 5s |
| **Contracts created/sec** | 10 | 50 | 100 | 200 (burst) |
| **Fury audits assigned/sec** | 5 | 25 | 50 | 100 (burst) |
| **Ledger writes/sec** | 20 | 100 | 200 | 400 (burst) |
| **Error rate** | < 0.1% | < 0.5% | < 2% | < 5% |
| **SSE delivery latency** | < 200ms | < 500ms | < 2s | < 5s |

## 4. Infrastructure Constraints

### 4.1 Render (Oregon)

Styx runs on Render's managed platform. Key constraints for the beta launch tier:

| Resource | Limit | Impact |
|----------|-------|--------|
| API instance | Starter (512MB RAM, 0.5 CPU) | ~200 concurrent connections max |
| Auto-scaling | Not available on Starter | Manual scaling only; consider Professional ($25/mo) for peak |
| Cold start | ~5s after idle | Health check keepalive recommended |
| Outbound bandwidth | 100GB/mo included | Sufficient for beta; monitor SSE traffic |

### 4.2 PostgreSQL 15

| Resource | Limit | Impact |
|----------|-------|--------|
| Connection pool | Default 20 (Render managed) | Bottleneck under load; use PgBouncer or increase to 50 |
| Max connections | 97 (Render Starter) | Hard ceiling; connection pooling mandatory |
| Storage | 1GB (Starter) | Sufficient for beta; ledger growth ~1KB/transaction |
| IOPS | Shared | Ledger writes may contend with reads under stress |

**Recommendation:** Set `connection_limit: 40` in Prisma, use `pgbouncer=true` in connection string. Monitor `pg_stat_activity` for connection exhaustion.

### 4.3 Redis 7 + BullMQ

| Resource | Limit | Impact |
|----------|-------|--------|
| Memory | 25MB (Render Starter) | ~25,000 queued jobs before eviction risk |
| Connections | 20 (Render Starter) | BullMQ uses 2 per worker + 1 per queue; budget carefully |
| Persistence | AOF (appendonly) | Safe for job durability; no data loss on restart |

**Recommendation:** Monitor `used_memory` and `connected_clients`. Set `maxmemory-policy: noeviction` to prevent silent job loss. Alert at 80% memory.

## 5. Load Profiles

### 5.1 Normal (Baseline)

- 100 concurrent users
- Ramp: 10 users/second over 10 seconds
- Duration: 10 minutes sustained
- Purpose: Establish baseline metrics and verify infrastructure handles expected beta load

### 5.2 Peak (Expected Maximum)

- 1,000 concurrent users
- Ramp: 50 users/second over 20 seconds
- Duration: 5 minutes sustained
- Purpose: Validate scaling strategy and identify first bottleneck

### 5.3 Stress (Beyond Capacity)

- 5,000 concurrent users
- Ramp: 100 users/second over 50 seconds
- Duration: 3 minutes sustained
- Purpose: Find breaking point, verify graceful degradation (no data corruption, proper error responses)

### 5.4 Spike (Burst)

- Start at 100 users, spike to 2,000 in 10 seconds, sustain 2 minutes, drop back to 100
- Purpose: Simulate viral moment or coordinated contract creation (e.g., New Year's resolution wave)

## 6. Tooling

**Recommended: k6 (Grafana)**

k6 is the recommended load testing tool for Styx because:
- JavaScript/TypeScript test scripts (matches team expertise)
- Built-in support for HTTP, WebSocket, and SSE protocols
- Threshold-based pass/fail (integrable with CI)
- Cloud execution option for stress profiles beyond local capacity
- JSON output for dashboard integration

**Alternative: Artillery**

Artillery is acceptable for teams preferring YAML-based scenario definitions. It has native support for SSE and webhook simulation.

**Test scripts location:** `load-tests/` at monorepo root.

**Structure:**
```
load-tests/
  scenarios/
    contract-creation.ts
    fury-assignment.ts
    ledger-concurrent.ts
    stripe-webhooks.ts
    sse-delivery.ts
  config/
    normal.json
    peak.json
    stress.json
    spike.json
  results/
    YYYY-MM-DD/
      summary.json
      report.html
```

## 7. Execution Cadence

| Trigger | Profile | Automated |
|---------|---------|-----------|
| Weekly (Thursday) | Normal | Yes (scheduled CI) |
| Pre-release | Peak | Yes (beta-promotion.yml gate) |
| Monthly | Stress | Manual (requires scaled infrastructure) |
| Ad-hoc | Spike | Manual |
| After infra change | Normal + Peak | Yes (triggered by infra PR merge) |

## 8. Results

_No load tests have been executed yet. Results will be appended below as dated sections._

### Template

```markdown
#### YYYY-MM-DD -- [Profile Name]

**Environment:** [Render plan, PG config, Redis config]
**Tool:** [k6 version]
**Duration:** [X minutes]

| Metric | Target | Actual | Status |
|--------|--------|--------|--------|
| p50 latency | ... | ... | PASS/FAIL |
| p95 latency | ... | ... | PASS/FAIL |
| p99 latency | ... | ... | PASS/FAIL |
| Error rate | ... | ... | PASS/FAIL |
| Throughput | ... | ... | PASS/FAIL |
| Ledger integrity | 0 discrepancy | ... | PASS/FAIL |

**Findings:** ...
**Action items:** ...
```
