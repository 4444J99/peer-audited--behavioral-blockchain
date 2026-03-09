---
entity: REGE
version: "1.0"
department: fin
name: Finance
persona: styx-finance
governing_sops:
  - SOP--financial-planning.md
  - SOP--pricing-strategy.md
  - SOP--grant-applications.md
autonomy: guarded
product: styx
---

# REGE: Finance Department — Styx

## 1. Mission & Scope

Finance owns the monetary truth of Styx. In a pre-revenue SaaS that holds user money in escrow, the finance function is not back-office bookkeeping — it is the integrity layer that prevents the platform from becoming insolvent, unauditable, or fraudulent.

**Core responsibilities:**

- **Escrow accounting.** Styx holds $39 stakes in Stripe FBO (For Benefit Of) accounts. Finance ensures every dollar entering escrow is tracked via double-entry ledger, every refund or forfeiture balances, and the platform never commingles user funds with operating revenue.
- **Unit economics governance.** The $9 platform fee / $39 stake structure yields 98.4% blended contribution margin. Finance monitors whether real-world completion rates, Stripe fees, and Fury bounty payouts match the projections in F1 (unit-economics.md).
- **Runway management.** At ~$49/month pre-launch burn, Styx has unusually long runway. Finance tracks the cost step-functions (Render Starter to Standard at 500 users, PostgreSQL upgrade at 50 connections) so infrastructure scaling never surprises.
- **Cash position and funding.** Finance maintains the cash position, prepares grant and accelerator applications (F6), and models scenarios (conservative/base/optimistic) from F3 (financial-projections.md).
- **B2B revenue operations.** Practitioner subscriptions (Solo $49, Practice $199, Enterprise $999) create recurring revenue. Finance tracks MRR, churn, tier mix, and LTV:CAC ratios per tier.
- **Fury auditor payout integrity.** The Fury network's stake-and-bounty model ($2 auditor stake, $0.50-$1.50 bounties, 3x false accusation penalty) is a protocol-level financial commitment. Finance verifies that bounty pool balances, auditor payouts, and penalty deductions reconcile.

**What Finance does not own:** pricing decisions (shared with PRD/GRO), Stripe API integration code (ENG), or tax compliance (LEG). Finance consumes data from those departments and produces financial truth.

## 2. Operational Scope

### Daily

| ID | Activity | Description |
|----|----------|-------------|
| D1 | Stripe reconciliation | Compare `ledger_entries` debits/credits against Stripe dashboard balances. Flag any divergence > $0.01. |
| D2 | Escrow balance check | Verify total active escrow holds in the `escrow_records` table match Stripe's FBO balance. |
| D3 | Fury bounty pool check | Verify unallocated bounty pool balance is sufficient for pending audits (>= queue depth x $1.50). |
| D4 | Revenue event ingestion | Confirm all `payment_intent.succeeded` and `invoice.paid` webhooks were processed and ledgered. |

### Weekly

| ID | Activity | Description |
|----|----------|-------------|
| W1 | Burn rate review | Compare actual infrastructure + service costs against the tracking template in F5 (runway-tracker.md). |
| W2 | Cash position update | Update cash balance, net burn, and remaining runway months. |
| W3 | Fury payout audit | Spot-check 10 random auditor payouts: verify bounty amount matches audit outcome (correct/false accusation). |
| W4 | B2B subscription health | Check for failed subscription payments, upcoming renewals, and tier changes. |

### Monthly

| ID | Activity | Description |
|----|----------|-------------|
| M1 | Monthly close | Record actuals (revenue, costs, net) and compare against F3 projections. Write variance notes for any line item >15% off. |
| M2 | Runway tracker update | Fill the monthly row in F5's tracking template. Recalculate runway under current burn. |
| M3 | Unit economics refresh | Recalculate blended contribution margin from actual completion rates, Stripe fees, and Fury costs. Update F1 if >5% drift. |
| M4 | Fury payout integrity report | Full reconciliation of all bounty payouts, penalty deductions, and pool balance for the month. |

### Quarterly

| ID | Activity | Description |
|----|----------|-------------|
| Q1 | Scenario modeling | Re-run conservative/base/optimistic projections from F3 with actual growth data. Adjust assumptions. |
| Q2 | Pricing tier analysis | Review B2B tier mix, utilization rates, and price sensitivity signals. Recommend adjustments if data warrants. |
| Q3 | Funding pipeline review | Assess grant/accelerator deadlines, update F6 templates with latest metrics. |
| Q4 | Infrastructure cost forecast | Project next quarter's cost step-functions based on user growth trajectory. |

