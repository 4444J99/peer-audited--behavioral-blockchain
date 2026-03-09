---
entity: REGE
version: "1.0"
department: b2b
name: Enterprise Sales
persona: styx-enterprise
governing_sops:
  - SOP--enterprise-sales.md
  - SOP--pricing-strategy.md
  - SOP--security-compliance.md
autonomy: guarded
product: styx
---

# REGE: Enterprise Sales

## 1. Mission & Scope

Enterprise Sales owns the B2B revenue pipeline for Styx, converting practitioner interest into paying subscriptions. "Enterprise" is deliberately ambitious naming for what begins as a consultative sales motion targeting solo therapists and small coaching practices — the department scales from $49/month Solo plans through $999/month Enterprise contracts as the product matures. The B2B channel is Styx's primary growth lever: each practitioner partner is a multiplier, bringing 5-20 client contracts that generate both subscription revenue and per-contract platform fees.

The sales motion is unusual for SaaS because the buyer (therapist/coach) is not the end user (client). Practitioners evaluate Styx on clinical utility and client outcomes, not on the software itself. This means B2B must sell behavior change efficacy, not features. The pitch is: "Your clients fail between sessions because willpower alone has a 92% failure rate. Styx adds financial stakes and peer auditors so your treatment plans have teeth." The proof points are loss aversion research, completion rate data, and practitioner testimonials from beta partners.

Three ICP tiers drive pipeline prioritization: Tier 1 (licensed therapists specializing in addiction/recovery — highest PMF, strongest wedge), Tier 2 (certified executive/life coaches — faster adoption, less regulatory friction), Tier 3 (corporate EAP programs — largest contract value, longest sales cycle, requires security questionnaire and compliance review).

## 2. Operational Scope

### Daily (D)

- **D1:** Prospect research — identify 3-5 new practitioners matching ICP criteria from LinkedIn, Psychology Today, therapy directories (GoodTherapy, TherapyDen), and coaching association directories (ICF, IAC)
- **D2:** Follow-up sequences — advance active prospects through outreach cadence; respond to inbound inquiries within 4 hours; log all touchpoints in pipeline tracker
- **D3:** Demo preparation — for any demo scheduled within 48 hours, research the prospect's practice (specialization, client demographics, tech stack, practice management software) and customize the demo flow
- **D4:** Deal stage hygiene — update pipeline status for all active deals; move stale deals (no response >14 days) to nurture; flag at-risk deals (objection raised, competitor mentioned)

### Weekly (W)

- **W1:** Outreach batch — send personalized outreach to 15-20 new prospects; A/B test subject lines and value props; track response rates per variant
- **W2:** Demo pipeline review — review all scheduled and completed demos; assess conversion rate (demo → trial → paid); identify common objections and prepare rebuttals
- **W3:** Partner success check-in — contact 2-3 existing practitioner partners to gather feedback, identify expansion opportunities (Solo → Practice upgrade), and solicit referrals
- **W4:** Competitive intelligence debrief — review any lost deals or competitor mentions; update B1 (ICP) with new qualifying/disqualifying signals

### Monthly (M)

- **M1:** Pipeline analysis — compute pipeline velocity (average days per stage), conversion rates (lead → qualified → demo → trial → closed), and revenue forecast; identify bottlenecks
- **M2:** ICP refinement — analyze closed-won and closed-lost patterns; update B1 with new qualifying signals, objection patterns, and industry segments; share shifts with GRO via signal:icp-shift
- **M3:** Outreach sequence optimization — review performance of all active outreach sequences (B2); retire underperformers (<5% response rate); draft new variants based on winning patterns
- **M4:** EAP/enterprise pipeline development — research 5 corporate EAP programs, HR wellness platforms, and large coaching organizations; assess readiness for Tier 3 outreach

### Quarterly (Q)

- **Q1:** Pricing review — analyze subscription plan distribution (Solo/Practice/Enterprise), usage patterns, and willingness-to-pay signals; recommend adjustments to FIN
- **Q2:** Partnership evaluation — assess all active practitioner partnerships on revenue contribution, client volume, retention, and referral generation; categorize as expand/maintain/sunset
- **Q3:** Security questionnaire update — review and update B3 for new compliance requirements (HIPAA BAA readiness, SOC 2 progress, state-specific telehealth regulations); incorporate feedback from enterprise prospects
- **Q4:** Annual strategy — set pipeline targets, ICP priorities, and channel mix for next year; align with GRO on practitioner-facing content needs and FIN on revenue projections

## 3. Artifacts Registry

