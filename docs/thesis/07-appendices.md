# Chapter 7: Appendices

This chapter collects the supplementary reference materials that support the formal arguments and empirical claims made in Chapters 3 through 6. The appendices are organized as follows: Appendix A presents annotated listings of the four core algorithms, with explicit mappings to the formal definitions; Appendix B documents the PostgreSQL schema that enforces the structural invariants at the database layer; Appendix C provides a comprehensive API endpoint specification; Appendix D describes the eight validation gates that constitute the automated verification infrastructure; Appendix E summarizes the test coverage across all workspaces; Appendix F presents the complete oath category taxonomy; Appendix G provides textual transition tables for the three state machines depicted in the SVG figures; and Appendix H reproduces the Human Vice Control System inter-regulation matrix that motivates the behavioral physics framework.

---

## Appendix A: Core Algorithm Listings

This appendix presents the four algorithms most directly referenced by the formal proofs in Chapter 4. Each listing reproduces the production TypeScript source with inline annotations mapping code constructs to the corresponding formal definitions from Chapter 3 (Section 3.3). All algorithms reside in the `src/shared/libs/` or `src/api/services/` directories and are exercised by automated tests.

### A.1 Integrity Score Calculation

The following function computes the Integrity Score *IS*(*u*) as specified in Definition D3. The function resides in `src/shared/libs/integrity.ts` and is the single authoritative implementation of the scoring algorithm across all workspaces.

```typescript
export const BASE_INTEGRITY = 50;       // IS_0: base score
export const FRAUD_PENALTY = 15;         // beta_f: fraud strike penalty
export const STRIKE_PENALTY = 20;        // beta_s: failed oath penalty
export const COMPLETION_BONUS = 5;       // beta_c: completion bonus

export interface UserHistory {
  userId: string;
  completedOaths: number;    // c_u: completed oaths count
  fraudStrikes: number;      // f_u: fraud strikes
  failedOaths: number;       // s_u: failed oaths (strikes)
  monthsInactive: number;    // d_u: months inactive
}

/**
 * Calculates a user's Integrity Score (IS) based on behavioral physics.
 * Maps to Definition D3:
 *   IS(u) = max(0, IS_0 + beta_c * c_u - beta_f * f_u - beta_s * s_u - beta_d * d_u)
 */
export function calculateIntegrity(history: UserHistory): number {
  const base = BASE_INTEGRITY;
  const bonus = history.completedOaths * COMPLETION_BONUS;
  const fraudCost = history.fraudStrikes * FRAUD_PENALTY;
  const strikeCost = history.failedOaths * STRIKE_PENALTY;
  const decay = history.monthsInactive * 1;  // beta_d = 1 per month

  const score = base + bonus - fraudCost - strikeCost - decay;

  // Floor at 0 (max(0, ...) from D3); ceiling is unbounded
  return Math.max(0, score);
}
```

**Annotations.** The constant declarations at lines 1--4 establish the exact coefficient values used in Definition D3: *IS*_0 = 50, *beta*_c = 5, *beta*_f = 15, *beta*_s = 20. The implicit decay coefficient *beta*_d = 1 is applied at line 16. The `Math.max(0, score)` at line 18 enforces the non-negativity floor specified in D3, ensuring that *IS*(*u*) is in Z>=0 for all possible inputs. The asymmetry between the positive coefficient (+5 per completion) and the negative coefficients (-15 per fraud, -20 per strike) is the code-level realization of the defection-dominance property proved in Theorem T3: a single fraud strike requires three successful completions to offset, and a single failed oath requires four. The `UserHistory` interface at lines 6--11 provides the input vector **h** = (*c*_u, *f*_u, *s*_u, *d*_u) that the function maps to a scalar score.

The tier function *T*(*IS*) that maps scores to access levels is implemented by the companion function `getAllowedTiers()`, which applies the threshold sequence *tau*_1 = 20, *tau*_2 = 50, *tau*_3 = 100, *tau*_4 = 500 to partition the score space into five tiers from `RESTRICTED_MODE` through `TIER_4_WHALE_VAULTS`.

### A.2 Fury Accuracy Calculation

The following function computes the Fury Accuracy metric *FA*(*v*) as specified in Definition D4. It resides in the same file (`src/shared/libs/integrity.ts`) and is the sole implementation used by the Fury worker, consensus engine, and demotion scheduler.

```typescript
export const FALSE_ACCUSATION_WEIGHT = 3;  // omega: penalty multiplier

export interface FuryHistory {
  furyId: string;
  successfulAudits: number;    // a_v: successful audits
  falseAccusations: number;    // a_bar_v: false accusations
  totalAudits: number;         // n_v: total audits
}

/**
 * Maps to Definition D4:
 *   FA(v) = clamp_01( (a_v - omega * a_bar_v) / n_v )
 *   FA(v) = 1.0 when n_v = 0
 */
export function calculateAccuracy(history: FuryHistory): number {
  if (history.totalAudits === 0) return 1.0;  // Benefit of doubt for new Furies

  // Weighted calculation: false claims penalized 3x
  const netSuccess = history.successfulAudits
    - (history.falseAccusations * FALSE_ACCUSATION_WEIGHT);
  const ratio = netSuccess / history.totalAudits;

  // clamp_01: clamp to [0.0, 1.0]
  return Math.max(0.0, Math.min(1.0, ratio));
}

export function shouldDemoteFury(history: FuryHistory): boolean {
  if (history.totalAudits < 10) return false;   // n_bar = 10: burn-in period
  return calculateAccuracy(history) < 0.8;       // FA_bar = 0.8: demotion threshold
}
```

**Annotations.** The `FALSE_ACCUSATION_WEIGHT = 3` constant at line 1 is the penalty multiplier *omega* from Definition D4. The 3x asymmetric weighting ensures that a single false accusation erases the positive contribution of three successful audits, implementing the strategic incentive structure analyzed in Theorem T4. The `clamp_01` operation from the notation conventions is realized by the nested `Math.max(0.0, Math.min(1.0, ratio))` at line 15. The `shouldDemoteFury()` function implements the compound demotion predicate: demotion triggers only when both conditions hold --- the burn-in period (*n*_v >= *n_bar* = 10) has elapsed AND accuracy has fallen below the threshold (*FA*(*v*) < *FA_bar* = 0.8). The burn-in guard prevents premature demotion of newly enrolled auditors whose statistics are not yet representative.

### A.3 Hamming Distance

The Hamming distance function computes *d*_H(*x*, *y*) for two 64-bit perceptual hashes, as referenced in Definition D9 and Theorem T9. It resides in `src/api/services/anomaly/anomaly.service.ts`.