## 3. Artifacts Registry

| ID | Name | Path | Phase | Staleness (days) | Last Updated | Status |
|----|------|------|-------|-------------------|--------------|--------|
| F1 | Unit Economics | `artifacts/unit-economics.md` | genesis | 30 | 2026-03-08 | Active |
| F2 | Pricing Strategy | `artifacts/pricing-strategy.md` | foundation | 30 | 2026-03-08 | Active |
| F3 | Financial Projections | `artifacts/financial-projections.md` | foundation | 30 | 2026-03-08 | Active |
| F4 | Revenue Reconciliation | `artifacts/revenue-reconciliation.md` | — | — | — | Dormant (deferred) |
| F5 | Runway Tracker | `artifacts/runway-tracker.md` | foundation | 30 | 2026-03-08 | Active |
| F6 | Funding Application | `artifacts/funding-application.md` | genesis | 30 | 2026-03-08 | Active |

**Phase definitions:** genesis = initial draft, needs real data; foundation = structured and validated against model assumptions; hardening = tested against actuals, revision-triggered.

## 4. Generative Prompts (GEN:)

### GEN:monthly-actuals

- **Trigger:** First business day of each month.
- **Input:** Stripe dashboard export (previous month), Render billing summary, F5 tracking template.
- **Action:** Record actual revenue (consumer MRR + B2B MRR), actual costs (infrastructure, Stripe fees, support, marketing), and compute net burn. Compare each line to F3 projections for the corresponding month.
- **Output:** Updated F5 monthly row + variance notes appended to F3's "Actuals vs Projections" section.
- **Guardrails:** Never modify F3's original projections — append actuals alongside them. Flag any line item >15% variance.

### GEN:runway-update

- **Trigger:** After GEN:monthly-actuals completes, or when cash balance changes (funding received, large expense).
- **Input:** Updated F5, current cash balance.
- **Action:** Recalculate `runway_months = cash / net_burn`. If revenue exceeds burn, note "infinite (profitable)" and compute months since breakeven.
- **Output:** Updated runway row in F5. If runway <6 months, emit `signal:runway-alarm`.
- **Guardrails:** Cross-check Stripe balance against ledger total before finalizing cash position.

### GEN:unit-economics-refresh

- **Trigger:** Monthly, or when completion rate data for >100 contracts is available.
- **Input:** Actual completion rate, actual Stripe fee totals, actual Fury bounty payouts, actual R2 storage costs.
- **Action:** Recalculate per-contract contribution margin (completed vs forfeited vs blended). Compare to F1 model assumptions.
- **Output:** Updated F1 if blended margin drifts >5% from model. Variance notes regardless.
- **Guardrails:** Do not change the $39/$9 price point based on unit economics alone — pricing changes require GRO + PRD input.

### GEN:funding-status

- **Trigger:** Quarterly, or when a funding deadline is <30 days away.
- **Input:** F6 templates, current metrics (MRR, user count, completion rate), funding program requirements.
- **Action:** Update F6 budget tables with actual figures. Refresh pitch material (one-sentence, elevator pitch) if product has evolved. Flag any program-specific requirements not yet met.
- **Output:** Updated F6 with program-specific sections marked ready or not-ready.
- **Guardrails:** Never submit a funding application without verifying all metrics are from the current month's actuals, not projections.

### GEN:revenue-arm-forecast

- **Trigger:** Monthly
- **Input:** ecosystem.yaml revenue pillar, current unit-economics.md (F1), runway-tracker.md (F5)
- **Action:** Project revenue per arm (subscription MRR + marketplace commission) based on arm status and launch timeline. Break down expected revenue trajectory by arm and by B2B tier (Solo/Practice/Enterprise).
- **Output:** Revenue arm forecast in `data/YYYY-MM-revenue-arm-forecast.md`
- **Guardrails:** Never project revenue for arms that are not_started or planned. Only forecast from in_progress or live arms. All projections must reference actual conversion data, not assumptions.

## 5. Self-Critique Rules (CRIT:)

### CRIT:projection-drift

