# Real-Money Pilot Readiness Gate (July 2026)

Every item must be verified before we process real money through the system.

## Payment Infrastructure

- [ ] **Stripe production keys configured** — switched from test mode to live mode with real banking. Verify: Stripe dashboard shows "Live mode" active, process a $1 test charge. Owner: H:FO
- [ ] **High-risk merchant account active** — payment processor confirmed we are approved for high-risk/regulated processing. Verify: processor welcome letter + dashboard access. Owner: H:FO
- [ ] **Prize-linked savings / contest fee structure finalized** — legal has signed off on the fee structure, AML compliance confirmed. Verify: signed legal opinion. Owner: H:LC
- [ ] **Financial reconciliation process documented** — daily reconciliation between Stripe, ledger, and bank accounts. Verify: runbook exists, dry-run passed. Owner: H:FO
- [ ] **E&O and cyber liability insurance active** — coverage limits sufficient for processing real user funds. Verify: certificate of insurance on file. Owner: H:FO
- [ ] **Refund and dispute handling SOP documented** — chargeback process, refund SLA, customer communication templates. Verify: SOP doc exists, support team trained. Owner: H:CXS

## Security & Compliance

- [ ] **SOC 2 Type I audit initiated** — auditor engaged, evidence collection underway. Verify: engagement letter. Owner: H:LC
- [ ] **Penetration test completed** — no critical findings open. Verify: pentest report. Owner: H:ENG
- [ ] **Rate limiting verified on financial endpoints** — wallet, contract creation, payout endpoints. Verify: load test passes. Owner: H:ENG
- [ ] **Sentry error monitoring configured with financial alerts** — ledger failures, escrow mismatches page ops. Verify: alert rule exists. Owner: H:ENG
- [ ] **Fury consensus engine passes crucible simulation** — 1000+ rounds with known honeypots. Verify: simulation script exit code 0. Owner: H:ENG

## User Protection

- [ ] **Aegis health guardrails verified** — BMI floor, weight-loss velocity cap all active and enforced. Verify: integration tests pass. Owner: H:ENG
- [ ] **Dispute resolution process documented** — appeal window, panel review, final decision. Verify: user-facing docs published at /help. Owner: H:CXS
- [ ] **User communication templates ready** — email notifications for verification, contract events, payouts. Verify: templates reviewed. Owner: H:CXS
- [ ] **Support channel active** — email/Discord monitored during business hours. Verify: response time < 4h tested. Owner: H:CXS
- [ ] **Initial users notified of real-money switch** — email, in-app banner, 7-day grace period before mandatory real-money. Verify: communication sent. Owner: H:GRO

## Pass Criteria

All checkboxes checked = gate passed. Any open item blocks the pilot launch.