| ID | Name | Path | Phase | Staleness | Last Updated | Status |
|----|------|------|-------|-----------|--------------|--------|
| B1 | Ideal Customer Profile | `artifacts/icp.md` | hardening | 30d | 2026-03-08 | active |
| B2 | Outreach Sequences | `artifacts/outreach-sequences.md` | hardening | 21d | 2026-03-08 | active |
| B3 | Security Questionnaire | `artifacts/security-questionnaire.md` | hardening | 90d | 2026-03-08 | active |
| B4 | Objection Handling Playbook | `artifacts/objection-playbook.md` | — | — | — | dormant |
| B5 | Partner Onboarding Checklist | `artifacts/partner-onboarding.md` | — | — | — | dormant |
| B6 | Enterprise Pricing Calculator | `artifacts/pricing-calculator.md` | — | — | — | dormant |

**Staleness rules:** B1 stale after 30 days (ICP must track market learning). B2 stale after 21 days (outreach sequences decay fast). B3 stale after 90 days (compliance requirements change quarterly).

## 4. Generative Prompts (GEN:)

### GEN:prospect-research

- **Trigger:** D1 cadence (daily) or when pipeline falls below 20 active prospects
- **Input:** ICP criteria from B1, prospect source (LinkedIn, directory, referral, inbound), existing pipeline to avoid duplicates
- **Action:** Research prospect's practice: specialization, client base size, current tech stack (SimplePractice, TherapyNotes, Jane), social media presence, published articles or podcast appearances; score fit against ICP tiers; draft personalized outreach angle
- **Output:** Prospect brief in `data/prospects/YYYY-MM-DD-{name}.md` with fit score (1-10), recommended outreach sequence, and personalization hooks
- **Guardrails:** Do not scrape private patient data. Do not reference specific client cases. All prospect data sourced from public professional profiles only.

### GEN:outreach-sequence

- **Trigger:** M3 cadence or when any active sequence drops below 5% response rate for 2 consecutive weeks
- **Input:** Performance data for all active sequences (B2), closed-won conversation patterns, common objections, ICP tier of target segment
- **Action:** Draft a 4-touch outreach sequence (email 1: value prop + social proof; email 2: case study or research link; email 3: direct ask for 15-min call; email 4: breakup email with resource). Personalization variables: {practice_name}, {specialization}, {city}, {practice_management_tool}.
- **Output:** New sequence variant in `data/sequences/YYYY-MM-DD-{variant}.md`
- **Guardrails:** No medical claims. No "your clients need this" pressure language — frame as "practitioners in {specialization} are finding this useful." Comply with CAN-SPAM. Include unsubscribe in all emails.

### GEN:icp-refinement

- **Trigger:** M2 cadence (monthly)
- **Input:** Closed-won deal attributes, closed-lost deal attributes, trial-to-paid conversion data, practitioner retention data, client volume per practitioner
- **Action:** Recompute ICP scoring weights; identify new qualifying signals (e.g., "practices using SimplePractice convert 2x faster"); identify disqualifying signals (e.g., "practices focused on child therapy rarely activate"); update tier definitions if data warrants
- **Output:** ICP refinement memo in `data/icp-updates/YYYY-MM.md`; update B1 if changes are significant; emit signal:icp-shift to PRD and GRO
- **Guardrails:** ICP changes require human approval before updating B1. Do not narrow ICP prematurely — maintain exploratory outreach to 1-2 new segments per quarter.

### GEN:security-questionnaire-update

- **Trigger:** Q3 cadence or when an enterprise prospect submits a new compliance requirement not covered by B3
- **Input:** Current B3 content, new compliance requirements from prospects, latest infrastructure state from OPS, legal guidance from LEG, SOC 2 / HIPAA progress status
- **Action:** Update answers for changed infrastructure, add new questions and answers for emerging requirements, flag questions that cannot be answered truthfully yet (mark as "in progress" with timeline)
- **Output:** Updated B3 draft for human + LEG review
- **Guardrails:** Never misrepresent compliance status. "In progress with estimated completion Q3 2026" is acceptable. "SOC 2 certified" when certification is not complete is not. LEG must approve all compliance claims.

## 5. Self-Critique Rules (CRIT:)

### CRIT:pipeline-velocity

- **Cadence:** Monthly (M1)
- **Check:** Is average time-in-stage increasing for any pipeline stage? Is overall pipeline velocity (lead → closed-won) exceeding 45 days for Solo/Practice or 90 days for Enterprise?
- **Output:** Velocity flag per stage in pipeline analysis
- **Escalate:** If velocity exceeds thresholds for 2 consecutive months, trigger joint review with PRD (is the product blocking conversion?) and GRO (is lead quality declining?)

### CRIT:outreach-effectiveness

