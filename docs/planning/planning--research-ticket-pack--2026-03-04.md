# Research Ticket Pack (Second Pass) — 2026-03-04

## Scope
This pack converts unresolved research and partial controls into executable implementation tickets.

Input anchors:
- `docs/FEATURE-BACKLOG.md`
- `docs/planning/planning--implementation-status.md`
- `docs/planning/planning--drift-check--2026-03-04.md`
- `docs/planning/planning--unity-contention-register--2026-03-04.md`

## Unity Lock-Ins (Non-Negotiable)
- MVP remains iOS-first and No-Contact recovery-first.
- Skill-based framing must remain explicit; no chance-based outcome mechanics in Phase 1.
- Jurisdiction controls, age gating, and responsible-use controls remain release gates.
- Cohort accountability model requires participant visibility (`ACTIVE` / `OUT`) and pod cap discipline.
- Verification must trend toward hardware-backed trust, with fallback telemetry while native bridges are staged.

## Contention Decisions (Chosen Paths)
- Contention: Stripe-only vs high-risk processor routing.
  Decision: implement a payment-router abstraction with Stripe-first plus failover stubs; no hard provider lock.
- Contention: digital-exhaust-only vs native wearable bridge.
  Decision: keep attestation + digital exhaust for continuity, ship native HealthKit in parallel with strict manual-entry exclusion.
- Contention: pod size ambiguity (4-6 vs 5).
  Decision: enforce max 5 in MVP runtime controls.
- Contention: solo commitment vs shared-pot competition.
  Decision: Phase 1 stays solo commitment contracts only; shared-pot/PvP remains post-beta with separate legal gates.

## Prioritized Execution Queue

### TKT-P0-001 — Real-Money FBO Settlement Activation
- Source items: `F-CORE-04`, `F-AEGIS-02`, legal guardrails docs.
- Why now: beta blocker for actual money movement.
- API diff:
  - Add `POST /payments/settlements/:contractId/preview` for deterministic payout breakdown.
  - Add `POST /payments/settlements/:contractId/execute` with idempotency key enforcement.
  - Add `GET /payments/settlements/:contractId/status` for reconciliation visibility.
- Schema diff:
  - Migration: `settlement_runs` table (contract_id, provider, quote_json, status, idempotency_key, executed_at, last_error).
  - Migration: `entries.metadata` contract settlement keys indexed for audit (`settlement_run_id`, `provider`).
- UI diff:
  - Desktop Judge panel: settlement status card and retry controls for failed runs.
  - Web admin: settlement timeline with provider + ledger event correlation.
- Legal/compliance gates:
  - Signed legal review on custody model (no omnibus custody).
  - Processor terms review for skill-contest category.
  - SOC-style auditability check for payout trace.
- Acceptance criteria:
  - Fully deterministic quote + execute + reconcile lifecycle.
  - No duplicate captures/refunds under retries.
  - Ledger and truth-log parity for every settlement run.
- Tests:
  - Idempotent execute retry suite.
  - Processor timeout/recovery simulation.
  - Ledger invariant checks under partial failure.

### TKT-P0-002 — Native iOS Camera Proof Capture (Gallery Disabled)
- Source items: `F-MOBILE-01`, verification architecture docs.
- Why now: beta blocker for proof integrity.
- API diff:
  - Extend `POST /proofs/upload-url` with `captureSource=native_camera` and signed nonce challenge.
  - Enforce proof submissions to include nonce echo + capture timestamp delta.
- Schema diff:
  - Migration: add `capture_source`, `capture_nonce`, `capture_verified` to `proofs`.
- UI diff:
  - Mobile `ProofCaptureScreen`: native camera only, no gallery picker fallback for high-integrity streams.
  - Visual challenge overlay (“weigh-in word”/nonce) persisted into upload metadata.
- Legal/compliance gates:
  - App Store review checklist for camera/recording disclosures.
  - Privacy policy language for capture metadata.
- Acceptance criteria:
  - Gallery import blocked in targeted oath streams.
  - Nonce mismatch auto-rejects proof before Fury routing.
- Tests:
  - Native module integration tests (device + simulator constraints).
  - Nonce replay rejection tests.

