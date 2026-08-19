---
generated: true
department: B2B
artifact_id: B4
governing_sop: "SOP--enterprise-security.md"
phase: hardening
product: styx
date: "2026-08-15"
---

# Styx Security Whitepaper

**STYX -- THE BLOCKCHAIN OF TRUTH**

_Last updated: 2026-08-15_

**Scope of this document.** This whitepaper describes the security architecture of Styx as it is
**implemented in the codebase today**. Every control below names the file that enforces it, so a
reviewer can read the source rather than trust the prose. Anything not yet implemented appears only
in [§12 Roadmap](#12-roadmap--not-yet-implemented) and is labelled as such. Claims about controls we
do not have are the failure mode this document exists to prevent; if you find a claim here that the
code does not support, that is a defect — report it as one.

**Companion documents.** [`security-questionnaire.md`](security-questionnaire.md) answers the
standard enterprise questionnaire topics (hosting, subprocessors, retention, incident response) and
defers to this whitepaper for architecture. [`compliance-packaging.md`](compliance-packaging.md)
covers commercial packaging of compliance artifacts.

---

## 1. What Styx Is, in Security Terms

Styx is a behavioral commitment platform. A user creates an **Oath** (a habit commitment), places a
financial **stake** behind it, and submits proof of compliance. Anonymous peer auditors (**Furies**)
review that proof and vote; a weighted consensus of their votes determines whether the Oath was kept.
The stake is then returned or forfeited according to the outcome **and** the user's jurisdiction.

That shape produces four security problems that a conventional SaaS application does not have:

| Problem | Why it is unusual | Primary control |
|---|---|---|
| The audit trail is the product | A disputed verdict is worth money, so the log itself is an attack target | Hash-chained TruthLog (§2) |
| Money must never be created | Settlement is automated; a bug that mints value is a solvency event | Double-entry ledger invariants (§3) |
| Auditors are adversaries | A Fury is paid per audit and can profit by voting without looking | Honeypots + weighted consensus (§7) |
| The legal answer varies by state | The same forfeited stake is revenue in one state and an illegal wager in another | Jurisdiction tiering + fail-closed geofence (§5) |

The rest of this document works through those four, plus the conventional controls (auth, media
privacy, device integrity) that support them.

---

## 2. The TruthLog: A Hash-Chained, Append-Only Event Log

**Implementation:** `src/api/services/ledger/truth-log.service.ts`
**Schema:** `src/api/database/schema.sql` (table `event_log`)

Every consequential platform action — a settlement, a Fury verdict, a bounty payment, a penalty, a
device-attestation rejection, an admin jurisdiction change, a GDPR erasure — is appended to a single
global event log whose entries are cryptographically linked.

### 2.1 The chain construction

Each entry stores a `current_hash` computed as:

```
SHA256( sequence_index | event_type | timestamp | previous_hash | JSON(payload) )
```

The preimage deliberately includes `event_type` and the explicit `sequence_index`, not just the
payload: an attacker who rewrote an event's *type* while leaving its payload intact, or who
reordered entries, would otherwise produce a chain that still verified.

### 2.2 What verification actually proves

`verifyChain()` walks the log in ascending `sequence_index` order and recomputes every hash. The
detail that matters: it recomputes each entry against the **running recomputed head**, not against
the `previous_hash` value stored in the row. A forger who rewrites one payload and then re-links
every subsequent `previous_hash`/`current_hash` pair to agree internally produces a chain that is
self-consistent — and it still fails verification, because the recomputed head diverges from the
forged links at the point of tampering.

`verifyChain()` returns `{ valid, checked, corrupted[] }`. It runs:

- **daily at 03:00 UTC** via `AdminScheduler.verifyHashChain()`
  (`src/api/src/modules/admin/admin.scheduler.ts`), which logs at ERROR level on corruption; and
- **on demand** at `GET /admin/integrity/chain`
  (`src/api/src/modules/admin/admin.controller.ts`), an `ADMIN`-only route.

### 2.3 Database-level immutability

Append-only is not merely a convention in the application layer. `event_log` carries a
`BEFORE UPDATE OR DELETE` trigger (`prevent_event_log_mutation`) that raises an exception on any
mutation attempt. An `UPDATE` issued directly against the database — by a future code path, a
migration, or a psql session — fails rather than silently forking the chain.

### 2.4 Concurrency

Appends are serialized by a transaction-scoped Postgres advisory lock
(`pg_advisory_xact_lock`), so two concurrent writers cannot compute the same head. When a caller
supplies its own `PoolClient`, the append **enlists in the caller's transaction** — so a Fury
verdict and its log entry commit or roll back atomically, and a rolled-back business write cannot
leave an orphaned "this happened" event behind.

### 2.5 Honest limits

- The chain is **tamper-evident, not tamper-proof.** It detects modification of history; it does
  not prevent an actor with database write access from truncating the log's tail. There is no
  external anchoring (no notarization to a public chain or third-party timestamping service).
- Verification is **whole-chain**: `verifyChain()` reads every row. It is a scheduled job, not a
  per-request check.
- "Blockchain of Truth" is the product's name and its architectural metaphor. Styx runs **no
  distributed ledger, no consensus network, and no cryptocurrency.** The chain is a hash-linked
  table in a single Postgres database. Any reader who needs the distinction stated plainly has it
  here.

---

## 3. The Double-Entry Ledger and the Phantom Money Test

**Implementation:** `src/api/services/ledger/ledger.service.ts`

All value movement — stakes, Fury bounties, Fury penalties, platform revenue — is posted through
`recordTransaction()`, which writes a row carrying a single integer-cent `amount`, a
`debit_account_id`, and a `credit_account_id`.

### 3.1 Posting-time invariants

`recordTransaction()` rejects, before any write:

- a non-positive amount,
- a non-integer amount (all money is integer cents; no floats reach the ledger), and
- a posting whose debit and credit accounts are the same.

### 3.2 Idempotency is enforced by the database, not by a check

Settlement workers retry. An application-level "does this posting already exist?" check loses the
race under concurrency. Instead, callers pass a deterministic `idempotencyKey` and the insert uses
`ON CONFLICT (idempotency_key) WHERE idempotency_key IS NOT NULL DO NOTHING` against a partial
unique index (migration 030). A duplicate posting is collapsed by the database; the caller receives
the pre-existing entry's id and observes idempotent success rather than a second payment.

### 3.3 What `verifyLedgerIntegrity()` actually checks

This is worth stating precisely, because the obvious formulation is worthless. In this schema each
row debits and credits the *same* amount, so a global "sum of debits equals sum of credits" check is
tautologically true and detects nothing. The implemented check asserts the three invariants that
corruption, a bad migration, or a manual write bypassing `recordTransaction()` **can** violate:

1. **Positive-amount** — no entry may have `amount <= 0` (money minted or destroyed on a posting).
2. **Distinct-leg** — no entry may debit and credit the same account (a no-op row that masks a
   lost posting).
3. **Referential** — every account reference must resolve to a real row in `accounts` (an orphaned
   reference is money in an account that does not exist).

Any violation returns `balanced: false` with per-invariant counts. When
`STYX_ENFORCE_HARD_INTEGRITY=true`, the check runs inside every posting transaction and a violation
throws, rolling back the posting and — where a `QuarantineService` is wired — quarantining the
account.

The reporting fields `totalDebits`/`totalCredits` are retained for the audit trail. They are equal
by construction and are **not** used to decide `balanced`.

### 3.4 Honest limits

- Hard-integrity enforcement is **environment-gated** (`STYX_ENFORCE_HARD_INTEGRITY`), not
  unconditional, because the check is a full-table scan on each posting.
- The invariants are structural. They prove no phantom entry exists; they do not prove that a
  business rule chose the *right* accounts for a given settlement.

---

## 4. Authentication and Authorization

**Implementation:** `src/api/src/modules/auth/`, `src/api/src/common/guards/`, `src/api/src/guards/`

### 4.1 Credentials and sessions

| Control | As implemented |
|---|---|
| Password hashing | `bcryptjs`, cost factor **10** (`BCRYPT_ROUNDS`) |
| Access token | JWT, **HS256**, `expiresIn: 15m`, signed with `JWT_SECRET` (startup fails if unset) |
| Refresh token | 32 random bytes; only its SHA-256 hash is stored in `refresh_tokens`; **7-day** expiry |
| Refresh rotation | Each refresh revokes the presented token and issues a new pair |
| Login timing | A bcrypt compare runs against a fixed dummy hash even when no user exists, so response time does not disclose account existence |
| Enterprise SSO assertions | Verified against a **dedicated** `ENTERPRISE_SSO_SECRET`, never `JWT_SECRET`. If the dedicated secret is unprovisioned, enterprise SSO is rejected outright rather than falling back to the shared session key |

Verification pins the algorithm (`algorithms: ['HS256']`), which closes the `alg: none` and
algorithm-confusion class.

### 4.2 Browser session cookies

`AuthController.issueBrowserSessionCookies()` sets exactly three cookies:

| Cookie | httpOnly | Purpose | Max age |
|---|---|---|---|
| `styx_auth_token` | yes | Access token | 15 minutes |
| `styx_refresh_token` | yes | Refresh token | 7 days |
| `styx_csrf_token` | **no** | Double-submit CSRF token | 15 minutes |

All three are `secure` in production and `sameSite: lax`. The CSRF token is *derived from* the
access token (`deriveCsrfToken`), so the guard validates it against the session rather than trusting
an arbitrary attacker-supplied cookie value. It is deliberately readable by JavaScript — that is the
double-submit pattern, not an oversight.

### 4.3 Authorization

Role checks are enforced by `RoleGuard` with the `@Roles(...)` decorator. Two properties matter:

- **The role is read from the database on every check, not from the JWT claim.** Access tokens live
  15 minutes; a Fury can be demoted or a user banned inside that window, and a stale claim would
  otherwise grant privileged access until expiry.
- **Ban status is checked in the same query.** A `BANNED` user is rejected by `RoleGuard` regardless
  of role, and again by `BannedUserGuard` on mutation endpoints.

Roles in use in the codebase: `USER` (the column default), `FURY`, `PRACTITIONER`, `ADMIN`.

Every guard in the estate **fails closed**: `RoleGuard`, `BannedUserGuard`, and
`ComplianceAccessGuard` all throw `ForbiddenException('Authentication required')` when
`request.user` is absent rather than falling through to allow.

### 4.4 Transport and request hardening

`src/api/src/main.ts` applies, at bootstrap: `helmet()` security headers; a 1 MB body limit on JSON
and urlencoded payloads; a global `ValidationPipe` with `whitelist: true` (unrecognized properties
are stripped, not passed through); an explicit CORS allowlist from `CORS_ORIGINS` (in production,
an unset value starts the API with **no** cross-origin browser access rather than `*`); and a
request-correlation ID surfaced on every response. Rate limiting is `ThrottlerModule` at 60 requests
per 60 seconds. OpenAPI/Swagger is served **only** when `NODE_ENV !== 'production'`.

---

## 5. Jurisdiction Control: Geofencing and the Tier Matrix

**Implementation:** `src/api/services/geofencing.ts`, `src/api/services/security/geofence.service.ts`,
`src/api/src/common/guards/geofence.guard.ts`,
`src/api/src/modules/compliance/compliance-policy.service.ts`
**Legal companion:** [`../legal/state-jurisdiction-matrix-DRAFT.md`](../legal/state-jurisdiction-matrix-DRAFT.md)

A forfeited stake is platform revenue in some US states and an unlawful wager in others. Styx
therefore classifies every request's jurisdiction before permitting a monetized action.

### 5.1 The three tiers

| Tier | Meaning | Effect on a failed Oath |
|---|---|---|
| `TIER_1` FULL_ACCESS | Predominance-doctrine states | Stake may be **captured** as revenue |
| `TIER_2` REFUND_ONLY | Licensing / material-element states | Stake **must be refunded** |
| `TIER_3` HARD_BLOCK | Prohibited or unresolvable | Monetized actions blocked entirely |

`STATE_TIERS` enumerates all 50 states plus DC explicitly.

### 5.2 Fail-closed by construction

`classifyJurisdiction()` returns `TIER_3` for: a null geo result, any non-US country, a state code
that fails strict normalization, and **any US state not explicitly listed in `STATE_TIERS`**. Every
`TIER_1` jurisdiction must be enumerated; there is no permissive default. `normalizeStateCode()`
accepts only a two-letter A–Z code or a known full state name — free text, ZIP codes, and garbage
resolve to `null`, which fails closed.

### 5.3 Settlement disposition follows the tier

`resolveStakeDisposition()` (`src/api/services/escrow/disposition.ts`) is a single pure function
that every escrow provider delegates to, so the Stripe rail and the internal-ledger rail cannot
drift apart:

- Oath **completed** → `REFUND`, always, in every tier.
- Oath **failed** → `CAPTURE` in `TIER_1` only; `REFUND` in `TIER_2` and (defensively) `TIER_3`.

### 5.4 Honest limits

- IP-to-state resolution uses the bundled **GeoLite2** database via `geoip-lite`. It is an IP
  heuristic. A VPN or a mobile carrier's egress can misplace a user; the control is a compliance
  guardrail, not identity-grade location proof. The `x-styx-state` override header is **ignored in
  production** and the attempt is logged.
- There are **two** sources of jurisdiction truth: the compile-time `STATE_TIERS` map and a runtime
  `jurisdictions` DB registry that admins can update (with TruthLog audit). Reconciliation policy
  between them is an open governance question, tracked in the state-jurisdiction matrix.
- The tier assignments themselves are **not counsel-signed** (issue #317). Where our own 50-state
  survey and the code disagreed, the code was tightened to the more restrictive value — tightening
  needs no counsel, relaxing does.

---

## 6. Device Integrity: App Attest and Play Integrity

**Implementation:** `src/api/services/security/device-attestation.service.ts` (~1,100 lines)

Proof submission comes from mobile clients. A rooted device, an emulator, or a repackaged binary
can fabricate sensor and media evidence, so Styx verifies the *device and app* server-side before
trusting a client.

### 6.1 iOS — Apple App Attest

Registration parses the CBOR attestation object with a **strict, purpose-built decoder** (no
indefinite lengths, no tags, no floats, text-string map keys only, depth-capped at 16 — a hardened
subset rather than a general-purpose CBOR library), then verifies:

- the certificate chain against the Apple App Attest root CA (`APPLE_APP_ATTEST_ROOT_CA_PEM`);
- the nonce binding — `SHA256(authData || SHA256(challenge))` against the credential certificate's
  `1.2.840.113635.100.8.2` extension;
- `rpIdHash == SHA256(APPLE_APP_ATTEST_APP_ID)`, the aaguid, and the initial counter;
- `keyId == SHA256(credential public key)`.

Only then is the **real** public key stored. Assertions are verified with `crypto.verify` against
that stored key over `SHA256(authenticatorData || SHA256(clientDataJSON))`, with **strict counter
monotonicity**: a replayed or rolled-back counter is REJECTED outright, never downgraded to a
"weak but verified" verdict. `rpIdHash` comparison is constant-time.

### 6.2 Android — Google Play Integrity

The Play Integrity token is treated as an untrusted JWS. Signature verification against a key fetched
and cached from the Google JWKS endpoint, expiry, and the **signed payload's** package name against
`ANDROID_PACKAGE_NAME` are all checked **before any verdict field is read**. The client-claimed
`requestPackageName` is never trusted on its own.

Verdicts map as: `MEETS_STRONG_INTEGRITY` or `MEETS_DEVICE_INTEGRITY` → `STRONG`;
`MEETS_BASIC_INTEGRITY` → `WEAK`; anything else → `NONE` (unverified). A `STRONG` verdict is
**downgraded to `WEAK`** on soft risk signals — a verdict older than 15 minutes, a missing timestamp,
or an app not `PLAY_RECOGNIZED`. `NONE` is never upgraded.

### 6.3 Fail-closed configuration, and the one exception

Missing attestation configuration throws at verification time. The single exception:
**non-production** with `DEVICE_ATTESTATION_DEV_BYPASS=true` returns a simulated verdict labelled
`deviceIntegrity: 'DEV_BYPASS'` — never `'STRONG'` — performs no writes, and appends a
`DEVICE_ATTESTATION_DEV_BYPASS` event to the TruthLog. The bypass is ignored entirely when
`NODE_ENV === 'production'`.

Every rejection path (unknown key, counter replay, rpId mismatch, package mismatch, expired token)
appends a typed event to the TruthLog with its risk flags.

---

## 7. Peer Audit Integrity: Redaction, Consensus, Honeypots, Collusion

This is the section a conventional security review will not have seen before. The peer-audit layer
has its own adversary model: the reviewer.

### 7.1 Auditors never see raw media

**Implementation:** `src/api/services/media/redaction.service.ts`,
`src/api/src/modules/fury/fury.controller.ts`, `src/api/src/modules/proofs/proofs.service.ts`

Proof media is processed into a redacted derivative before review. Two profiles exist:
`FACE_BLUR` (FFmpeg face detection plus blur, falling back to a conservative **full-frame** blur when
the detection filter is unavailable — the fallback is deliberately over-broad so PII is redacted
even when detection fails) and `VOICE_PIVOT` (pitch shift to defeat voice identification while
preserving intelligibility).

The serving rule is keyed on the **presence of the masked asset**, never on a `redaction_status`
string. That is a scar, not a preference: the status string takes at least four different values
across the codebase (`MASKED`, `COMPLETED`, `NOT_APPLICABLE`, `null`), and a comparison against one
of them fell through to the unredacted original on the production path. The current code reads
`row.masked_media_uri ?? null` and, absent a masked asset, serves **no URL at all**.

Auditors also see the subject only as a `subject_alias`, never as an identity.

### 7.2 Weighted consensus

**Implementation:** `src/api/src/modules/fury/consensus.engine.ts`,
`src/api/services/fury-router/fury-router.worker.ts`,
`src/shared/fury-logic/consensus.resolver.ts`

Each proof is routed to `FURY_CONSENSUS_SIZE = 3` reviewers, selected at random from the eligible
pool. Eligibility enforces five isolation rules in a single query — the reviewer must hold the
`FURY` role with an integrity score of at least 20, and must **not** be the submitter, in the
submitter's last-known state (geographic isolation), in the submitter's social guild, in the
submitter's enterprise, or one of the submitter's accountability partners. Votes are weighted by the reviewer's history (completed audits, agreement
with final consensus, false-accusation rate) into a voting power of 1.0–2.0×. A verdict resolves
only when one side exceeds **66%** of total power; otherwise the outcome is `SPLIT`/`UNCERTAIN` and
no verdict is forced. The shared `ConsensusResolver` applies the same symmetric band
(>0.66 → BREACH, <0.33 → CLEAN, else UNCERTAIN).

### 7.3 Honeypots

**Implementation:** `src/shared/fury-logic/honeypot.engine.ts`,
`src/api/services/intelligence/honeypot.service.ts`

Synthetic proofs with a known-correct answer are injected into the audit stream on a **6-hourly
cron**. A Fury who votes against the known answer is flagged, and the penalty is financial, not
merely reputational.

Generation avoids the obvious weaknesses: identifiers are `randomUUID()` (non-enumerable), sender
hashes are 20 random bytes, and content is drawn from randomized template pools using
`crypto.randomInt` — a CSPRNG with a uniform distribution, chosen specifically to avoid both
`Math.random` predictability and the modulo bias of `randomBytes(1)[0] % n`. A honeypot that is
detectable by its text is not a honeypot.

### 7.4 The money side of an audit

**Implementation:** `src/api/src/modules/fury/fury.worker.ts`

`AUDITOR_STAKE_AMOUNT` is **200 cents ($2.00)**. A correct Fury is credited that amount from
`FURY_BOUNTY_POOL`; an incorrect one — including a honeypot failure — is debited that amount to
`SYSTEM_REVENUE`. Every posting carries a deterministic idempotency key
(`consensus:{proofId}:{furyId}:bounty|penalty`) and `metadata.consensusProofId`, and the worker
refuses to re-run the money block if any entry for that proof already exists. Each payment and
penalty also appends `FURY_BOUNTY_PAID` / `FURY_PENALTY_CHARGED` to the TruthLog.

### 7.5 Collusion detection

**Implementation:** `src/api/services/security/collusion-detection.service.ts`

A windowed analysis over recent audit history looks for four ring signals: pairs that co-vote at an
abnormal rate, pairs whose verdicts are always identical, pairs whose votes land inside a tight
temporal window (5 minutes), and pairs that appear together on assignments far more often than the
pool size predicts. `AntiSybilService` (`src/api/src/modules/security/anti-sybil.service.ts`)
separately correlates shared device fingerprints, shared payment instruments, and shared IPs, and
carries an appeal path for legitimate shared-device cases.

---

## 8. Privacy Engineering

### 8.1 Pseudonymization is keyed

**Implementation:** `src/api/services/security/anonymization.service.ts`

Analytics and export paths pass user records through `AnonymizationService`. Email is replaced with
a **keyed HMAC-SHA256** over the normalized address — not a bare SHA-256, which is rainbow-table
reversible and forms a stable cross-record join key. Names are replaced with a salted pseudonym
token (`user-1a2b3c4d`), not initials, because initials still narrow re-identification in a small
cohort. Phone is redacted outright and `stripe_customer_id` is deleted.

The keying secret (`ANONYMIZE_SALT` or `APP_SECRET`) **fails closed in production**: if neither is
set, the service refuses to emit a guessable hash rather than degrading silently. A clearly-labelled
non-secret fallback exists for local development only.

### 8.2 Data subject rights

**Implementation:** `src/api/src/modules/users/gdpr.service.ts`

`exportUserData()` assembles a structured export of the user's own records. Deletion is a two-phase
process: a deletion request marks the account, and `processPendingDeletions()` acts only on requests
older than **30 days**, running the erasure statements, cancelling any stored subscription, and
appending TruthLog events throughout.

Note the intentional tension with §2: TruthLog entries are immutable by database trigger. Erasure
anonymizes the user record; it does not rewrite history. Payload minimization at append time — not
retroactive deletion — is what keeps the two compatible.

### 8.3 Secret hygiene in the repository

The repository is public. A `secret-scan` CI workflow blocks any commit containing
credential-shaped strings, and a line that is a verified false positive must carry an explicit
`// allow-secret` marker — a deliberate, reviewable annotation rather than a silent suppression.

---

## 9. Financial Rails and Escrow

**Implementation:** `src/api/services/escrow/stripe.service.ts`,
`src/api/src/modules/payments/fbo-account.service.ts`
**Legal companion:** [`../legal/escrow-agreement-DRAFT.md`](../legal/escrow-agreement-DRAFT.md)

Styx never receives, stores, or transmits card numbers; Stripe holds all payment instruments.

A stake is taken as a Stripe PaymentIntent with `capture_method: 'manual'` — an **authorization
hold**, not a transfer of funds into a Styx-controlled account. At settlement the hold is either
captured (in whole or in part) or released. Both operations carry Stripe idempotency keys, and the
capture key incorporates the capture *amount*, because a fixed key reused with a different
`amount_to_capture` makes Stripe replay the first request rather than perform the new one.

FBO (For Benefit Of) connected accounts are registered per ISO-3166-2 jurisdiction and selected by
the contract owner's geofence-maintained state, so custody routing follows jurisdiction. Rotation
selects the **newest** active account, since the normal register-then-deactivate sequence leaves two
rows active for a window.

### 9.1 AML

`src/api/src/modules/compliance/aml-screening.service.ts` implements: screening against an
**internal** watchlist table; structuring detection (three or more stake postings, each under
$3,000, inside a 24-hour window, aggregating to $10,000 or more); rapid-movement detection over a
48-hour window; risk classification; and SAR drafting with history.

Two limits, both material:

- **The watchlist is internal.** There is no live OFAC feed and no third-party sanctions-list
  integration. A user is screened against rows we put there ourselves.
- **`detectStructuring()` does not currently execute.** Its query selects
  `entries.amount_cents`, and the `entries` table's column is `amount`
  (`src/api/database/schema.sql`).
  The call therefore throws at runtime rather than returning a pattern. Every specification in this
  estate mocks the `pg` Pool, so the unit tests pass and the defect is invisible to them — which is
  precisely why it is disclosed here rather than left for a customer's auditor to find. Treat
  structuring detection as **not in service** until the column reference is fixed and exercised
  against a real database.

### 9.2 Identity verification

Identity verification runs through Stripe Identity. The webhook signature is verified before any
field in the payload is trusted — a forged callback cannot flip a user to verified. A `MOCK`
provider path exists for development and is gated unreachable in production.

---

## 10. Software Supply Chain and Secure Development

| Control | As implemented |
|---|---|
| Static analysis | GitHub CodeQL (`.github/workflows/codeql.yml`) on pull requests |
| Secret scanning | `.github/workflows/secret-scan.yml` blocks credential-shaped strings |
| Dependency alerts | GitHub Dependabot |
| Type safety | TypeScript strict mode; `tsc --noEmit` in CI |
| Branch protection | Enforced and diffed by `scripts/branch-protection.sh` and `scripts/branch-protection-diff.mjs` |
| Release gates | `scripts/validation/` — phantom-money check, simulator-spoof check, full-loop check, redacted-build check, security-invariant check, claim-drift check, compliance-artifact check, Fury-crucible simulation, realm-sync check |

The **claim-drift check** (`scripts/validation/07-claim-drift-check.js`) is the gate that governs
this document's category: it fails the build when a status document references a repository path
that does not exist. The **compliance-artifact check**
(`scripts/validation/08-compliance-artifact-check.sh`) blocks deploys when a required compliance
artifact is absent, expired, or fails its content-hash comparison against the recorded value.

---

## 11. Operational Posture

Styx is operated by a single founder. That is a material fact for an enterprise reviewer and is
stated rather than obscured: there is no separation-of-duties between the developer and the
production operator, no on-call rotation, and no security team.

The compensating controls are structural rather than organizational — the append-only TruthLog
records admin actions, `RoleGuard` reads authority from the database on every request, ledger
postings are idempotent and invariant-checked, and every release gate above runs in CI rather than
by hand. Hosting, database management, patching, and backups are Render's responsibility under a
managed-platform model; Cloudflare fronts all public traffic. See
[`security-questionnaire.md`](security-questionnaire.md) §3, §5, §6, and §10 for hosting,
backup/DR, incident response, and access-control specifics.

---

## 12. Roadmap — Not Yet Implemented

Everything in this section is **absent from the codebase today**. It is listed so that a reviewer
can distinguish a gap we know about from one we are hiding.

| Item | Status |
|---|---|
| SOC 2 Type II | Not started. No auditor engaged. |
| Third-party penetration test | Not performed. |
| Multi-factor authentication | Not implemented. |
| SAML 2.0 SSO | Not implemented. The `exchangeEnterpriseToken` path verifies a pre-shared HS256 assertion, which is not SAML. |
| Asymmetric (RS256) token signing | Not implemented. Session JWTs are HS256. |
| Token revocation list | Not implemented. Revocation is by refresh-token rotation and the database-read role/ban check, not a blacklist. |
| External anchoring of the TruthLog | Not implemented. No notarization to an external timestamping service. |
| Live sanctions-list (OFAC) screening | Not implemented. Screening is against an internal watchlist. |
| Structuring detection in service | **Broken, not merely absent.** `detectStructuring()` queries a column that does not exist (§9.1). Needs a fix and an integration test, not a roadmap entry. |
| HIPAA Business Associate Agreements | Template drafted ([`../legal/hipaa-baa-template-DRAFT.md`](../legal/hipaa-baa-template-DRAFT.md)), **not counsel-reviewed, none executed**. |
| Counsel sign-off on jurisdiction tiering | Open — issues #315 (retain counsel) and #317 (matrix sign-off). |
| Responsible disclosure policy | Not published. No `security.txt` yet. |
| Disaster-recovery test | Not performed. |

---

## 13. Reporting a Vulnerability

Until a published disclosure policy exists (§12), report suspected vulnerabilities by opening a
GitHub security advisory on `4444J99/peer-audited--behavioral-blockchain`. Please do not open a
public issue containing exploit detail.