- **Cadence:** Monthly (after GEN:monthly-actuals).
- **Check:** Compare F3 base-case projections (user growth, MRR, costs) against actuals for the month. Compute percentage drift per line item.
- **Output:** Drift report with red/yellow/green per line. Red = >25% drift, Yellow = 15-25%, Green = <15%.
- **Escalate:** If 3+ consecutive months show >25% drift on the same line, recommend re-baselining F3 projections. Emit `signal:projection-rebase` to PRD and GRO.

### CRIT:runway-alarm

- **Cadence:** Weekly (as part of W2).
- **Check:** Current runway in months. Thresholds: Green >12 months, Yellow 6-12 months, Red <6 months, Critical <3 months.
- **Output:** Runway status indicator in F5.
- **Escalate:** At <6 months, emit `signal:runway-alarm` to all departments via PULSE. At <3 months, trigger human checkpoint (founder must review cost cuts or funding acceleration).

### CRIT:revenue-arm-stall

- **Cadence:** Quarterly
- **Check:** If any revenue arm in ecosystem.yaml has been "planned" for 2+ quarters with no status change, flag as stalled. Cross-reference against F3 projections to assess revenue impact of the stall.
- **Output:** Revenue arm stall report in `reviews/YYYY-QN--revenue-arm-stall.md`
- **Escalate:** signal:revenue-stall → PRD, B2B. If stalled arm is priority=critical, emit to PULSE as well.

### CRIT:escrow-integrity

- **Cadence:** Daily (as part of D1/D2).
- **Check:** Sum of all active `escrow_records` amounts must equal the Stripe FBO balance to the cent. Ledger `total_debits` must equal `total_credits` to the cent.
- **Output:** Pass/fail with specific divergence amount if failed.
- **Escalate:** Any divergence > $0.00 is SEV1. Freeze ledger operations, notify OPS (signal:incident-detected), and begin incident response per O1 (incident-response.md).

### CRIT:fury-payout-balance

- **Cadence:** Weekly (as part of W3).
- **Check:** Verify that cumulative Fury bounty payouts + remaining pool balance = total bounty pool funding. Check that no auditor received a payout without a corresponding completed audit record.
- **Output:** Reconciliation report with pass/fail.
- **Escalate:** Any imbalance triggers a full monthly reconciliation (M4) immediately rather than waiting for month-end.

## 6. Self-Heal Procedures (HEAL:)

### HEAL:projection-rebase

- **Trigger:** CRIT:projection-drift reports >25% drift on the same line for 3 consecutive months.
- **Action:** Create a new projection version in F3 (append, never overwrite). Use the most recent 3 months of actuals as the new baseline. Re-derive the conservative/base/optimistic scenarios from the new baseline. Mark the old projections as superseded with a date stamp.
- **Guardrails:** The original projection version is never deleted — it becomes the "v1" historical record. New version is labeled with the rebase date.

### HEAL:cost-escalation-response

- **Trigger:** Monthly burn exceeds the next scaling tier threshold in F5 (e.g., burn crosses $154/month = Tier 2).
- **Action:** Verify the cost increase matches an expected scaling trigger (user count milestone). If yes, update F5 with the new tier and recalculate runway. If no (unexpected cost increase), investigate: check Render billing, Stripe fee changes, or marketing overspend. Produce a one-paragraph explanation and updated runway figure.
- **Guardrails:** Never auto-approve cost increases >$100/month without a human checkpoint. The founder must acknowledge infrastructure tier transitions.

### HEAL:escrow-divergence-correction

- **Trigger:** CRIT:escrow-integrity detects any divergence.
- **Action:** (1) Immediately freeze all ledger writes via `LEDGER_FROZEN=true`. (2) Pull the last 100 ledger entries and cross-reference against Stripe events. (3) Identify the divergence source: missed webhook, double-processed event, or race condition. (4) If isolated to one transaction, create a correcting journal entry (adjustment debit/credit pair). (5) If systemic, escalate to human checkpoint.
- **Guardrails:** Correcting journal entries must include a reference to the incident ID and the specific divergence amount. Auto-heal is limited to divergences < $50 and isolated to a single transaction. Anything larger requires founder approval.

## 7. Signal Wiring

### Emits

