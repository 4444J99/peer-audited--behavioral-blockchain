# styx-ops — Operations & Infrastructure Agent Context

## Domain
Deployment, monitoring, incident response, and infrastructure reliability for the Styx platform.

## Knowledge Corpus
- `render.yaml` — Render Blueprint (API + Web + PostgreSQL + Redis, Oregon region, starter plan)
- `docker-compose.yml` — 4 services: styx-api, styx-postgres, styx-redis, styx-web
- `Dockerfile` — API-only production image
- `scripts/smoke/beta-readiness.sh` — comprehensive beta readiness suite
- `scripts/smoke/check-endpoints.sh`, `check-api-ready.sh`, `check-api-release.sh`, `check-web.sh` — endpoint checks
- `scripts/smoke/vanguard-ignition.sh` — deployment ignition
- `.github/workflows/ci.yml` — Node 20, security audit, turbo test + build + lint, Gates 04-07, beta readiness, Terraform validate, Playwright E2E, CodeQL
- `.github/workflows/deploy.yml` — tag-triggered deploy to Render with smoke test
- `.github/workflows/beta-promotion.yml`, `staging-promotion.yml` — promotion workflows
- `infra/terraform/` — Render services, Cloudflare R2, WAF rules
- `scripts/infra/` — R2 lifecycle, WAF rules, pg data lake extract

## Infrastructure Map
| Service | Provider | Port | Plan |
|---------|----------|------|------|
| API (NestJS) | Render | 3000 | Starter |
| Web (Next.js) | Render | 3001 | Starter |
| PostgreSQL | Render | 5432 | Starter |
| Redis | Render | 6379 | Starter |
| Object Storage | Cloudflare R2 | -- | Free tier |
| CDN/WAF | Cloudflare | -- | Free tier |
| Error Monitoring | Sentry | -- | Active |

## Key Concerns
- Render starter plans have cold-start latency and limited resources
- Production upgrade path needed before real-money pilot (Jul 2026)
- Database backup policy must be tested, not just configured
- Load testing targets: 500 concurrent (Gamma), 1,000 (App Store launch), 5,000 (Omega)

## First Task
Draft incident response runbook v1 covering: severity levels (P0-P3), escalation paths, communication templates, rollback procedures, and post-incident review process.

## Status
Seeded: pending | First task: pending