### TKT-P0-003 — KYC Runtime Enforcement + Progressive Stake Tiers
- Source items: `F-AEGIS-05`, implementation-status “Planned” row.
- Why now: required for real-money scaling and fraud/AML posture.
- API diff:
  - Add `POST /compliance/kyc/start` and `GET /compliance/kyc/status`.
  - Gate `POST /contracts` by tiered KYC requirement above configured stake thresholds.
- Schema diff:
  - Migration: `users.kyc_status`, `users.kyc_level`, `users.kyc_verified_at`, `users.kyc_provider_ref`.
  - Migration: `kyc_events` audit table.
- UI diff:
  - Web/mobile onboarding step for identity verification and status polling.
  - Contract creation UI shows stake cap based on KYC tier.
- Legal/compliance gates:
  - Vendor DPA + retention policy.
  - Jurisdiction mapping for ID verification requirements.
- Acceptance criteria:
  - High-stake contracts blocked without required KYC level.
  - All KYC transitions truth-logged and queryable.
- Tests:
  - Tier gating tests around threshold boundaries.
  - Provider error and retry flows.

### TKT-P0-004 — Geofence Fail-Closed Hardening + Policy Registry
- Source items: `F-AEGIS-02` (partial), legal geofencing mandates.
- Why now: direct regulatory exposure if bypassed.
- API diff:
  - Add policy introspection endpoint `GET /compliance/policy/effective` (request-scoped decision trace).
  - Enforce `fail-closed` for monetary-risk routes in production when geo headers are absent/low-confidence.
- Schema diff:
  - Migration: `compliance_decisions` table for sampled request decisions and overrides.
- UI diff:
  - Web legal pages: state availability matrix + restricted-state messaging flow.
- Legal/compliance gates:
  - Counsel sign-off on state matrix and change-control cadence.
- Acceptance criteria:
  - No transacting path succeeds for unresolved jurisdiction in production mode.
  - Override headers remain test-only and blocked in prod.
- Tests:
  - Route-by-route geofence guard regression pack.

### TKT-P1-005 — Recovery Danger-Zone Lockdowns + 24h Timelock
- Source items: `F-AEGIS-04` (partial), `F-CORE-11` (not started).
- Why now: directly linked to No-Contact adherence outcomes.
- API diff:
  - Add `POST /contracts/:id/recovery/break-request` to queue intentional breaks.
  - Add `POST /contracts/:id/recovery/break-cancel` for cancellation during cooldown.
  - Add `GET /contracts/:id/recovery/lock-status`.
- Schema diff:
  - Migration: `recovery_break_requests` table (requested_at, unlock_at, reason, status).
- UI diff:
  - Mobile contract detail: explicit cooldown countdown and cancel CTA.
  - Dashboard danger-zone banners for Day 3 and Day 21 lock windows.
- Legal/compliance gates:
  - Verify no coercive design beyond disclosed commitment contract terms.
- Acceptance criteria:
  - No immediate break action is possible once request starts.
  - Timelock state is immutable/auditable.
- Tests:
  - Scheduler tests for unlock/cancel transitions.
  - Day 3/21 lock-window policy tests.

### TKT-P1-006 — Remote Push Pipeline (APNs/FCM) + Policy Matrix
- Source items: `F-MOBILE-03` (partial), behavioral reminders.
- Why now: reminders are core for attestation compliance.
- API diff:
  - Add `POST /notifications/push/register` hardening with platform token validation.
  - Add internal dispatch job API for attestation/grace/deadline templates.
- Schema diff:
  - Migration: `push_tokens` (user_id, platform, token_hash, status, last_seen_at).
  - Migration: `push_deliveries` (template, payload_hash, provider_result, delivered_at).
- UI diff:
  - Mobile settings screen for notification channel controls.
- Legal/compliance gates:
  - Consent and notification preference disclosures.
- Acceptance criteria:
  - Remote push delivery path operational for iOS + Android.
  - Duplicate token and stale token handling implemented.
- Tests:
  - Provider mock tests + invalid token demotion.

### TKT-P1-007 — Native HealthKit Bridge + Server Metadata Filter
- Source items: `F-VERIFY-02`, `F-VERIFY-05`, `F-VERIFY-16`.
- Why now: close the verification trust gap for health data.
- API diff:
  - Add `POST /oracles/healthkit/samples` ingest endpoint for signed device payloads.
  - Apply strict server-side rejection for `WasUserEntered=true` and disallowed source bundles.