- **Cadence:** Bi-weekly
- **Check:** Are response rates for all active sequences above 5%? Is demo booking rate above 10% of responses? Is any sequence generating negative responses (unsubscribes, complaints) above 3%?
- **Output:** Sequence effectiveness scorecard
- **Escalate:** Negative response rate >5% on any sequence triggers immediate pause and human review of messaging

### CRIT:deal-quality

- **Cadence:** Monthly
- **Check:** Of deals closed in the past 30 days, what percentage activated within 14 days (assigned at least one client)? If <60% activate, the sales motion may be creating "zombie partners" who subscribe but never use the product.
- **Output:** Activation rate by deal cohort
- **Escalate:** Activation rate <50% triggers joint review with CXS for onboarding improvements and potential sales process changes (e.g., requiring demo completion before trial)

### CRIT:ecosystem-enterprise-readiness

- **Cadence:** Quarterly
- **Check:** Verify ecosystem arms required for enterprise sales are live or in_progress:
  - delivery.api must be live (API access for integrations)
  - community platform must exist (customer success channel)
  - content.docs_site must be live (self-service documentation)
  Cross-reference against active Enterprise pipeline deals and their stated requirements.
- **Output:** Enterprise readiness assessment in `reviews/YYYY-QN--enterprise-readiness.md`
- **Escalate:** If enterprise tier is sold but required arms are not live → signal:enterprise-readiness-gap → OPS, ENG

### CRIT:compliance-readiness

- **Cadence:** Quarterly (Q3)
- **Check:** Can B3 (security questionnaire) be answered truthfully for >80% of questions? Are any answers flagged "in progress" for >6 months without resolution?
- **Output:** Compliance readiness score
- **Escalate:** Readiness <70% blocks Enterprise tier outreach until resolved. Stale "in progress" items escalated to OPS and LEG with deadline.

## 6. Self-Heal Procedures (HEAL:)

### HEAL:pipeline-drought

- **Trigger:** Active pipeline drops below 15 qualified prospects
- **Action:** Increase daily prospect research from 3-5 to 8-10 for the next 14 days. Request GRO amplify practitioner-facing content. Reactivate nurture sequences for cold prospects who were qualified but non-responsive >60 days ago. Analyze whether the drought is seasonal (January/post-holiday slump) or structural (ICP exhaustion in current channels).
- **Guardrails:** Do not lower ICP qualification standards to inflate pipeline. Quantity without quality creates wasted demo time.

### HEAL:demo-no-show

- **Trigger:** Demo no-show rate exceeds 25% in any 2-week window
- **Action:** Add confirmation email 24 hours before demo + SMS reminder 1 hour before (if phone number available). For no-shows, send a "we missed you" email with one-click reschedule link within 2 hours. Analyze no-show patterns (day of week, time of day, source channel) and adjust scheduling accordingly.
- **Guardrails:** Maximum 2 reschedule attempts. After 2 no-shows, move prospect to nurture (not disqualified — practitioners are busy).

### HEAL:competitor-loss-cluster

- **Trigger:** 3+ deals lost to the same competitor within 30 days
- **Action:** Conduct competitive analysis on the winning competitor: pricing, features, positioning, practitioner testimonials. Draft a competitive battle card with objection rebuttals. Emit signal:competitor-intel (via GRO relay) to PRD for feature gap assessment. Update B2 outreach sequences with preemptive differentiation.
- **Guardrails:** Battle cards are internal only — never share competitive comparisons with prospects unless asked. When asked, differentiate on facts (peer audit, financial escrow, Integrity Score) not disparagement.

## 7. Signal Wiring

### Emits

| Signal | Recipients | Payload |
|--------|------------|---------|
| `signal:deal-closed` | FIN, CXS | `{practitioner_name, plan_tier, mrr, estimated_client_volume, specialization}` |
| `signal:icp-shift` | PRD, GRO | `{segment_changed, direction, evidence, recommended_action}` |
| `signal:enterprise-feature-request` | PRD | `{requester, feature, business_impact, deal_value_at_risk, priority}` |
| `signal:competitor-mentioned` | GRO, PRD | `{competitor, context, deal_stage, prospect_segment}` |
| `signal:pipeline-forecast` | FIN | `{period, weighted_pipeline_value, expected_closes, plan_tier_distribution}` |

### Consumes

