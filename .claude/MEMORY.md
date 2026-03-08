# Styx (peer-audited--behavioral-blockchain) — Project Memory

## Identity
- **Full name:** peer-audited--behavioral-blockchain (codename: Styx)
- **Organ:** ORGAN-III (Ergon) — commercial products
- **Tier:** flagship
- **Status:** CANDIDATE (promoted from LOCAL on 2026-02-24)
- **GitHub org:** labores-profani-crux

## Architecture
- **Monorepo** managed by Turborepo
- `src/api/` — NestJS backend (port 3000)
- `src/web/` — Next.js frontend (port 3001)
- `src/shared/` — shared TypeScript libs (behavioral-logic, integrity, linguistic-cloak)
- `src/mobile/` — React Native (Expo)
- `src/desktop/` — Tauri wrapper
- `src/pitch/` — pitch deck build
- `infra/terraform/` — Render + Cloudflare R2 + WAF
- `docs/` — research, legal, planning, architecture docs

## Key Constants
- Loss aversion lambda: 1.955
- Onboarding bonus: $5 (endowed progress)
- Grace days: 2/month
- BMI floor: 18.5 (Aegis Protocol health safety)
- Recovery contracts: max 30 days, max 3 targets, 3 missed attestations = auto-fail
- Stake tiers: $0 / $20 / $100 / $1,000 / unlimited

## Development
- Node 20, TypeScript strict
- `npm run dev` — turbo dev (API + web)
- `npm test` — turbo test
- `npm run lint` — turbo lint
- CI: `.github/workflows/ci.yml` (security audit, turbo test+build+lint, Gates 04-07, beta readiness, Terraform validate, Playwright E2E, CodeQL)
- Deploy: tag-triggered to Render via `.github/workflows/deploy.yml`

## Deployment
- **Provider:** Render (Oregon region, starter plans)
- **Services:** API, Web, PostgreSQL, Redis
- **CDN/WAF:** Cloudflare (free tier)
- **Object Storage:** Cloudflare R2 (free tier)
- **Monitoring:** Sentry (active)
- **Production status:** Not yet deployed with real-money settlement

## Linguistic Cloaker
App Store compliance layer — swaps gambling-adjacent terms:
- stake → vault
- bet → commitment
- fury (peer review system) → peer review
- Enforced by `scripts/gatekeeper-scan.sh` and `scripts/validation/04-redacted-build-check.sh`

## Agent Departments
7 seeded agent contexts in `.claude/agents/` — none yet activated:
enterprise, finance, growth, support, ops, product, legal

## Sprint History
- Sprint 2-3 (Feb 27): Core feature implementation
- Docs rename/reorganize (Feb 27): 19 renames + 5 moves
- Test hardening (Feb 27): CI + E2E + deploy pipeline
- Community health (Feb 28): SECURITY, CoC, issue templates
- E2G roadmap (Feb 28): 18 tasks across 4 phases (Alpha→Delta)
- Groq chat route (Mar 4): LLM endpoint implemented
- Doctoral dissertation tracking (Mar 4): 67,503 words, 9 proofs
- Beta acceleration (Mar 4): 51 new tests
- Governance registration (Mar 6): Styx added to registry-v2.json
- AI session audit (Mar 6): 7 GitHub issues created

## Key Issues (Blocked on Human Action)
- #132: KYC integration
- #133: High-risk merchant account
- #136: Skill-based contest whitepaper + counsel sign-off
- #146: App Store UGC moderation submission
- #148: Cross-jurisdictional consent matrix
- #137: Prize indemnity insurance
- #147: Stablecoin stakes regulatory pathway
- #184: FUNDING.yml (community health gap)

## Unexecuted Plans (High Value)
- `ask-styx-static-chat` — standalone chat SPA for GH Pages
- `architecture-completeness-matrix` — 8-phase deep dive, 19 feature areas
- `stub-placeholder-inventory` — grep-based stub/TODO search (subordinate to above)
