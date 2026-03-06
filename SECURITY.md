# Security Policy

## Scope

Styx is a financial platform that handles escrow (via Stripe FBO), personally identifiable information, and a double-entry ledger with hash-chained audit trails. Security vulnerabilities in these areas are treated with the highest priority.

### In Scope

- **Escrow / Payments**: Stripe FBO hold/capture/cancel flows, settlement workers, payout providers (`src/api/services/escrow/`, `src/api/src/modules/payments/`)
- **Ledger Integrity**: Double-entry transaction engine, hash-chain audit log (`src/api/services/ledger/`)
- **Authentication & Authorization**: JWT issuance, guards, enterprise SSO (`src/api/src/modules/auth/`, `src/api/guards/`)
- **PII Handling**: User profiles, KYC/AML data, GDPR scheduler (`src/api/src/modules/users/`, `src/api/src/modules/compliance/`)
- **Proof Media Pipeline**: Upload, storage, signed URL generation (`src/api/services/storage/`, Cloudflare R2)
- **Fury Consensus**: Auditor routing, verdict tallying, bounty payouts (`src/api/services/fury-router/`, `src/api/src/modules/fury/`)
- **AI Services**: Prompt injection in grill-me/ELI5 endpoints, ask-styx worker (`src/api/src/modules/ai/`, `src/ask-styx/`)
- **Rate Limiting**: API throttle and edge-level rate limiting (`src/ask-styx/worker/`)

### Out of Scope

- The interactive pitch deck (`src/pitch/`, `docs/index.html`)
- Desktop admin dashboard in local-only mode (`src/desktop/`)
- Documentation files

## Supported Versions

| Version | Supported |
|---------|-----------|
| `main` branch (latest) | Yes |
| Tagged releases | Yes (latest tag only) |
| Feature branches | No |

## Reporting a Vulnerability

**Do not open a public GitHub issue for security vulnerabilities.**

1. **Preferred**: Use [GitHub Security Advisories](../../security/advisories/new) to report privately.
2. **Alternative**: Email security findings with:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact assessment
   - Suggested fix (if any)

### What to Expect

- **Acknowledgment**: Within 48 hours of report
- **Triage**: Within 5 business days
- **Fix timeline**: Critical (escrow/ledger) — 72 hours. High (auth/PII) — 7 days. Medium/Low — next release cycle.
- **Disclosure**: Coordinated disclosure after fix is deployed. Reporter credited unless they prefer anonymity.

## Security Architecture

### Validation Gates (CI-Enforced)

These gates run on every push and PR via `.github/workflows/ci.yml`:

| Gate | Script | What It Checks |
|------|--------|----------------|
| 04 | `scripts/validation/04-redacted-build-check.sh` | No gambling/wagering terminology in production build output |
| 05 | `scripts/validation/05-behavioral-physics-check.ts` | Core constants (loss aversion lambda, BMI floor, velocity caps) match spec |
| 06 | `scripts/validation/06-security-invariant-check.ts` | No hardcoded secrets, debug backdoors, or exposed credentials in build |
| 07 | `scripts/validation/07-claim-drift-check.js` | Documentation claims match actual code paths on disk |

### Design Principles

- **Zero Trust**: All biometric and financial validation is server-side. Mobile clients are untrusted.
- **No Egress**: Media files never leave Cloudflare R2. Served only via time-limited signed URLs.
- **FBO Escrow**: User funds held in Stripe FBO (For Benefit Of) accounts — Styx never has direct custody of user funds.
- **Hash-Chained Ledger**: Every ledger entry references the hash of the previous entry. Tampering breaks the chain.
- **Linguistic Cloaker**: Runtime vocabulary transformation prevents accidental exposure of regulated terminology in app store builds.
