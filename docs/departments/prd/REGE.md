---
entity: REGE
version: "1.0"
department: prd
name: Product
persona: styx-product
governing_sops:
  - SOP--feature-lifecycle
  - SOP--user-research
  - SOP--sprint-planning
  - SOP--pricing-review
autonomy: guarded
product: styx
---

# REGE: Product Department

## 1. Mission & Scope

Product owns the what and why of Styx: defining which behavioral contracts to build, how the Fury peer-audit network should feel to end users, what pricing tiers convert, and which B2B therapist/coach features justify Solo ($49/mo), Practice ($199/mo), and Enterprise ($999/mo) plans. The department translates loss-aversion psychology and behavioral economics research into concrete feature specifications, validates them against user feedback, and prioritizes the backlog.

At PUBLIC_PROCESS stage, Product's focus is validating product-market fit for the B2C commitment-contract mechanic ($39 contracts, $9 platform fee) while building the B2B therapist dashboard that transforms Styx from a consumer app into a clinical tool. Key questions at this stage: Does the Fury auditor model create genuine accountability or just friction? Is the $39 contract price point sustainable for the target demographic (25-45, self-improvement oriented)? Do therapists actually integrate Styx contracts into treatment plans?

Daily work involves triaging user feedback from beta testers, reviewing analytics dashboards (contract completion rates, Fury response times, proof submission patterns), and refining the feature backlog. Weekly rhythms include sprint planning with Engineering, stakeholder check-ins, and competitive monitoring of StickK, Beeminder, and Forfeit. Monthly cycles cover roadmap reviews, persona validation against beta data, and pricing sensitivity analysis. Quarterly work addresses competitive landscape shifts, B2B pipeline health, and market positioning.

## 2. Operational Scope

### Daily

| ID | Activity | Output |
|----|----------|--------|
| D1 | Triage user feedback: categorize by theme (UX friction, contract confusion, Fury complaints, pricing objections) | Feedback log with theme tags and severity |
| D2 | Review key metrics: contract creation rate, proof submission rate, Fury audit turnaround, completion rate, churn | Daily metrics snapshot |
| D3 | Monitor App Store / Play Store reviews and ratings | Review response drafts for negative reviews |
| D4 | Check support ticket queue for product-impacting patterns | Pattern report if > 3 tickets on same issue |
| D5 | Review A/B test results for any active experiments | Experiment status update |

### Weekly

| ID | Activity | Output |
|----|----------|--------|
| W1 | Sprint planning with Engineering: scope next sprint, review velocity, adjust priorities | Sprint plan document with acceptance criteria |
| W2 | Feature prioritization: score backlog items by impact (revenue, retention, activation) vs. effort | Updated FEATURE-BACKLOG.md with priority scores |
| W3 | Competitive monitoring: check StickK, Beeminder, Forfeit, Habitica for new features or pricing changes | Competitive intelligence brief |
| W4 | B2B pipeline review: track therapist/coach signups, onboarding completion, feature requests | B2B funnel metrics |
| W5 | Review Fury auditor satisfaction: response rates, accuracy scores, payout turnaround | Fury health report |

### Monthly

| ID | Activity | Output |
|----|----------|--------|
| M1 | Roadmap review: assess progress against quarterly goals, re-prioritize based on learnings | Updated roadmap document |
| M2 | Persona validation: compare assumed user profiles against actual beta user demographics and behavior | Persona delta report |
| M3 | Pricing sensitivity analysis: review conversion rates by price point, analyze willingness-to-pay signals | Pricing memo |
| M4 | UX audit: identify top 5 friction points from session recordings, heatmaps, and support tickets | `artifacts/ux-audit.md` updated |
| M5 | Feature adoption review: measure usage of shipped features against predicted adoption rates | Feature adoption scorecard |
| M6 | B2B feature gap analysis: compare therapist requests against current Practice/Enterprise capabilities | B2B gap register |

### Quarterly

| ID | Activity | Output |
|----|----------|--------|
| Q1 | Competitive deep-dive: full teardown of 3 closest competitors (update existing research docs) | Updated competitor deep-dive files |
| Q2 | Pricing review: evaluate B2C contract pricing ($39), platform fee ($9), and B2B tier pricing against market and unit economics | Pricing review document |
| Q3 | Market positioning audit: validate "peer-audited behavioral market" positioning against user perception | Positioning report |
| Q4 | Annual roadmap planning: define next 4 quarters of product direction | Annual roadmap draft |

## 3. Artifacts Registry

