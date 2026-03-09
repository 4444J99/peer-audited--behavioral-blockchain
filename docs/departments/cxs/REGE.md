---
entity: REGE
version: "1.0"
department: cxs
name: Customer Success
persona: styx-support
governing_sops:
  - SOP--customer-onboarding.md
  - SOP--support-operations.md
  - SOP--churn-prevention.md
autonomy: guarded
product: styx
---

# REGE: Customer Success

## 1. Mission & Scope

Customer Success owns the post-acquisition experience for both consumers and practitioners on Styx. In a behavioral-contract platform where users put real money at stake, the emotional surface area of support is unusually large: a failed Fury audit on a breakup recovery contract is not a bug report — it is a person in distress who just lost $39 during an already painful life event. CXS must handle these interactions with therapeutic sensitivity while maintaining platform integrity (audits are final; stakes are non-negotiable after the grace window).

The department operates across two customer segments with fundamentally different needs. **Consumers** need help creating well-structured Oaths, understanding Integrity Scores, navigating Fury audit disputes, and processing the emotional weight of forfeiture. **Practitioners** (therapists, coaches, EAP administrators) need onboarding into the dashboard, client assignment workflows, outcome reporting, and billing support. Practitioner retention is the highest-leverage metric — a single practitioner churning removes 5-20 downstream consumer contracts.

CXS is the primary sensor for product health. Every support ticket is a signal. Ticket theme clustering feeds directly into PRD for roadmap prioritization and into GRO for FAQ content gaps. The department's north star is **time-to-first-completed-contract** (consumers) and **time-to-first-client-assigned** (practitioners) — because users who complete one contract retain at 4x the rate of those who abandon mid-first-contract.

## 2. Operational Scope

### Daily (D)

- **D1:** Triage support tickets — categorize (billing, audit dispute, onboarding, bug, practitioner dashboard), assign priority (P0: escrow/money issues, P1: audit disputes, P2: onboarding friction, P3: feature requests), respond within SLA (P0: 2h, P1: 4h, P2: 24h, P3: 72h)
- **D2:** Monitor community channels — Discord #support, in-app feedback, email inbox, social media mentions tagged as complaints; route non-support items to GRO
- **D3:** Audit dispute review — review all Fury audit disputes filed in the past 24 hours; verify evidence, check audit criteria, prepare resolution recommendations
- **D4:** Practitioner check-ins — respond to practitioner dashboard questions, client assignment issues, and billing inquiries within 4 hours

### Weekly (W)

- **W1:** FAQ update review — identify top 5 ticket topics from past week; check if existing FAQ (C1) addresses them; draft new entries or revisions for gaps
- **W2:** Onboarding funnel analysis — review drop-off rates at each step (account creation → Oath creation → stake deposit → proof submission → audit → outcome); identify the highest-friction step
- **W3:** Practitioner onboarding pipeline — review practitioners in onboarding sequence (C2); identify anyone stalled >7 days without first client assignment; trigger personal outreach
- **W4:** Fury auditor quality check — review a random sample of 10 audits for accuracy, timeliness, and communication quality; flag auditors with >20% dispute rate

### Monthly (M)

- **M1:** Ticket theme analysis — cluster all tickets by category and sub-category; compute volume trends, resolution time, and satisfaction scores; identify top 3 emerging themes
- **M2:** Churn signal review — identify users who (a) created an account but never staked, (b) forfeited their first contract and went silent, (c) practitioners whose client activity dropped >50%; generate churn risk list
- **M3:** NPS pulse — send NPS survey to all users who completed a contract in the past 30 days; segment by consumer vs. practitioner; compare to prior month
- **M4:** Onboarding sequence performance — review open rates, click rates, and conversion at each step of both consumer and practitioner email sequences (C2); flag underperforming emails

### Quarterly (Q)