- Schema diff:
  - Migration: `health_oracle_samples` (user_id, source_bundle_id, was_user_entered, sample_hash, accepted, reason).
- UI diff:
  - Mobile bridge settings/permissions screen with source trust explanation.
- Legal/compliance gates:
  - Health data processing disclosures and data minimization policy.
- Acceptance criteria:
  - Manual Health entries never count toward stake-protected goals.
  - Accepted sample provenance preserved end-to-end.
- Tests:
  - Ingest contract tests for accepted vs rejected samples.

### TKT-P1-008 — Cross-Lobby Anti-Collusion Routing
- Source items: `F-FURY-03`.
- Why now: prevents review capture and credibility loss.
- API diff:
  - Extend Fury assignment API with exclusion constraints (`region`, `social_graph`, `recent_pairing`).
- Schema diff:
  - Migration: `fury_assignment_edges` (reviewer_id, subject_user_id, interaction_weight, last_assigned_at).
  - Migration: `social_exclusion_edges` (source_user_id, target_user_id, reason).
- UI diff:
  - Admin moderation screen for flagged collusion clusters.
- Legal/compliance gates:
  - Bias and fairness review for exclusion heuristics.
- Acceptance criteria:
  - Assignment engine rejects prohibited reviewer-target pairs.
  - Collusion suspicion metrics visible to moderators.
- Tests:
  - Queue assignment simulation with exclusion saturation.

### TKT-P1-009 — Self-Exclusion + Responsible-Use Runtime Controls
- Source items: `F-AEGIS-06`.
- Why now: legal optics and user safety controls are currently document-only.
- API diff:
  - Add `POST /compliance/self-exclusion` and `GET /compliance/self-exclusion/status`.
  - Add runtime gate on contract creation/payment operations during exclusion window.
- Schema diff:
  - Migration: `self_exclusions` (user_id, starts_at, ends_at, reason_code, created_by).
- UI diff:
  - Web/mobile compliance page with activate/deactivate flow and help links.
- Legal/compliance gates:
  - Terms and responsible-use page update review.
- Acceptance criteria:
  - Excluded users cannot create or fund contracts.
  - Audit trail exists for every exclusion change.
- Tests:
  - Guard tests for exclusion enforcement across endpoints.

### TKT-P1-010 — Endowed Progress + Downscale UX Completion
- Source items: `F-UX-02` (partial), `F-UX-03` (partial), `F-UX-06` (stub).
- Why now: direct retention and completion impact in first 14 days.
- API diff:
  - Add `GET /contracts/:id/progress-model` exposing protected vs active vault, downscale recommendation state, and streak risk markers.
- Schema diff:
  - Migration: `contract_progress_events` table for downscale recommendations, acceptance, and protected-vault milestones.
- UI diff:
  - Web/mobile create-contract bounded stake selector with transparent loss math.
  - Dashboard progress model visualization and downscale recommendation flow.
- Legal/compliance gates:
  - Ensure copy remains skill/commitment framing, non-gambling tone.
- Acceptance criteria:
  - Users can see protected vs active stake and recommended recalibration path.
  - Downscale action is logged and testable.
- Tests:
  - UI contract creation and progress endpoint integration tests.

## Deeper Unresolved Ticket Tranche (Wave B)

### TKT-P0-011 — Forfeit Disposition Policy Engine + Refund-Only Kill Switch
- Source items: `F-LEGAL-04`, `F-LEGAL-03`, pricing redistribution contention (`Option 1/2/3`) in `brainstorm--chatgpt--2026-03-03.md`.
- Why now: unresolved payout-disposition logic is a legal blocker once real-money settlement is live.
- API diff:
  - Add `GET /payments/disposition-policy/effective` for jurisdiction-scoped disposition mode (`HOUSE_RETAINED`, `REFUND_ONLY`).
  - Add `POST /payments/disposition-policy/simulate` to preview user/platform outcomes before policy activation.
  - Add admin mutation route `PUT /compliance/jurisdictions/:code/disposition-mode`.
- Schema diff:
  - Migration: `jurisdiction_disposition_modes` table (jurisdiction_code, mode, legal_basis_ref, active_from, updated_by).
  - Migration: `settlement_runs.disposition_mode` and `settlement_runs.legal_basis_ref`.
