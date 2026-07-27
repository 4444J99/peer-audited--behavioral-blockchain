# Stripe Production Setup — Account Types, Configuration & Migration
> Issue: #349
> Phase: Pre-Launch (Private Beta → Public Beta)

## Overview

Styx relies on Stripe for FBO (For Benefit Of) escrow, platform fees, practitioner subscriptions, and payout processing. Moving from test mode to live mode requires careful KYC/compliance, webhook endpoint configuration, API key rotation, and migration sequencing. This doc covers the full production Stripe checklist.

## Account Types

### Stripe Account Hierarchy

| Account Type | Purpose | Owner | Activation |
|-------------|---------|-------|------------|
| Platform Account (Standard) | Main Stripe account for Styx platform fees, subscriptions, and payout routing | Styx LLC | Now (test mode), T-7 (live) |
| FBO Escrow Account | Holds user stakes in trust (separate bank account, not Stripe-commingled) | Styx LLC FBO Users | T-14 (bank approval) |
| Connected Accounts (Express) | Practitioner payouts and subscription billing | Individual practitioners | Per practitioner onboarding |
| Stripe Identity | KYC/age verification for high-stake contracts | Users | T-14 (configuration) |

### Platform Account Requirements

| Requirement | Detail | Status |
|------------|--------|--------|
| Business entity | LLC or Corporation (Stripe requires registered business) | Check |
| Business website | styx.app (with privacy policy, terms of service, refund policy) | Required |
| Business description | "Accountability platform — peer-audited behavioral contracts with financial escrow" | Must be accurate |
| Industry classification | "Software as a Service" (not "Gambling" — critical) | Verify |
| Estimated transaction volume | Projected monthly volume for underwriting review | Prepare projection |
| Average transaction amount | $9 (fee) + $39 (stake) = $48 | Document |
| Expected chargeback rate | Target <0.5% (industry avg. for SaaS) | Monitor |

### FBO Escrow Account

