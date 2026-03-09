# Styx Department Organisms — RE:GE Colony

**Product:** Styx — The Blockchain of Truth
**Architecture:** RE:GE (Recursive Engine: Generative Entities)
**Schema:** [`rege.schema.json`](https://github.com/labores-profani-crux/ergon-prime--business-orchestrator/tree/main/packages/schema/rege.schema.json)
**System Heartbeat:** [PULSE.md](PULSE.md)

---

## What This Is

Each department directory is a **generative entity** — not a folder of docs, but an organism that researches, generates, critiques, heals, and wires to other departments. Every department follows the RE:GE contract defined in its `REGE.md`.

## Department Index

| Code | Name | Artifacts | Persona | REGE |
|------|------|-----------|---------|------|
| `eng` | Engineering | E4, E5 | styx-eng | [REGE.md](eng/REGE.md) |
| `prd` | Product | P1, P2, P3, P4 | styx-product | [REGE.md](prd/REGE.md) |
| `leg` | Legal | L2, L3, L5, L7 | styx-legal | [REGE.md](leg/REGE.md) |
| `fin` | Finance | F1, F2, F3, F5, F6 | styx-finance | [REGE.md](fin/REGE.md) |
| `ops` | Operations | O1, O2, O3, O4 | styx-ops | [REGE.md](ops/REGE.md) |
| `gro` | Growth & Marketing | G1, G2, G3 | styx-growth | [REGE.md](gro/REGE.md) |
| `cxs` | Customer Success | C1, C2 | styx-support | [REGE.md](cxs/REGE.md) |
| `b2b` | Enterprise Sales | B1, B2, B3 | styx-enterprise | [REGE.md](b2b/REGE.md) |

**Cross-department artifacts** (X1, X5) remain in `docs/checklists/` and `docs/pitch/` — they bridge departments.

## Full Artifact Inventory

### Active (27 artifacts)

| ID | Artifact | Dept | Phase | Path |
|----|----------|------|-------|------|
| E4 | Test Strategy | ENG | foundation | `eng/artifacts/test-strategy.md` |
| E5 | Load Test Report | ENG | hardening | `eng/artifacts/load-test-report.md` |
| P1 | Product Requirements Document | PRD | genesis | `prd/artifacts/prd.md` |
| P2 | User Personas | PRD | genesis | `prd/artifacts/user-personas.md` |
| P3 | UX Audit Template | PRD | hardening | `prd/artifacts/ux-audit.md` |
| P4 | Feature Matrix | PRD | foundation | `prd/artifacts/feature-matrix.md` |
| L2 | Terms of Service | LEG | hardening | `leg/artifacts/terms-of-service.md` |
| L3 | Privacy Policy | LEG | hardening | `leg/artifacts/privacy-policy.md` |
| L5 | Regulatory Risk Register | LEG | foundation | `leg/artifacts/regulatory-risk-register.md` |
| L7 | IP & OSS Policy | LEG | genesis | `leg/artifacts/ip-assignment.md` |
| F1 | Unit Economics Model | FIN | genesis | `fin/artifacts/unit-economics.md` |
| F2 | Pricing Strategy & Tiers | FIN | foundation | `fin/artifacts/pricing-strategy.md` |
| F3 | Financial Projections | FIN | foundation | `fin/artifacts/financial-projections.md` |
| F5 | Runway & Burn Rate Tracker | FIN | foundation | `fin/artifacts/runway-tracker.md` |
| F6 | Funding Application Template | FIN | any | `fin/artifacts/funding-application.md` |
| O1 | Incident Response Runbook | OPS | hardening | `ops/artifacts/incident-response.md` |
| O2 | Deployment Procedure | OPS | foundation | `ops/artifacts/deployment-procedure.md` |
| O3 | Monitoring & Alerting Setup | OPS | hardening | `ops/artifacts/monitoring-setup.md` |
| O4 | Database Backup & Recovery | OPS | foundation | `ops/artifacts/backup-recovery.md` |
| G1 | Go-to-Market Strategy | GRO | hardening | `gro/artifacts/gtm-strategy.md` |
| G2 | Content Calendar | GRO | hardening | `gro/artifacts/content-calendar.md` |
| G3 | SEO Strategy | GRO | hardening | `gro/artifacts/seo-strategy.md` |
| C1 | FAQ / Help Center | CXS | hardening | `cxs/artifacts/faq.md` |
| C2 | Onboarding Email Sequences | CXS | hardening | `cxs/artifacts/onboarding-sequence.md` |
| B1 | Ideal Customer Profile | B2B | hardening | `b2b/artifacts/icp.md` |
| B2 | Outreach Sequences | B2B | hardening | `b2b/artifacts/outreach-sequences.md` |
| B3 | Security Questionnaire | B2B | hardening | `b2b/artifacts/security-questionnaire.md` |

### Cross-Department (2 artifacts)

| ID | Artifact | Phase | Path |
|----|----------|-------|------|
| X1 | Phase Gate: PUBLIC_PROCESS → GRADUATED | any | `../checklists/phase-gate-public-process.md` |
| X5 | Pitch Deck Content | hardening | `../pitch/content.md` |

### Deferred (14 artifacts — dormant until GRADUATED)

| ID | Artifact | Dept |
|----|----------|------|
| L4 | Data Processing Agreement | LEG |
| P5 | A/B Test Log | PRD |
| F4 | Revenue Reconciliation | FIN |
| O5 | Cost Management | OPS |
| O6 | On-Call Rotation | OPS |
| G4 | PR / Media Plan | GRO |
| G5 | Referral Program | GRO |
| G6 | Partnership Playbook | GRO |
| C3 | Support Playbook | CXS |
| C4 | Churn Signals Dashboard | CXS |
| C5 | NPS Survey | CXS |
| B4 | SLA Template | B2B |
| B5 | Demo Script | B2B |
| B6 | Pricing Proposal Template | B2B |

## Directory Layout

```
departments/
├── README.md          ← this file
├── PULSE.md           ← system heartbeat (cadences, routing, health)
├── {dept}/
│   ├── REGE.md        ← generative entity definition (the organism's DNA)
│   ├── artifacts/     ← generated output (the active documents)
│   ├── reviews/       ← self-critique + human review logs
│   ├── signals/       ← incoming triggers (nervous system)
│   └── data/          ← mutable tracking data (metrics, snapshots)
```

## How It Works

1. **REGE.md** defines what the department does (mission, scope), what it generates (GEN: prompts), how it self-evaluates (CRIT: rules), and how it self-heals (HEAL: procedures).
2. **Cadence-driven:** Departments generate on defined rhythms (daily/weekly/monthly/quarterly). See PULSE.md for the full matrix.
3. **Signal-wired:** Departments communicate via named signals. When ENG deploys, OPS and FIN are notified. When FIN changes pricing, GRO, B2B, and CXS update their artifacts.
4. **Self-critiquing:** Each department runs CRIT: checks that detect staleness, drift, and gaps. Escalations route to PULSE.
5. **Self-healing:** HEAL: procedures fire when problems are detected. They create new versions (never overwrite) and flag for human review.
6. **Human-guarded:** All departments operate at `autonomy: guarded` — full autonomy within guardrails, with human checkpoints for external-facing output and substantive changes.

## Schema

All REGE.md files conform to the RE:GE schema defined in [`ergon-prime--business-orchestrator/packages/schema/rege.schema.json`](https://github.com/labores-profani-crux/ergon-prime--business-orchestrator/tree/main/packages/schema/rege.schema.json). This ensures every product's department organisms are structurally interoperable.