- UI diff:
  - Compliance admin panel for per-state disposition mode changes with immutable reason capture.
  - Settlement timeline badges showing active legal mode at execution time.
- Legal/compliance gates:
  - Counsel sign-off on per-state mode mapping.
  - Written trigger criteria for emergency switch to `REFUND_ONLY`.
- Acceptance criteria:
  - Settlement execution always uses jurisdiction-specific disposition mode.
  - Mode changes are fully audit-logged and reproducible for any payout.
- Tests:
  - Regression matrix for payout outcomes by disposition mode.
  - Jurisdiction override audit and rollback tests.

### TKT-P1-012 — Weekend Multiplier Policy Engine (Recovery Stream)
- Source items: `F-CORE-10`, recovery behavior research on weekend relapse concentration.
- Why now: high-risk window is documented but not enforced in runtime policy.
- API diff:
  - Extend `GET /contracts/:id/attestation` with `riskWindow` metadata (`NORMAL`, `WEEKEND_MULTIPLIER`).
  - Add `GET /contracts/:id/recovery/penalty-preview` with base-vs-multiplied penalty math.
- Schema diff:
  - Migration: `contract_penalty_windows` (contract_id, starts_at, ends_at, multiplier, source_policy).
- UI diff:
  - Mobile and web contract views display weekend risk badge and explicit penalty delta.
- Legal/compliance gates:
  - Copy review to ensure transparent, non-deceptive penalty disclosures.
- Acceptance criteria:
  - Recovery contracts apply configured weekend multiplier during local Fri 5PM–Sun 9AM window.
  - Preview and ledger outcomes match for every multiplied event.
- Tests:
  - Timezone boundary tests across DST transitions.
  - Penalty parity tests between preview and settlement.

### TKT-P1-013 — Video Proof Processing Pipeline Completion
- Source items: `F-VERIFY-07` (partial), verification architecture pipeline.
- Why now: upload lifecycle exists, but transcode/metadata/processing states are incomplete.
- API diff:
  - Add `GET /proofs/:id/processing-status` for pipeline observability.
  - Add internal callback `POST /proofs/:id/processing-complete` for worker completion events.
  - Require challenge token metadata validation before moving to review queue.
- Schema diff:
  - Migration: `proof_processing_jobs` table (proof_id, stage, status, attempts, worker_ref, error).
  - Migration: `proofs.processing_status`, `proofs.challenge_token`, `proofs.metadata_hash`.
- UI diff:
  - Proof capture flow shows queued/transcoding/ready statuses and failure recovery CTA.
- Legal/compliance gates:
  - Retention and redaction policy review for raw video intermediates.
- Acceptance criteria:
  - Every proof reaches terminal processing status with stage-level traceability.
  - Missing/invalid challenge token prevents Fury routing.
- Tests:
  - Worker callback idempotency tests.
  - Pipeline failure and retry path tests.

### TKT-P1-014 — Fury Audit Masks (Identity Redaction) Runtime
- Source items: `F-FURY-04`.
- Why now: anti-bias and privacy controls are required before scaling reviewer pool.
- API diff:
  - Extend Fury proof detail endpoint to return masked media URL and anonymized subject handle.
  - Add `GET /fury/review/:assignmentId/mask-audit` for redaction provenance.
- Schema diff:
  - Migration: `proofs.masked_media_uri`, `proofs.redaction_status`, `proofs.redaction_profile`.
  - Migration: `fury_assignments.subject_alias` defaulting to `Target_UUID`.
- UI diff:
  - Fury review workbench displays only masked media and alias, not identity artifacts.
- Legal/compliance gates:
  - Privacy review for biometric handling and masking threshold standards.
- Acceptance criteria:
  - No reviewer-accessible view contains raw face/name identifiers for masked categories.
  - Redaction provenance is queryable per assignment.
- Tests:
  - Masking bypass regression tests.
  - Assignment payload contract tests for alias-only identity.

### TKT-P1-015 — Collusion Slashing + Honey-Trap Enforcement
- Source items: `F-FURY-09`, existing honeypot and anti-collusion signals.
- Why now: exclusion routing alone is insufficient without economic penalties.
- API diff:
  - Add `POST /fury/enforcement/evaluate` to score collusion incidents from review events.
  - Add `POST /fury/enforcement/appeals/:caseId` for controlled remediation workflow.