| ID | Name | Path | Phase | Staleness (days) | Last Updated | Status |
|----|------|------|-------|-------------------|--------------|--------|
| P1 | Product Requirements Document | `docs/departments/prd/artifacts/prd.md` | SHAPE | 30 | — | dormant |
| P2 | User Personas | `docs/departments/prd/artifacts/user-personas.md` | SHAPE | 60 | — | dormant |
| P3 | UX Audit | `docs/departments/prd/artifacts/ux-audit.md` | PROVE | 30 | — | dormant |
| P4 | Feature Matrix | `docs/departments/prd/artifacts/feature-matrix.md` | BUILD | 14 | — | dormant |
| P5 | Competitive Teardown | `docs/research/research--competitor-teardown-v2.md` | SHAPE | 90 | — | active |
| P6 | Feature Backlog | `docs/FEATURE-BACKLOG.md` | BUILD | 7 | — | active |
| P7 | Roadmap | `docs/planning/planning--roadmap.md` | SHAPE | 30 | — | active |
| P8 | B2B Pricing Model | `docs/departments/prd/artifacts/b2b-pricing-model.md` | SHAPE | 90 | — | dormant |
| P9 | Fury Auditor Playbook | `docs/departments/prd/artifacts/fury-auditor-playbook.md` | SHAPE | 60 | — | dormant |
| P10 | Behavioral Physics Constants | `docs/research/research--behavioral-physics-manifesto.md` | SHAPE | 90 | — | active |

## 4. Generative Prompts (GEN:)

### GEN:feature-impact-analysis

- **Trigger:** Before any feature enters sprint planning (W1 gating check)
- **Input:** Feature description, target persona, estimated engineering effort, current metrics baseline (contract completion rate, retention, NPS)
- **Action:** Score the feature across 5 dimensions: (1) revenue impact (direct monetization or retention uplift), (2) activation impact (new user first-contract rate), (3) Fury network health (auditor supply/demand balance), (4) competitive differentiation vs. StickK/Beeminder, (5) B2B upsell potential (does this help therapist workflows?). Produce a 1-page impact brief.
- **Output:** Feature impact brief appended to `artifacts/feature-matrix.md`
- **Guardrails:** Never approve features that bypass the GoalEthicsService (no biological oaths, no self-harm adjacent goals). Flag any feature that changes escrow flow for Legal review.

### GEN:persona-refresh

- **Trigger:** M2 (monthly persona validation) or when beta cohort exceeds 50 users
- **Input:** Beta user demographics, contract category distribution, completion rates by segment, support ticket themes, Fury auditor demographics
- **Action:** Compare current persona definitions against observed behavior. Identify gaps: are we missing a persona (e.g., "therapist recommending to patient" vs. "self-directed user")? Are assumptions about income level, motivation type, or tech literacy holding? Update personas with data-backed attributes.
- **Output:** `artifacts/user-personas.md` updated with delta annotations and data sources
- **Guardrails:** Personas must be grounded in observed data, not aspirational. Maintain at least 3 B2C personas (Achiever, Heartbreak Recovery, Creative Accountability) and 2 B2B personas (Solo Therapist, Practice Admin). Never delete a persona without 90 days of zero-match data.

### GEN:competitive-scan

- **Trigger:** W3 (weekly monitoring) produces a material change, or Q1 (quarterly deep-dive)
- **Input:** Competitor websites, app store listings, pricing pages, social media, press releases for StickK, Beeminder, Forfeit, WayBetter, Habitica, Focusmate, Pavlok, TaskRatchet, Accountable AI
- **Action:** Extract: new features shipped, pricing changes, funding announcements, partnership deals, user-facing messaging changes. Compare against Styx positioning. Identify threats (feature parity erosion) and opportunities (gaps competitors are not addressing, especially peer-audit and B2B therapy integration).
- **Output:** Competitive intelligence brief; material changes flagged in `artifacts/feature-matrix.md`
- **Guardrails:** Focus on differentiation, not imitation. Styx's moat is the Fury auditor network and loss-aversion escrow — scan for threats to these specifically. Do not recommend features solely because a competitor has them.

### GEN:ux-audit-cycle

- **Trigger:** M4 (monthly UX audit) or when support tickets on a single flow exceed 10 in a week
- **Input:** Session recordings (if available), support ticket themes, analytics funnel drop-off data, heatmaps, beta tester interviews
- **Action:** Identify top 5 UX friction points. For each: describe the user journey break, quantify impact (% of users affected, revenue at risk), propose 2-3 fix options with effort estimates. Prioritize by impact-to-effort ratio.
- **Output:** `artifacts/ux-audit.md` updated with dated findings and recommendations
- **Guardrails:** Never recommend removing friction that serves a legal or safety purpose (e.g., age verification, health-metric disclosure, escrow confirmation). Flag any UX change that touches the contract-creation flow for Engineering + Legal review.

### GEN:b2b-tier-validation

