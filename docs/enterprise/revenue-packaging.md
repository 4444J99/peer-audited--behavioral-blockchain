# Enterprise Revenue Packaging — Tier Ladder and Billing Mechanics

**Date:** 2026-07-30
**Audience:** Founders, pricing approval, enterprise sales.
**Rule of this document:** every tier cites the code that actually meters or bills it.
Where a price is aspirational rather than implemented, it says so. Pricing dollar
figures below are **drafts for human approval** — the code constants are the only
numbers currently enforced.

---

## Tier Ladder

| # | Tier | Who pays | What is billed | Implemented? |
|---|------|----------|----------------|--------------|
| 0 | Consumer beta (free / test money) | Nobody | Nothing — test-money mode | Yes (flags) |
| 1 | Pro subscription | Individual user | $14.99/mo + per-event fees | Yes (constants + checkout) |
| 2 | Practitioner seat | Coach/therapist | Monthly seat, per published tiers | Partially (model + docs; seat billing not coded) |
| 3 | Enterprise B2B | Company | Platform fee + metered usage | Yes (metered pipeline) |

---

## Tier 0 — Consumer Beta (free, test money)

**Purpose:** habit-loop validation and legal safety during private beta. No real money
moves, which also underpins the legal posture in
`docs/legal/legal-defense-whitepaper-DRAFT.md` §6.

**Enforcing code / config:**
- `STYX_PRIVATE_BETA` / `STYX_TEST_MONEY_MODE` feature flags (documented in
  `docs/CLAUDE.md` → "Beta / Feature Flags"; consumed across API and web)
- Beta gates module: `src/api/src/modules/beta/`
- Stripe escrow client refuses to run production with a mock key
  (`src/api/services/escrow/stripe.service.ts`), so test-money beta cannot silently
  leak into real charges

**Revenue:** $0 by design. Conversion asset: the beta waitlist funnel
(`041_beta_waitlist.sql`, marketing module).

---

## Tier 1 — Pro Subscription (consumer paid)

**Price as coded:** `MONTHLY_SUBSCRIPTION_PRICE = 1499` cents ($14.99/mo) —
`src/api/services/billing.ts:6`.

**Billing mechanics (all implemented):**
- Subscription checkout uses the constant directly:
  `src/api/src/modules/payments/payments.controller.ts` (Stripe checkout
  `unit_amount: MONTHLY_SUBSCRIPTION_PRICE` at line ~193; subscription status
  surfaced at line ~451). User↔subscription linkage: migration
  `042_user_subscription_id.sql`.
- Client-facing price catalog: `src/api/src/modules/pay/pay.service.ts`
  (`monthlySubscriptionCents`).
- Per-event consumer fees, charged via Stripe PaymentIntent + double-entry ledger +
  TruthLog in `src/api/services/billing.ts` (`processIAP` — idempotent end-to-end,
  capture-verified before revenue is recorded):
  - `TICKET_PRICE_BASE = 499` cents ($4.99) per contract ticket
  - `APPEAL_FEE_AMOUNT = 500` cents ($5.00) appeal friction fee
- Commitment-device subscriptions schema: `040_commitment_device_subscriptions.sql`.

**Open pricing question (human-gated):** whether beta users grandfather into $14.99 and
whether the ticket fee applies to subscription holders.

---

## Tier 2 — Practitioner Seat (B2B2C)

**Model:** practitioners (breakup-recovery coaches, therapists, EAPs) subscribe and
assign contracts to clients; revenue comes from the practitioner seat, not the client's
stake. Model and published draft pricing live in `docs/enterprise/README.md`:
$49 Starter (5 clients) / $149 Growth / $349 Scale / $999+ Enterprise.

