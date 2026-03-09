# PULSE — System Heartbeat

**Product:** Styx — The Blockchain of Truth
**Entity:** RE:GE Colony Pulse Monitor
**Version:** 1.0
**Last Updated:** 2026-03-08

This document defines the system-wide orchestration layer for all 8 department organisms.

---

## Cadence Matrix

| Cadence | ENG | PRD | LEG | FIN | OPS | GRO | CXS | B2B |
|---------|-----|-----|-----|-----|-----|-----|-----|-----|
| **Daily** | CI review, error monitoring | Triage feedback, analytics | ToS violation flags | Stripe reconciliation, escrow check | Dashboards, deploy queue, backups | Social engagement, distribution | Ticket triage, community | Prospect research, follow-ups |
| **Weekly** | Dependency audit, PR review | Sprint planning, prioritization | Regulatory news scan | Burn rate review, cash position | Performance metrics, retros | Content publish, SEO tracking | FAQ review, funnel analysis | Outreach batch, pipeline review |
| **Monthly** | Load test review, coverage analysis | Roadmap review, persona validation | Compliance checklist | Close books, runway update, Fury payouts | Load test, cost review, backup drill | Content performance, channel ROI | Ticket themes, churn signals, NPS | Pipeline analysis, ICP refinement |
| **Quarterly** | Architecture review, tech debt | Competitive analysis, pricing review | Full regulatory audit, IP review | Scenario modeling, pricing analysis, funding | DR test, capacity planning | GTM strategy review, brand audit | Support process audit, KB overhaul | Pricing review, partnerships, security Q |

## Signal Routing Table

### Engineering (ENG)

| Signal | Direction | Targets | Action |
|--------|-----------|---------|--------|
| `signal:deploy-complete` | emits | OPS, FIN | Confirm deployment success, update cost tracking |
| `signal:test-failure` | emits | PRD, OPS | Alert on test regression, assess user impact |
| `signal:api-change` | emits | PRD, OPS, CXS, B2B | Update docs, deployment procedure, FAQ, security Q |

### Product (PRD)

| Signal | Direction | Targets | Action |
|--------|-----------|---------|--------|
| `signal:feature-shipped` | emits | GRO, CXS, OPS, B2B | Update marketing, help docs, monitoring, proposals |
| `signal:roadmap-change` | emits | ENG, GRO, B2B | Re-prioritize engineering, update GTM, update outreach |
| `signal:persona-update` | emits | GRO, CXS, B2B | Refresh targeting, support scripts, ICP |

### Legal (LEG)

| Signal | Direction | Targets | Action |
|--------|-----------|---------|--------|
| `signal:compliance-alert` | emits | PULSE (all) | System-wide regulatory awareness |
| `signal:tos-update` | emits | CXS, GRO, B2B | Update FAQ, marketing claims, security Q |
| `signal:privacy-change` | emits | ENG, PRD, OPS | Update data handling, product spec, monitoring |

### Finance (FIN)

| Signal | Direction | Targets | Action |
|--------|-----------|---------|--------|
| `signal:pricing-change` | emits | GRO, B2B, CXS | Update landing pages, proposals, FAQ |
| `signal:runway-alarm` | escalates | PULSE (all) | System-wide alert — runway < 3 months |
| `signal:revenue-milestone` | emits | GRO, PRD | Celebrate, adjust roadmap assumptions |

### Operations (OPS)

| Signal | Direction | Targets | Action |
|--------|-----------|---------|--------|
| `signal:deploy-complete` | emits | ENG, FIN | Confirm deployment, update cost tracking |
| `signal:incident-detected` | escalates | PULSE (all) | System-wide incident response |
| `signal:performance-degradation` | emits | ENG, PRD | Diagnose, assess user impact |

### Growth & Marketing (GRO)

| Signal | Direction | Targets | Action |
|--------|-----------|---------|--------|
| `signal:content-published` | emits | CXS, B2B | Share with users, share with prospects |
| `signal:campaign-results` | emits | PRD, FIN | Feed analytics, update actuals |

### Customer Success (CXS)

| Signal | Direction | Targets | Action |
|--------|-----------|---------|--------|
| `signal:churn-risk` | emits | PRD, B2B | Prioritize retention features, alert account owners |
| `signal:faq-gap` | emits | ENG, PRD | Missing feature doc, product gap |
| `signal:onboarding-friction` | emits | PRD, ENG | UX improvement, bug fix |

### Enterprise Sales (B2B)

| Signal | Direction | Targets | Action |
|--------|-----------|---------|--------|
| `signal:deal-closed` | emits | FIN, CXS | Update revenue, onboard new account |
| `signal:icp-shift` | emits | PRD, GRO | Adjust product roadmap, update targeting |
| `signal:enterprise-feature-request` | emits | PRD, ENG | Evaluate, prioritize |

## Ecosystem Signal Routing

| Signal | Source | Targets | Trigger |
|--------|--------|---------|---------|
| `signal:ecosystem-arm-live` | ANY dept | GRO, FIN, B2B, PULSE | An ecosystem arm transitions to `live` |
| `signal:ecosystem-gaps` | GRO, OPS | PRD, PULSE | Ecosystem audit finds missing coverage |
| `signal:revenue-stall` | FIN | PRD, B2B | Revenue arm stalled for 2+ quarters |
| `signal:enterprise-readiness-gap` | B2B | OPS, ENG | Enterprise requirements not met by ecosystem arms |
| `signal:unmonitored-delivery` | OPS | ENG | Live delivery arm without monitoring coverage |
| `signal:marketing-blind-spots` | GRO | PRD, PULSE | 3+ marketing arms still not_started at GRADUATED |