```typescript
/**
 * Compute Hamming distance between two hex-encoded 64-bit hashes.
 * Maps to Definition D9: d_H(x, y) = popcount(x XOR y)
 * Time complexity: O(64) = O(1) for fixed-width 64-bit hashes.
 */
hammingDistance(a: string, b: string): number {
  let distance = 0;
  const aBig = BigInt('0x' + a);
  const bBig = BigInt('0x' + b);
  let xor = aBig ^ bBig;
  while (xor > 0n) {
    distance += Number(xor & 1n);
    xor >>= 1n;
  }
  return distance;
}
```

**Annotations.** The algorithm implements the standard XOR-and-popcount approach to Hamming distance. Lines 3--4 parse the hex-encoded hash strings into BigInt values. Line 5 computes the bitwise XOR, producing a value whose set bits correspond to positions where the two hashes differ. The loop at lines 6--9 performs a population count (popcount) by iterating over each bit, extracting the least significant bit via `xor & 1n`, and right-shifting. For fixed-width 64-bit hashes, the loop executes at most 64 iterations, yielding O(1) time complexity. The function returns a value in [0, 64], which is compared against the threshold *theta*_H = 5 (constant `PHASH_HAMMING_THRESHOLD`) by the duplicate detection logic. A distance below the threshold triggers the duplicate predicate from D9: duplicate(*p*_1, *p*_2) iff *d*_H(*pH*(*p*_1), *pH*(*p*_2)) < *theta*_H.

### A.4 Hash Chain Append

The `appendEvent()` method constructs the cryptographic hash chain specified in Definition D2. It resides in `src/api/services/ledger/truth-log.service.ts` and is the sole write path to the `event_log` table.

```typescript
/**
 * Appends an event to the cryptographically linked tamper-evident log.
 * Maps to Definition D2:
 *   h_j = H(h_{j-1} || serialize(pi_j))  for j >= 1
 *   h_0 = "GENESIS_HASH"
 */
async appendEvent(
  eventType: string,
  payload: Record<string, any>,
): Promise<string> {
  const client: PoolClient = await this.pool.connect();

  try {
    await client.query('BEGIN');

    // 1. Fetch the latest hash with FOR UPDATE lock to prevent race conditions.
    //    If table is empty, use the genesis sentinel h_0 = "GENESIS_HASH".
    const latestLogQuery = `
      SELECT current_hash
      FROM event_log
      ORDER BY created_at DESC
      LIMIT 1
      FOR UPDATE;
    `;
    const latestRes = await client.query(latestLogQuery);
    const previousHash = latestRes.rows.length > 0
      ? latestRes.rows[0].current_hash
      : 'GENESIS_HASH';

    // 2. Compute h_j = SHA-256(h_{j-1} || serialize(pi_j))
    const payloadString = JSON.stringify(payload);
    const hashInput = `${previousHash}${payloadString}`;
    const currentHash = createHash('sha256')
      .update(hashInput)
      .digest('hex');

    // 3. Insert the new log entry
    const insertQuery = `
      INSERT INTO event_log (event_type, payload, previous_hash, current_hash)
      VALUES ($1, $2, $3, $4)
      RETURNING id;
    `;
    const insertRes = await client.query(insertQuery, [
      eventType, payload, previousHash, currentHash,
    ]);

    await client.query('COMMIT');
    return insertRes.rows[0].id;
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}
```

**Annotations.** The three-step structure of the function directly mirrors the recursive definition D2. Step 1 (lines 5--14) retrieves *h*_{j-1}, the hash of the most recent event, using a `FOR UPDATE` lock that prevents concurrent insertions from creating a fork in the chain --- this is the serialization mechanism referenced in the Theorem T2 proof's discussion of rewrite cost. The genesis sentinel `'GENESIS_HASH'` at line 14 establishes the base case *h*_0. Step 2 (lines 16--19) performs the hash computation *h*_j = *H*(*h*_{j-1} || serialize(*pi*_j)), using Node.js's `createHash('sha256')` as the instantiation of the SHA-256 hash function *H*. The concatenation operator || from the notation conventions is realized by template string interpolation. Step 3 (lines 21--27) performs the atomic INSERT within the same transaction, ensuring that the chain is extended atomically: either the new event is appended with a valid chain link, or the entire operation rolls back.

---

## Appendix B: Database Schema

This appendix presents the principal tables from the PostgreSQL schema (`src/api/database/schema.sql`) with annotations identifying which formal properties each constraint enforces. The schema implements a defense-in-depth strategy: even if application-layer validation fails, database-level constraints prevent invariant violations.

### B.1 Ledger Tables

**accounts.** The double-entry ledger requires a chart of accounts with typed categories.

```sql
CREATE TYPE account_type AS ENUM ('ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE');

CREATE TABLE accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,     -- Enforces account uniqueness (T1 precondition)
    type account_type NOT NULL,    -- Restricts to valid accounting categories
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

The `UNIQUE` constraint on `name` prevents duplicate account creation, which could introduce aliasing errors in balance computation. The `NOT NULL` constraint on `type` ensures every account is classified, supporting the accounting category invariant.

**entries.** Each ledger entry records a double-entry transaction between two accounts.

```sql
CREATE TABLE entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    debit_account_id UUID REFERENCES accounts(id) ON DELETE RESTRICT,   -- FK prevents orphan entries
    credit_account_id UUID REFERENCES accounts(id) ON DELETE RESTRICT,  -- FK prevents orphan entries
    amount DECIMAL(19, 4) NOT NULL CHECK (amount > 0),   -- T1: strictly positive amounts only
    contract_id UUID,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

The `CHECK (amount > 0)` constraint at the database level enforces the positive-amount precondition of Theorem T1, preventing zero-value or negative entries regardless of application-layer behavior. The `ON DELETE RESTRICT` foreign keys prevent account deletion while entries reference them, preserving referential integrity for balance recomputation. The `DECIMAL(19, 4)` type provides exact decimal arithmetic with four fractional digits, eliminating floating-point rounding errors in financial calculations.

### B.2 Event Log (Truth Log)

```sql
CREATE TABLE event_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type TEXT NOT NULL,
    payload JSONB NOT NULL,                -- pi_j: event payload (D2)
    previous_hash TEXT NOT NULL,           -- h_{j-1}: link to predecessor (D2)
    current_hash TEXT NOT NULL,            -- h_j: SHA-256 hash of this event (D2)
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Immutability trigger: prevents UPDATE and DELETE (T2 enforcement)
CREATE OR REPLACE FUNCTION prevent_event_log_mutation()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'event_log is immutable: UPDATE and DELETE are prohibited';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_event_log_immutable
  BEFORE UPDATE OR DELETE ON event_log
  FOR EACH ROW EXECUTE FUNCTION prevent_event_log_mutation();
```

