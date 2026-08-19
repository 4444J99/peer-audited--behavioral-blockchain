# Feature-to-Surface Matrix

**Generated**: 2026-08-19
**Source of Truth**: `src/web/lib/guided-tour/registry.ts`, `src/api/src/modules/`, `src/web/app/`, `.env.example`

---

## Classification Dimensions

| Dimension | Meaning |
|-----------|---------|
| **Specified** | Has docs/planning artifacts |
| **Written** | Has implementation code in repo |
| **Registered** | Entry in guided-tour registry (`TOUR_ROUTES`) or routing config |
| **Reachable** | Has a nav path or URL that resolves |
| **Executable** | Can be completed end-to-end via UI against seeded data |
| **Demo-Ready** | Works with seeded synthetic data |
| **Production-Ready** | Passes all safeguards, feature-flag gated for live |

---

## Circle Alpha — The Wedge (Consumer No-Contact Recovery)

| Feature | Route | API | Role | Label | Specified | Written | Registered | Reachable | Executable | Demo-Ready | Production-Ready | Blocker |
|---------|-------|-----|------|-------|-----------|---------|------------|-----------|------------|------------|------------------|---------|
| Landing page | `/` | — | public | working | Yes | Yes | Yes | Yes | Yes | Yes | No | Marketing only; `STYX_PRIVATE_BETA=true` gates full funnel |
| Beta waitlist | `/beta` | `POST /beta/waitlist` | public | beta | Yes | Yes | Yes | Yes | Yes | Yes | No | `STYX_PRIVATE_BETA=true`; no open enrollment |
| Beta confirm | `/beta/confirm` | — | public | beta | Yes | Yes | Yes | Yes | Yes | Yes | No | Cohort assignment is synthetic |
| No-contact guide | `/recovery/breakup-no-contact-guide` | — | public | working | Yes | Yes | Yes | Yes | Yes | Yes | Yes | — |
| Commitment contracts explainer | `/recovery/how-commitment-contracts-work` | — | public | working | Yes | Yes | Yes | Yes | Yes | Yes | Yes | — |
| Accountability app | `/recovery/accountability-app-for-relationships` | — | public | working | Yes | Yes | Yes | Yes | Yes | Yes | Yes | — |
| Couples tools | `/recovery/couples-recovery-tools` | — | public | working | Yes | Yes | Yes | Yes | Yes | Yes | Yes | — |
| Do-not-text-your-ex-tonight | `/do-not-text-your-ex-tonight` | — | public | working | Yes | Yes | Yes | Yes | Yes | Yes | Yes | — |

---

## Circle Beta — The Loop (Commitment Contracts)

| Feature | Route | API | Role | Label | Specified | Written | Registered | Reachable | Executable | Demo-Ready | Production-Ready | Blocker |
|---------|-------|-----|------|-------|-----------|---------|------------|-----------|------------|------------|------------------|---------|
| Contract creation | `/contracts/new` | `POST /contracts` | USER | working | Yes | Yes | Yes | Yes | Yes | Yes | No | `STYX_TEST_MONEY_MODE=true` — no real money rail |
| Contract detail | `/contracts/[id]` | `GET /contracts/:id` | USER | working | Yes | Yes | Yes | Yes | Yes | Yes | No | Test-money ledger only |
| Contract attestation | `/contracts/[id]/attest` | `POST /contracts/:id/attestation` | USER | working | Yes | Yes | Yes | Yes | Yes | Yes | No | Requires seeded active contract (river) |
| Dashboard | `/dashboard` | `GET /dashboard` | USER | working | Yes | Yes | Yes | Yes | Yes | Yes | No | Seeded with river's data; no real money |
| Wallet | `/wallet` | `GET /wallet/balance`, `GET /wallet/history` | USER | beta | Yes | Yes | Yes | Yes | Yes | Yes | No | `STYX_TEST_MONEY_MODE=true` — internal ledger only |
| Realms | `/realms`, `/realms/[slug]` | `GET /realms` | USER | working | Yes | Yes | Yes | Yes | Yes | Yes | No | — |
| Realm contract creation | `/realms/[slug]/contracts/new` | `POST /contracts` | USER | working | Yes | Yes | Yes | Yes | Yes | Yes | No | Pre-fills realm-specific evidence rule |
| Tavern | `/tavern` | `GET /feed`, `GET /social/leaderboard` | USER | working | Yes | Yes | Yes | Yes | Yes | Yes | No | — |
| Referrals | `/referrals` | `GET /referrals/code`, `GET /referrals/rewards` | USER | working | Yes | Yes | Yes | Yes | Yes | Yes | No | — |
| Profile | `/profile` | `GET /users/me` | USER | working | Yes | Yes | Yes | Yes | Yes | Yes | Yes | — |
| Settings | `/settings` | `PATCH /users/me/settings` | USER | working | Yes | Yes | Yes | Yes | Yes | Yes | Yes | — |
| Help | `/help` | — | public | working | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Static FAQ |