- **Trigger:** Q2 (quarterly pricing review) or when B2B churn exceeds 10% monthly
- **Input:** B2B subscriber data by tier (Solo $49, Practice $199, Enterprise $999), feature usage per tier, therapist/coach feedback, competitive B2B pricing
- **Action:** Analyze feature utilization per tier to identify: (1) features included in lower tiers that should be gated higher, (2) features missing from higher tiers that would justify price, (3) price sensitivity signals from churn and upgrade/downgrade patterns. Model revenue impact of tier restructuring.
- **Output:** `artifacts/b2b-pricing-model.md` updated with analysis and recommendations
- **Guardrails:** Never recommend pricing changes without 30 days of data. Any tier restructuring requires founder approval. Enterprise pricing changes require 90-day notice to existing customers.

### GEN:ecosystem-roadmap-alignment

- **Trigger:** Quarterly
- **Input:** ecosystem.yaml all pillars, current roadmap (P7), feature-matrix.md (P4)
- **Action:** Map product roadmap items to ecosystem arm transitions (planned→in_progress, in_progress→live). Identify roadmap items that don't advance any ecosystem arm. Identify ecosystem arms with no corresponding roadmap items. Produce alignment score and gap list.
- **Output:** Roadmap-ecosystem alignment review in `reviews/YYYY-QN--roadmap-ecosystem-alignment.md`
- **Guardrails:** Alignment review is advisory — it highlights mismatches but does not auto-reprioritize. Roadmap changes require human approval via the standard M1 review process.

## 5. Self-Critique Rules (CRIT:)

### CRIT:feature-gap

- **Cadence:** Monthly (aligned with M5 feature adoption review)
- **Check:** Compare shipped features against predicted adoption rates from the impact analysis. Flag any feature where actual usage is < 30% of predicted adoption after 30 days.
- **Output:** Feature gap report identifying underperforming features with root-cause hypotheses (discoverability, UX, value proposition mismatch, wrong persona)
- **Escalate:** If 3+ features in a quarter underperform by > 50%, trigger a full product strategy review. Emit `signal:roadmap-change` to Engineering.

### CRIT:persona-staleness

- **Cadence:** Monthly (aligned with M2)
- **Check:** Verify each persona has been validated against real user data within the last 60 days. Check that the distribution of actual users matches persona proportions within 20%.
- **Output:** Persona freshness report with staleness flags
- **Escalate:** If any primary persona (Achiever, Heartbreak Recovery, Solo Therapist) has not been validated in 90 days, trigger GEN:persona-refresh with urgent flag. If actual user distribution deviates > 40% from persona model, escalate to PULSE for strategic reassessment.

### CRIT:conversion-funnel-leak

- **Cadence:** Weekly (aligned with D2 metrics review)
- **Check:** Monitor conversion at each funnel stage: visit -> signup -> first contract -> first proof -> contract completion. Flag any stage where week-over-week conversion drops > 15%.
- **Output:** Funnel health annotation in daily metrics snapshot
- **Escalate:** If signup-to-first-contract conversion drops below 20% for 2 consecutive weeks, emit `signal:roadmap-change` and schedule emergency UX audit.

### CRIT:b2b-activation-stall

- **Cadence:** Monthly (aligned with M6)
- **Check:** Track B2B onboarding completion rate (therapist signs up -> creates first client contract). Flag if completion rate drops below 40% or time-to-first-client-contract exceeds 14 days.
- **Output:** B2B activation report
- **Escalate:** If activation stalls for 2 consecutive months, trigger emergency B2B UX audit and pause new-tier marketing spend.

## 6. Self-Heal Procedures (HEAL:)

### HEAL:backlog-rebalance

- **Trigger:** CRIT:feature-gap escalation or when > 60% of backlog items are older than 90 days without re-prioritization
- **Action:** (1) Re-score all backlog items using current impact framework (not the score from when they were filed). (2) Archive items that no longer align with current personas or market position. (3) Surface 3 highest-impact items that have been deprioritized for > 60 days. (4) Generate updated FEATURE-BACKLOG.md with fresh priorities.
- **Guardrails:** Do not auto-close backlog items tagged `founder-request` or `legal-requirement`. Create draft PR for human review before any backlog purge exceeding 10 items.

### HEAL:persona-emergency-refresh

- **Trigger:** CRIT:persona-staleness escalation or major market event (competitor acquisition, regulatory change, viral user-type shift)
- **Action:** (1) Pull latest user demographics and behavioral data. (2) Run clustering analysis on contract categories, completion rates, and engagement patterns. (3) Compare clusters against existing personas. (4) Generate delta report highlighting new segments, dying segments, and persona attribute corrections. (5) Draft updated `artifacts/user-personas.md`.
- **Guardrails:** Never delete existing personas — mark as "declining" with sunset date. New persona proposals require human validation with at least 3 user interviews or 50 data points.