The immutability trigger is the database-layer enforcement of Theorem T2's tamper-evidence property. While T2 proves that modifications are *detectable*, the trigger goes further by *preventing* modifications at the PostgreSQL level. An attacker who bypasses the application layer but operates through SQL would need superuser privileges to drop or disable the trigger before modifying entries. The `NOT NULL` constraints on `previous_hash` and `current_hash` ensure that every event participates in the chain, preventing gaps that could weaken tamper evidence. The `created_at` index supports efficient chronological traversal by `verifyChain()`.

### B.3 Domain Tables

**users.** The user table anchors identity, integrity scoring, and role-based access.

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,         -- Unique identity constraint
    password_hash TEXT,                 -- Bcrypt hash; NULL for SSO-only users
    stripe_customer_id TEXT,            -- Payment identity
    integrity_score INTEGER DEFAULT 50, -- IS_0 = 50 (D3 base score)
    account_id UUID REFERENCES accounts(id),  -- Link to ledger account
    role TEXT DEFAULT 'USER',           -- RBAC: USER, FURY, ADMIN
    enterprise_id UUID,                 -- B2B tenant isolation
    status TEXT DEFAULT 'ACTIVE',       -- Account status lifecycle
    created_at TIMESTAMPTZ DEFAULT NOW(),
    failed_login_attempts INTEGER DEFAULT 0,   -- Brute-force protection
    locked_until TIMESTAMPTZ                    -- Account lockout window
);
```

The `DEFAULT 50` on `integrity_score` initializes every new user at *IS*_0 = 50, the base value from Definition D3. The `UNIQUE` constraint on `email` prevents duplicate registrations that could create split-identity attacks on the integrity score system.

**contracts.** The behavioral contract table enforces structural invariants.

```sql
CREATE TABLE contracts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    oath_category TEXT NOT NULL,           -- From OathCategory enum (Appendix F)
    verification_method TEXT NOT NULL,     -- From VerificationMethod enum
    stake_amount DECIMAL(19,4) NOT NULL CHECK (stake_amount > 0),  -- T1/T5: positive stake
    payment_intent_id TEXT,
    duration_days INTEGER NOT NULL,        -- delta: contract duration
    status TEXT DEFAULT 'PENDING_STAKE',   -- FSM initial state (Appendix G)
    grace_days_used INTEGER DEFAULT 0,     -- Bounded by g_max = 2/month
    strikes INTEGER DEFAULT 0,            -- Counter for downscale threshold kappa_bar = 3
    started_at TIMESTAMPTZ,
    ends_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'           -- Recovery stream configuration
);
```

The `CHECK (stake_amount > 0)` constraint enforces the positive-stake precondition shared by Theorems T1 and T5. The `DEFAULT 'PENDING_STAKE'` establishes the initial state of the contract lifecycle FSM documented in Appendix G. The `grace_days_used` column with its application-layer bound of *g*_max = 2 per month (from `MAX_GRACE_DAYS_PER_MONTH`) prevents unbounded deadline extension. The `strikes` column tracks the failure count *kappa* against the downscale threshold *kappa_bar* = 3 from Definition D5.

**proofs, fury_assignments, and disputes.** These tables implement the proof submission, peer review, and dispute resolution workflows.

```sql
CREATE TABLE proofs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contract_id UUID REFERENCES contracts(id),
    user_id UUID REFERENCES users(id),
    media_uri TEXT,                      -- R2 object key (signed URL access only)
    proof_type TEXT DEFAULT 'MEDIA',     -- MEDIA or ATTESTATION
    is_honeypot BOOLEAN DEFAULT FALSE,   -- T7: honeypot injection flag
    status TEXT DEFAULT 'PENDING_REVIEW', -- Proof verification pipeline state
    submitted_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE fury_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    proof_id UUID REFERENCES proofs(id),
    fury_user_id UUID REFERENCES users(id),
    verdict TEXT,                        -- PASS or FAIL
    reviewed_at TIMESTAMPTZ,
    assigned_at TIMESTAMPTZ DEFAULT NOW()
);
```

The `is_honeypot` column on `proofs` supports the honeypot injection mechanism from Theorem T7. When a proof is flagged as a honeypot, the system knows the ground truth and can evaluate the accuracy of Fury verdicts against it. The `DEFAULT FALSE` ensures that regular user-submitted proofs are not accidentally marked as honeypots.

### B.4 Supporting Tables

Additional tables enforce operational constraints: `stripe_events` provides webhook idempotency via `UNIQUE` on `event_id`; `attestations` uses `UNIQUE(contract_id, attestation_date)` to prevent double-attestation within a single day; `contract_resolution_side_effects` implements the transactional outbox pattern with `CHECK (status IN ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'QUARANTINED'))` to constrain the side-effect state machine; `refresh_tokens` supports JWT rotation with `UNIQUE` on `token_hash` to prevent replay attacks; and `consumption_logs` tracks B2B metered billing with composite indexes on `(enterprise_id, recorded_at)` for efficient time-bounded aggregation.

---

## Appendix C: API Endpoint Specification

This appendix documents the HTTP API surface exposed by the NestJS backend (`src/api`). All endpoints are prefixed with the application root (`/`). Unless otherwise noted, endpoints require JWT bearer authentication via the `Authorization` header. The API specification is also available interactively at `/api/docs` (Swagger/OpenAPI) when the development server is running.

### C.1 Authentication Module

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| POST | `/auth/register` | Register a new user account | Public |
| POST | `/auth/login` | Authenticate and receive JWT + refresh token | Public |
| POST | `/auth/enterprise` | Exchange enterprise SSO token for session JWT | Public |
| POST | `/auth/refresh` | Refresh access token using refresh token cookie | Cookie |
| POST | `/auth/logout` | Clear session cookies and revoke refresh tokens | JWT |
| GET | `/auth/csrf` | Refresh CSRF cookie for browser session requests | Public |

### C.2 Contracts Module

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | `/contracts` | List contracts for the authenticated user | JWT |
| POST | `/contracts` | Create a new behavioral contract with financial stake | JWT |
| GET | `/contracts/invitations` | List pending accountability partner invitations | JWT |
| GET | `/contracts/cohorts/:cohortId/snapshot` | Get cohort snapshot with roster and pod breakdown | JWT |
| GET | `/contracts/:id` | Get a single contract by ID | JWT |
| GET | `/contracts/:id/proofs` | List proof submissions for a contract | JWT |
| POST | `/contracts/:id/proof` | Submit a proof of compliance for peer review | JWT |
| POST | `/contracts/:id/grace-day` | Use a grace day on a contract | JWT |
| POST | `/contracts/:id/dispute` | File a dispute against a verdict | JWT |
| POST | `/contracts/:id/ticket` | Purchase an in-app ticket for a contract | JWT |
| GET | `/contracts/:id/attestation` | Get attestation status for a recovery contract | JWT |
| POST | `/contracts/:id/attestation` | Submit daily attestation for a recovery contract | JWT |
| POST | `/contracts/:id/attestation/cosign` | Co-sign attestation as accountability partner | JWT |
| POST | `/contracts/:id/partner/accept` | Accept an accountability partner invitation | JWT |
| POST | `/contracts/:id/whoop/scored` | Ingest Whoop SCORED state and credit attestation | JWT |
| POST | `/contracts/:id/double-down` | Increase financial stake for an active contract | JWT |
| POST | `/contracts/bounty/:linkId` | Submit whistleblower evidence via bounty link | Public |

### C.3 Fury Module

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | `/fury/stats` | Get audit statistics for the current Fury reviewer | JWT |
| GET | `/fury/queue` | Get pending audit assignments for the current Fury | JWT |
| POST | `/fury/verdict` | Submit a PASS or FAIL verdict on an assigned proof | JWT |
| POST | `/fury/stream-ticket` | Issue short-lived ticket for Fury SSE subscription | JWT |
| POST | `/fury/stream-cookie` | Issue HttpOnly cookie for Fury SSE subscription | JWT |

### C.4 Wallet Module

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | `/wallet/balance` | Get ledger balance and integrity tier for current user | JWT |
| GET | `/wallet/history` | Get transaction history from the double-entry ledger | JWT |

### C.5 Proofs Module

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| POST | `/proofs/upload-url` | Request pre-signed R2 upload URL for proof media | JWT |
| POST | `/proofs/:id/confirm-upload` | Confirm that proof media has been uploaded to R2 | JWT |
| GET | `/proofs/:id` | Get proof details with signed view URL (for auditors) | JWT |

### C.6 Users Module

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | `/users/me` | Get current user profile | JWT |
| GET | `/users/me/compliance` | Get compliance and identity verification status | JWT |
| POST | `/users/me/compliance/identity/start` | Initiate identity verification flow | JWT |
| POST | `/users/me/compliance/identity/mock-complete` | Complete identity verification (mock/test mode) | JWT |
| GET | `/users/me/history` | Get user's behavioral history | JWT |
| PATCH | `/users/me/password` | Change password | JWT |
| PATCH | `/users/me/settings` | Update user settings | JWT |
| GET | `/users/me/data-export` | Request GDPR data export | JWT |
| DELETE | `/users/me` | Delete account (GDPR right to erasure) | JWT |
| POST | `/users/me/self-exclusion` | Activate voluntary self-exclusion | JWT |
| GET | `/users/leaderboard` | Get public integrity leaderboard | JWT |
| GET | `/users/:id` | Get a public user profile by ID | JWT |

### C.7 Admin Module

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | `/admin/integrity/chain` | Verify event_log hash chain integrity | Admin |
| POST | `/admin/honeypot` | Inject a honeypot proof to QA reviewer accuracy | Admin |
| POST | `/admin/ban/:userId` | Ban a user for policy violations | Admin |
| POST | `/admin/resolve/:contractId` | Manually resolve a contract (completed or failed) | Admin |
| GET | `/admin/disputes` | Get queue of disputes pending judge review | Admin |
| GET | `/admin/disputes/:id` | Get full dispute detail with Fury vote history | Admin |
| POST | `/admin/disputes/:id/resolve` | Resolve dispute with judge verdict | Admin |
| GET | `/admin/disputes/:id/audit-trail` | Get full audit trail for a dispute | Admin |
| GET | `/admin/users/:id` | Get full user profile with history | Admin |
| PATCH | `/admin/users/:id/integrity` | Manually adjust user integrity score | Admin |
| POST | `/admin/users/:id/compliance/identity/mock-complete` | Admin override: complete identity verification | Admin |
| GET | `/admin/reconciliation` | Get reconciliation visibility for inconsistencies | Admin |
| POST | `/admin/anomaly/scan` | Scan all stored proof hashes for pHash collisions | Admin |
| GET | `/admin/stats` | Get platform-wide statistics | Admin |

### C.8 Other Modules

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| POST | `/ai/grill-me` | Generate VC-style challenge questions from pitch | JWT |
| POST | `/ai/eli5` | Simplify a concept to plain language (ELI5) | JWT |
| GET | `/feed` | Get anonymized public activity feed | JWT |
| GET | `/notifications` | Get all notifications for current user | JWT |
| GET | `/notifications/unread-count` | Get count of unread notifications | JWT |
| POST | `/notifications/:id/read` | Mark a notification as read | JWT |
| POST | `/notifications/stream-ticket` | Issue ticket for notification SSE subscription | JWT |
| POST | `/notifications/stream-cookie` | Issue HttpOnly cookie for notification SSE | JWT |
| POST | `/oracles/healthkit/samples` | Ingest HealthKit samples with manual-entry filter | JWT |
| GET | `/compliance/eligibility` | Check jurisdictional eligibility | Public |
| POST | `/compliance/identity/webhooks/stripe` | Stripe Identity webhook receiver | Public |
| GET | `/payments/disposition-policy/effective` | Get effective disposition policy | JWT |
| POST | `/payments/webhook` | Handle Stripe webhook events | Public |
| GET | `/health` | Combined health check | Public |
| GET | `/health/live` | Kubernetes liveness probe | Public |
| GET | `/health/ready` | Kubernetes readiness probe | Public |
| GET | `/beta/mobile/bootstrap` | Mobile app bootstrap configuration | Public |
| GET | `/beta/meta/release` | Release metadata | Public |
| GET | `/b2b/metrics/:enterpriseId` | Get enterprise compliance metrics | JWT |
| GET | `/b2b/billing/:enterpriseId` | Get enterprise billing summary | JWT |
| POST | `/b2b/webhook/register` | Register enterprise webhook URL | JWT |
| POST | `/b2b/webhook/test` | Send test event to webhook URL | JWT |
| GET | `/b2b/export/hr/:enterpriseId` | Export anonymized HR compliance data | JWT |
| GET | `/b2b/datalake/:enterpriseId` | Extract time-bounded data lake snapshot | JWT |

---

## Appendix D: Validation Gate Descriptions

The Styx platform employs eight validation gates --- automated scripts that verify formal properties and operational invariants beyond what unit tests cover. Gates 01--03 require a running API instance with seeded data; Gates 04--07 run as static analysis against source artifacts; Gate 08 executes a self-contained adversarial simulation. Gates 04--07 are enforced in CI (GitHub Actions).

| Gate | Name | Script | What It Validates | Theorem / Invariant | Pass Criteria |
|------|------|--------|-------------------|---------------------|---------------|
| 01 | Phantom Money Check | `01-phantom-money-check.ts` | Double-entry ledger prevents unbalanced entries. Creates a contract and verifies the user's balance reflects the stake hold exactly. | T1 (Ledger Balance Invariant) | Net ledger balance sum equals zero after contract creation and stake hold. |
| 02 | Simulator Spoof Check | `02-simulator-spoof-check.ts` | Hardware oracles reject manually entered data. Submits a biological contract proof with spoofed HealthKit metadata and verifies the Aegis protocol rejects unsafe metrics. | T5 (Aegis Safety Protocol) | API returns rejection status for spoofed biometric data; genuine data passes. |
| 03 | The Full Loop | `03-the-full-loop.ts` | End-to-end contract lifecycle via real HTTP calls with JWT authentication. Login, create contract, submit proof, three Fury verdicts, verify resolution. | T1, T2, T3, T4 (integrated) | Contract reaches terminal state (COMPLETED or FAILED) with correct ledger entries and truth log events. |
| 04 | Redacted Build Check | `04-redacted-build-check.sh` | Linguistic Cloaker has successfully removed legally banned terminology from user-facing client code. Greps source bundles for terms that trigger Apple/Stripe bot rejections. | Regulatory compliance | Zero matches for banned terms ("bet", "gamble", "wager") in web, desktop, and mobile source directories. |
| 05 | Behavioral Physics Check | `05-behavioral-physics-check.ts` | Core behavioral physics rules are enforced by the API: 7-day cool-off period after failure, dynamic downscaling after 3+ failures, stake tier limits respected. | T3 (Integrity Score), T5 (Aegis) | Deterministic test user experiences correct cool-off lockout, downscaled stake ceiling, and tier-appropriate rejection. |
| 06 | Security Invariant Check | `06-security-invariant-check.ts` | No development tokens, hardcoded secrets, or debug backdoors exist in compiled production output. Scans source files (excluding test files) for forbidden patterns. | Security invariant | Zero matches for forbidden patterns: dev mock tokens, mock user IDs, debug backdoors, unprotected admin endpoints. |
| 07 | Claim Drift Check | `07-claim-drift-check.js` | File paths referenced in the Claim-to-Control Matrix (`docs/planning/implementation-status.md`) still exist on disk. Prevents documentation from drifting out of sync with the codebase. | Documentation integrity | All inline code paths starting with `/src/` or `/docs/` resolve to existing files. |
| 08 | Fury Crucible | `08-fury-crucible-simulation.ts` | Adversarial agent simulation of the Fury network. Spawns 100 simulated reviewers (70 honest at 95% accuracy, 20 random guessers at 50%, 10 colluding at 100% internal alignment but incorrect). | T4 (Fury Accuracy), T7 (Honeypot Detection) | Honest Furies maintain positive stake; random guessers are demoted; colluding Furies are bankrupted. Network consensus accuracy exceeds 95%. |

**Gate execution.** Gates 01--03 and 08 are integration-level checks that require the API server, PostgreSQL, and Redis to be running with seeded test data. They are executed locally during development and in staging environments. Gates 04--07 are pure static analysis scripts that operate on source files and build artifacts; they run in every CI pipeline execution and block merges on failure. The separation ensures that the most critical invariant checks (no banned terms, no leaked secrets, no documentation drift) are enforced on every commit, while the integration-level checks are reserved for environments with full infrastructure availability.

---

## Appendix E: Test Coverage Summary

The Styx platform maintains a comprehensive test suite spanning five workspaces, with a combined total exceeding 467 automated tests at the time of writing. This appendix summarizes the distribution, methodology, and enforcement thresholds.

### E.1 Test Distribution by Workspace

| Workspace | Package | Test Files | Approx. Tests | Framework | File Convention |
|-----------|---------|------------|---------------|-----------|-----------------|
| API | `@styx/api` | 86 | ~250 | Jest + ts-jest | `*.spec.ts` |
| Web | `@styx/web` | 37 | ~80 | Jest + React Testing Library | `*.test.ts`, `*.test.tsx` |
| Mobile | `@styx/mobile` | 14 | ~60 | Jest + ts-jest | `*.spec.ts` |
| Desktop | `@styx/desktop` | 1 | ~5 | Jest + ts-jest | `*.spec.ts` |
| Shared | `@styx/shared` | 3 | ~37 | Jest + ts-jest | `*.spec.ts` |
| E2E | (root) | 7 | ~35 | Playwright | `*.spec.ts` |
| **Total** | | **148** | **467+** | | |

### E.2 Coverage Thresholds

The API workspace enforces minimum coverage thresholds in `src/api/jest.config.cjs`:

| Metric | Threshold |
|--------|-----------|
| Lines | 70% |
| Branches | 60% |
| Functions | 60% |
| Statements | 70% |

These thresholds are enforced in CI: any test run that produces coverage below these minimums causes the pipeline to fail, preventing regression in test quality.

### E.3 Test Categories

**Unit tests** form the majority of the suite. In the API workspace, each domain service (`src/api/services/`) and NestJS module (`src/api/src/modules/`) has a corresponding `*.spec.ts` file that tests business logic in isolation using mocked dependencies. The standard NestJS testing pattern constructs injectable classes with constructor-injected `Pool` or service instances, using `as any` casts for mock injection. Examples include `ledger.service.spec.ts` (balance computation, phantom money prevention), `integrity.spec.ts` (score calculation, tier assignment), `anomaly.service.spec.ts` (pHash duplicate detection, EXIF validation), and `dispute.service.spec.ts` (dispute filing, resolution, fee handling).

**Integration tests** verify cross-module interactions. The `contracts.full-breath.spec.ts` and `users.full-breath.spec.ts` files exercise complete user journeys spanning authentication, contract creation, proof submission, Fury assignment, verdict processing, and settlement. The `global-http-exception.e2e.spec.ts` file tests the exception filter pipeline end-to-end.

**Behavioral specification tests** (`contracts.service.behavioral.spec.ts`) validate the behavioral physics rules: cool-off periods, downscaling thresholds, grace day limits, and Aegis protocol enforcement. These tests map directly to the formal properties established in Theorems T3 and T5.

**End-to-end tests** use Playwright to exercise the complete system through a browser. The seven E2E suites (`auth`, `auth-guards`, `contract-lifecycle`, `dashboard`, `fury-workbench`, `recovery-contracts`, `wallet`) run against four browser targets: Chromium, Firefox, WebKit, and mobile Chrome. The Playwright configuration auto-starts the web server and provides fixtures for authenticated sessions.

### E.4 Test Naming Conventions

Test descriptions follow the pattern `should [expected behavior] when [precondition]`, enabling the test output to read as a behavioral specification. Example: `should reject contract creation when user is in cool-off period`. Describe blocks are organized by function or feature: `describe('calculateIntegrity', () => { ... })` for unit tests; `describe('Contract Lifecycle', () => { ... })` for integration tests.

### E.5 Turbo Pipeline

Test execution is orchestrated by Turborepo with a pipeline dependency: `"test": { "dependsOn": ["build"] }`. This ensures that `@styx/shared` is compiled before other workspaces run their tests, since they import from the shared package at runtime. The `make test` command invokes `turbo run test` across all workspaces in dependency order.

---

## Appendix F: Oath Category Taxonomy

The Styx platform supports seven behavioral streams comprising 27 oath categories. This appendix presents the complete taxonomy as defined in the `OathCategory` enum (`src/shared/libs/behavioral-logic.ts`), with verification methods, oracle types, and example contracts for each category.

### F.1 Biological Stream (5 categories)

The Biological stream requires hardware oracle verification via HealthKit (iOS) or Health Connect (Android). All categories in this stream produce machine-generated, tamper-evident metrics that cannot be manually entered by users --- the Simulator Spoof Check (Gate 02) validates this property.

| Category | Enum Value | Verification Method | Oracle Type | Example Contract |
|----------|------------|---------------------|-------------|------------------|
| Weight Management | `BIOLOGICAL_WEIGHT` | HealthKit / Health Connect | Hardware | "I will lose 2 lbs per week for 8 weeks at $50/week stake" |
| Cardiovascular Stamina | `BIOLOGICAL_CARDIO` | HealthKit / Health Connect | Hardware | "I will run 3x per week with heart rate data for 30 days at $25 stake" |
| Glucose Stability | `BIOLOGICAL_METABOLIC` | HealthKit / Health Connect | Hardware | "I will maintain fasting glucose below 100 mg/dL for 14 days at $100 stake" |
| Sleep Integrity | `BIOLOGICAL_SLEEP` | HealthKit / Health Connect | Hardware | "I will sleep 7+ hours per night for 21 days at $30 stake" |
| Sobriety (HRV) | `BIOLOGICAL_SOBRIETY` | HealthKit / Health Connect | Hardware | "I will maintain HRV baseline (no alcohol spikes) for 30 days at $75 stake" |

### F.2 Cognitive Stream (4 categories)

The Cognitive stream uses device-level APIs (Screen Time, Digital Wellbeing) and third-party API integrations to verify behavioral compliance.

| Category | Enum Value | Verification Method | Oracle Type | Example Contract |
|----------|------------|---------------------|-------------|------------------|
| Digital Fasting | `COGNITIVE_DIGITAL` | Screen Time API | Device | "I will limit social media to 30 min/day for 14 days at $20 stake" |
| Deep Work Focus | `COGNITIVE_FOCUS` | Screen Time API / Third-party | Device | "I will log 4 hours of uninterrupted work daily for 5 days at $50 stake" |
| Inbox Zero | `COGNITIVE_QUEUE` | Third-party API | Device | "I will reach inbox zero every weekday for 10 business days at $15 stake" |
| Learning Retention | `COGNITIVE_LEARNING` | Third-party API | Device | "I will complete 1 course module per week for 6 weeks at $40 stake" |

### F.3 Professional Stream (3 categories)

The Professional stream verifies work output through third-party API integrations and financial ledger data.

| Category | Enum Value | Verification Method | Oracle Type | Example Contract |
|----------|------------|---------------------|-------------|------------------|
| Sales Velocity | `PROFESSIONAL_SALES` | Third-party API / Ledger | API | "I will close 5 deals per month for 3 months at $200 stake" |
| Developer Throughput | `PROFESSIONAL_CODE` | Third-party API | API | "I will merge 3 PRs per week for 4 weeks at $50 stake" |
| Punctuality | `PROFESSIONAL_TIME` | Third-party API | API | "I will clock in within 5 min of scheduled time for 20 workdays at $25 stake" |

### F.4 Creative Stream (4 categories)

The Creative stream uses a hybrid verification model: time-lapse proof of process combined with Fury consensus. This stream validates the act of creation rather than the output quality, using the "proof of process" paradigm.

| Category | Enum Value | Verification Method | Oracle Type | Example Contract |
|----------|------------|---------------------|-------------|------------------|
| Deep Writing | `CREATIVE_WRITING` | Time-lapse + Fury consensus | Hybrid | "I will write 1,000 words per day for 30 days at $100 stake" |
| Visual Arts | `CREATIVE_ART` | Time-lapse + Fury consensus | Hybrid | "I will create 1 digital artwork per week for 8 weeks at $40 stake" |
| Music Practice | `CREATIVE_MUSIC` | Time-lapse + Fury consensus | Hybrid | "I will practice guitar 45 min/day for 21 days at $30 stake" |
| Maker/Build | `CREATIVE_BUILD` | Time-lapse + Fury consensus | Hybrid | "I will complete 1 woodworking project per month for 3 months at $75 stake" |

### F.5 Environmental Stream (4 categories)

The Environmental stream relies primarily on Fury consensus (peer review of photographic evidence) supplemented by GPS geofencing where applicable.

| Category | Enum Value | Verification Method | Oracle Type | Example Contract |
|----------|------------|---------------------|-------------|------------------|
| Nutritional Transparency | `VISUAL_NUTRITION` | Fury consensus + GPS | Peer + Location | "I will photograph every meal for 14 days at $20 stake" |
| Tidiness/Minimalism | `VISUAL_ENVIRONMENT` | Fury consensus + GPS | Peer + Location | "I will maintain a clean desk (photo proof) for 30 days at $25 stake" |
| Personal Presentation | `VISUAL_IMAGE` | Fury consensus + GPS | Peer + Location | "I will dress professionally for work 5 days/week for 4 weeks at $15 stake" |
| Active Reading | `VISUAL_LITERACY` | Fury consensus + GPS | Peer + Location | "I will read 30 pages per day (photo of page count) for 21 days at $30 stake" |

### F.6 Character Stream (3 categories)

The Character stream employs multi-oracle verification, combining Fury consensus with GPS geofencing and optionally third-party API data.

| Category | Enum Value | Verification Method | Oracle Type | Example Contract |
|----------|------------|---------------------|-------------|------------------|
| Civic Engagement | `SOCIAL_COMMUNITY` | Fury consensus + GPS | Multi | "I will volunteer 4 hours per week for 8 weeks at $50 stake" |
| Philanthropic Velocity | `SOCIAL_CHARITY` | Fury consensus + GPS | Multi | "I will donate $10/week to charity for 12 weeks at $25 stake" |
| Family Presence | `SOCIAL_CONNECTION` | Fury consensus + GPS | Multi | "I will attend family dinner 3x/week for 4 weeks at $20 stake" |

### F.7 Recovery Stream (4 categories)

The Recovery stream is governed by the Recovery Protocol (Theorem T8) and employs daily attestation with optional Fury consensus. All Recovery contracts require accountability partners (*AP*(*c*) != empty set) and safety acknowledgments (*Ack*(*c*) = all true), as specified in Definition D8. Additional guardrails include the maximum no-contact duration (*delta_bar_R* = 30 days), maximum no-contact targets (*n_bar_NC* = 3), and missed attestation auto-fail threshold (*chi_bar_miss* = 3).

| Category | Enum Value | Verification Method | Oracle Type | Example Contract |
|----------|------------|---------------------|-------------|------------------|
| No-Contact Boundary | `RECOVERY_NOCONTACT` | Daily attestation + Fury | Attestation | "I will maintain no contact with [target] for 30 days at $50 stake" |
| Substance Abstinence | `RECOVERY_SUBSTANCE` | Daily attestation + Screen Time | Attestation | "I will abstain from alcohol for 21 days at $75 stake" |
| Behavioral Detox | `RECOVERY_DETOX` | Daily attestation + Fury | Attestation | "I will avoid gambling apps for 30 days at $100 stake" |
| Environment Avoidance | `RECOVERY_AVOIDANCE` | Daily attestation + Screen Time + Fury | Attestation | "I will avoid bars and clubs for 14 days at $30 stake" |

---

## Appendix G: State Transition Diagrams

This appendix provides textual transition tables for the three state machines depicted in the SVG figures (`docs/thesis/figures/`). These tables supplement the visual diagrams with exhaustive (state, event) to next-state mappings.

### G.1 Contract Lifecycle FSM (Figure 1)

The contract lifecycle state machine governs the progression of a behavioral contract from creation through resolution. The FSM has six states and eight transitions.

**States:** `PENDING_STAKE`, `ACTIVE`, `COMPLETED`, `FAILED`, `DISPUTED`, `CANCELLED`.

**Terminal states:** `COMPLETED`, `FAILED`, `CANCELLED`.

| Current State | Event | Next State | Side Effects |
|---------------|-------|------------|--------------|
| `PENDING_STAKE` | Stripe payment confirmed | `ACTIVE` | Ledger entry: debit user account, credit escrow; truth log event; contract `started_at` and `ends_at` set |
| `PENDING_STAKE` | Payment failed / timeout | `CANCELLED` | No ledger entry; notification sent |
| `ACTIVE` | All proofs verified, deadline reached | `COMPLETED` | Ledger entry: debit escrow, credit user (stake refund); integrity score +*beta*_c; truth log event |
| `ACTIVE` | Proof rejected by Fury consensus | `FAILED` | Ledger entry: debit escrow, credit Fury bounty pool + platform revenue; integrity score -*beta*_s; strikes incremented; truth log event |
| `ACTIVE` | Deadline reached, insufficient proofs | `FAILED` | Same as proof-rejected failure; auto-resolution by scheduler |
| `ACTIVE` | User disputes Fury verdict | `DISPUTED` | Dispute filed; appeal fee held via Stripe; proof status set to DISPUTED |
| `DISPUTED` | Dispute resolved: UPHELD | `FAILED` | Appeal fee captured; original verdict stands; truth log event |
| `DISPUTED` | Dispute resolved: OVERTURNED | `COMPLETED` | Appeal fee refunded; proof re-verified; Fury penalized; truth log event |

### G.2 Dispute Resolution FSM (Figure 2)

The dispute resolution FSM operates within the `disputes` table and governs the appeal lifecycle. It has five states and four transitions.

**States:** `FEE_AUTHORIZED_PENDING_REVIEW` (*q*_1), `IN_REVIEW` (*q*_2), `ESCALATED` (*q*_3), `RESOLVED_UPHELD` (*q*_4), `RESOLVED_OVERTURNED` (*q*_5).

**Initial state:** *q*_1 = `FEE_AUTHORIZED_PENDING_REVIEW`.

**Terminal states:** {*q*_4, *q*_5} = {`RESOLVED_UPHELD`, `RESOLVED_OVERTURNED`}.

| Current State | Input (Judge Decision) | Next State | Side Effects |
|---------------|----------------------|------------|--------------|
| `FEE_AUTHORIZED_PENDING_REVIEW` | Judge begins review | `IN_REVIEW` | Dispute assigned to judge; notification sent |
| `IN_REVIEW` | Judge rules: UPHELD | `RESOLVED_UPHELD` | Appeal fee captured as revenue; original rejection stands; proof status REJECTED; Fury accuracy unaffected; truth log event |
| `IN_REVIEW` | Judge rules: OVERTURNED | `RESOLVED_OVERTURNED` | Appeal fee refunded; proof status set to VERIFIED; Fury penalized (false accusation recorded); contract re-evaluated; truth log event |
| `IN_REVIEW` | Judge rules: ESCALATED | `ESCALATED` | Appeal fee held; proof status remains DISPUTED; requires further investigation; may involve additional evidence or panel review |

Theorem T6 proves that this FSM is total and terminates: every reachable state either is terminal or has at least one defined transition, and no cycles exist among non-terminal states. The `ESCALATED` state is a non-terminal intermediate that eventually transitions to one of the two terminal states upon final adjudication.

### G.3 Proof Verification Pipeline (Figure 3)

The proof verification pipeline is a five-layer sequential filter. Each layer either passes the proof to the next layer or rejects it with a specific flag. The pipeline processes a single proof submission and produces a terminal verdict.

| Layer | Name | Pass Condition | Fail Action | Theorem |
|-------|------|----------------|-------------|---------|
| 1 | EXIF Timestamp Validation | EXIF timestamp within 1 hour of submission time | Flag `EXIF_TIMESTAMP_DISCREPANCY`; pass to Fury with unverified flag (fail-open) | T5 |
| 2 | pHash Duplicate Detection | Hamming distance to all prior hashes >= *theta*_H (5) | Reject with `PHASH_DUPLICATE` flag; proof status set to REJECTED | T9 |
| 3 | Anomaly Analysis Timeout | Analysis completes within 10 seconds | Flag `ANALYSIS_TIMEOUT` and `UNVERIFIED`; pass to Fury (fail-open) | --- |
| 4 | Fury Assignment | Proof enqueued to BullMQ `FURY_ROUTER_QUEUE` | N/A (always passes to next layer) | T4 |
| 5 | Fury Consensus | Majority of 3 assigned Furies vote PASS | Reject proof; contract fails; Fury bounty distributed | T4, T7 |

The fail-open design at Layers 1 and 3 reflects a deliberate architectural choice: false negatives (missing a duplicate or timestamp anomaly) are less harmful than false positives (rejecting legitimate proofs), because the Fury consensus layer provides a secondary verification opportunity. The pipeline achieves defense-in-depth by combining automated analysis (Layers 1--3) with human judgment (Layer 5), mediated by the queuing infrastructure (Layer 4).

---

## Appendix H: HVCS Inter-Regulation Matrix

This appendix reproduces the Human Vice Control System (HVCS) inter-regulation matrix that provides the theoretical motivation for Styx's behavioral physics framework. The matrix originates from the behavioral physics manifesto (see `docs/research/research--behavioral-physics-manifesto.md`) and models human drives not as isolated moral defects but as competing control signals that regulate one another through feedback loops.

### H.1 Theoretical Foundation

The HVCS treats each of the seven classical "vices" --- Gluttony, Lust, Greed, Pride, Envy, Wrath, and Sloth --- as a **drive-node** in a multi-input, multi-output adaptive control system. Each drive has an activation trigger, an output behavior, a cost surface, and one or more counter-regulators. No drive is terminal; stability is always provisional and emerges from cross-constraint rather than suppression.

This model is neither moral nor theological. It is a descriptive engineering model rooted in cybernetics and control theory. The key insight --- that drives exist in tension, and excess in one vector generates corrective pressure from others --- informs Styx's design philosophy: the platform does not attempt to suppress human impulses but instead creates feedback structures that align existing drives with desired behavioral outcomes.

### H.2 The 7x7 Inter-Regulation Matrix

| Escalating Drive | Pressure Created | Counter-Drive(s) Activated | Self-Governing Mechanism |
|-----------------|------------------|---------------------------|--------------------------|
| **Gluttony** | Bodily degradation, loss of attractiveness, reduced energy | Pride, Lust | Desire for status, image maintenance, and sexual viability forces restraint or redirection of overconsumption |
| **Lust** | Competition, rejection risk, performance anxiety | Pride, Greed | Need for desirability (Pride) and resources to attract partners (Greed) disciplines behavior and redirects energy into self-improvement |
| **Greed** | Social resentment, instability, burnout | Sloth, Pride | Exhaustion (Sloth as damping mechanism) and reputation management (Pride as social constraint) cap unchecked accumulation |
| **Pride** | Overexposure, social isolation, challenge to status claims | Wrath, Envy | Conflict from challenged status (Wrath) and comparison with superior competitors (Envy) re-anchor self-assessment |
| **Envy** | Chronic dissatisfaction, inferiority signal, motivational paralysis | Greed, Pride | Drive to acquire (Greed) or to distinguish oneself (Pride) redirects envy into productive action rather than stagnation |
| **Wrath** | Social punishment, retaliation risk, reputational damage | Sloth, Pride | Cost of sustained conflict (Sloth as energy conservation) and image damage (Pride as reputational constraint) dampen aggression |
| **Sloth** | Stagnation, loss of opportunity, boredom, status decline | Envy, Greed, Lust | Comparison with active peers (Envy), desire for resources (Greed), and desire for reciprocity (Lust) re-ignite motion |

### H.3 Structural Roles in the Control Architecture

The manifesto identifies three structural roles that emerge from the matrix. **Pride** functions as a meta-regulator: because it encodes social visibility, reputation, and identity coherence, it translates internal excess into external consequence. Pride appears as a counter-drive in five of the seven rows, making it the most interconnected node in the control topology. **Lust** operates as a selection engine: it introduces external evaluation criteria that sharply limit unchecked indulgence elsewhere, because bodies, competence, status, and presentation all become regulated when desire requires reciprocation. **Sloth** serves as a damping mechanism: without sloth, burnout and overextension dominate, but sloth becomes pathological only when disconnected from the reactivation triggers (envy, lust, greed) that convert rest into renewed motion.

### H.4 Application to Styx Design

The HVCS matrix informs several of Styx's core design decisions:

1. **Loss aversion as drive amplification.** The loss aversion coefficient (*lambda* = 1.955) amplifies the pride/greed counter-regulatory pressure by making financial loss nearly twice as salient as equivalent gain. This aligns with Prospect Theory (Kahneman and Tversky, 1979) and operationalizes the matrix's prediction that greed (loss of resources) is a powerful constraint on overconsumption (gluttony) and inaction (sloth).

2. **Peer review as social accountability.** The Fury network implements the pride counter-drive: auditors create social visibility around behavioral commitments, converting private excess into public consequence. The auditor's own financial stake (*sigma*_audit = $2.00) activates the greed constraint against lazy or dishonest reviewing.

3. **Cool-off periods as damping.** The 7-day cool-off period (*tau*_cool) after repeated failures functions as an institutionalized sloth mechanism, preventing the wrath/pride cycle of escalating stakes after losses. The system enforces rest when the user's own damping drive may have failed.

4. **Recovery Protocol as isolation prevention.** The anti-isolation predicate (Definition D8) operationalizes the matrix's warning about breaking feedback loops: no-contact contracts could, without guardrails, sever the social comparison and accountability feedback channels (envy, pride, lust) that the HVCS model predicts are necessary for behavioral regulation. The mandatory accountability partner and maximum target limits preserve these channels.

5. **Honeypot injection as trust calibration.** The honeypot mechanism (Theorem T7) prevents the pride-without-consequence failure mode identified in the manifesto's analysis of social media: by injecting known-truth proofs, the system ensures that auditor reputation reflects actual accuracy rather than accumulated volume, maintaining calibration in the pride/reputation feedback loop.

### H.5 Where Modern Systems Break

The manifesto identifies six failure modes caused by **feedback interruption** rather than by vice itself. These failure modes motivated the design constraints documented in Chapter 3:

**Capitalism without counter-pressure.** When monopolies remove competitive loss risk, greed no longer produces invention; it produces extraction. Styx addresses this by ensuring every participant --- user and auditor alike --- faces real financial loss risk.

**Social media without reputational decay.** When anonymity and algorithmic amplification remove social correction, pride inflates without bound. Styx addresses this through durable reputation (the integrity score persists across all interactions) and the honeypot mechanism (which injects ground truth into the reputation signal).

**Consumer abundance without bodily cost visibility.** When consequences are delayed, overconsumption self-limits too slowly. Styx addresses this through immediate financial consequence: the stake hold creates an artificial but timely cost signal that supplements the delayed biological one.

**Desire without reciprocity.** When parasocial substitutes replace real interaction, selection pressure disappears. Styx addresses this through the Fury network's bilateral stake structure: auditors and users both risk real value, ensuring reciprocal accountability.

**Sloth without comparison.** When infinite entertainment prevents boredom, rest becomes terminal rather than recuperative. Styx addresses this through the public leaderboard and the integrity score tier system, which provide continuous comparative feedback.

**Moral absolutism.** When systems attempt to zero out drives through shame-based suppression, energy leaks into hypocrisy or pathology. Styx explicitly rejects suppression: it does not moralize behavior but instead channels existing drives through structured consequence.

### H.6 General Law

The manifesto concludes with a general stability law that serves as the philosophical axiom underlying Styx's design: *A system remains stable when drives are acknowledged, costs are visible, consequences are timely, comparison is real, and loss is possible. Modern systems fail where buffers, abstractions, or asymmetries delay feedback.* Each of the nine formal theorems in Chapter 4 can be understood as establishing one aspect of this stability condition within the computational implementation.

---

*End of Appendices.*