- Schema diff:
  - Migration: `fury_enforcement_cases` (reviewer_id, case_type, confidence, status, evidence_json).
  - Migration: `fury_penalties` (case_id, penalty_type, amount_cents, applied_at, reversed_at).
- UI diff:
  - Admin moderation panel for enforcement actions, evidence trace, and appeal outcomes.
- Legal/compliance gates:
  - Internal policy for reviewer sanctions and appeal rights.
- Acceptance criteria:
  - High-confidence collusion events trigger deterministic penalty workflow.
  - Every penalty event is tied to evidence and reversible via audited appeal.
- Tests:
  - Honey-trap detection and penalty-application simulations.
  - False-positive appeal rollback tests.

### TKT-P1-016 — Identity-Based Oath Onboarding Flow
- Source items: `F-UX-01`.
- Why now: identity framing is unresolved despite strong behavioral evidence and beta importance.
- API diff:
  - Add `POST /onboarding/identity-oath` to persist identity archetype, oath framing, and activation copy variant.
  - Add `GET /onboarding/identity-oath` for resumable onboarding state.
- Schema diff:
  - Migration: `user_identity_oaths` (user_id, identity_label, oath_category, pledge_copy, activated_at).
- UI diff:
  - Web/mobile onboarding wizard: identity selection -> oath category -> commitment terms.
- Legal/compliance gates:
  - Language review to preserve skill-contract framing and avoid coercive wording.
- Acceptance criteria:
  - New users cannot skip directly to contract creation without identity-oath completion.
  - Oath identity selection is available to downstream progress/notification surfaces.
- Tests:
  - Onboarding resume and completion tests.
  - Copy variant assignment determinism tests.

### TKT-P1-017 — Accountability Partner Protocol Completion
- Source items: `F-SOCIAL-01` (partial), recovery partner/veto requirements.
- Why now: partner concept exists in schema but consent/veto lifecycle is incomplete.
- API diff:
  - Add `POST /contracts/:id/accountability/invite` and `POST /contracts/:id/accountability/respond`.
  - Add `POST /contracts/:id/recovery/veto-break` for active partner veto path.
  - Add `GET /contracts/:id/accountability/status` for user and partner view.
- Schema diff:
  - Migration: `accountability_partner_events` table (contract_id, actor_id, event_type, payload, created_at).
  - Migration: `accountability_partners.status` enum hardening (`PENDING`, `ACTIVE`, `DECLINED`, `REVOKED`).
- UI diff:
  - Contract detail partner invite state, response handling, and veto visibility.
- Legal/compliance gates:
  - Disclosure review for partner authority and data visibility boundaries.
- Acceptance criteria:
  - Recovery break unlock path respects active partner veto policy.
  - Partner lifecycle transitions are fully auditable.
- Tests:
  - Invite/respond/veto end-to-end contract tests.
  - Permission tests for partner-limited actions.

### TKT-P1-018 — Goal-Gradient Dashboard + Live Leaderboard Completion
- Source items: `F-UX-05` (stub), `F-WEB-04` (partial), open retention visualization gaps.
- Why now: retention loop depends on clear progress telemetry and low-latency social proof.
- API diff:
  - Add `GET /dashboard/progress` aggregated payload (daily, weekly, streak, protected-vault progress).
  - Add `GET /users/leaderboard/stream` SSE endpoint for rank delta updates.
- Schema diff:
  - Migration: `leaderboard_events` (user_id, score_delta, reason, created_at).
  - Migration: `dashboard_progress_snapshots` (user_id, snapshot_date, payload_json).
- UI diff:
  - Dashboard renders multi-layer goal-gradient visuals with one-tap log action.
  - Tavern leaderboard subscribes to SSE rank deltas with polling fallback.
- Legal/compliance gates:
  - Copy and badge labels verified against terminology-sanitization policy.
- Acceptance criteria:
  - Dashboard and leaderboard update without manual refresh in nominal path.
  - Fallback polling preserves parity when SSE is unavailable.
- Tests:
  - SSE reconnect/fallback integration tests.
  - Snapshot payload contract tests.