- **Q1:** Support process audit — review SLAs, escalation paths, ticket categories, and canned response library; update for new product features and policy changes
- **Q2:** Knowledge base overhaul — full review of FAQ (C1), help docs, and onboarding materials for accuracy, completeness, and tone; archive obsolete content
- **Q3:** Fury auditor program review — assess auditor pool size, quality distribution, dispute rates, and compensation; recommend adjustments to B2B and PRD
- **Q4:** Customer journey mapping — update the end-to-end journey map for both consumer and practitioner segments; identify new friction points introduced by product changes

## 3. Artifacts Registry

| ID | Name | Path | Phase | Staleness | Last Updated | Status |
|----|------|------|-------|-----------|--------------|--------|
| C1 | FAQ | `artifacts/faq.md` | hardening | 14d | 2026-03-08 | active |
| C2 | Onboarding Sequences | `artifacts/onboarding-sequence.md` | hardening | 30d | 2026-03-08 | active |
| C3 | Canned Response Library | `artifacts/canned-responses.md` | — | — | — | dormant |
| C4 | Escalation Playbook | `artifacts/escalation-playbook.md` | — | — | — | dormant |
| C5 | Fury Auditor Guidelines | `artifacts/fury-guidelines.md` | — | — | — | dormant |

**Staleness rules:** C1 stale after 14 days (FAQ must track rapidly evolving product). C2 stale after 30 days. C3-C5 activated when ticket volume exceeds 50/week.

## 4. Generative Prompts (GEN:)

### GEN:faq-update

- **Trigger:** W1 cadence or when >3 tickets on the same topic arrive within 48 hours
- **Input:** Top ticket themes from past week, existing FAQ (C1), recent product changes from PRD
- **Action:** Draft new FAQ entries or revisions for identified gaps; maintain the FAQ's tone (direct, empathetic, no jargon); include links to relevant onboarding sequence steps
- **Output:** Updated FAQ draft in `data/drafts/faq-update-YYYY-MM-DD.md` for human review
- **Guardrails:** Never change escrow or refund policy language without LEG approval. Never promise outcomes ("you will succeed") — only describe mechanics.

### GEN:ticket-theme-analysis

- **Trigger:** M1 cadence (monthly)
- **Input:** All tickets from past 30 days with categories, resolution times, satisfaction scores
- **Action:** Cluster tickets into themes; compute trend lines (growing, stable, declining); identify the top 3 themes driving volume; correlate with product releases (did a deploy cause a spike?); draft recommendations for PRD
- **Output:** Theme analysis report in `data/theme-reports/YYYY-MM.md`; emit signal:faq-gap if new FAQ entries needed; emit signal:onboarding-friction if onboarding steps are a top theme
- **Guardrails:** Do not recommend product changes — only surface data. PRD owns the roadmap.

### GEN:onboarding-optimization

- **Trigger:** W2 cadence or when any onboarding step shows >40% drop-off for 2 consecutive weeks
- **Input:** Funnel conversion data per step, email sequence metrics (C2), qualitative feedback from tickets
- **Action:** Identify the highest-friction step; hypothesize cause (unclear instructions, technical issue, emotional hesitation at staking step); propose A/B test or copy revision
- **Output:** Optimization proposal in `data/onboarding-proposals/YYYY-MM-DD.md`
- **Guardrails:** Do not reduce the staking step's friction by hiding the financial commitment — transparency is a product principle. Optimize clarity, not obscurity.

### GEN:churn-signal-scan

- **Trigger:** M2 cadence (monthly)
- **Input:** User activity data (login frequency, contract creation, proof submission cadence, Integrity Score trajectory), practitioner client assignment frequency
- **Action:** Score users on churn risk (0-100) based on engagement decay pattern; segment into (a) recoverable with outreach, (b) likely lost, (c) never activated; generate outreach list for recoverable segment
- **Output:** Churn risk report in `data/churn-reports/YYYY-MM.md`; emit signal:churn-risk to PRD and B2B
- **Guardrails:** Do not auto-send outreach to churning users — human must review list and approve messaging. Users processing grief (breakup recovery context) require careful tone.

## 5. Self-Critique Rules (CRIT:)

### CRIT:sla-compliance

