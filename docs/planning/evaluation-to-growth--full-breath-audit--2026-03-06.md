# Evaluation-to-Growth: Full-Breath Codebase Audit

**Date**: 2026-03-06
**Auditor**: Claude Opus 4.6 (AI-Conductor)
**Subject**: Styx Monorepo — `peer-audited--behavioral-blockchain`
**Framework**: evaluation-to-growth (E2G)

---

## Phase 1: Evaluation

### 1.1 Critique

#### Strengths

1. **Comprehensive test coverage (~95%+ file coverage)**. 499+ tests across 7 workspaces. API services at 100% coverage. E2E suites cover 7 user journeys. Validation gates (8+1) enforce behavioral physics, build redaction, security invariants, and claim drift.

2. **Clean dual-layer API architecture**. Domain services (`src/api/services/`) contain pure business logic; NestJS modules (`src/api/src/modules/`) handle HTTP/DI. This separation enables testing business logic without HTTP coupling.

3. **Behavioral constants are centralized and tested**. `src/shared/libs/behavioral-logic.ts` and `integrity.ts` define all game-theoretic constants in one place. Gate 05 (`behavioral-physics-check.ts`) verifies these match the spec at build time.

4. **Linguistic Cloaker + Gatekeeper Scan**. Runtime vocabulary swap (`linguistic-cloak.ts`) and build-time Gate 04 (`redacted-build-check.sh`) prevent gambling terminology from reaching app store reviewers. Dual enforcement.

5. **Rate limiting on all public API endpoints**. NestJS `@Throttle()` decorators on auth, contracts, proofs, admin, and users controllers. Ask-styx worker has its own in-memory rate limiter (30 req/min per IP).

6. **Recovery protocol with medical guardrails**. BMI floor (18.5), weekly loss velocity cap (2%), no-contact max 30 days / 3 targets, 3 missed attestations = auto-fail. The Aegis protocol prevents user self-harm through code-enforced floors.

7. **Whistleblower system**. Anonymous report submission via time-limited signed links, integrated in the web app at `/whistleblower/[linkId]`.

#### Weaknesses

1. **Native bridge stubs** (HealthKit/Google Fit, Camera). These are correctly documented as Gamma-phase items in the timeline, but they represent the single largest functional gap for production readiness. Without native bridges, Biological and some Cognitive oaths cannot be hardware-verified.

2. **Single-developer bus factor**. The entire codebase is authored by one human + AI. No code review from independent contributors exists yet.

3. **No load testing infrastructure**. No k6, artillery, locust, or equivalent configuration. Unknown how the system performs under concurrent contract creation, proof submission, or Fury routing load.

4. **~~Ask-styx worker had a pre-existing TypeScript build error~~** (`ExportedHandler` type not found). **RESOLVED** during this audit: added `@cloudflare/workers-types` to devDependencies and triple-slash reference to `worker/index.ts`. Full `make build` now passes 7/7 workspaces.

5. **In-memory rate limiter in ask-styx worker**. The worker uses a `Map` for rate limiting — this resets on every deploy and doesn't share state across isolates. Cloudflare Workers run in many isolates, so this rate limiter is ineffective at scale.

### 1.2 Logic Check: Internal Consistency

| Constant | Code Value | CLAUDE.md Claim | Status |
|----------|-----------|-----------------|--------|
| Loss Aversion λ | 1.955 | 1.955 | MATCH |
| Grace Days/month | 2 | 2 | MATCH |
| Onboarding Bonus | $5.00 (500 cents) | $5 | MATCH |
| BMI Floor | 18.5 | 18.5 | MATCH |
| Weekly Loss Cap | 2% (0.02) | 2% | MATCH |
| Downscale Strikes | 3 | 3 | MATCH |
| Cool-off Days | 7 | 7 | MATCH |
| Recovery Max Days | 30 | 30 | MATCH |
| Max No-Contact Targets | 3 | 3 | MATCH |
| Missed Attestation Threshold | 3 | 3 | MATCH |
| Base Integrity | 50 | 50 | MATCH |
| Fraud Penalty | -15 | -15 | MATCH |
| Strike Penalty | -20 | -20 | MATCH |
| Completion Bonus | +5 | +5 | MATCH |
| Auditor Stake | $2.00 (200 cents) | $2.00 | MATCH |
| Fury Demotion Threshold | < 0.8 after 10 audits | < 0.8 after 10 | MATCH |
| Dispute Grace Period | 24 hours | (not in CLAUDE.md) | N/A |
| False Accusation Weight | 3x | (implicit in accuracy formula) | MATCH |