**What the code provides today:**
- Practitioner-facing risk intelligence (the thing the seat actually buys):
  `src/api/src/modules/behavioral/practitioner-intelligence.service.ts` — composite
  client risk profiles (GREEN/YELLOW/RED), journal alerts
  (RATIONALIZATION / DISTRESS_ESCALATION / TRIGGER_MENTION / CRISIS_LANGUAGE),
  practitioner dashboard aggregation. Wired into `behavioral.module.ts` and given a
  web surface (practitioner pages) by branch `feat/omega-completion`.
- Enterprise scaffolding practitioners hang off: `enterprises` table
  (`037b_create_enterprises_table.sql`), billing scope
  (`038_enterprise_billing_scope.sql`), enterprise SSO (auth module,
  `ENTERPRISE_SSO_SECRET` required).

**Honest gap:** there is **no seat-count billing code** yet — no `Stripe` price objects
for the $49/$149/$349 tiers and no per-seat entitlement enforcement. Until that exists,
practitioner revenue is invoice-driven ops, not product. This is the largest
build-vs-sell gap in the ladder.

---

## Tier 3 — Enterprise B2B (platform fee + metered usage)

**What the code meters and bills (implemented end-to-end):**

1. **Event capture** — `src/api/src/modules/payments/metered-usage.service.ts`
   (`recordMeteredUsage`): resolves the user's enterprise, writes an idempotent row to
   `usage_event` (`ON CONFLICT (idempotency_key) DO NOTHING`; table from
   `041_metered_usage_events.sql`), then forwards to Stripe billing.
2. **Stripe metered billing** — `src/api/src/modules/b2b/billing.service.ts`:
   `METERED_EVENT_TYPES = ["phash_scan", "gemini_call", "anomaly_detection",
   "proof_accepted"]`; reports via `stripe.billing.meterEvents.create`, resolves the
   enterprise's metered subscription item
   (`price.recurring.usage_type === "metered"`), and reads usage back through
   `stripe.billing.meters.listEventSummaries`.
3. **Internal consumption ledger** (pre-invoice reporting / reconciliation) —
   `src/api/services/b2b/billing.service.ts` (`ConsumptionBillingService`):
   `consumption_logs` table, monthly period rollups, usage history.
4. **Enterprise surface** — `src/api/src/modules/b2b/b2b.controller.ts`
   (`@Roles('ADMIN')` + enterprise scoping): `GET /b2b/metrics/:enterpriseId`,
   `GET /b2b/billing/:enterpriseId`, webhook registration/test, anonymized HR export
   (`GET /b2b/export/hr/:enterpriseId`), data-lake export. Anonymization before export:
   `src/api/src/modules/b2b/anonymize.service.ts`.
5. **CRM handoff** — `src/api/src/modules/b2b/crm.service.ts` with Salesforce/HubSpot
   connectors (`src/api/src/modules/b2b/connectors/`), reachable over the same
   enterprise-scoped surface: `GET /b2b/crm/integrity/:enterpriseId`,
   `POST /b2b/crm/events/:enterpriseId`, `POST /b2b/crm/interactions/:enterpriseId`,
   `POST /b2b/crm/sync/:enterpriseId`.

**What enterprise buys, control-wise:** the compliance packaging in
`docs/enterprise/compliance-packaging.md` (audit log, access controls, geofence,
KYC/AML, CCPA/GDPR, kill switch, attestation) is the enterprise trust collateral for
this tier.

**Open pricing questions (human-gated):** platform-fee amount, per-event metered
prices (the Stripe meter/price objects must be created in the Stripe dashboard —
config, not code), and whether `proof_accepted` bills to the enterprise or nets
against the practitioner seat.

---

## Revenue-Recognition Guardrail

All consumer money paths post through the double-entry ledger
(`src/api/services/ledger/ledger.service.ts`) with idempotency keys, and revenue is
only recorded after Stripe capture succeeds (`src/api/services/billing.ts`, PM20
check). Metered B2B usage is idempotent at the `usage_event` layer. This means every
revenue number in an investor or enterprise deck can be reproduced from the ledger —
quote from it, not from Stripe dashboards.
