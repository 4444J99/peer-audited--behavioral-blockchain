# Styx Architecture Deep Dive Plan
**Date**: 2026-03-06  
**Agent**: Architectural Exploration  
**Session ID**: ab75bbd2a354611ca  
**Status**: PLANNING (no execution yet)

---

## User Request Summary

Conduct exhaustive exploration of `peer-audited--behavioral-blockchain` (Styx) monorepo to map every service, module, controller, and shared library. Determine implementation completeness across all layers.

### Explicit Requirements (14 numbered items)

1. List ALL files in `src/api/services/` recursively with first 50 lines read for each
2. List ALL files in `src/api/src/modules/` recursively  
3. Read `src/shared/libs/` and list all shared libraries with export signatures
4. Map `src/web/app/` directory structure and all routes/pages
5. List all screens in `src/mobile/screens/`
6. List all services in `src/mobile/services/`
7. List all panels in `src/desktop/src/panels/`
8. Examine `src/api/database/schema.sql` for table definitions
9. Examine `src/api/database/seed.sql` for seed data
10. For API services: identify fully implemented methods vs stubs/placeholders
11. For NestJS modules: identify fully wired endpoints vs mock/placeholder data
12. Check `src/web/utils/`, `src/web/stores/`, `src/web/components/` for inventory
13. Report completeness matrix showing implementation % for each feature area
14. Focus on: auth, contracts, fury, wallet, compliance, escrow, health, intelligence, security, oracles, b2b, ai, admin, notifications, payments, proofs, ledger, feed, beta

---

## Execution Plan

### Phase 1: Service Layer Deep Dive (40+ files)
**Goal**: Understand implementation completeness of domain services

**Tasks**:
- [ ] Read first 50 lines of each service in `src/api/services/`:
  - [ ] `ledger/` (3 files: ledger.service.ts, truth-log.service.ts, and spec)
  - [ ] `fury-router/` (3 files: router.service.ts, worker.ts, spec)
  - [ ] `escrow/` (3 files: stripe.service.ts, dispute.service.ts, spec)
  - [ ] `health/` (3 files: aegis.service.ts, recovery-protocol.service.ts, spec)
  - [ ] `intelligence/` (7+ files: GeminiClient.ts, goal-ethics.service.ts, honeypot.service.ts, phash.service.ts, specs)
  - [ ] `security/` (4+ files: moderation.service.ts, geofence.service.ts, anonymization.service.ts, spec)
  - [ ] `storage/` (2 files: r2.service.ts, spec)
  - [ ] `b2b/` (3+ files: billing.service.ts, crm.service.ts, specs)
  - [ ] `anomaly/` (2 files: anomaly.service.ts, spec)
  - [ ] Support files: billing.ts, geofencing.ts

**Output**: Matrix of service name → constructor params → core methods → stub detection (STUB/PARTIAL/FULL)

---

### Phase 2: NestJS Module Layer Deep Dive (100+ files)
**Goal**: Understand HTTP endpoint wiring and controller completeness

**Tasks**:
- [ ] For each module in `src/api/src/modules/`, examine:
  - [ ] controller.ts (route handlers, @Get/@Post/@Put/@Delete decorators)
  - [ ] module.ts (DI wiring, imported services)
  - [ ] service.ts (NestJS-specific business logic)
  - [ ] dto.ts (validation schema)
  - [ ] Any specialized files (workers, schedulers, connectors)

**Modules to scan**: auth/, contracts/, compliance/, fury/, wallet/, b2b/, ai/, admin/, users/, notifications/, payments/, proofs/, oracles/, ledger/, feed/, beta/, health/

**Output**: Module name → endpoint count → stub endpoint detection → scheduler presence

---

### Phase 3: Shared Libraries Inventory
**Goal**: Document all shared exports and type definitions

**Tasks**:
- [ ] Read `src/shared/libs/behavioral-logic.ts` (export signatures + 7 oath categories)
- [ ] Read `src/shared/libs/integrity.ts` (Integrity Score, tier enums)
- [ ] Read `src/shared/libs/money.ts` (Currency utilities)
- [ ] Any other .ts files in libs/ and spec files

**Output**: Shared library name → exported functions/classes/types

---

### Phase 4: Frontend Inventory
**Goal**: Map Next.js routes and component structure

**Tasks**:
- [ ] List all files in `src/web/app/` (routes, layouts, api handlers)
- [ ] List all files in `src/web/utils/` (helpers, linguistic-cloak.ts, etc.)
- [ ] List all files in `src/web/stores/` (Zustand stores)
- [ ] List all files in `src/web/components/` (React components)

**Output**: Frontend structure map with route → component mapping

---

### Phase 5: Mobile Inventory
**Goal**: Document screens and services

**Tasks**:
- [ ] List all files in `src/mobile/screens/`
- [ ] List all files in `src/mobile/services/` (ApiClient, SessionService, OfflineCache, etc.)
- [ ] Identify placeholder vs implemented screens

**Output**: Mobile screens/services inventory with implementation status

---

### Phase 6: Desktop Inventory
**Goal**: Document Tauri panels

**Tasks**:
- [ ] List all files in `src/desktop/src/panels/`

**Output**: Panels inventory

---