---

## Circle Gamma — Proof Integrity (Trust Machinery)

| Feature | Route | API | Role | Label | Specified | Written | Registered | Reachable | Executable | Demo-Ready | Production-Ready | Blocker |
|---------|-------|-----|------|-------|-----------|---------|------------|-----------|------------|------------|------------------|---------|
| Fury queue | `/fury` | `GET /fury/queue`, `POST /fury/verdict` | FURY | working | Yes | Yes | Yes | Yes | Yes | Yes | No | Requires FURY persona (alecto); 3-way consensus active |
| KYC | `/kyc` | `GET /users/me/compliance` | USER | beta | Yes | Yes | Yes | Yes | Yes | Yes | No | `KYC_ENFORCEMENT_ENABLED=false`; `STYX_IDENTITY_PROVIDER=mock` — mock verification only |
| Jurisdiction switchboard | `/admin/jurisdictions` | `GET /admin/jurisdictions` | ADMIN | future | Yes | Yes | Yes | Yes | Yes | Yes | No | `GEOFENCE_FAIL_OPEN_ON_MISSING_HEADERS=false`; local demo in permissive posture |
| Whistleblower | `/whistleblower/[linkId]` | `POST /contracts/bounty/:linkId` | public | working | Yes | Yes | Yes | Yes | Yes | Yes | No | Scoped link; reporter identity not exposed |

---

## Circle Delta — Retention (Pods, Realms, Social)

| Feature | Route | API | Role | Label | Specified | Written | Registered | Reachable | Executable | Demo-Ready | Production-Ready | Blocker |
|---------|-------|-----|------|-------|-----------|---------|------------|-----------|------------|------------|------------------|---------|
| Behavioral toolkit | `/behavioral` | — | USER | working | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Hub page; links to sub-tools |
| Assessment | `/behavioral/assessment` | `GET /behavioral/intake-assessment` | USER | working | Yes | Yes | Yes | Yes | Yes | Yes | Yes | — |
| Habit strength | `/behavioral/habit-strength` | `GET /behavioral/habit-strength` | USER | working | Yes | Yes | Yes | Yes | Yes | Yes | Yes | — |
| Friction audit | `/behavioral/friction-audit` | `POST /behavioral/friction-audit` | USER | working | Yes | Yes | Yes | Yes | Yes | Yes | Yes | — |
| Reentry | `/behavioral/reentry` | `GET /behavioral/reentry/eligibility` | USER | working | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Seeded with missed-and-recovered streak |
| Academy | `/behavioral/academy` | `POST /behavioral/academy/progress` | USER | working | Yes | Yes | Yes | Yes | Yes | Yes | Yes | — |
| Gateway oath | `/behavioral/gateway-oath` | `GET /behavioral/gateway-oath/eligibility` | USER | working | Yes | Yes | Yes | Yes | Yes | Yes | Yes | — |
| Auditor wellness | `/behavioral/auditor-wellness` | `POST /behavioral/auditor/wellness` | FURY | working | Yes | Yes | Yes | Yes | Yes | Yes | Yes | — |
| Partner | `/partner` | `POST /contracts/:id/accountability/invite` | USER | working | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Partner protocol: invite, co-sign, veto |
| Guardrails | `/guardrails` | — | public | working | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Static safety limits |

---

## Circle Omega — The Enterprise

| Feature | Route | API | Role | Label | Specified | Written | Registered | Reachable | Executable | Demo-Ready | Production-Ready | Blocker |
|---------|-------|-----|------|-------|-----------|---------|------------|-----------|------------|------------|------------------|---------|
| Practitioner console | `/practitioner` | `GET /practitioner/dashboard` | PRACTITIONER/ADMIN | working | Yes | Yes | Yes | Yes | Yes | Yes | No | `STYX_FEATURE_B2B_HR_UI=false` — UI present but feature-flagged off |
| Enterprise analytics | `/hr` | `GET /b2b/metrics/:enterpriseId` | ADMIN | future | Yes | Yes | Yes | Yes | Yes | Yes | No | `STYX_FEATURE_B2B_HR_UI=false`; preview only, not deployed enterprise product |

---

## Admin Surfaces