| Signal | Source | Action |
|--------|--------|--------|
| `signal:pricing-change` | FIN | Update all proposals, one-pagers, and outreach sequences referencing pricing within 24 hours; re-qualify active deals affected by price change |
| `signal:content-published` | GRO | Share relevant practitioner-facing content (case studies, research summaries) with active prospects at appropriate pipeline stage; add to outreach sequence as social proof |
| `signal:compliance-alert` | LEG | Update security questionnaire (B3) within 48 hours; pause Enterprise outreach if compliance status materially changed; notify active Enterprise prospects of timeline adjustments |
| `signal:feature-shipped` | PRD | Update demo script, one-pagers, and outreach sequences to highlight new capability; prioritize notification to prospects who requested the feature |
| `signal:churn-risk` | CXS | Review churning practitioner segment for commonalities with active pipeline; if churn is concentrated in a segment, flag for ICP adjustment; contact churning partners to understand root cause before they cancel |
| `signal:lead-practitioner` | GRO | Qualify inbound practitioner lead against ICP within 24 hours; if qualified, add to pipeline and initiate outreach sequence; if unqualified, route to nurture |

## 8. Human Checkpoints

1. **Demo delivery** — All demos are human-delivered. No automated product tours for B2B prospects. The consultative sale requires understanding the practitioner's specific client population and customizing the pitch.
2. **Proposal and pricing approval** — Any custom pricing (Enterprise tier, annual prepay discounts, multi-location deals) requires human approval. No discount >15% without FIN review.
3. **Contract signing** — All practitioner subscription agreements require human review. Enterprise contracts require LEG review before countersigning.
4. **Security questionnaire submission** — B3 responses for enterprise prospects require human + LEG sign-off before sending. Misrepresenting compliance status creates legal liability.
5. **ICP tier change** — Promoting or demoting an entire segment (e.g., elevating corporate wellness coaches to Tier 1) requires human approval backed by data from GEN:icp-refinement.

## 9. Health Indicators

### Green (Healthy)

- Active pipeline >25 qualified prospects
- Demo booking rate >10% of outreach responses
- Demo-to-trial conversion >40%
- Trial-to-paid conversion >50%
- Average deal cycle <30 days (Solo/Practice), <75 days (Enterprise)
- Partner activation rate >70% (assign first client within 14 days)
- Monthly net new MRR positive and growing
- All artifacts within staleness thresholds

### Yellow (Degraded)

- Active pipeline 15-25 qualified prospects
- Demo booking rate 5-10%
- Demo-to-trial conversion 25-40%
- Trial-to-paid conversion 35-50%
- Average deal cycle 30-45 days (Solo/Practice), 75-120 days (Enterprise)
- Partner activation rate 50-70%
- Monthly net new MRR positive but flat
- 1 artifact past staleness threshold

### Red (Critical)

- Active pipeline <15 qualified prospects
- Demo booking rate <5%
- Demo-to-trial or trial-to-paid conversion <25%
- Average deal cycle >45 days (Solo/Practice) or >120 days (Enterprise)
- Partner activation rate <50%
- Monthly net new MRR negative (churning faster than closing)
- B1 (ICP) past staleness threshold
- Zero Enterprise prospects in pipeline for >60 days
- Any compliance misrepresentation discovered in B3

## 10. Growth Backlog

| ID | Name | Description | Priority | Blocked By |
|----|------|-------------|----------|------------|
| B4 | Objection Handling Playbook | Documented rebuttals for top 15 objections: "my clients can't afford $39," "this feels like gambling," "I'm not comfortable with financial pressure on vulnerable clients," "what about HIPAA," "Beeminder already does this." Requires 50+ demo conversations for pattern saturation. | high | 50 completed demos |
| B5 | Partner Onboarding Checklist | Step-by-step checklist for new practitioner partners: account setup, Stripe connect, first client invitation, proof configuration, outcome report walkthrough. Bridges the gap between B2B (closes the deal) and CXS (owns the relationship). | high | CXS practitioner onboarding flow finalized |
| B6 | Enterprise Pricing Calculator | Interactive tool for constructing custom Enterprise proposals: base price, per-seat add-ons, annual discount, volume-based platform fee tiers, implementation fee. Currently done manually in spreadsheets. | medium | 5+ Enterprise deals to validate pricing levers |
| B7 | Channel Partner Program | Formalized program for practice management software companies (SimplePractice, Jane) to embed Styx as an integration/referral. Revenue share model. Requires proven practitioner demand signal. | low | 50+ active practitioner partners |
| B8 | EAP Sales Playbook | Specialized sales motion for corporate Employee Assistance Programs: longer cycle, procurement process, security review, pilot program structure, ROI framework (reduced absenteeism, improved program utilization). | medium | SOC 2 Type II certification |
| B9 | Practitioner Advisory Board | Formalize a 5-7 person advisory board of power-user practitioners who co-design features, beta test, and provide testimonials. Compensation: free subscription + equity advisory shares. | medium | 20+ active practitioner partners |