### TKT-P1-019 — Skill-Contest Whitepaper + Release Gate
- Source items: `F-LEGAL-05`, `legal--performance-wagering.md`.
- Why now: legal defense remains document-only and disconnected from release controls.
- API diff:
  - Add `GET /compliance/artifacts/skill-whitepaper` exposing signed artifact metadata (version/hash/date).
- Schema diff:
  - Migration: `compliance_artifacts` (artifact_type, version, sha256, approved_by, approved_at, uri).
- UI diff:
  - Legal site section linking current whitepaper artifact and jurisdiction summary matrix.
- Legal/compliance gates:
  - Counsel approval and dated signature for each artifact version.
  - Release checklist requirement: active artifact must exist before production deploy.
- Acceptance criteria:
  - Release gate fails when no active approved whitepaper artifact is registered.
  - Production legal page always points to current approved artifact hash.
- Tests:
  - CI gate tests for missing/expired compliance artifact.
  - Artifact hash mismatch rejection tests.

## Coverage Delta (Second-Pass Deep Unresolved)
- `F-CORE-10` -> `TKT-P1-012`
- `F-VERIFY-07` -> `TKT-P1-013`
- `F-FURY-04` -> `TKT-P1-014`
- `F-FURY-09` -> `TKT-P1-015`
- `F-UX-01` -> `TKT-P1-016`
- `F-SOCIAL-01` -> `TKT-P1-017`
- `F-UX-05`, `F-WEB-04` -> `TKT-P1-018`
- `F-LEGAL-04` -> `TKT-P0-011`
- `F-LEGAL-05` -> `TKT-P1-019`

## Full P0/P1 Unresolved Coverage Map
- `F-CORE-04` -> `TKT-P0-001`
- `F-CORE-10` -> `TKT-P1-012`
- `F-CORE-11` -> `TKT-P1-005`
- `F-VERIFY-02` -> `TKT-P1-007`
- `F-VERIFY-05` -> `TKT-P1-007`
- `F-VERIFY-07` -> `TKT-P1-013`
- `F-FURY-03` -> `TKT-P1-008`
- `F-FURY-04` -> `TKT-P1-014`
- `F-FURY-09` -> `TKT-P1-015`
- `F-AEGIS-02` -> `TKT-P0-004`
- `F-AEGIS-04` -> `TKT-P1-005`
- `F-AEGIS-06` -> `TKT-P1-009`
- `F-UX-01` -> `TKT-P1-016`
- `F-UX-02` -> `TKT-P1-010`
- `F-UX-03` -> `TKT-P1-010`
- `F-UX-05` -> `TKT-P1-018`
- `F-UX-06` -> `TKT-P1-010`
- `F-SOCIAL-01` -> `TKT-P1-017`
- `F-MOBILE-01` -> `TKT-P0-002`
- `F-MOBILE-03` -> `TKT-P1-006`
- `F-WEB-04` -> `TKT-P1-018`
- `F-LEGAL-03` -> `TKT-P0-004`, `TKT-P0-011`
- `F-LEGAL-04` -> `TKT-P0-011`
- `F-LEGAL-05` -> `TKT-P1-019`

## Sequencing Recommendation
1. `TKT-P0-001` -> `TKT-P0-003` -> `TKT-P0-004`
2. `TKT-P0-002` in parallel with `TKT-P1-006`
3. `TKT-P0-011` after settlement/geofence are live to finalize jurisdiction payout modes
4. `TKT-P1-005` + `TKT-P1-012` + `TKT-P1-017` for recovery-path integrity
5. `TKT-P1-007` + `TKT-P1-013` + `TKT-P1-014` for verification trust chain
6. `TKT-P1-008` -> `TKT-P1-015` for anti-collusion prevention + enforcement
7. `TKT-P1-010` + `TKT-P1-016` + `TKT-P1-018` for onboarding/retention loop completion
8. `TKT-P1-009` before broad beta expansion
9. `TKT-P1-019` as a release-gate prerequisite before public monetary rollout

## Definition of Done for This Pack
- Each ticket has explicit API/schema/UI diff direction.
- Each ticket has legal/compliance gating criteria.
- Tickets are independently plannable and estimable by lane.
- Previously uncovered P0/P1 unresolved items are mapped to at least one executable ticket.