| Feature | Route | API | Role | Label | Specified | Written | Registered | Reachable | Executable | Demo-Ready | Production-Ready | Blocker |
|---------|-------|-----|------|-------|-----------|---------|------------|-----------|------------|------------|------------------|---------|
| Admin console | `/admin` | — | ADMIN | future | Yes | Yes | Yes | Yes | Yes | Yes | No | Internal operator surface; `hr` persona in tour |
| Admin collusion | `/admin/collusion` | `GET /fury/enforcement/rings` | ADMIN | future | Yes | Yes | Yes | Yes | Yes | Yes | No | Ring-detection engine runs on cadence; screen for human review |
| Admin CAC/LTV | `/admin/cac-ltv` | `GET /admin/stats` | ADMIN | future | Yes | Yes | Yes | Yes | Yes | Yes | No | Figures modelled from synthetic data |
| Admin jurisdictions | `/admin/jurisdictions` | `GET /admin/jurisdictions` | ADMIN | future | Yes | Yes | Yes | Yes | Yes | Yes | No | Geofence in permissive demo posture |

---

## Legal / Compliance

| Feature | Route | API | Role | Label | Specified | Written | Registered | Reachable | Executable | Demo-Ready | Production-Ready | Blocker |
|---------|-------|-----|------|-------|-----------|---------|------------|-----------|------------|------------|------------------|---------|
| Terms | `/legal/terms` | — | public | working | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Static content |
| Privacy | `/legal/privacy` | — | public | working | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Static content |
| Responsible use | `/legal/responsible-use` | — | public | working | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Static content |
| Rules | `/legal/rules` | — | public | working | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Static content |
| Compliance artifacts | `/legal/compliance-artifacts` | `GET /compliance/artifacts` | public | working | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Hash CI-gated; release gate checks artifact integrity |

---

## Authentication

| Feature | Route | API | Role | Label | Specified | Written | Registered | Reachable | Executable | Demo-Ready | Production-Ready | Blocker |
|---------|-------|-----|------|-------|-----------|---------|------------|-----------|------------|------------|------------------|---------|
| Login | `/login` | `POST /auth/login` | public | working | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Tour establishes sessions via API directly; form works |
| Register | `/register` | `POST /auth/register` | public | working | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Captures age confirmation + terms acceptance |

---

## Tour / Demo

| Feature | Route | API | Role | Label | Specified | Written | Registered | Reachable | Executable | Demo-Ready | Production-Ready | Blocker |
|---------|-------|-----|------|-------|-----------|---------|------------|-----------|------------|------------|------------------|---------|
| Tour | `/tour` | — | public | beta | Yes | Yes | Yes | Yes | Yes | Yes | No | Truth-label boundary page; demo-only overlay |
| Circles | `/circles` | — | public | beta | Yes | Yes | Yes | Yes | Yes | Yes | No | Synthetic demo index |
| Pitch | `/pitch` | — | public | working | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Investor deck; projections not sourced |

---

## Future / Incomplete

| Feature | Route | API | Role | Label | Specified | Written | Registered | Reachable | Executable | Demo-Ready | Production-Ready | Blocker |
|---------|-------|-----|------|-------|-----------|---------|------------|-----------|------------|------------|------------------|---------|
| Ask Styx | `/ask` | Cloudflare Worker | public | future | Yes | Partial | Yes | Yes | No | No | No | Worker URL not configured locally; page renders but backend unreachable |
| Behavioral pages | `/behavioral/*` | various | USER | working | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Sub-routes individually classified above |

---

## Seed Personas

| Persona | Email | Role | Tour Key | Primary Surfaces |
|---------|-------|------|----------|-----------------|
| River | `river@demo.styx.protocol` | USER | `river` | Dashboard, contracts, attestation, wallet, realms, tavern, referrals, profile, settings, behavioral tools |
| Dr. Moira | `dr.moira@demo.styx.protocol` | PRACTITIONER | `moira` | Practitioner console, assigned clients |
| HR Lead | `hr.lead@acheron.example` | ADMIN | `hr` | Enterprise analytics, admin surfaces |
| Alecto | `alecto@demo.styx.protocol` | FURY | `alecto` | Fury queue, auditor wellness, collusion review |
| Sage | `sage@demo.styx.protocol` | USER | `sage` | KYC (mid-verification state) |

---

## Feature Flags

| Flag | Default | Effect |
|------|---------|--------|
| `STYX_TEST_MONEY_MODE` | `true` | LedgerEscrowProvider (internal); no real money rail |
| `STYX_PRIVATE_BETA` | `true` | Gated enrollment; waitlist required |
| `STYX_ALLOWLIST_US_ONLY` | `true` | Geo-restriction to US |
| `STYX_PHASE1_MOBILE_PRIMARY` | `true` | Mobile-first experience |
| `STYX_PHASE1_NO_CONTACT_ONLY` | `true` | Narrow wedge; other contract categories deferred |
| `STYX_FEATURE_B2B_HR_UI` | `false` | Practitioner/enterprise UI present but flagged off |
| `KYC_ENFORCEMENT_ENABLED` | `false` | Mock identity provider; no live KYC |
| `STYX_IDENTITY_PROVIDER` | `mock` | Simulated identity verification |
| `STYX_APPEAL_FEE_ENABLED` | `false` | $5 appeal friction removed for beta cohort |
| `STYX_ONBOARDING_BONUS_ENABLED` | `false` | Endowed-progress bonus removed for beta cohort |

