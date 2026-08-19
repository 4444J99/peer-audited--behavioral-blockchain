---
generated: true
department: B2B
artifact_id: B3
governing_sop: "SOP--enterprise-security.md"
phase: hardening
product: styx
date: "2026-03-08"
---

# Security Questionnaire (Pre-Filled)

## Overview

This document provides pre-filled answers to standard enterprise security questionnaire topics for Styx. Use this as a reference when responding to prospect security reviews, RFPs, or compliance audits.

**Product:** Styx — Peer-Audited Behavioral Accountability Platform
**Company:** ORGANVM (sole proprietorship, US-based)
**Infrastructure:** Render (Oregon, US), Cloudflare, Stripe
**Data classification:** PII, financial (escrow), behavioral/health data

> **This document answers the questionnaire. [`security-whitepaper.md`](../../../enterprise/security-whitepaper.md)
> describes the architecture.** The two are deliberately non-overlapping: operational facts
> (hosting, subprocessors, retention, backup/DR, incident response, vendor risk) live here;
> mechanism (the hash-chained TruthLog, the ledger invariants, guards, geofencing, device
> attestation, redaction, honeypots, consensus) lives in the whitepaper, with a file path for every
> claim. Where an answer below needs mechanism to be credible, it links rather than restates — a
> restated control is a control that goes stale silently. Send both documents to a prospect; send
> the whitepaper alone to an engineer.
>
> The whitepaper's **§12 Roadmap** is the authoritative list of what is *not* implemented. Where
> this questionnaire says "planned" or "not yet", §12 is the source of truth.

---

## 1. Data Encryption

