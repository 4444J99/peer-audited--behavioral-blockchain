# Security Policy

## Supported Versions

| Version | Supported          |
|---------|--------------------|
| 0.4.x   | :white_check_mark: |
| 0.3.x   | :x:                |
| 0.2.x   | :x:                |
| 0.1.x   | :x:                |
| < 0.1   | :x:                |

## Reporting a Vulnerability

If you discover a security vulnerability in Styx, please report it responsibly.

**Do NOT open a public GitHub issue for security vulnerabilities.**

### How to Report

1. Email: Send a detailed report to the repository maintainers via GitHub's private vulnerability reporting feature at **Security > Report a vulnerability** on this repository.
2. Include:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact assessment
   - Suggested fix (if any)

### Response Timeline

- **Acknowledgment**: Within 48 hours of receipt
- **Initial assessment**: Within 5 business days
- **Resolution target**: Within 30 days for critical issues, 90 days for lower severity

### Scope

The following are in scope:
- Authentication and authorization bypasses
- Financial logic errors (ledger, escrow, stakes)
- Data exposure or leakage
- Injection vulnerabilities (SQL, XSS, command injection)
- Cryptographic weaknesses in the hash-chained audit log

The following are out of scope:
- Denial of service attacks
- Social engineering
- Issues in third-party dependencies (report upstream)
- Issues requiring physical access

### Safe Harbor

We will not pursue legal action against researchers who:
- Make a good faith effort to avoid privacy violations, data destruction, or service disruption
- Only interact with accounts they own or with explicit permission
- Report vulnerabilities promptly and do not publicly disclose before resolution

## Security Measures

Styx implements the following security controls:

- **Helmet.js** HTTP security headers (CSP, HSTS, X-Frame-Options, etc.)
- **Rate limiting** via @nestjs/throttler (60 req/min global, 5 req/min on auth endpoints)
- **JWT authentication** with enforced secret in production (dev/test fallback secret still exists; do not use outside local/testing)
- **Input validation** via class-validator with whitelist mode
- **Geofencing** for jurisdiction compliance
- **Double-entry ledger** with hash-chained audit log for tamper evidence
- **Stripe webhook signature verification** for payment integrity
- **Structured logging** (pino) for security event monitoring

## Data Retention Policy

| Data Type | Retention Period | Disposition |
|-----------|-----------------|-------------|
| `event_log` (hash chain) | **Indefinite** | Append-only; critical for audit integrity. Archival to cold storage after 2 years. |
| `proofs` (media URIs) | **1 year** after contract completion | R2 objects deleted; metadata row retained with `media_uri = '[REDACTED]'`. |
| `notifications` | **90 days** after read | Soft-deleted, then purged in batch. |
| `fury_assignments` | **1 year** after verdict | Retained for dispute resolution window, then anonymized. |
| `stripe_events` | **7 years** | Financial regulatory compliance (IRS record-keeping). |
| User PII (email, hashes) | **Account lifetime + 30 days** | Deleted upon account deletion request per CCPA/GDPR. |

> **Note**: The hash-chained `event_log` cannot be truncated without breaking chain integrity. Archival involves moving rows to a separate `event_log_archive` table while preserving the chain's terminal hash for verification.