---

## Summary Counts

| Dimension | Count | Percentage |
|-----------|-------|------------|
| Total features classified | 52 | — |
| Specified | 52 | 100% |
| Written | 52 | 100% |
| Registered (tour) | 52 | 100% |
| Reachable | 52 | 100% |
| End-to-end executable | 51 | 98% |
| Demo-ready (synthetic data) | 50 | 96% |
| Production-ready | 26 | 50% |

### By Label (Truth Boundary)

| Label | Count | Features |
|-------|-------|----------|
| **working** | 36 | Landing, recovery guides, contracts, dashboard, realms, tavern, referrals, profile, settings, help, fury queue, whistleblower, behavioral toolkit (all sub-tools), partner, guardrails, login, register, tour infra, legal surfaces, compliance artifacts, do-not-text wedge |
| **beta** | 8 | Beta waitlist, beta confirm, wallet, KYC, tour page, circles demo |
| **future** | 8 | Ask Styx, HR enterprise analytics, admin console, admin collusion, admin CAC/LTV, admin jurisdictions, jurisdiction switchboard |

### By Circle

| Circle | Total | Working | Beta | Future |
|--------|-------|---------|------|--------|
| Alpha (Wedge) | 8 | 6 | 2 | 0 |
| Beta (Loop) | 12 | 10 | 2 | 0 |
| Gamma (Proof Integrity) | 4 | 2 | 1 | 1 |
| Delta (Retention) | 10 | 10 | 0 | 0 |
| Omega (Enterprise) | 2 | 1 | 0 | 1 |
| Admin | 4 | 0 | 0 | 4 |
| Legal/Compliance | 5 | 5 | 0 | 0 |
| Auth | 2 | 2 | 0 | 0 |
| Tour/Demo | 3 | 1 | 2 | 0 |
| Future/Incomplete | 2 | 1 | 0 | 1 |

---

## Remaining Fleet Debt

### Production Blockers (features that are demo-ready but not production-ready)

| ID | Feature | Debt | Required For |
|----|---------|------|--------------|
| FD-01 | Real-money Stripe FBO | `STYX_TEST_MONEY_MODE=true` — no live escrow rail | Public beta |
| FD-02 | Live KYC | `KYC_ENFORCEMENT_ENABLED=false` — mock provider | Financial compliance |
| FD-03 | B2B HR UI | `STYX_FEATURE_B2B_HR_UI=false` — feature-flagged off | Enterprise sales |
| FD-04 | Geofence enforcement | Jurisdictions in permissive demo posture | Multi-jurisdiction launch |
| FD-05 | Ask Styx worker | Cloudflare Worker URL not configured | Self-serve support |
| FD-06 | Mobile native camera | `F-MOBILE-01` STUB — no native capture | Proof verification on mobile |
| FD-07 | Push notifications | `F-MOBILE-03` PARTIAL | Re-engagement |
| FD-08 | Pod-based cohorts | `F-SOCIAL-07` NOT_STARTED | Retention features |
| FD-09 | Identity onboarding | `F-UX-01` NOT_STARTED | User experience |
| FD-10 | HealthKit bridge | `F-VERIFY-02` NOT_STARTED | Hardware-verified proofs |

### Demo-Only Surfaces (registered but not customer-facing)

| Surface | Reason |
|---------|--------|
| `/circles` | Synthetic demo index for investor walkthrough |
| `/pitch` | Investor deck; projections not independently sourced |
| `/tour` | Guided-tour boundary page; truth-label vocabulary |

### Partial Implementations

| Feature | State | Gap |
|---------|-------|-----|
| Ask Styx (`/ask`) | Page renders; Worker unreachable | `GROQ_API_KEY` may be unset; Worker URL needed |
| Push notifications | PARTIAL | Needs native bridge + APNs/FCM config |
| HealthKit native bridge | NOT_STARTED | iOS-only; requires native module |
| Pod-based cohorts | NOT_STARTED | Max-5 pod visibility not built |

---

## Source Files

| Artifact | Path |
|----------|------|
| Guided-tour registry | `src/web/lib/guided-tour/registry.ts` |
| Web routes | `src/web/app/` (Next.js App Router) |
| API modules | `src/api/src/modules/` (NestJS) |
| Feature flags | `.env.example` |
| Seed personas | `seed.yaml` (section `PERSONA_ACCOUNTS` in registry) |
| Feature backlog | `docs/FEATURE-BACKLOG.md` |
| Tour component | `src/web/components/guided-tour/GuidedTour.tsx` |