| Question | Answer |
|----------|--------|
| Is data encrypted at rest? | Yes. PostgreSQL 15 on Render uses AES-256 encryption at rest (managed by Render's infrastructure). Cloudflare R2 object storage uses AES-256 at rest. |
| Is data encrypted in transit? | Yes. All connections use TLS 1.3 minimum. HSTS headers enforced. No plaintext HTTP endpoints. |
| Are encryption keys managed by the vendor or customer? | Vendor-managed (Render for database, Cloudflare for R2, Stripe for payment data). Key rotation follows vendor schedules. |
| Is payment data encrypted? | Payment data is processed and stored by Stripe. Styx never receives, stores, or transmits full card numbers. Stripe is PCI DSS Level 1 certified. |
| Are proof submission files encrypted? | Yes. Proof images and documents are stored in Cloudflare R2 with AES-256 at rest and served over TLS 1.3 in transit. Access is authenticated and scoped to the contract participant and assigned Fury. |

## 2. Authentication & Authorization

Full mechanism, with file paths: [`security-whitepaper.md` §4](../../../enterprise/security-whitepaper.md#4-authentication-and-authorization).

| Question | Answer |
|----------|--------|
| What authentication method is used? | Email/password with bcrypt hashing. JWT tokens for session management (15-minute access tokens + 7-day refresh tokens, rotated on each refresh). |
| Is multi-factor authentication (MFA) supported? | **No — not implemented.** Whitepaper §12. |
| Is single sign-on (SSO) supported? | **SAML 2.0 is not implemented.** An enterprise token-exchange path exists that verifies a pre-shared HS256 assertion against a dedicated secret; it is not SAML and should not be described as such. Whitepaper §4.1 and §12. |
| What authorization model is used? | Role-based access control. Roles in the codebase: `USER`, `FURY`, `PRACTITIONER`, `ADMIN`. The distinguishing property is that role and ban status are re-read from the database on every request rather than trusted from the session token, so a demotion or ban takes effect immediately instead of at token expiry. Whitepaper §4.3. |
| How are API tokens managed? | Access tokens expire after 15 minutes; refresh tokens after 7 days, and only their SHA-256 hash is stored. Signing is **HS256 (symmetric)** — not RS256. There is **no revocation blacklist**; revocation is achieved by refresh-token rotation plus the per-request database role/ban check. Whitepaper §4.1, §12. |
| Are passwords stored securely? | Yes. bcrypt (`bcryptjs`), cost factor **10**. Plaintext passwords are never stored or logged. Login runs a bcrypt compare against a fixed dummy hash even for non-existent accounts so response timing does not disclose account existence. Whitepaper §4.1. |
| How is CSRF handled? | Double-submit token derived cryptographically from the session token, so a fabricated cookie value cannot validate. Whitepaper §4.2. |

## 3. Infrastructure & Hosting

| Question | Answer |
|----------|--------|
| Where is the application hosted? | Render (Oregon, US-West-2 region). All compute, database, and background workers run on Render. |
| What cloud provider(s) are used? | Render (compute, PostgreSQL, Redis), Cloudflare (CDN, R2 storage, DNS, DDoS protection), Stripe (payment processing). |
| Is the infrastructure containerized? | Yes. All services run in Docker containers on Render. Container images are built in CI (GitHub Actions) and deployed via Render's managed platform. |
| What is the deployment model? | Platform-as-a-Service (Render managed). Styx does not manage bare metal servers, hypervisors, or operating systems. |
| What database is used? | PostgreSQL 15 (Render managed). Redis 7 (Render managed) for caching, session management, and background job queues. |
| What CDN/WAF is used? | Cloudflare (CDN, DDoS protection, WAF rules, rate limiting). All public traffic routes through Cloudflare. |
| Is the infrastructure multi-tenant or single-tenant? | Multi-tenant application layer with logical data isolation. Each practitioner's data is scoped by organization ID. Database queries enforce tenant isolation via row-level filtering. Enterprise single-tenant deployments are not currently available. |

## 4. Data Residency & Privacy

Pseudonymization, media redaction, and the export/erasure implementation: [`security-whitepaper.md` §8](../../../enterprise/security-whitepaper.md#8-privacy-engineering) and [§7.1](../../../enterprise/security-whitepaper.md#71-auditors-never-see-raw-media). Note the one structural caveat it records: the append-only audit log is immutable by database trigger, so erasure anonymizes the user record rather than rewriting log history.

| Question | Answer |
|----------|--------|
| Where is data stored geographically? | United States (Oregon). PostgreSQL on Render US-West-2. Cloudflare R2 in US region. |
| Is data transferred outside the US? | No. All data processing and storage occurs within the United States. Cloudflare CDN may cache static assets at global edge nodes, but PII and behavioral data are not cached at the edge. |
| What personal data is collected? | Name, email, phone number (identity verification), payment method (via Stripe — Styx never sees full card numbers), behavioral contract data (terms, proof submissions, verdicts), usage analytics (anonymized). |
| Is behavioral/health data collected? | Yes. Contract terms, proof submissions (photos, text), Fury verdicts, and Integrity Scores constitute behavioral data. Some contracts (Biological, Recovery) may involve health-adjacent data. |
| Is data sold to third parties? | No. Styx does not sell, rent, or trade user data to any third party under any circumstances. |
| Can users export their data? | Yes. Users can request a full data export (JSON format) from Settings > Data. Exports are generated within 24 hours. |
| Can users delete their data? | Yes. Users can request account deletion from Settings > Account. A 30-day grace period applies (account deactivated, data retained). After 30 days, all personal data is permanently purged. Financial transaction records are retained for 7 years as required by US law (anonymized after account deletion). |

## 5. Backup & Disaster Recovery

| Question | Answer |
|----------|--------|
| Are databases backed up? | Yes. Render managed PostgreSQL performs automatic daily backups with 7-day retention. |
| What is the backup retention period? | 7 days (Render managed). |
| Are backups encrypted? | Yes. Backups inherit Render's AES-256 at-rest encryption. |
| What is the Recovery Time Objective (RTO)? | Target: < 4 hours for full service restoration. Render's managed infrastructure handles most recovery automatically. |
| What is the Recovery Point Objective (RPO)? | Target: < 24 hours (daily backup cycle). Redis data (caches, job queues) may have higher RPO but is non-critical and can be reconstructed. |
| Has disaster recovery been tested? | Planned for pre-launch testing phase. Documented in the phase-gate checklist. |
| Is there a business continuity plan? | In development. Key mitigation: Render manages infrastructure availability (99.9% SLA). Styx application is stateless (can be redeployed from container images in minutes). Database is the only stateful component (managed by Render). |

## 6. Incident Response

| Question | Answer |
|----------|--------|
| Is there a documented incident response plan? | Yes. Defines severity levels, response procedures, communication protocols, and post-incident review. |
| What are the severity levels? | **P1 (Critical):** Data breach, financial system compromise, complete service outage. Response: < 1 hour. **P2 (High):** Partial outage, single-service degradation, security vulnerability. Response: < 4 hours. **P3 (Medium):** Non-critical bugs, performance degradation. Response: < 24 hours. **P4 (Low):** Cosmetic issues, documentation errors. Response: < 72 hours. |
| What is the incident response time? | P1: < 1 hour initial response, < 4 hours resolution target. P2: < 4 hours initial response, < 24 hours resolution target. |
| How are affected parties notified? | P1/P2: Email notification to all affected users within 24 hours of discovery. Practitioner accounts receive a dashboard alert. Public status page updated. P3/P4: No individual notification; resolved in regular updates. |
| Is there a post-incident review process? | Yes. All P1 and P2 incidents receive a written post-mortem within 5 business days, including root cause analysis, timeline, and preventive measures. |

## 7. Compliance & Certifications

The complete list of what is **not** implemented is [`security-whitepaper.md` §12](../../../enterprise/security-whitepaper.md#12-roadmap--not-yet-implemented). Do not answer a compliance question from this section without checking it.

| Question | Answer |
|----------|--------|
| Is the platform SOC 2 Type II certified? | Not yet. SOC 2 Type II audit is planned post-launch (targeting Q4 2026). Current security practices are designed to meet SOC 2 Trust Service Criteria. |
| Is the platform HIPAA compliant? | No — and "HIPAA compliant" is not a status that exists as a certification. Styx is not a covered entity. HIPAA Business Associate Agreements are planned for the Enterprise tier ($999+/mo); **none has been executed**, and the template is an un-reviewed draft ([`../legal/hipaa-baa-template-DRAFT.md`](../../../legal/hipaa-baa-template-DRAFT.md)), whose §0 lists the technical prerequisites that are not yet met. Practitioners handling PHI should consult their compliance officer. |
| Is there a security whitepaper? | Yes — [`security-whitepaper.md`](../../../enterprise/security-whitepaper.md). It names the implementing file for every control it claims and lists unimplemented controls separately in §12. |
| Is the platform PCI DSS compliant? | Styx itself does not process or store payment card data. All payment processing is handled by Stripe, which is PCI DSS Level 1 certified. Styx operates in SAQ A-EP scope (redirect/iframe integration). |
| Is there a privacy policy? | Yes. Published at styx.app/privacy. Covers data collection, usage, sharing, retention, and user rights. |
| Is there a terms of service? | Yes. Published at styx.app/terms. Covers user obligations, financial stakes, dispute resolution, and liability limitations. |
| Are data processing agreements (DPAs) available? | DPAs are available for Enterprise tier customers upon request. |

## 8. Penetration Testing & Vulnerability Management

Supply-chain and release-gate detail: [`security-whitepaper.md` §10](../../../enterprise/security-whitepaper.md#10-software-supply-chain-and-secure-development).

| Question | Answer |
|----------|--------|
| Has a penetration test been performed? | Planned for pre-launch. Will be conducted by an independent third-party firm. Results will be available to Enterprise prospects under NDA. |
| How often are penetration tests performed? | Planned: annually, plus ad-hoc testing after significant architecture changes. |
| How are vulnerabilities managed? | GitHub Dependabot monitors all dependencies for known vulnerabilities. Alerts are triaged within 48 hours. Critical/high vulnerabilities are patched within 7 days. |
| Is static analysis performed? | Yes. GitHub CodeQL runs on every pull request. Ruff linter enforces Python code quality. ESLint + TypeScript strict mode enforce frontend code quality. |
| Is there a security audit in CI? | Yes. The CI pipeline includes: dependency vulnerability scanning (Dependabot), static analysis (CodeQL), linting (ruff, ESLint), type checking (TypeScript strict, Pyright). Security audit is one of 7 CI workflows. |
| Is there a responsible disclosure policy? | Planned. Will be published at styx.app/.well-known/security.txt with a security@styx.app contact. |

## 9. Subprocessors

| Subprocessor | Purpose | Data Shared | Location |
|-------------|---------|-------------|----------|
| **Stripe** | Payment processing, FBO escrow | Payment method, transaction amounts, identity verification data | US |
| **Render** | Application hosting, database, compute | All application data (encrypted at rest) | US (Oregon) |
| **Cloudflare** | CDN, R2 storage, DNS, DDoS protection | Static assets, proof submission files, domain traffic | US (primary), global edge (static assets only) |
| **Google (Gemini AI)** | Contract term validation, Aegis protocol natural language analysis | Contract text (no PII passed to model) | US |
| **Groq** | LLM inference for content moderation, proof analysis hints | Anonymized text snippets (no PII) | US |
| **Sentry** | Error tracking, performance monitoring | Stack traces, anonymized request metadata (no PII in payloads) | US |
| **Resend/Postmark** | Transactional email delivery | Email addresses, email content | US |

All subprocessors are US-based. No data is shared with subprocessors for advertising, profiling, or resale.

## 10. Access Controls & Employee Security

| Question | Answer |
|----------|--------|
| Who has access to production systems? | Sole founder (admin). No shared accounts. No contractor access to production databases. |
| Is the principle of least privilege enforced? | Yes. Application-level RBAC scopes all database queries by role. Infrastructure access is limited to the founder via Render and Cloudflare dashboards with MFA enabled. |
| Are access logs maintained? | Yes. Render and Cloudflare maintain access logs. Application-level audit logging is the hash-chained, append-only TruthLog — financial transactions, Fury verdicts, admin actions, and device-attestation rejections all append to it, and it carries a database trigger that rejects `UPDATE` and `DELETE`. Mechanism and its limits: [`security-whitepaper.md` §2](../../../enterprise/security-whitepaper.md#2-the-truthlog-a-hash-chained-append-only-event-log). |
| Are background checks performed? | Not applicable (sole founder). Fury auditors undergo identity verification (government ID) but are not employees. |
| Is there security awareness training? | Not applicable at current scale (sole founder). Planned for when team expands. |

## 11. Data Deletion & Retention

| Data Type | Retention Period | Deletion Method |
|-----------|-----------------|-----------------|
| Account data (name, email, phone) | Until account deletion + 30-day grace period | Permanent purge from PostgreSQL |
| Financial transaction records | 7 years (legal requirement) | Anonymized after account deletion; purged after 7 years |
| Behavioral contract data | Until account deletion + 30-day grace period | Permanent purge from PostgreSQL |
| Proof submission files | Until account deletion + 30-day grace period | Permanent purge from Cloudflare R2 |
| Fury audit verdicts | Until account deletion + 30-day grace period | Permanent purge from PostgreSQL |
| Integrity Score history | Until account deletion + 30-day grace period | Permanent purge from PostgreSQL |
| Usage analytics | 12 months (rolling) | Anonymized; no PII retained |
| Application logs | 30 days | Auto-purged by Render |
| Backup data | 7 days (rolling) | Auto-purged by Render |

## 12. Third-Party Risk

| Question | Answer |
|----------|--------|
| How are third-party vendors assessed? | All subprocessors are evaluated for security certifications (SOC 2, PCI DSS), data handling practices, encryption standards, and incident response capabilities before integration. |
| Are vendor contracts reviewed for security? | Yes. Data processing terms, security obligations, and breach notification requirements are reviewed in all vendor agreements. |
| What happens if a subprocessor is breached? | Styx's incident response plan covers subprocessor breaches. Affected users are notified per the same P1/P2 timelines. Data shared with the breached subprocessor is assessed for exposure. |
