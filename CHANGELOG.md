# CHANGELOG

## [0.4.0] - 2026-02-25

### Added — Phase Delta: The Arena

- **Dispute Resolution Pipeline**: Full `DisputeService` with `initiateAppeal`, `getDisputeQueue`, `getDisputeDetail`, and `resolveDispute` (UPHELD/OVERTURNED/ESCALATED outcomes).
- **Disputes migration** (`004_disputes.sql`): Schema for dispute tracking with appeal status, judge assignment, and resolution notes.
- **AdminController expansion**: 9 endpoints — disputes queue, dispute detail with signed media URL, dispute resolution, user profile inspection, manual integrity score adjustment.
- **pHash Deduplication**: `PHashService` wired into proof upload pipeline; `003_proof_hashes.sql` migration; duplicate detection in `confirm-upload` with `409 CONFLICT` rejection.
- **R2 `downloadFile()`**: Added to `R2StorageService` for server-side media retrieval (used by pHash computation).
- **Public Activity Feed**: `FeedController` with `GET /feed` (REST) and `GET /feed/stream` (SSE); anonymized events, no auth required.
- **Tavern Board Leaderboard**: Tier badges (Diamond/Gold/Silver/Bronze), animated ranks, weekly/monthly/alltime filters, "Fury of the Week" spotlight.
- **Mobile TavernFeed**: Upgraded to consume `/feed/stream` SSE with type icons, relative timestamps, and connection status indicator.
- **Gatekeeper Scan** (`scripts/gatekeeper-scan.sh`): Validation Gate #4 — scans built bundles for forbidden gambling terminology.
- **Enterprise CRM Connectors**: Integrated `CrmService` orchestrating `SalesforceConnector` and `HubSpotConnector` within the `B2BModule`.
- **Payment Routing Scaffold**: Centralized `PaymentRouterService` in the `PaymentsModule` with high-risk merchant escalation fallbacks.
- **Consumption Billing & Anonymization**: B2B readiness via `ConsumptionBillingService` and `AnonymizationService`.
- **Linguistic Middleware**: iOS/Android text sanitizer converting gambling terms (`Bet`, `Wager`) to behavioral compliance terms (`Commitment`, `Pledge`).

### Changed

- **AdminController**: Fixed broken `HoneypotInjectorService` → `HoneypotService` import. Added rate limiting to honeypot injection.
- **DisputeService**: Rewritten from scratch with transactional resolution, Stripe fee capture/refund, and Fury integrity penalties on overturn.
- **Platform stats** now include `pendingDisputes` count.

## [0.3.0] - 2026-02-25

### Added — Phase Gamma: The Panopticon

- **ProofsModule**: 3-endpoint upload pipeline (upload-url, confirm-upload, get-detail) with pre-signed R2 URLs.
- **HoneypotService**: Cron-based synthetic proof injection every 6 hours with ±5 integrity scoring.
- **Fury Workbench**: Video/image player from signed R2 URLs, confidence slider (0-100), FLAG AS SUSPICIOUS button, honeypot feedback overlay.
- **ProofCaptureScreen**: Mobile live-only camera, tamper-evident watermark, direct R2 upload.
- **R2 Lifecycle Rules**: Terraform — 30-day proof expiry, 7-day honeypot cleanup, 1-day multipart abort.

### Changed

- **FuryController**: Assignments now return signed R2 `viewUrl`, `contentType`, `description`.
- **FuryWorker**: Replaced hard-coded honeypot penalty with `HoneypotService.gradeHoneypotPerformance()`.
- **API Client**: `VerdictDto` includes `confidence` and `flagged`; return type includes `honeypotReveal`.

## [0.2.0] - 2026-02-25

### Changed

- **GEMINI.md overhaul**: Fixed package manager (yarn→npm), desktop stack (Electron→Tauri 2.0), added `src/pitch` workspace, added Recovery Protocol, added AI tooling reference.
- **Node.js engine**: Standardized minimum to `>=20.0.0` across `package.json`, `README.md`, and CI matrix.
- **Deprecated BIOLOGICAL oath stream**: Marked `WEIGHT_MANAGEMENT`, `CARDIOVASCULAR_STAMINA`, `GLUCOSE_STABILITY`, `SLEEP_INTEGRITY`, `SOBRIETY_HRV` and `HEALTHKIT`/`HEALTHCONNECT` native bridge verification methods as `@deprecated` in `behavioral-logic.ts`.
- **Stripe production guard**: `StripeFboService` now throws on startup if `NODE_ENV=production` and `STRIPE_SECRET_KEY` is missing or mock.
- **ConsensusEngine bounty distribution**: Wired `LedgerService` integration to pay Furies via `FURY_BOUNTY_POOL` account after consensus.
- **Terraform remote state**: Added S3-compatible backend block for Cloudflare R2 state storage.

### Added

- **`GoalEthicsService`** (`src/api/services/intelligence/goal-ethics.service.ts`): Moved goal ethics screening from `shared/` to `api/` to fix `shared→api` dependency inversion.
- **`FuryRouterWorker`** (`src/api/services/fury-router/fury-router.worker.ts`): BullMQ worker that processes Fury review routing jobs — selects eligible auditors, creates `fury_assignments`, and updates proof status.
- **`BannedUserGuard`** (`src/api/src/guards/banned-user.guard.ts`): NestJS guard that prevents banned users from accessing mutation endpoints.
- **`LedgerService` read-path**: `getAccountBalance()`, `getContractLedger()`, `verifyLedgerIntegrity()` methods for balance queries and Phantom Money Test.
- **`isOathStreamActive()`**: Runtime check for whether an oath category is supported in the current MVP.
- **`ACTIVE_OATH_STREAMS`**: Constant array of active oath streams (`COGNITIVE`, `PROFESSIONAL`, `CREATIVE`, `RECOVERY`).
- **Data retention policy**: Added retention schedule to `SECURITY.md` covering event_log, proofs, notifications, fury_assignments, stripe_events, and user PII.

### Removed

- **`isGoalEthical()`** from `shared/libs/behavioral-logic.ts` (replaced by `GoalEthicsService` in API layer).
- **Unused `FRAUD_PENALTY` import** from `consensus.engine.ts`.

## [0.1.0] - 2026-02-23

### Added

- **Security hardening**: Helmet HTTP security headers, JWT secret enforcement in production (no fallback), `SECURITY.md` vulnerability disclosure policy.
- **OpenAPI/Swagger**: Interactive API documentation at `/api/docs` with `@ApiTags`, `@ApiOperation`, `@ApiBearerAuth`, and `@ApiProperty` decorators across all controllers and DTOs.
- **Database migrations**: Migration runner (`migrate.ts`) with `schema_migrations` tracking table, `001_initial_schema.sql` baseline, and `npm run migrate` script.
- **Structured logging**: Pino integration via `nestjs-pino` — JSON output in production, pretty-print in development, automatic HTTP request logging.
- **README rewrite**: Updated test count (~430), Node.js prerequisite (>= 20), React Native version (0.76), CI badges, Swagger docs link, security link, migration command.

## [0.0.1] - 2026-02-22

### Added

- Initial monorepo skeleton.
- Architecture documentation.
- Legal guardrail definitions.
- Platform-specific build instructions.