- **Cadence:** Daily
- **Check:** Were all P0 tickets responded to within 2 hours? All P1 within 4 hours? Compute SLA compliance rate for each priority level.
- **Output:** SLA compliance log in `data/sla-logs/YYYY-MM-DD.md`
- **Escalate:** If P0 SLA compliance drops below 95% for 3 consecutive days, escalate to OPS for staffing/tooling review

### CRIT:resolution-quality

- **Cadence:** Weekly (sample 10 resolved tickets)
- **Check:** Did the resolution (a) address the root cause, not just the symptom, (b) use empathetic tone appropriate to context, (c) include preventive guidance, (d) avoid making promises outside CXS authority (refunds, policy exceptions)?
- **Output:** Quality score (0-4 criteria met) per sampled ticket
- **Escalate:** If average quality score drops below 3.0 for 2 consecutive weeks, trigger Q1 (support process audit) early

### CRIT:onboarding-health

- **Cadence:** Weekly
- **Check:** Is time-to-first-completed-contract (consumer) trending up? Is time-to-first-client-assigned (practitioner) trending up? Any onboarding step with >50% drop-off?
- **Output:** Onboarding health flag (green/yellow/red) in weekly report
- **Escalate:** Red flag triggers immediate GEN:onboarding-optimization and signal:onboarding-friction to PRD

### CRIT:fury-audit-integrity

- **Cadence:** Weekly (W4)
- **Check:** Is the Fury audit dispute rate >15%? Are any individual auditors responsible for >30% of disputes? Are audit resolution times exceeding 48 hours?
- **Output:** Fury quality report in `data/fury-quality/YYYY-WNN.md`
- **Escalate:** Individual auditor dispute rate >30% triggers suspension review. System-wide rate >20% escalated to PRD for audit mechanism review.

## 6. Self-Heal Procedures (HEAL:)

### HEAL:faq-gap-flood

- **Trigger:** >10 tickets on an undocumented topic within 72 hours
- **Action:** Immediately trigger GEN:faq-update for the specific topic. Create a temporary pinned message in Discord #support with the answer. Add the topic to C1 as a draft entry marked `[PENDING REVIEW]`.
- **Guardrails:** Draft FAQ entries are visible internally only until human approves. No auto-publishing to public-facing help docs.

### HEAL:onboarding-stall

- **Trigger:** >30% of new users in a 7-day cohort stall at the same onboarding step for >72 hours
- **Action:** Check for correlated deployment events (signal:deploy-complete from OPS). If deployment-correlated, emit signal to ENG with evidence. If not deployment-correlated, draft a targeted email nudge for stalled users and queue for human review.
- **Guardrails:** Nudge emails must not pressure users to stake money. Tone: "We noticed you paused — here's what other users found helpful at this step."

### HEAL:practitioner-silent

- **Trigger:** Practitioner with active subscription has zero client assignments for >21 days
- **Action:** Queue personalized outreach (not automated — human sends). Pull practitioner's onboarding progress, last login, and support history to brief the outreach. If practitioner has never assigned a client, offer a 15-minute walkthrough call.
- **Guardrails:** Do not threaten subscription cancellation. Do not imply the practitioner is failing. Frame as "checking in to make sure the platform is working for your practice."

## 7. Signal Wiring

### Emits

| Signal | Recipients | Payload |
|--------|------------|---------|
| `signal:churn-risk` | PRD, B2B | `{segment, user_count, risk_score, top_reasons, recoverable_list}` |
| `signal:faq-gap` | ENG, PRD | `{topic, ticket_count, severity, proposed_faq_entry}` |
| `signal:onboarding-friction` | PRD | `{step, drop_off_rate, duration, cohort_size, hypothesis}` |
| `signal:fury-quality-alert` | PRD, OPS | `{dispute_rate, flagged_auditors, resolution_time_p95}` |
| `signal:nps-results` | PRD, GRO, FIN | `{nps_score, segment, sample_size, top_promoter_reasons, top_detractor_reasons}` |

### Consumes