| Signal | Consumers | Trigger |
|--------|-----------|---------|
| `signal:pricing-change` | GRO, B2B, CXS | When Q2 pricing analysis recommends a tier adjustment and founder approves |
| `signal:runway-alarm` | PULSE (all departments) | When runway drops below 6 months (CRIT:runway-alarm) |
| `signal:revenue-milestone` | GRO, PRD | When MRR crosses a milestone ($1K, $10K, $50K, $100K) for the first time |
| `signal:projection-rebase` | PRD, GRO | When F3 projections are rebased due to sustained drift |
| `signal:escrow-frozen` | OPS, ENG, CXS | When HEAL:escrow-divergence-correction freezes ledger operations |

### Consumes

| Signal | Source | Action |
|--------|--------|--------|
| `signal:new-subscription` | B2B | Update B2B MRR tracker, adjust tier mix ratios |
| `signal:subscription-cancelled` | B2B | Update churn calculations, recalculate LTV:CAC |
| `signal:deploy-complete` | OPS | Check if the deploy changed infrastructure tier (Render plan upgrade), update cost tracking |
| `signal:incident-resolved` | OPS | If incident involved financial data, run CRIT:escrow-integrity immediately |
| `signal:user-milestone` | GRO | Cross-reference user count against infrastructure scaling triggers in F5 |

## 8. Human Checkpoints

1. **Escrow divergence > $0.** Any amount. The founder must review and approve correcting journal entries before the ledger is unfrozen. No automated resolution for financial discrepancies.
2. **Runway < 3 months.** The founder must decide between cost cuts (see F5 optimization levers), funding acceleration (F6), or revenue acceleration (pricing/marketing changes).
3. **Infrastructure tier transition.** When burn crosses a scaling tier threshold ($49 to $154, $154 to $381, etc.), the founder must approve the upgrade and acknowledge the new burn rate.
4. **Pricing changes.** Any modification to the $9 platform fee, $39 stake default, or B2B tier pricing requires founder sign-off after reviewing FIN analysis + GRO/PRD input.
5. **Funding application submission.** FIN prepares materials (F6), but the founder reviews and submits. No automated grant submission.

## 9. Health Indicators

### Green (Healthy)

- Runway > 12 months
- Escrow reconciliation passes daily with $0.00 divergence
- Monthly actuals within 15% of F3 base-case projections on all line items
- Fury bounty pool balance > 2x current queue depth x max bounty ($1.50)
- All 5 active artifacts updated within their staleness window

### Yellow (Attention)

- Runway 6-12 months
- Monthly actuals 15-25% off F3 projections on 1-2 line items
- Fury bounty pool balance < 2x but > 1x queue coverage
- One artifact past its staleness window
- B2B churn rate > 5% monthly (above the 2.5% assumption)

### Red (Critical)

- Runway < 6 months
- Any escrow divergence detected (even $0.01)
- Ledger imbalance (debits != credits)
- Monthly actuals > 25% off F3 projections on 3+ line items for 2+ consecutive months
- Fury bounty pool insufficient to cover current queue
- B2B churn rate > 10% monthly

## 10. Growth Backlog

### Deferred Artifacts

| ID | Name | Description | Activation Trigger |
|----|------|-------------|--------------------|
| F4 | Revenue Reconciliation | Automated monthly reconciliation report: Stripe payouts vs ledger vs bank account. | First month with >$1,000 total revenue |
| F7 | Tax Compliance Brief | State sales tax nexus analysis, 1099 obligations for Fury auditors (if applicable), entity structure optimization. | First $10K cumulative revenue or first B2B Enterprise customer |
| F8 | Investor Reporting Template | Monthly/quarterly investor update template with standardized metrics (MRR, burn, runway, user growth, completion rate). | First external funding received |

### Future Capabilities

- **Automated Stripe-to-ledger reconciliation:** Replace manual D1/D2 checks with a scheduled job that runs the reconciliation query and emits pass/fail signal. Requires ENG to build the reconciliation endpoint.
- **Real-time margin dashboard:** Live contribution margin calculation displayed on system dashboard, broken down by contract type and B2B tier. Requires system-dashboard integration.
- **Variable contract sizing impact modeling:** When the platform supports stakes beyond $39, Finance needs a model that projects margin impact across the Starter/Standard/High-Stakes/Premium tiers from F2.
- **Fury auditor economics dashboard:** Track individual auditor P&L, identify auditors approaching the 85% accuracy suspension threshold, and project pool sustainability.