### Ecosystem Health Protocol

When `signal:ecosystem-arm-live` fires:
1. GRO: update marketing copy and landing pages to reflect new live channel
2. FIN: begin revenue tracking for the arm if revenue-bearing
3. B2B: update enterprise readiness assessment and security questionnaire
4. PULSE: log the transition in the ecosystem changelog

When `signal:ecosystem-gaps` fires:
1. PRD: evaluate whether roadmap items address the gap
2. PULSE: add to next monthly strategic review agenda

## Staleness Dashboard

| Dept | Artifact | Staleness Threshold | Status |
|------|----------|-------------------|--------|
| ENG | E4 test-strategy.md | 90 days | active |
| ENG | E5 load-test-report.md | 30 days | active |
| PRD | P1 prd.md | 90 days | active |
| PRD | P2 user-personas.md | 90 days | active |
| PRD | P3 ux-audit.md | 60 days | active |
| PRD | P4 feature-matrix.md | 30 days | active |
| LEG | L2 terms-of-service.md | 180 days | active |
| LEG | L3 privacy-policy.md | 180 days | active |
| LEG | L5 regulatory-risk-register.md | 90 days | active |
| LEG | L7 ip-assignment.md | 180 days | active |
| FIN | F1 unit-economics.md | 90 days | active |
| FIN | F2 pricing-strategy.md | 90 days | active |
| FIN | F3 financial-projections.md | 30 days | active |
| FIN | F5 runway-tracker.md | 30 days | active |
| FIN | F6 funding-application.md | 90 days | active |
| OPS | O1 incident-response.md | 90 days | active |
| OPS | O2 deployment-procedure.md | 60 days | active |
| OPS | O3 monitoring-setup.md | 60 days | active |
| OPS | O4 backup-recovery.md | 90 days | active |
| GRO | G1 gtm-strategy.md | 60 days | active |
| GRO | G2 content-calendar.md | 14 days | active |
| GRO | G3 seo-strategy.md | 60 days | active |
| CXS | C1 faq.md | 30 days | active |
| CXS | C2 onboarding-sequence.md | 60 days | active |
| B2B | B1 icp.md | 90 days | active |
| B2B | B2 outreach-sequences.md | 30 days | active |
| B2B | B3 security-questionnaire.md | 90 days | active |

## Inter-Department Dependency Graph

```
                    ┌─────────┐
                    │   PRD   │ ← product intelligence hub
                    └────┬────┘
                         │ signal:feature-shipped
            ┌────────────┼────────────┐
            ▼            ▼            ▼
       ┌─────────┐ ┌─────────┐ ┌─────────┐
       │   ENG   │ │   GRO   │ │   B2B   │
       └────┬────┘ └────┬────┘ └────┬────┘
            │           │           │
   signal:  │  signal:  │  signal:  │
   deploy-  │  content- │  deal-    │
   complete │  published│  closed   │
            ▼           ▼           ▼
       ┌─────────┐ ┌─────────┐ ┌─────────┐
       │   OPS   │ │   CXS   │ │   FIN   │
       └─────────┘ └─────────┘ └─────────┘
                                     │
                            signal:pricing-change
                         ┌───────────┼───────────┐
                         ▼           ▼           ▼
                    ┌─────────┐ ┌─────────┐ ┌─────────┐
                    │   GRO   │ │   B2B   │ │   CXS   │
                    └─────────┘ └─────────┘ └─────────┘

       ┌─────────┐
       │   LEG   │ ── signal:compliance-alert ──► ALL DEPARTMENTS
       └─────────┘
```

## Autonomy Guardrails (System-Wide)

1. **Never delete.** All modifications create new versions. Old versions are retained for audit trail.
2. **Version everything.** Artifacts, reviews, and data files use date-stamped filenames when updated (e.g., `data/2026-03-actuals.md`).
3. **Human approves externals.** Any content that will be seen by customers, partners, or regulators requires human review before publication.
4. **Append, don't overwrite.** Data files (financial actuals, metrics, logs) are append-only. Historical records are never modified.
5. **Signal processing SLA.** All incoming signals must be acknowledged within 7 days. Unprocessed signals > 14 days trigger yellow health.
6. **Escalation is immediate.** Signals marked `escalates` bypass normal cadence and alert PULSE immediately.
7. **No cross-department writes.** Departments can read any other department's artifacts but can only write to their own directories.
8. **Review before heal.** Any HEAL: procedure that modifies substantive content (not just metadata) requires human review of the diff before merge.

## Human Review Schedule

| Cadence | What | Who |
|---------|------|-----|
| Daily (5 min) | Scan PULSE for red/yellow health indicators | Founder |
| Weekly (30 min) | Review GEN: outputs from past week, approve/reject | Founder |
| Monthly (2 hr) | Full department health review: staleness, signals, critiques | Founder |
| Quarterly (half day) | Strategic review: are departments aligned with product direction? | Founder + advisors |

## Escalation Protocols

### Level 1: Department Yellow
- 1+ artifacts stale OR unprocessed signals 7-14 days
- Action: Department self-heals. HEAL: procedures fire automatically.
- Human notification: Weekly review summary.

### Level 2: Department Red
- 3+ artifacts stale OR unprocessed signals > 14 days OR active CRIT: escalation
- Action: Immediate PULSE notification. Human review within 48 hours.
- Affected department pauses GEN: outputs until health restored.

### Level 3: System Alert
- `signal:runway-alarm` OR `signal:incident-detected` OR `signal:compliance-alert`
- Action: All departments receive signal. Human review within 24 hours.
- Cross-department coordination required.