### Phase 7: Database Schema & Seed
**Goal**: Understand data model and initialization

**Tasks**:
- [ ] Read `src/api/database/schema.sql` → extract all table definitions
- [ ] Read `src/api/database/seed.sql` → document seed data structure

**Output**: Database schema map (tables, columns, constraints)

---

### Phase 8: Completeness Matrix
**Goal**: Synthesize findings into implementation percentage matrix

**Features to rate**: auth, contracts, fury, wallet, compliance, escrow, health, intelligence, security, oracles, b2b, ai, admin, notifications, payments, proofs, ledger, feed, beta

**Scoring scale**:
- **0-25%**: Architectural shell only; no real implementation
- **25-50%**: Core domain services exist; many endpoints stub/mock data
- **50-75%**: Most endpoints wired; some services have real logic; E2E tests exist
- **75-100%**: Fully wired; all endpoints routed; services have production logic; comprehensive tests

**Output**: CSV or table format with feature → completion % → notes

---

## Execution Strategy

**Tools to use**:
- `Glob` for rapid file discovery (patterns like `src/api/services/**/*.ts`)
- `Read` for first-50-line excerpts (using `offset` + `limit` to minimize token cost)
- `Bash` for parallel `wc -l` on all service files (to identify large vs small stubs)
- `Grep` for method detection (e.g., grep `constructor|async` to identify real vs stub)

**Parallel execution**:
- All 40+ service files can be read in parallel (Phase 1)
- All module controllers can be scanned in parallel (Phase 2)
- All directory inventories can be done in parallel (Phases 4-6)

**Token optimization**:
- Read only first 50 lines of services (catches constructors + core exports)
- Use grep to identify method bodies vs empty stubs (avoid reading full 100-line files)
- Use bash `wc -l` to rank services by complexity (smallest files = likely stubs)

---

## Expected Deliverables

1. **Service Layer Report** (Phase 1)
   - CSV: service_name | file_location | constructor_params | core_methods | implementation_status | line_count

2. **Module Layer Report** (Phase 2)
   - CSV: module_name | controller_path | endpoint_count | stub_count | real_endpoints | scheduler_present

3. **Shared Libraries Report** (Phase 3)
   - Structured list of exports for behavioral-logic.ts, integrity.ts, money.ts

4. **Frontend Structure Report** (Phase 4)
   - Route tree with component mappings
   - Utils/stores/components inventory

5. **Mobile/Desktop Inventory** (Phases 5-6)
   - Screens/panels list with implementation notes

6. **Database Schema Map** (Phase 7)
   - All table definitions with column types

7. **Implementation Completeness Matrix** (Phase 8)
   - Feature | Completion % | Evidence/Notes | Critical Gaps

---

## Assumptions & Constraints

- **No edits**: Read-only exploration only (per plan mode rules)
- **Monorepo structure**: Turbo + npm workspaces with workspaces defined in root `package.json`
- **NestJS patterns**: Controllers → services → domain services (three-tier)
- **Production data files**: Will NOT overwrite `registry-v2.json`, `seed.yaml`, or other protected files
- **Token budget**: ~200K tokens available; prioritize high-value reads (schema, core services) over exhaustive code review

---

## Success Criteria

- [ ] All 40+ service files inventoried with implementation status
- [ ] All NestJS modules mapped with endpoint counts
- [ ] Shared libraries documented with export signatures
- [ ] Frontend/mobile/desktop structure fully mapped
- [ ] Database schema extracted to table definitions list
- [ ] Completeness matrix generated showing % implementation for each feature
- [ ] Clear identification of critical gaps or stub-heavy areas
- [ ] Report deliverable formatted as markdown for clarity

---

## Risk Mitigation

| Risk | Mitigation |
|------|-----------|
| Token overflow on large files | Use `offset` + `limit` in Read tool; prioritize first 50 lines |
| Slow parallel execution | Batch reads into 5-10 parallel calls max per phase |
| Incomplete/inconsistent data | Cross-check with grep for method definitions; use bash wc to validate |
| Git state contamination | All reads only; zero writes except to plan file |

---

## Timeline Estimate

- **Phase 1** (services): 15-20 min (40 parallel reads of 50 lines each)
- **Phase 2** (modules): 20-25 min (100+ controller reads in batches)
- **Phase 3** (shared libs): 5 min
- **Phase 4-6** (inventory): 10 min (parallel globs)
- **Phase 7** (database): 5 min
- **Phase 8** (matrix): 15 min (synthesis)
- **Total**: ~90 min of active exploration

---

## Notes

- The linguistic-cloak mechanism (vocabulary swap: stake→vault, bet→commitment, fury→peer review) is critical for understanding web/mobile terminology differences.
- Behavioral-logic.ts contains the most complex business rules: 7 oath categories, grace days 2/month, loss aversion λ=1.955, strike mechanics, velocity caps.
- Fury network is the decentralized auditing layer — core to the system's integrity model.
- Health module includes two branches: Aegis Protocol (BMI floor, velocity caps) and Recovery Protocol (no-contact guardrails).
- B2B module is enterprise-focused with CRM connectors, billing, metrics, anonymization, webhooks, data lake extraction.

---

**Ready to execute**: User must confirm before Phase 1 begins.