Styx uses a Stripe FBO structure where user stakes are held in a separate bank account (not Stripe's operating account). This is critical for:

1. **Regulatory compliance:** User funds are not Styx revenue; they're held in trust
2. **Bankruptcy protection:** If Styx fails, user stakes are protected
3. **Transparency:** Double-entry ledger reconciles with FBO balance daily
4. **Audit readiness:** Separate account creates clean audit trail

**FBO setup process:**
1. Apply for Stripe FBO escrow facility (requires underwriting review)
2. Provide legal opinion letter on escrow structure
3. Set up separate bank account at partner bank (Stripe facilitates)
4. Configure payout routing: stakes flow to FBO, fees flow to operating account
5. Test with test-mode environment before going live

## KYC / Onboarding Checklist

### Business Verification

- [ ] Business registration documents (Articles of Incorporation, EIN letter)
- [ ] Beneficial ownership form (anyone owning 25%+)
- [ ] Business license (if applicable in operating jurisdiction)
- [ ] E-sign agreement to Stripe Services Agreement
- [ ] Complete Stripe onboarding questionnaire (business model, expected volume, compliance)
- [ ] Verify business address (utility bill or bank statement)
- [ ] Provide website URL with complete legal pages:
  - [ ] Privacy Policy
  - [ ] Terms of Service
  - [ ] Refund Policy
  - [ ] Cookie Policy
  - [ ] CCPA/CPRA compliance (if serving California users)

### Individual Verification (Platform Owners)

For each founder/officer:

- [ ] Government-issued ID (passport or driver's license)
- [ ] Social Security Number or ITIN
- [ ] Date of birth
- [ ] Current residential address
- [ ] Occupation and industry
- [ ] Source of funds for business

### Risk Review Preparation

Stripe may flag Styx as "high risk" due to the escrow/payout model. Prepare:

- [ ] Business model white paper explaining escrow mechanics
- [ ] Legal opinion: Styx is not gambling (skill-based, peer-audited, outcome controlled by user)
- [ ] Consumer protection disclosures (clear TOS explaining escrow, fees, dispute process)
- [ ] Anti-fraud controls documentation (Aegis Protocol, double-entry ledger, verification gates)
- [ ] Chargeback prevention strategy (automated reconciliation, proof-of-delivery records)
- [ ] Projected transaction volume by month (first 12 months)
- [ ] Maximum transaction amount ($2,000 per contract initially)
- [ ] Refund and cancellation policy

## Webhook Endpoints

### Production Webhook Endpoints

| Event | Endpoint | Purpose | Idempotency Key |
|-------|----------|---------|-----------------|
| `checkout.session.completed` | `POST /api/stripe/checkout-completed` | Capture payment intent, create ledger entry | `checkout_session_id` |
| `payment_intent.succeeded` | `POST /api/stripe/payment-succeeded` | Confirm escrow hold, update contract status | `payment_intent_id` |
| `payment_intent.payment_failed` | `POST /api/stripe/payment-failed` | Notify user, retry logic | `payment_intent_id` |
| `charge.dispute.created` | `POST /api/stripe/dispute-created` | Log dispute, freeze contract, notify admin | `dispute_id` |
| `charge.dispute.closed` | `POST /api/stripe/dispute-closed` | Resolve dispute, update ledger | `dispute_id` |
| `payout.paid` | `POST /api/stripe/payout-completed` | Confirm FBO payout | `payout_id` |
| `payout.failed` | `POST /api/stripe/payout-failed` | Alert, retry | `payout_id` |
| `customer.subscription.*` | `POST /api/stripe/subscription-events` | Practitioner subscription lifecycle | `subscription_id` |
| `account.updated` | `POST /api/stripe/account-updated` | Connected account status changes | `account_id` |

### Webhook Configuration

| Setting | Production Value | Notes |
|---------|-----------------|-------|
| Endpoint URL | `https://api.styx.app/api/stripe/webhooks` | Production API URL |
| API version | `2024-12-18.acacia` (latest stable) | Pin version, don't float |
| Signing secret | `whsec_*` (generated per endpoint) | Store in Render secrets, not env file |
| Retry on failure | Enabled | Stripe retries up to 3 times over 3 days |
| Events to send | Only enabled events (above) | Don't subscribe to all events |
| Connect events | Enabled (for connected accounts) | Practitioner-related events |

### Webhook Idempotency

Stripe guarantees at-least-once delivery. Implement idempotency:

```typescript
// Check if event already processed
const existing = await EventLog.findOne({ stripeEventId: event.id });
if (existing) return { received: true };

// Process event
await processEvent(event);

// Record processed event
await EventLog.create({
  stripeEventId: event.id,
  type: event.type,
  processedAt: new Date(),
});
```

### Webhook Testing

- [ ] Test with Stripe CLI: `stripe trigger payment_intent.succeeded`
- [ ] Test all webhook event types in test mode
- [ ] Verify idempotency (replay events, confirm no double-processing)
- [ ] Test webhook failure handling (disable endpoint, confirm retry logic)
- [ ] Test timeout handling (slow handler, confirm Stripe retries)

## API Key Rotation

### Key Types

| Key | Environment | Rotation Schedule | Storage |
|-----|-------------|-------------------|---------|
| `STRIPE_SECRET_KEY` | Live | Every 90 days | Render secrets |
| `STRIPE_PUBLISHABLE_KEY` | Live | Every 180 days | Render secrets + client code |
| `STRIPE_WEBHOOK_SECRET` | Live | Every 90 days (or on webhook URL change) | Render secrets |
| `STRIPE_TEST_SECRET_KEY` | Test | Every 180 days | Local `.env` / CI secrets |
| `STRIPE_TEST_PUBLISHABLE_KEY` | Test | Every 180 days | Local `.env` / CI secrets |
| `STRIPE_TEST_WEBHOOK_SECRET` | Test | Every 180 days | Local `.env` / CI secrets |

### Rotation Procedure

```
1. Generate new key in Stripe Dashboard
2. Deploy new key to Render secrets (alongside old key)
3. Update application to use new key variable
4. Verify all webhooks + API calls work with new key
5. Wait 24 hours
6. Revoke old key in Stripe Dashboard
7. Update incident response doc if webhook secret changed
```

**Never:**
- Store keys in code, `.env` files committed to git, or logs
- Share keys across developers (use Stripe restricted keys per developer)
- Use live keys in test environment or vice versa

### Restricted Keys (Developer Tokens)

| Role | Permissions | Key Type |
|------|-------------|----------|
| Developer (admin operations) | Write: charges, refunds, disputes | Restricted key |
| Developer (read-only) | Read: all | Restricted key |
| CI/CD | Read: test mode only | Test restricted key |
| Support agent | Read: charges, customers (write: disputes) | Restricted key |

## Test Mode vs Live Mode Migration

### Pre-Migration Checklist

- [ ] All webhook endpoints tested and verified in test mode (7+ days of test traffic)
- [ ] Idempotency handling verified (replayed events don't create duplicates)
- [ ] Ledger reconciliation tested: test-mode Stripe balance = internal ledger balance
- [ ] Dispute handling flow tested end-to-end
- [ ] Refund flow tested (full + partial)
- [ ] Payout flow tested (to connected accounts)
- [ ] Subscription billing tested (create, upgrade, downgrade, cancel, prorate)
- [ ] KYC flow tested (Stripe Identity)
- [ ] Error handling tested (all 4xx/5xx Stripe responses)
- [ ] Rate limiting tested (Stripe has per-second limits)
- [ ] FBO escrow test account reconciled

### Migration Sequence

**Phase 1: Parallel Run (T-14 days)**
1. Create production Stripe account (do NOT activate yet)
2. Configure production webhook endpoints pointing to staging API
3. Deploy production API keys to staging environment
4. Run staging environment with production Stripe keys for 7 days
5. Monitor for errors, reconcile test vs. production balance

**Phase 2: Soft Launch (T-7 days)**
1. Activate production Stripe account
2. Set `KYC_ENFORCEMENT_ENABLED=false` during transition
3. Enable production mode for internal users + beta testers only
4. Run both test and production in parallel (feature flag: `STRIPE_MODE`)
5. Daily ledger reconciliation between both environments
6. Monitor all webhook endpoints for errors

**Phase 3: Full Migration (T-0)**
1. Feature flag all new users to production mode
2. Migrate existing test-mode users:
   - Freeze test-mode contracts
   - Notify users: "Your contracts are moving to real money"
   - Create new production-mode contracts with same terms
   - Close out test-mode contracts with manual reconciliation
3. Disable test mode feature flag
4. Deactivate test-mode webhook endpoints
5. Run full ledger reconciliation: test + production = expected values
6. Archive test-mode data (keep for audit trail)

**Phase 4: Monitoring (T+14 days)**
1. Daily reconciliation between Stripe balance and internal ledger
2. Monitor chargeback rate (target <0.5%)
3. Monitor dispute volume
4. Monitor webhook delivery success rate (target >99.9%)
5. Verify payout schedule is as expected (daily/weekly)
6. Confirm FBO account balances match escrow ledger

### Rollback Plan (if issues found)

| Issue | Rollback Action | Data Impact |
|-------|----------------|-------------|
| Webhook delivery failing | Switch webhook URL to test-mode or staging | Pending events in Stripe queue |
| Escrow reconciliation mismatch | Freeze new production contracts, revert to test mode | Existing contracts continued in test mode |
| High chargeback rate >1% | Restrict contract amounts to <$50, enable stricter KYC | Partial restriction, not full rollback |
| Stripe suspends account | Immediately revert to test mode, contact Stripe support | Emergency; all production transactions paused |

## Connected Accounts (Stripe Connect)

### Account Type: Express

Practitioners receive payouts and manage subscriptions through Stripe Express connected accounts.

| Feature | Implementation |
|---------|---------------|
| Onboarding | Stripe-hosted onboarding form (customizable) |
| Payouts | Direct to practitioner bank account (daily/weekly/monthly) |
| Subscriptions | Practitioner pays Styx via platform → Styx pays practitioner via connected account |
| Platform fee | Styx takes platform fee before distributing to practitioner |

### Connect Configuration

- [ ] Register platform in Stripe Connect settings
- [ ] Configure onboarding flow (branding, required info)
- [ ] Set payout schedule (default: weekly, configurable per practitioner)
- [ ] Set platform fee percentage (default: 20% of practitioner subscription)
- [ ] Configure dispute handling (liability: platform or connected account?)
- [ ] Test onboarding flow end-to-end in test mode
- [ ] Test payout flow with test bank account
- [ ] Document practitioner onboarding (friction: KYC/ID verification required)

## Post-Migration Monitoring

| Check | Frequency | Tool | Alert Threshold |
|-------|-----------|------|-----------------|
| Stripe balance vs. internal ledger | Daily | Reconciliation script | Any difference > $0.01 |
| Webhook delivery failure rate | Per-event | Stripe dashboard | >5% failure rate |
| Chargeback rate | Weekly | Stripe dashboard | >0.5% |
| Dispute volume | Weekly | Stripe dashboard | >2 disputes/week |
| Connected account errors | Daily | Stripe dashboard | Any onboarding failures |
| API error rate (4xx/5xx) | Real-time | Sentry + Stripe metrics | >1% error rate |
| Payout timing | Per-payout | Stripe dashboard | >24h delay |
| FBO balance vs. escrow ledger | Daily | Reconciliation script | Any difference > $0.01 |

## Environment Variables

| Variable | Source | Environment |
|----------|--------|-------------|
| `STRIPE_SECRET_KEY` | Stripe Dashboard → API Keys → Secret key | Production only (Render secrets) |
| `STRIPE_PUBLISHABLE_KEY` | Stripe Dashboard → API Keys → Publishable key | Production web env |
| `STRIPE_WEBHOOK_SECRET` | Stripe Dashboard → Webhooks → Signing secret | Production API env |
| `STRIPE_TEST_SECRET_KEY` | Stripe Dashboard → API Keys → Test secret key | Dev + CI + staging |
| `STRIPE_TEST_PUBLISHABLE_KEY` | Stripe Dashboard → API Keys → Test publishable key | Dev + CI + staging |
| `STRIPE_TEST_WEBHOOK_SECRET` | Stripe Dashboard → Webhooks → Test signing secret | Dev + CI + staging |
| `STRIPE_CONNECT_CLIENT_ID` | Stripe Dashboard → Connect → Settings | Production + staging |
| `FBO_ACCOUNT_ID` | Stripe support (FBO escrow facility) | Production only |
| `KYC_ENFORCEMENT_ENABLED` | Runtime flag | `true` in production |
| `STRIPE_MODE` | Runtime flag | `test` or `live` |

## Key Contacts

| Contact | Purpose | Availability |
|---------|---------|-------------|
| Stripe Support (chat) | Technical issues, API questions, webhook debugging | 24/7 |
| Stripe Account Manager | Underwriting, risk review, FBO setup | Business hours |
| Stripe Connect Support | Connected account issues, onboarding flow | Business hours |
| Stripe Identity Support | KYC/verification issues | Business hours |
