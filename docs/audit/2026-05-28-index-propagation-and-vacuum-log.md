# Index Propagation & Vacuum Log — 2026-05-28

Session close-out record for the full issue-discovery → hardening → review → CI-health
work spanning **2026-05-26 through 2026-05-28** (session `f339a589`). This document is
the **in-repo delivery rail** for the IRF registry: the canonical registry lives in
`meta-organvm/organvm-corpvs-testamentvm/INST-INDEX-RERUM-FACIENDARUM.md`, which is in
a **different repository** outside this container's authorized GitHub scope. The operator
uses this document as source material for `organvm irf`.

Continues from `2026-05-27-cross-agent-handoff.md`. All PRs (#605–#611) are now merged.
`main` @ `128e6a6`.

---

## Completed work (for IRF `## Completed`)

### Phase 1 — Full-coverage issue discovery (`/loop`)
- Ran a full multi-angle `/loop` audit of the Styx NestJS monorepo; surfaced and
  categorized **15+ critical / high / medium / low** findings across ledger, payments,
  Fury consensus, auth, compliance, proofs, GDPR, behavioral-physics, and honeypot.
- Full findings inventory: `docs/audit/2026-05-26-issue-discovery-hardening-commit-605.md`.

### Phase 2 — Security & correctness hardening (PR #605, squash `95bc00f`)

**Double-entry ledger & audit log**
- `ledger.service.ts`: replaced tautological SUM check with real structural invariants
  (non-positive amounts, self-transfers, orphaned account refs via LEFT JOIN).
- `truth-log.service.ts`: `event_type` added to SHA-256 hash preimage; `pg_advisory_xact_lock`
  serializes concurrent appends; explicit `sequence_index` (not BIGSERIAL default).

**Payments / settlement**
- `stripe.service.ts`: `captureStake` now idempotent on `'succeeded'` intent, enabling
  clean retry recovery without double-capture.
- `settlement.worker.ts`: stable idempotency keyed on `(contract_id, type, amountCents)`
  so BullMQ retries with different run IDs cannot double-post ledger entries; fresh
  PROCESSING runs skipped (<5 min) to prevent concurrent double-settlement.
- `stripe-payout.provider.ts`: fail-closed allowlist for `canceled` → SUCCESS — only
  `null` and `'requested_by_customer'` cancellation reasons count as deliberate releases;
  all other reasons (abandoned, automatic, fraudulent, etc.) map to FAILED.

**Fury consensus & enforcement**
- `fury.worker.ts`: post-claim work wrapped in try/catch; error path reverts
  `RESOLVING` → `UNDER_REVIEW`; `honeypot_expected_verdict` read only when `is_honeypot = true`.
- `enforcement.service.ts`: `confirmCase` is now TOCTOU-safe — atomic
  `UPDATE … WHERE status='PENDING_REVIEW' RETURNING` prevents concurrent double-penalty.

**Contracts**
- `contracts.service.ts`: capture uses outer transaction client (atomic with status change);
  `resolveContract` fallback checks `rowCount`; `useGraceDay` per-calendar-month via
  `grace_period_month` column; `invitePartner` ownership check; `fileDispute` no longer
  falls back to `contractId` as `proofId`.

**Auth / role / secrets**
- `auth.service.ts`: JWT secret throws in ALL environments (no hardcoded fallback);
  constant-time login for unknown users; enterprise SSO validates `token_type` claim.
- `role.guard.ts`: live DB role/ban check on every request (no 15-minute stale-privilege window).
- `anonymize.service.ts`, `webhook.service.ts`: lazy getter properties for secrets
  (not field initializers) — prevents DI bootstrap crash when env var is absent.

**Compliance / geofence**
- `compliance-policy.service.ts`: fail-closed by default; `cf-ipstate` only trusted when
  `TRUST_PROXY_HEADERS=true`; real age ≥ 18 gate.
- `compliance.controller.ts`: Stripe Identity webhook signature verification; medical
  exemption endpoints require `AuthGuard`.

**Proofs / GDPR**
- `proofs.service.ts`: non-owners never receive raw `media_uri`; `content_type`,
  `description`, `uploaded_at` restored to SELECT.
- `gdpr.service.ts`: `GDPR_ERASURE_COMPLETED` is a properly chained hash-append
  (advisory lock + SHA-256 + explicit `sequence_index`).

**Shared algorithms**
- `money.ts`: `toCents` throws on non-finite input.
- `loss-aversion.engine.ts`: `totalDays <= 0` guard; negative volatility clamped to 0.
- `honeypot.engine.ts`, `honeypot.service.ts`: `crypto.randomInt` for unbiased content
  selection (was modulo-biased `randomBytes(1)[0] % n`).

**New migrations**
- `027_account_quarantine_status.sql` — `accounts.status TEXT DEFAULT 'ACTIVE'`.
- `028_proofs_honeypot_expected_verdict.sql` — `proofs.honeypot_expected_verdict TEXT`;
  column was referenced in code but missing from schema, crashing all consensus resolution.
- `029_contract_grace_period_month.sql` — `contracts.grace_period_month TEXT` for
  per-calendar-month grace day reset.

**Gate & CI**
- `scripts/validation/06-security-invariant-check.ts`: pattern coverage extended to
  all three guard directories; real default-secret patterns added.
- `.github/workflows/ci.yml`: duplicate `codeql` job removed (runs in dedicated `codeql.yml`).

**Test suite**: `tsc --noEmit` clean; **908 tests / 93 suites** green (API).

### Phase 3 — Adversarial code review (`/code-review`, 5 angles)
- Ran a 5-angle × 8-candidate review; surfaced 15 regressions introduced by the Phase 2
  hardening (tautological ledger check, missing DB column, undefined helper method,
  9 contract spec failures, 2 GDPR spec failures, and more).
- All 15 regressions fixed; fixes bundled into the subsequent PRs.

### Phase 4 — Runtime verification (`/verify`)
- Geofence: confirmed fail-closed default; proxy-header trust gated on `TRUST_PROXY_HEADERS`.
- Settlement worker: idempotency confirmed under simulated concurrent dispatch.
- `build_and_test` CI: green via summary job (#608) after matrix rename.

### Phase 5 — Release engineering & additional remediation (PR #607, squash `f45c80c`)
- 89 additional audit findings remediated.
- Branch-protection ruleset: CODEOWNERS approval + merge queue (`refs/heads/main`).
- KYC default ON; SSRF fixed via IP-pinning; ledger idempotency migration 030.
- Canonical branching/merge strategy documented.

### Phase 6 — CI health restoration (PRs #608 `8566d32`, #611 `b1dd946`)
- Stable `build_and_test` summary job — required-check name never changes with matrix shape.
- `src/shared` ts-jest config: 119 previously-skipped shared tests now run.
- `test-harness` lint fixed (`tsc --noEmit`).
- `--coverage --ci` flags no longer forwarded globally (was blocking suite loading).

### Phase 7 — Index sync & handoff (PR #609, merged `1115fb1`)
- `.claude/MEMORY.md` and `docs/CLAUDE.md` updated with new required env vars and
  architecture deltas.
- `docs/audit/2026-05-26-index-propagation-and-vacuum-log.md` — first propagation log.
- `docs/audit/2026-05-27-cross-agent-handoff.md` — durable cross-agent handoff.

### Phase 8 — Ruleset schema fix (PR #610, `128e6a6`)
- Removed unsupported `automatic_copilot_code_review_enabled` field from
  `.github/rulesets/main.json`.

---

## Data-integrity audit (nothing-lost proof)

- `main` @ `128e6a6`; all 8 PRs merged and squash-committed.
- All 6 original feature-branch commits (`claude/issue-discovery-reporting-i090y`) are
  squash-merged as `95bc00f`; their diff is byte-identical to the squash tree.
- Working tree: **0 uncommitted changes, 0 stashes, 0 untracked working files**.
- `local : remote = 1 : 1` at the content level.

---

## Cross-index propagation status

| Index | Status | Note |
|-------|--------|------|
| IRF master registry (`meta-organvm/...`) | **BLOCKED — unreachable** | Outside this container's GitHub scope. Operator must run `organvm irf`. This document is the source material. |
| GitHub issues (this repo) | **CHECKED — none closed** | No open issue is resolved by this work. Contributes to #555/#556 (phase gates) but does not close them. #604 (npm audit ERESOLVE) remains open and separate. |
| Omega scorecard | **N/A here** | Lives in `meta-organvm`; unreachable. |
| `inquiry-log.yaml` | **N/A** | Not SGO/inquiry work. |
| `seed.yaml` | **CHECKED — no change** | No org-edge/agent/governance change. |
| `docs/CLAUDE.md` | **UPDATED** | New required env vars added (Phase 7). Architecture deltas in `.claude/MEMORY.md`. |
| Concordance | **N/A** | No new cross-repo IDs introduced. |
| `.claude/MEMORY.md` | **UPDATED** | Full remediation record + Known Gaps + CI-health notes appended (Phase 7). |

---

## Vacuums found — researched, planned, logged

1. **`docs/logos/` tetradic layer is MISSING (Symmetry 0.0 / VACUUM).**
   - *Research:* `docs/CLAUDE.md` declares `telos.md`, `pragma.md`, `praxis.md`,
     `receptio.md`, `alchemical-io.md` in `docs/logos/` and reports the layer "currently void."
   - *Plan:* build the five docs grounded in real repo state (this audit provides most of
     `pragma` and `praxis` content). Scoped as a dedicated follow-up, not a security tag-along.
   - *Status:* **LOGGED — not yet built.** Carry-over from 2026-05-26 log.

2. **Advisory CI jobs are pre-existing red (`terraform_validate`, `beta_readiness`, `e2e`).**
   - *Research:* all three have `continue-on-error: true`; they need real Terraform, live API
     endpoints, and browser environments that don't exist in this container.
   - *Plan:* Terraform fmt/validate is a one-line local fix. Beta readiness requires `BETA_API_URL`
     secret. E2E requires a deployed web build.
   - *Status:* **LOGGED — operator action required for secrets/infra.**

3. **New required env vars not yet provisioned in production environments.**
   - `APP_SECRET`, `ANONYMIZE_SALT`, `ZK_EXHAUST_SECRET`, `STYX_WEBHOOK_SECRET`,
     `INTERNAL_SERVICE_TOKEN`, `STRIPE_IDENTITY_WEBHOOK_SECRET`, `ENTERPRISE_SSO_SECRET`,
     `TRUST_PROXY_HEADERS` (if behind proxy).
   - *Status:* **LOGGED — operator must set in Render + GitHub Environments.**

4. **PR #604 (npm audit ERESOLVE) is open and unrelated to this work.**
   - *Research:* ERESOLVE conflict + audit vulns unrelated to the hardening work.
   - *Status:* **LOGGED — separate PR, needs independent review.**

5. **CodeQL SSRF alert** — may still surface as a code-scanning check result.
   - *Research:* real DNS-rebinding risk is fixed via IP-pinning (PR #607); remaining
     alert is a static false-positive.
   - *Status:* **LOGGED — operator must dismiss in Security → Code scanning.**

6. **IRF delivery from within this container.**
   - *Research:* container's GitHub MCP is scoped to this one repo; `organvm` CLI is
     unavailable; `meta-organvm/...` is unreachable.
   - *Solution:* the established in-repo delivery rail (this document) commits the
     propagation record here; operator runs `organvm irf` from a context with access.
   - *Status:* **RESOLVED — pattern documented and implemented.**

---

## Operator checklist (carry to the universal context)

- [ ] `organvm irf` — move all Phase 1–8 items above to `## Completed`; update statistics.
- [ ] Provision new env vars in Render services + GitHub Environments:
  `APP_SECRET`, `ANONYMIZE_SALT`, `ZK_EXHAUST_SECRET`, `STYX_WEBHOOK_SECRET`,
  `INTERNAL_SERVICE_TOKEN`, `STRIPE_IDENTITY_WEBHOOK_SECRET`, `ENTERPRISE_SSO_SECRET`.
  Set `TRUST_PROXY_HEADERS=true` on deployments behind a trusted reverse proxy.
- [ ] Dismiss CodeQL SSRF alert (Security → Code scanning). Justification: connection
  pinned to pre-validated IP, all A-records validated, redirects disabled, tenant-gated.
- [ ] Review and merge PR #604 (npm audit ERESOLVE fix) independently.
- [ ] Fix advisory CI jobs once real infra is available:
  `BETA_API_URL`, `BETA_WEB_URL`, `BETA_ENV_LABEL` secrets for beta_readiness;
  `terraform fmt` in a Terraform-equipped environment.
- [ ] Build `docs/logos/` tetradic layer (telos / pragma / praxis / receptio / alchemical-io).
  This is a tracked VACUUM (Symmetry 0.0 per `docs/CLAUDE.md`).
- [ ] Update omega scorecard and concordance if applicable (lives in `meta-organvm`).