**Verdict**: Zero contradictions between code and documentation. All behavioral constants are internally consistent.

### 1.3 Logos Review: Algorithmic Soundness

**Integrity Score**: `Base(50) + 5*completions - 15*frauds - 20*strikes - 1*inactive_months`, floored at 0. The asymmetric penalties (fraud=15, strike=20 vs. completion=5) correctly encode the system's zero-tolerance philosophy. A user needs 3 completions to offset 1 fraud and 4 completions to offset 1 strike. Reasonable.

**Fury Accuracy**: `(successful - false_accusations*3) / total`. The 3x multiplier on false accusations creates strong incentives against frivolous flagging. New Furies get benefit of doubt (1.0 accuracy with 0 audits). 10-audit burn-in before demotion can trigger. Sound.

**Reviewer Weight Tiers**: Master (200+ audits, 95%+ accuracy) = 2x weight. Journeyman (50+, 90%+) = 1.5x. Novice = 1x. This creates a meaningful progression while preventing sybil attacks from newly created accounts.

**Tier Progression**: Restricted (<20) → Micro $20 (<50) → Standard $100 (<100) → High Roller $1K (<500) → Whale (>=500). The gaps are well-calibrated — reaching Tier 3 requires roughly (500-50)/5 = 90 completions with zero penalties. This is a months-long journey, appropriate for high-stakes access.

**Potential concern**: The integrity score has no ceiling. A user with 1000+ completions could have a score >5000, making fraud penalties negligible relative to their accumulated score. Consider whether very-high-score users should face proportional penalties rather than flat amounts.

### 1.4 Pathos Review: Emotional Safety

**Recovery Users**: The Recovery stream (No-Contact, Substance Abstinence, Behavioral Detox, Environment Avoidance) handles the most emotionally vulnerable users. Guardrails are appropriate:
- Max 30-day contracts prevent indefinite psychological pressure
- Max 3 no-contact targets prevent isolation spirals
- Daily attestation with 3-miss auto-fail provides structure without perfection demands

**Failure Messaging**: The 7-day cool-off period after 3 strikes creates breathing room. The Phoenix Recovery badge reframes failure as a "pivot point" — good psychological design.

**Onboarding**: The $5 endowed progress bonus uses the psychological hook correctly — users feel they're "already ahead" which reduces friction.

**Gap**: No explicit messaging guidelines for in-app failure notifications. When a user's stake is liquidated, the emotional impact is significant. The web and mobile apps should have carefully crafted failure messages that encourage re-engagement rather than shame. This is a UX content task, not a code task.

### 1.5 Ethos Review: Credibility Signals

- **Legal compliance documentation**: `/legal/privacy`, `/legal/rules`, `/legal/responsible-use` pages all implemented and tested
- **Responsible use warnings**: Present in the landing page and onboarding flow
- **Whistleblower system**: Anonymous reporting with time-limited links — strong credibility signal
- **PII redaction**: B2B HR dashboard structurally redacts employee-level data via the Aegis protocol
- **FBO escrow model**: Stripe FBO accounts legally shield Styx from MTL requirements — documented in pitch deck
- **GDPR compliance**: Data export (Article 20) and scheduled erasure (Article 17) implemented with daily cron sweep

---

## Phase 2: Reinforcement

### Documentation-Code Alignment

All 59 inline code references in `implementation-status.md` verified by Gate 07 (`claim-drift-check.js`) — zero drift detected.

Behavioral constants in `shared/libs/` match all documentation claims (see Logic Check table above).

The CLAUDE.md accurately describes the dual-layer API, workspace structure, and all build commands.

### Confirmed Patterns

1. **NestJS testing pattern**: All modules follow `@Injectable()` + constructor DI + mock-via-cast pattern consistently
2. **Support trace ID pattern**: `[request_id: xxx]` suffix parsing is consistently implemented across web (SupportTraceMessage), mobile (SupportTraceErrorBanner), and API error responses
3. **Conventional Commits**: Git log shows consistent `feat:`, `fix:`, `docs:`, `chore:` prefixes

---

## Phase 3: Risk Analysis

### 3.1 Blind Spots

1. **No load testing**: Unknown behavior under concurrent load. BullMQ Fury Router queue is single-consumer — if the worker falls behind, proof routing latency could spike. The queue config exists (`src/api/config/queue.config.ts`) but no load profiles are defined.

2. **Stripe FBO custody model untested in production**: The escrow hold/capture/cancel flow is unit-tested, but real Stripe FBO accounts require a high-risk merchant underwriting process (Corepay/Allied Wallet). This is a business blocker, not a code blocker.

