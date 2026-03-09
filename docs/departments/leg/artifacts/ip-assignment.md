---
generated: true
department: LEG
artifact_id: L7
governing_sop: "SOP--legal-documentation.md"
phase: genesis
product: styx
date: "2026-03-08"
---

# Intellectual Property and Open-Source Policy

This document establishes the intellectual property ownership structure, open-source dependency audit, trade secret inventory, and trademark strategy for Styx.

**IMPORTANT:** This is an internal policy document, not a legal agreement. It requires translation into formal legal instruments (IP assignment agreement, CLA, trademark applications) by qualified legal counsel.

---

## 1. IP Ownership Structure

### 1.1 Entity Ownership

All intellectual property created for Styx -- including source code, algorithms, documentation, designs, branding, and data structures -- is owned by the ORGANVM operating entity (entity formation TBD). No individual contributor retains IP rights to code contributed to the Styx codebase.

### 1.2 Founder Assignment

The founding developer(s) assign all pre-existing IP created for Styx prior to entity formation to the ORGANVM entity upon incorporation. This includes:
- All source code in the `peer-audited--behavioral-blockchain` repository
- All documentation in `docs/`
- All design assets, wireframes, and mockups
- Research and analysis documents
- The Fury consensus algorithm design
- The integrity scoring formula
- The Aegis Protocol specification
- The Recovery Protocol specification
- The behavioral physics constants (including lambda = 1.955 application)

A formal IP assignment agreement (see `docs/legal/legal--founder-agreement-draft.md`) will be executed at entity formation.

### 1.3 Contributor License Agreement (CLA)

All external contributors must sign a Contributor License Agreement before any pull request is merged. The CLA grants:
- A perpetual, worldwide, non-exclusive, royalty-free license to the ORGANVM entity for all contributed code
- The right to relicense contributed code under any terms
- Confirmation that the contributor has the legal right to make the contribution

CLA signing will be automated via a GitHub bot (e.g., CLA Assistant) on the public repository. Internal contributors (employees, contractors) will sign a broader IP assignment as part of their engagement agreement.

### 1.4 Work-for-Hire

All code produced by contractors, freelancers, or AI-assisted development tools for Styx is work-for-hire owned by the ORGANVM entity. Contractor agreements must include explicit IP assignment clauses.

AI-generated code (via Claude, Gemini, Copilot, or other tools) is treated as work-for-hire from the tool operator's perspective. The ORGANVM entity claims ownership of all AI-assisted output integrated into the Styx codebase, subject to the respective AI tool provider's terms of service.

## 2. Open-Source Dependencies

Styx is built on open-source foundations. All dependencies are audited for license compatibility with a proprietary (closed-source) commercial product.

### 2.1 Runtime Dependencies (Production)

| Package | License | Category | Compatibility |
|---------|---------|----------|---------------|
| **NestJS** (framework) | MIT | Backend | Compatible -- permissive |
| **Next.js** (framework) | MIT | Frontend | Compatible -- permissive |
| **React** | MIT | Frontend | Compatible -- permissive |
| **React Native** | MIT | Mobile | Compatible -- permissive |
| **Expo** | MIT | Mobile | Compatible -- permissive |
| **Tauri** | MIT / Apache-2.0 | Desktop | Compatible -- permissive (dual-license) |
| **Prisma** | Apache-2.0 | ORM | Compatible -- permissive |
| **Stripe SDK** (@stripe/stripe-js, stripe-node) | Apache-2.0 | Payments | Compatible -- permissive |
| **BullMQ** | MIT | Job queue | Compatible -- permissive |
| **ioredis** | MIT | Redis client | Compatible -- permissive |
| **Zod** | MIT | Validation | Compatible -- permissive |
| **Passport.js** | MIT | Authentication | Compatible -- permissive |
| **jsonwebtoken** | MIT | JWT | Compatible -- permissive |
| **bcrypt** | MIT | Password hashing | Compatible -- permissive |
| **Playwright** | Apache-2.0 | E2E testing | Compatible -- permissive (dev only) |
| **Jest** | MIT | Unit testing | Compatible -- permissive (dev only) |
| **TypeScript** | Apache-2.0 | Language | Compatible -- permissive (dev only) |
| **Turborepo** | MIT | Build | Compatible -- permissive (dev only) |
| **ESLint** | MIT | Linting | Compatible -- permissive (dev only) |