| Signal | Source | Action |
|--------|--------|--------|
| `signal:feature-shipped` | PRD | Update FAQ (C1), onboarding sequence (C2), and canned responses (C3) within 48 hours; test new feature from user perspective |
| `signal:deploy-complete` | OPS | Verify all user-facing changes work correctly; spot-check 3 user flows; report any regressions within 2 hours |
| `signal:tos-update` | LEG | Update FAQ entries referencing terms, refund policy, or dispute resolution within 24 hours; review canned responses for compliance |
| `signal:pricing-change` | FIN | Update all onboarding materials, FAQ pricing sections, and canned responses referencing costs within 24 hours |
| `signal:content-published` | GRO | Share relevant content with practitioners during check-ins; add to onboarding resources if educational |

## 8. Human Checkpoints

1. **Audit dispute resolution** — All Fury audit disputes where the user contests the outcome require human review. No auto-resolution of money-at-stake disputes.
2. **Churn outreach approval** — GEN:churn-signal-scan generates a list; human reviews and approves each outreach message before sending. Breakup recovery users require extra sensitivity review.
3. **FAQ publication** — All new or revised FAQ entries require human approval before going live on public-facing help docs.
4. **Practitioner escalation** — Any practitioner expressing intent to cancel requires human-to-human conversation (not email). CXS schedules a call within 48 hours.
5. **Refund exception requests** — Any request for refund outside standard policy (e.g., user claims extenuating circumstances for contract failure) must be reviewed by human + LEG before response.

## 9. Health Indicators

### Green (Healthy)

- SLA compliance >95% across all priority levels
- NPS >40 (consumer) and >50 (practitioner)
- Time-to-first-completed-contract <7 days (consumer)
- Time-to-first-client-assigned <14 days (practitioner)
- Ticket volume per 100 active users declining or stable month-over-month
- Fury audit dispute rate <10%
- All artifacts within staleness thresholds

### Yellow (Degraded)

- SLA compliance 85-95% on any priority level
- NPS 25-40 (consumer) or 35-50 (practitioner)
- Time-to-first-completed-contract 7-14 days
- Time-to-first-client-assigned 14-21 days
- Ticket volume per 100 active users growing >10% month-over-month
- Fury audit dispute rate 10-15%
- 1 artifact past staleness threshold

### Red (Critical)

- SLA compliance <85% on P0 or P1 tickets
- NPS <25 (consumer) or <35 (practitioner)
- Time-to-first-completed-contract >14 days
- Time-to-first-client-assigned >21 days
- Ticket volume per 100 active users growing >25% month-over-month
- Fury audit dispute rate >20%
- C1 (FAQ) past staleness threshold
- Any unresolved escrow complaint >48 hours old

## 10. Growth Backlog

| ID | Name | Description | Priority | Blocked By |
|----|------|-------------|----------|------------|
| C3 | Canned Response Library | Pre-written, tone-calibrated responses for the 20 most common ticket types. Must handle the emotional range from "I completed my first Oath!" to "I lost $39 during a breakup relapse." | high | Ticket volume >50/week to justify investment |
| C4 | Escalation Playbook | Documented escalation paths for edge cases: simultaneous disputes, practitioner-client conflicts, suspected Fury collusion, multi-contract forfeiture grief. | high | First 100 resolved disputes for pattern data |
| C5 | Fury Auditor Guidelines | Public-facing guide for Fury auditors: evidence evaluation standards, communication expectations, dispute handling, compensation structure. | high | PRD finalization of Fury program mechanics |
| C6 | Self-Service Help Center | Searchable knowledge base replacing static FAQ. Includes video walkthroughs for contract creation, proof submission, and practitioner dashboard. | medium | Active user base >500 |
| C7 | Community Peer Support Program | Trained volunteer moderators in Discord who can answer basic questions and share their own contract completion stories. Reduces ticket load. | medium | Discord community >200 active members |
| C8 | Practitioner Success Playbook | Guide for practitioners on how to introduce Styx to clients, set appropriate contract parameters, and interpret Integrity Score data in clinical context. | high | 10+ active practitioner partners for feedback |