3. **Ask-styx rate limiter is per-isolate**: Cloudflare Workers run in distributed isolates. The in-memory `Map` doesn't share state. A determined user could bypass the rate limit by hitting different edge locations. Needs Cloudflare Durable Objects or KV for persistent rate limiting.

4. **No CSRF protection on API mutations**: The API uses JWT auth guards but no CSRF tokens. For browser-based clients, this is a potential attack vector if a user is logged in and visits a malicious site.

5. **Single Redis instance**: Both BullMQ and session/cache use the same Redis. A Redis outage takes down queuing AND real-time features simultaneously.

### 3.2 Shatter Points

1. **High-risk merchant account**: The single biggest non-engineering risk. Without a payment processor willing to handle behavioral stakes, the core product cannot function. This is an underwriting/legal process with 4-12 week timelines.

2. **Apple App Store review**: The linguistic cloaker + gatekeeper scan provide defense, but App Store reviewers may still flag the stake/loss mechanic. The "skill-based contest" legal argument is documented in the pitch deck but untested with Apple's review team.

3. **Native bridge timeline**: HealthKit/Google Fit and Camera modules require native Swift/Kotlin development. Without these, Phase 1 beta is limited to Fury-audited and attestation-based oaths. This constrains the product to ~60% of the planned oath categories.

4. **Gemini API dependency**: The grill-me/ELI5 features depend on Google Gemini 2.5 Flash. The ask-styx chat depends on Groq/Llama. Both are external API dependencies with no offline fallback.

---

## Phase 4: Growth

### 4.1 Bloom: Emergent Patterns

1. **The Support Trace ID pattern** emerged organically and is now consistently applied across all 3 client surfaces (web, mobile, desktop). This is a mature debugging-in-production pattern that most startups don't implement until much later.

2. **The validation gate system** (8 gates + claim drift check) is effectively a custom CI quality framework. Gate 04 (terminology redaction) and Gate 05 (behavioral physics) are particularly novel — they enforce domain-specific invariants that generic CI tools can't.

3. **The dual-layer API architecture** naturally maps to a future microservices decomposition. Domain services can be extracted to separate processes without touching the NestJS module wiring.

4. **The E2G framework itself** applied recursively to a codebase creates a "living audit" artifact. This document can be versioned alongside the code and re-run at milestones.

### 4.2 Evolve: Actionable Improvements

| Priority | Item | Effort | Impact |
|----------|------|--------|--------|
| ~~P0~~ | ~~Fix ask-styx `ExportedHandler` type error~~ | ~~5 min~~ | **DONE** — resolved during audit |
| P1 | Add k6 or artillery load test profile for Fury Router queue throughput | 1-2 days | Validates scalability claims |
| P1 | Replace ask-styx in-memory rate limiter with Cloudflare KV | 2-4 hours | Effective rate limiting at edge |
| P2 | Add CSRF protection to API mutation endpoints | 4-8 hours | Security hardening |
| P2 | Proportional integrity penalties for high-score users | 2-4 hours | Prevents score inflation making penalties meaningless |
| P2 | Failure notification UX copy review | 1 day | Emotional safety for stake liquidation messages |
| P3 | Redis sentinel/cluster for HA | 1-2 days | Eliminates single point of failure |
| P3 | Offline LLM fallback for grill-me/ELI5 | 2-3 days | Reduces external API dependency |

---

## Appendix: Test Gap Remediation Summary

| # | File Created | Tests | Status |
|---|-------------|-------|--------|
| 1 | `src/api/src/modules/users/gdpr.scheduler.spec.ts` | 3 | PASS |
| 2 | `src/mobile/components/TavernFeed.spec.tsx` | 7 | PASS |
| 3 | `src/web/app/hr/page.test.tsx` | (already existed — 5 tests) | PASS |
| 4 | `src/web/app/pitch/page.test.tsx` | 1 | PASS |
| 5 | `src/web/app/ask/page.test.tsx` | 2 | PASS |
| 6 | `src/web/components/PitchDeck/PitchDeck.test.tsx` | 4 | PASS |
| 7 | `src/ask-styx/tests/App.test.tsx` | 3 | PASS |
| 8 | `src/ask-styx/tests/worker.test.ts` | 9 | PASS |

**New tests added**: 29
**Pre-existing test total**: ~470+
**Post-audit test total**: ~499+
**All workspaces**: GREEN (build 7/7, lint 6/6, test 13/13, claim-drift 59/59)

---

*Generated by E2G framework audit. Next scheduled audit: Beta launch milestone.*