### 2.2 License Risk Assessment

| License Type | Risk Level | Count | Notes |
|-------------|------------|-------|-------|
| MIT | None | ~85% of deps | No obligations beyond attribution |
| Apache-2.0 | Very Low | ~12% of deps | Requires NOTICE file preservation, patent grant included |
| BSD-2-Clause | None | ~2% of deps | Similar to MIT |
| ISC | None | ~1% of deps | Functionally identical to MIT |
| GPL / LGPL / AGPL | **High** | 0 | **No GPL-family dependencies in Styx.** This is enforced. |

### 2.3 License Compliance Actions

1. **NOTICE file:** Maintain a `NOTICE` file at repository root listing all Apache-2.0 dependencies with their copyright notices.
2. **Attribution:** Include open-source attribution in the "About" section of web, mobile, and desktop apps.
3. **No GPL contamination:** Automated license check in CI (using `license-checker` or equivalent) that fails the build if any GPL-family dependency is introduced.
4. **Periodic audit:** Quarterly review of dependency tree for license changes in upstream packages.

### 2.4 Dependency Update Policy

- **Security patches:** Applied within 48 hours of disclosure
- **Minor updates:** Applied monthly (batch update with regression testing)
- **Major updates:** Evaluated individually; migration plan required
- **Abandoned dependencies:** Flagged for replacement if no commits in 12 months

## 3. Trade Secrets

The following elements of Styx are classified as trade secrets and must be protected from public disclosure:

### 3.1 Algorithms

| Trade Secret | Description | Protection Measures |
|-------------|-------------|---------------------|
| **Fury Consensus Algorithm** | The specific implementation of auditor selection, conflict-of-interest detection, quorum formation, and reputation weighting. The general concept (peer audit) is public; the implementation details are proprietary. | Source code in private repository. Not discussed in public documentation beyond high-level description. |
| **Integrity Scoring Formula** | The exact formula for score calculation, including weights for completions, failures, audit participation, and potential decay curves. The existence of the score is public; the formula is proprietary. | Implemented in `@styx/shared` with no public documentation of exact weights. |
| **Aegis Protocol Thresholds** | While the BMI floor (18.5) and velocity cap (2%) are disclosed for user transparency, the full set of safety heuristics (including unreleased ones for future oath categories) is proprietary. | Safety-critical thresholds are user-facing. Internal heuristics are in private config. |

### 3.2 Behavioral Physics Constants

The application of specific behavioral economics constants to product mechanics:
- Lambda (1.955) loss aversion coefficient applied to stake presentation
- Contract duration optimization curves
- Verification frequency impact on completion rates
- Grace day allocation effect on user retention

These constants are derived from published academic research but their specific application to product mechanics is proprietary.

### 3.3 Business Intelligence

- Conversion funnel data (registration to first contract)
- Completion rates by oath category and stake amount
- Fury auditor accuracy distributions
- Revenue per user by segment
- B2B practitioner churn analysis

### 3.4 Protection Measures

1. **Code access:** Repository is private. All contributors sign NDAs.
2. **Documentation:** Trade secret documents are marked "CONFIDENTIAL -- TRADE SECRET" in headers.
3. **Employee/contractor agreements:** Include non-disclosure and non-compete clauses covering trade secrets.
4. **AI tool usage:** Trade secret code is processed by AI tools (Claude, Copilot) under their respective terms. Evaluate whether AI tool terms adequately protect trade secret status. Consider opt-out of training data inclusion where available.

## 4. Trademark Strategy

### 4.1 Primary Marks

| Mark | Type | Status | Class |
|------|------|--------|-------|
| **STYX** | Word mark | To be filed | Class 36 (Financial), Class 42 (Software) |
| **The Blockchain of Truth** | Tagline | To be filed | Class 36, Class 42 |
| **Fury** (in context of peer audit) | Word mark | To be filed | Class 36 |
| Styx logo (design TBD) | Design mark | Planned | Class 36, Class 42 |

### 4.2 Trademark Risks