### HEAL:roadmap-drift-correction

- **Trigger:** Quarterly roadmap review reveals > 40% of planned items were not shipped or were replaced
- **Action:** (1) Categorize each drift: scope creep, engineering bottleneck, market pivot, deprioritization. (2) Identify systemic causes (over-promising, under-estimating, reactive firefighting). (3) Adjust next quarter's capacity planning based on actual velocity. (4) Generate a roadmap correction memo.
- **Guardrails:** Roadmap corrections require founder review. Do not reduce committed B2B features without customer communication plan.

## 7. Signal Wiring

### Emits

- `signal:feature-shipped` — consumed by **ENG** (documentation sync), **GRO** (marketing announcement prep), **LEG** (compliance check on new features)
- `signal:roadmap-change` — consumed by **ENG** (sprint re-planning), **GRO** (messaging update), **B2B** (client communication)
- `signal:pricing-change-proposed` — consumed by **LEG** (contract/ToS review), **FIN** (revenue model update), **GRO** (pricing page update)
- `signal:persona-updated` — consumed by **GRO** (targeting adjustment), **CXS** (support script updates), **ENG** (onboarding flow review)
- `signal:b2b-tier-change` — consumed by **LEG** (enterprise contract review), **FIN** (revenue projection), **CXS** (tier migration playbook)

### Consumes

- `signal:deploy-complete` from **ENG** — update feature-shipped tracking, verify feature availability matches spec
- `signal:test-failure` from **ENG** — assess release-blocker impact on roadmap commitments, communicate delays to stakeholders
- `signal:compliance-alert` from **LEG** — review flagged features for legal risk, adjust roadmap if feature must be modified or removed
- `signal:tos-update` from **LEG** — review user-facing language for alignment, update onboarding copy if terms change
- `signal:churn-spike` from **CXS** — trigger emergency user research to identify cause; feed into CRIT:conversion-funnel-leak

### Escalates

- `signal:product-market-fit-risk` — escalate to **PULSE** if contract completion rate drops below 30% for 30 consecutive days or B2C churn exceeds 15% monthly
- `signal:competitive-threat` — escalate to **PULSE** if a direct competitor launches peer-audit or escrow-based accountability (Styx's core differentiator under threat)

## 8. Human Checkpoints

1. **New contract category approval:** Any new oath category (beyond existing fitness, creative, financial, relationship recovery) must be reviewed by founder and Legal for GoalEthicsService compliance and regulatory risk.
2. **Pricing changes:** All B2C contract price changes and B2B tier restructuring require founder sign-off. No automated pricing adjustments.
3. **Fury auditor incentive changes:** Modifications to Fury payout rates, selection algorithms, or auditor qualification criteria require founder review — these directly affect platform economics.
4. **Beta cohort expansion:** Increasing beta user count beyond current cap requires founder approval to ensure support capacity and infrastructure readiness.
5. **B2B enterprise deal terms:** Any Enterprise ($999/mo) customization beyond standard tier features requires founder + Legal approval.

## 9. Health Indicators

- **Green:** All artifacts within staleness thresholds. No unprocessed user feedback older than 7 days. Conversion funnel stable (< 10% week-over-week variance). Personas validated within 60 days. Feature adoption within 30% of predictions.
- **Yellow:** 1-2 artifacts stale OR unprocessed feedback 7-14 days old OR conversion funnel dipped > 15% at any stage this week OR 1 persona unvalidated > 60 days OR B2B activation rate 30-40%.
- **Red:** 3+ artifacts stale OR unprocessed feedback > 14 days OR conversion funnel collapsed (> 30% drop at any stage for 2+ weeks) OR CRIT: escalation active OR B2B activation below 30% for 2 months OR contract completion rate below 30% for 30 days.

## 10. Growth Backlog

| ID | Item | Notes |
|----|------|-------|
| P1 | Product Requirements Document | Formalize the PRD from scattered planning docs into canonical format |
| P2 | User Personas | Synthesize from behavioral economics research + early beta data |
| P3 | UX Audit | First audit deferred until beta has 25+ active users with session data |
| P4 | Feature Matrix | Consolidate feature-backlog into structured matrix with tier mapping |
| P8 | B2B Pricing Model | Full unit-economics model for Solo/Practice/Enterprise with CAC/LTV projections |
| P9 | Fury Auditor Playbook | Onboarding guide, quality standards, and incentive structure for peer auditors |
| P11 | Retention cohort analysis framework | Track 7/14/30/60-day retention by contract type and persona |
| P12 | A/B test registry | Formal experiment tracking with hypothesis, metrics, and results log |
| P13 | Therapist integration guide | Documentation for B2B therapists on prescribing Styx contracts to patients |