| Risk | Assessment | Mitigation |
|------|------------|------------|
| "Styx" conflicts with existing marks | Medium -- "Styx" is a common mythological reference used across industries | Narrow to financial/software classes. Search USPTO TESS before filing. |
| "Fury" is generic | High -- "fury" is a common English word | File as "Fury" specifically in context of peer audit/verification services. Consider "Styx Fury" as a composite mark. |
| "Blockchain" in tagline may be misleading | Medium -- Styx does not use blockchain technology (it uses a double-entry ledger) | "Blockchain of Truth" is metaphorical. Consider "Ledger of Truth" as alternative if challenged. Evaluate whether metaphorical use creates consumer confusion or regulatory issues. |

### 4.3 Domain and Social Media

| Asset | Status | Notes |
|-------|--------|-------|
| styx.app | To be acquired | Check availability and pricing |
| styx.io | To be evaluated | Alternative if .app unavailable |
| @styx on Twitter/X | To be evaluated | Likely taken; consider @styx_app or @usestyx |
| @styx on Instagram | To be evaluated | |
| r/styx | Conflict (band subreddit) | Use r/styxapp or r/styxplatform |

### 4.4 Filing Timeline

1. **Pre-beta:** File intent-to-use applications for STYX (word mark) in Classes 36 and 42
2. **Beta launch:** File use-based applications when platform is live
3. **Post-launch:** File "The Blockchain of Truth" and "Fury" if the marks prove to have market value
4. **Ongoing:** Monitor USPTO for conflicting filings; set up trademark watch service

## 5. IP Inventory Summary

| Category | Count | Status |
|----------|-------|--------|
| Source code (proprietary) | ~50,000 LOC (TypeScript) | Private repo, entity-owned (pending formation) |
| Algorithms (trade secret) | 3 core algorithms | Protected, not publicly documented |
| Open-source dependencies | ~200 packages | All MIT/Apache-2.0 compatible |
| Trademarks (planned) | 3 word marks + 1 design mark | Pre-filing |
| Patents | 0 | Not currently pursuing; evaluate post-launch |
| Domain names | 0 acquired | To be acquired pre-beta |
| Design assets | ~20 files | Entity-owned (pending formation) |
| Documentation (proprietary) | ~100 files | Private repo, entity-owned (pending formation) |

## 6. Patent Considerations

The Fury consensus algorithm and integrity scoring system may be patentable as novel methods in the fintech/behavioral economics domain. However, patent filing is deferred for the following reasons:

1. **Cost:** Provisional patent ($2K-$5K) + full patent ($15K-$30K) is a significant pre-revenue expense
2. **Disclosure:** Patent applications become public, revealing trade secrets
3. **Trade secret alternative:** Trade secret protection is perpetual (vs. 20-year patent term) and requires no disclosure
4. **Enforcement:** Patent litigation is prohibitively expensive for an early-stage company

**Recommendation:** Maintain trade secret protection for core algorithms. Re-evaluate patent strategy at Series A or when a competitor emerges with a similar implementation.

## 7. Action Items

| Action | Priority | Owner | Deadline |
|--------|----------|-------|----------|
| Form ORGANVM entity | P0 | Founder | Pre-beta |
| Execute founder IP assignment | P0 | Legal Counsel | At entity formation |
| File STYX trademark (intent-to-use) | P1 | Legal Counsel | Pre-beta |
| Set up CLA bot on GitHub | P1 | Engineering | Before public repo |
| Implement license-checker in CI | P1 | Engineering | Before public repo |
| Create NOTICE file for Apache-2.0 deps | P2 | Engineering | Pre-beta |
| Acquire styx.app domain | P1 | Operations | Pre-beta |
| Evaluate AI tool training data opt-out | P2 | Legal + Engineering | Pre-beta |
| USPTO TESS search for STYX/FURY | P1 | Legal Counsel | Immediate |
| Draft NDA template for contractors | P1 | Legal Counsel | Pre-beta |

---

_This policy requires formal legal instruments to be drafted by qualified IP counsel. Key deliverables: (1) IP assignment agreement for founders, (2) CLA for external contributors, (3) NDA template, (4) trademark filing applications. Budget estimate: $15K-$25K for initial IP legal work._
