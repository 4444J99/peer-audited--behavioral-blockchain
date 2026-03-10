# Plan: Implement All 18 E2G Roadmap Tasks (Alpha → Delta)

## Context

The completed E2G review (`docs/evaluation-to-growth-review.md`) identified 18 prioritized tasks across 4 phases. This plan implements all of them. The codebase is a Turborepo monorepo (NestJS API + Next.js web + shared libs) with 1,318 tests. Existing patterns: `@nestjs/schedule` for cron, `@nestjs/throttler` for rate limiting, parameterized SQL everywhere, `HttpException` for business rule violations, Zustand stores on the web side.

---

## Phase Alpha: Security Hardening (Tasks 1–6)

### Task 1: Fix Gate 06 `collectFiles` recursive call
**File**: `scripts/validation/06-security-invariant-check.ts:59`
**Change**: Add missing `extensions` parameter to recursive call.
```
- files.push(...collectFiles(full));
+ files.push(...collectFiles(full, extensions));
```
**Test**: Existing test + manual: `npx tsx scripts/validation/06-security-invariant-check.ts` after `make build`.

---

### Task 2: Add Stripe idempotency keys
**File**: `src/api/services/escrow/stripe.service.ts`
**Change**: Add `idempotencyKey` to `paymentIntents.create`, `capture`, and `cancel`.
- `holdStake`: generate key from `contractId` → `styx_hold_${contractId}`
- `captureStake`: key from `paymentIntentId` → `styx_capture_${paymentIntentId}`
- `cancelHold`: key from `paymentIntentId` → `styx_cancel_${paymentIntentId}`
- Pass via Stripe's `requestOptions` second argument: `{ idempotencyKey }`
**Test**: Update `stripe.service.spec.ts` to verify idempotency keys are passed.

---

### Task 3: Fix linguistic cloaker word boundaries
**File**: `src/web/utils/linguistic-cloak.ts:12-20`
**Change**: Add `\b` word boundary anchors to all regex patterns:
```ts
[`\\bsta${b(107)}e\\b`, 'gi', 'vault'],
[`\\b${b(98)}e${b(116)}\\b`, 'gi', 'commitment'],
[`\\bgam${b(98)}l[ei]ng?\\b`, 'gi', 'investing'],
[`\\bwa${b(103)}er\\b`, 'gi', 'deposit'],
['\\bfury\\b', 'gi', 'peer review'],
[`\\bno.?contact\\b`, 'gi', 'personal boundary'],
[`\\brelapse\\b`, 'gi', 'setback'],
```
**Test**: Update `src/web/utils/linguistic-cloak.test.ts` — add cases for "between", "better", "mistake", "stakeholder" confirming they are NOT transformed.

---

### Task 4: Validate dateOfBirth format
**File**: `src/api/src/modules/auth/auth.service.ts:50-57`
**Change**: Before `new Date(opts.dateOfBirth)`, validate the string is a valid date:
```ts
if (opts?.dateOfBirth) {
  const dob = new Date(opts.dateOfBirth);
  if (isNaN(dob.getTime())) {
    throw new BadRequestException('Invalid date of birth format');
  }
  // ... existing age calculation
}
```
**Test**: Add case to `auth.service.spec.ts` — register with `dateOfBirth: '2020-99-99'` should throw `BadRequestException`.

---

### Task 5: Make `signToken` private
**File**: `src/api/src/modules/auth/auth.service.ts:134`
**Change**: `signToken` → `private signToken`
**Test**: Compile check (`npx turbo run lint`). No external callers exist (confirmed via grep).

---

### Task 6: Add missing ledger indexes
**File**: `src/api/database/schema.sql`
**Change**: Add after existing index definitions:
```sql
CREATE INDEX idx_entries_debit_account_id ON entries(debit_account_id);
CREATE INDEX idx_entries_credit_account_id ON entries(credit_account_id);
CREATE INDEX idx_entries_contract_id ON entries(contract_id);
CREATE INDEX idx_users_enterprise_id ON users(enterprise_id);
```
**Test**: `make test` — schema is used by init scripts, not migration runner. Tests should pass unchanged.

---

## Phase Beta: Integrity Assurance (Tasks 7–8, 10–12, 14)

### Task 7: Schedule daily `verifyChain()` + admin endpoint
**Files**:
- `src/api/src/modules/admin/admin.controller.ts` — add GET endpoint
- New file: `src/api/src/modules/admin/admin.scheduler.ts` — daily cron job

**Admin endpoint** (add to existing AdminController):
```ts
@Get('integrity/chain')
@ApiOperation({ summary: 'Verify event_log hash chain integrity' })
async verifyChain() {
  return this.truthLog.verifyChain();
}
```
The `TruthLogService` is already injected into AdminModule providers (confirmed: `admin.module.ts:19`). Need to inject it into AdminController constructor.

**Scheduler** (new file, follow `contracts.scheduler.ts` pattern):
```ts
@Injectable()
export class AdminScheduler {
  private readonly logger = new Logger(AdminScheduler.name);
  constructor(private readonly truthLog: TruthLogService) {}

  @Cron('0 3 * * *') // 3 AM daily
  async verifyHashChain(): Promise<void> {
    const result = await this.truthLog.verifyChain();
    if (!result.valid) {
      this.logger.error(`HASH CHAIN CORRUPTION: ${result.corrupted.length} corrupted entries`);
    } else {
      this.logger.log(`Hash chain verified: ${result.checked} events, all valid`);
    }
  }
}
```
- Register `AdminScheduler` in `admin.module.ts` providers
- Add `ScheduleModule.forRoot()` to admin module imports

**Test**: New `admin.scheduler.spec.ts` — mock TruthLogService, verify cron calls verifyChain and logs correctly. Also test the admin endpoint in `admin.controller.spec.ts`.

---

### Task 8: Add immutability trigger on event_log
**File**: `src/api/database/schema.sql`
**Change**: Add trigger after event_log table definition:
```sql
CREATE OR REPLACE FUNCTION prevent_event_log_mutation()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'event_log is immutable: UPDATE and DELETE are prohibited';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_event_log_immutable
  BEFORE UPDATE OR DELETE ON event_log
  FOR EACH ROW EXECUTE FUNCTION prevent_event_log_mutation();
```
**Test**: `make test` — existing tests don't update/delete event_log rows.

---

### Task 10: Fix useFuryStore token check for cookie auth
**File**: `src/web/store/useFuryStore.ts:33-40`
**Change**: Remove the `getAuthToken()` gate entirely. Cookie auth is primary; the `api.getFuryAssignments()` call sends credentials via cookies. If the user is not authenticated, the API will return 401 and the catch block handles it.
```ts
connectStream: async () => {
  get().disconnectStream();
  // Removed: token check. Cookie auth is primary — let the API call determine auth.
  const poll = async () => { ... };
  await poll();
  ...
}
```
Also remove the `getAuthToken` import if no longer needed.
**Test**: Update `src/web/store/__tests__/useFuryStore.test.ts` — remove/update the "no token" test case.

---

### Task 11: Migrate useFuryStore to SSE-with-polling-fallback
**File**: `src/web/store/useFuryStore.ts`
**Change**: Rewrite `connectStream` to match `NotificationPanel.tsx` pattern:
1. Try `api.issueFuryStreamCookie()` → open `EventSource` to `/fury/stream`
2. On `onopen`: clear poll timer
3. On `onmessage`: parse assignment, merge into state
4. On `onerror`: close source, start poll fallback, schedule reconnect (5s)
5. Move `pollTimer` and `eventSource` refs to closure variables (outside Zustand state) to avoid unnecessary re-renders
6. Remove `pollTimer` from the `FuryState` interface

**Interface changes**:
```ts
interface FuryState {
  assignments: Assignment[];
  isConnected: boolean;
  error: string | null;
  // pollTimer removed from state
  connectStream: () => Promise<void>;
  disconnectStream: () => void;
  removeAssignment: (assignmentId: string) => void;
}
```

**Closure refs** (above `create` call):
```ts
let pollTimer: ReturnType<typeof setInterval> | null = null;
let eventSource: EventSource | null = null;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
let stopped = false;
```

**Test**: Update `useFuryStore.test.ts` — mock EventSource, test SSE path and polling fallback.

---

### Task 12: Implement account lockout after N failed login attempts
**Files**:
- `src/api/database/schema.sql` — add columns to `users` table
- `src/api/src/modules/auth/auth.service.ts` — add lockout logic

**Schema change** (ALTER TABLE since it comes after CREATE TABLE):
```sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS failed_login_attempts INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS locked_until TIMESTAMPTZ;
```

**Auth service changes** (in `login` method):
1. After fetching user, check `locked_until`: if `locked_until > NOW()`, throw `UnauthorizedException('Account temporarily locked. Try again later.')`
2. On password mismatch: increment `failed_login_attempts`. If >= 5, set `locked_until = NOW() + INTERVAL '15 minutes'`
3. On successful login: reset `failed_login_attempts = 0, locked_until = NULL`
4. Keep the error message generic to prevent enumeration

**Test**: Add tests to `auth.service.spec.ts`:
- 5 failed attempts → account locked for 15 min
- Locked account rejects even correct password
- Successful login after lockout expires
- Successful login resets counter

---

### Task 14: Move poll timer out of Zustand state
**File**: `src/web/store/useFuryStore.ts`
**Note**: This is subsumed by Task 11 (SSE migration) which already moves timer refs to closure variables. No separate action needed.

---

## Phase Gamma: Financial Precision (Tasks 9, 13, 15, 16)

### Task 9: Full JWT refresh token flow
**Files**:
- `src/api/src/modules/auth/auth.service.ts` — add refresh token generation + verification
- `src/api/src/modules/auth/auth.controller.ts` — add refresh endpoint + update cookie logic
- `src/api/guards/auth.guard.ts` — extract cookie for access token (no change needed — already reads `styx_auth_token`)
- `src/api/database/schema.sql` — add `refresh_tokens` table
- `src/web/services/api-client.ts` — add `refreshToken` method
- `src/web/contexts/AuthContext.tsx` — add silent refresh on 401

**Schema** — new table:
```sql
CREATE TABLE refresh_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  revoked BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_token_hash ON refresh_tokens(token_hash);
```

**Auth service changes**:
- `TOKEN_EXPIRY` → `'15m'` (access token, down from 24h)
- New `REFRESH_TOKEN_EXPIRY_DAYS = 7`
- New `generateRefreshToken(userId)`: generate `randomBytes(32).toString('hex')`, hash with SHA-256, store hash in DB, return raw token
- New `refreshAccessToken(refreshToken)`: look up hash in DB, validate not expired/revoked, issue new access token + rotate refresh token (revoke old, issue new)
- New `revokeRefreshTokensForUser(userId)`: revoke all (used on logout, password change)

**Auth controller changes**:
- `issueBrowserSessionCookies`: set access token cookie (15min maxAge) + refresh token cookie (7d maxAge, HttpOnly, path `/auth/refresh`)
- New `@Post('refresh')` endpoint: reads refresh token from cookie, calls `refreshAccessToken`, sets new cookies
- `logout`: also call `revokeRefreshTokensForUser`
- `clearBrowserSessionCookies`: also clear `styx_refresh_token`

**Cookie details**:
```ts
// Access token — 15 min
res.cookie('styx_auth_token', accessToken, { httpOnly: true, secure, sameSite: 'lax', path: '/', maxAge: 15 * 60 * 1000 });
// Refresh token — 7 days, restricted path
res.cookie('styx_refresh_token', refreshToken, { httpOnly: true, secure, sameSite: 'lax', path: '/auth/refresh', maxAge: 7 * 24 * 60 * 60 * 1000 });
```

**Web api-client changes**:
- Add `refreshToken: () => request<{ userId: string; token: string }>('/auth/refresh', { method: 'POST' })`
- In `request()` function: if response is 401 and path is not `/auth/refresh`, attempt one refresh call. If refresh succeeds, retry original request. If refresh fails, throw.

**AuthContext changes**:
- Remove in-memory `token` state (cookie-based auth is now exclusive)
- `login`/`register`: no longer call `setAuthToken()` — cookies handle everything
- Add `refreshSession` callback that calls `api.refreshToken()` (used by api-client retry)

**Test**: Extensive new tests:
- `auth.service.spec.ts`: refresh token generation, rotation, expiry, revocation
- `auth.controller.spec.ts`: refresh endpoint, cookie issuance
- `api-client.test.ts`: 401 → auto-refresh → retry
- `AuthContext.test.tsx`: silent refresh on mount failure

---

### Task 13: Implement BMI floor and weight velocity cap in Aegis
**File**: `src/api/services/health/aegis.service.ts`
**Change**: Add a new method `validateHealthMetrics` (called by contracts controller for BIOLOGICAL oaths):
```ts
validateHealthMetrics(healthMetrics?: {
  currentWeightLbs: number;
  heightInches: number;
  targetWeightLbs: number;
}, durationDays?: number): boolean {
  if (!healthMetrics) return true; // Non-biological oaths skip

  // BMI floor check
  const bmiCurrent = (healthMetrics.currentWeightLbs / (healthMetrics.heightInches ** 2)) * 703;
  if (bmiCurrent < MIN_SAFE_BMI) {
    throw new HttpException(
      `Aegis Health Guard: Current BMI (${bmiCurrent.toFixed(1)}) is below the medical safety floor of ${MIN_SAFE_BMI}. Contract rejected.`,
      HttpStatus.NOT_ACCEPTABLE,
    );
  }

  // Weekly weight loss velocity cap
  if (durationDays && durationDays >= 7) {
    const weeks = durationDays / 7;
    const totalLoss = healthMetrics.currentWeightLbs - healthMetrics.targetWeightLbs;
    const weeklyLossRate = totalLoss / weeks / healthMetrics.currentWeightLbs;
    if (weeklyLossRate > MAX_WEEKLY_LOSS_VELOCITY_PCT) {
      throw new HttpException(
        `Aegis Velocity Guard: Projected weekly weight loss (${(weeklyLossRate * 100).toFixed(1)}%) exceeds the safe maximum of ${MAX_WEEKLY_LOSS_VELOCITY_PCT * 100}% per week.`,
        HttpStatus.NOT_ACCEPTABLE,
      );
    }
  }

  return true;
}
```
Also: wire into contracts controller — when `oathCategory` starts with `BIOLOGICAL`, call `validateHealthMetrics` with the DTO's `healthMetrics` field.

**Test**: New tests in `aegis.service.spec.ts` — BMI below 18.5 rejected, velocity above 2%/week rejected, normal values pass.

---

### Task 15: Migrate ledger amounts to integer cents
**Files** (extensive — touches the full financial pipeline):
- `src/api/services/ledger/ledger.service.ts` — amount parameter becomes integer cents
- `src/api/services/escrow/stripe.service.ts` — already converts to cents, remove `Math.round(amountDollars * 100)` patterns
- `src/api/services/billing.ts` — update pricing constants to cents
- `src/shared/libs/integrity.ts` — `AUDITOR_STAKE_AMOUNT = 200` (cents)
- `src/shared/libs/behavioral-logic.ts` — `ONBOARDING_BONUS = 500` (cents)
- `src/api/services/health/aegis.service.ts` — constants in cents: `MAX_STAKE_LIMIT = 50000`, comparisons against cents
- All contract creation / resolution paths that pass amounts
- `src/web/` display code — divide by 100 for display, format with `(cents / 100).toFixed(2)`

**Schema**: The `entries.amount` and `contracts.stake_amount` columns are already `DECIMAL(19,4)`. No schema change needed — we just stop storing fractional dollars and store integer cents instead. The application layer enforces integer input.

**Strategy**:
1. Add a `toCents(dollars: number): number` and `toDollars(cents: number): number` utility in `src/shared/libs/money.ts`
2. Update `LedgerService.recordTransaction` to validate `Number.isInteger(amount)` (amount is now in cents)
3. Update all callers to pass cents
4. Update display code to format cents → dollars
5. Update `verifyLedgerIntegrity` tolerance: `Math.abs(netBalance) < 1` (1 cent tolerance instead of 0.0001 dollars)

**Test**: Update ALL ledger/escrow/contract tests to use cent amounts. Run `make test` to verify full suite.

---

### Task 16: Add explicit algorithm to jwt.verify()
**Files**:
- `src/api/guards/auth.guard.ts:49`
- `src/api/src/modules/auth/auth.service.ts:142,167`

**Change**: Add `{ algorithms: ['HS256'] }` as third/options argument:
```ts
jwt.verify(token, secret, { algorithms: ['HS256'] }) as AuthPayload;
```
**Test**: Existing auth tests should pass. Add one test: token signed with RS256 should be rejected.

---

## Phase Delta: Compliance & Scale (Tasks 17–18 + documentation)

### Task 17: GDPR data export and right-to-erasure
**Files**:
- New: `src/api/src/modules/users/gdpr.service.ts`
- `src/api/src/modules/users/users.controller.ts` — add export endpoint
- `src/api/src/modules/users/users.service.ts` — enhance `requestDeletion`
- `src/api/src/modules/users/users.module.ts` — register GdprService
- New: `src/api/src/modules/users/gdpr.scheduler.ts` — process pending deletions

**Data export** (`GET /users/me/data-export`):
```ts
@Injectable()
export class GdprService {
  constructor(private readonly pool: Pool) {}

  async exportUserData(userId: string): Promise<Record<string, unknown>> {
    const [user, contracts, proofs, entries, notifications, attestations] = await Promise.all([
      this.pool.query('SELECT id, email, integrity_score, role, status, created_at FROM users WHERE id = $1', [userId]),
      this.pool.query('SELECT id, oath_category, verification_method, stake_amount, status, duration_days, started_at, ends_at, created_at FROM contracts WHERE user_id = $1', [userId]),
      this.pool.query('SELECT id, contract_id, status, submitted_at FROM proofs WHERE user_id = $1', [userId]),
      this.pool.query(`SELECT e.* FROM entries e JOIN accounts a ON (e.debit_account_id = a.id OR e.credit_account_id = a.id) JOIN users u ON u.account_id = a.id WHERE u.id = $1`, [userId]),
      this.pool.query('SELECT id, type, title, body, created_at FROM notifications WHERE user_id = $1', [userId]),
      this.pool.query('SELECT a.* FROM attestations a JOIN contracts c ON a.contract_id = c.id WHERE c.user_id = $1', [userId]),
    ]);
    return {
      exportedAt: new Date().toISOString(),
      user: user.rows[0] || null,
      contracts: contracts.rows,
      proofs: proofs.rows,
      ledgerEntries: entries.rows,
      notifications: notifications.rows,
      attestations: attestations.rows,
    };
  }
}
```

**Right-to-erasure** (enhance existing `requestDeletion` + new scheduler):
- Current: Sets `status = 'PENDING_DELETION'` — correct first step
- Add scheduler (`@Cron('0 4 * * *')`) that processes `PENDING_DELETION` users after 30-day cooling period:
  1. Anonymize user: set `email = 'deleted-{uuid}@anonymized.styx'`, `password_hash = NULL`
  2. Delete notifications
  3. Anonymize contracts (keep for ledger integrity but scrub PII from metadata)
  4. Do NOT delete ledger entries or event_log (financial integrity requires retention — this is a documented legal basis under GDPR Article 6(1)(c))
  5. Set `status = 'DELETED'`
  6. Append event_log entry for the deletion

**Test**: New `gdpr.service.spec.ts` — export returns correct shape, erasure anonymizes correctly, ledger entries preserved.

---

### Task 18: Extract web auth-check into Next.js middleware
**File**: New `src/web/middleware.ts` (Next.js convention — must be at web workspace root)

**Change**: Create a Next.js middleware that checks for the `styx_auth_token` cookie on protected routes and redirects to `/login` if missing:
```ts
import { NextRequest, NextResponse } from 'next/server';

const PROTECTED_PATHS = ['/dashboard', '/fury', '/wallet', '/settings', '/profile', '/admin', '/contracts', '/hr', '/tavern'];
const PUBLIC_PATHS = ['/', '/login', '/register', '/pitch'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isProtected = PROTECTED_PATHS.some(p => pathname === p || pathname.startsWith(p + '/'));
  if (!isProtected) return NextResponse.next();

  const token = request.cookies.get('styx_auth_token');
  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api).*)'],
};
```

Then **remove** the duplicated `router.push('/login')` auth checks from these pages:
- `src/web/app/wallet/page.tsx`
- `src/web/app/dashboard/page.tsx`
- `src/web/app/admin/page.tsx`
- `src/web/app/profile/page.tsx`
- `src/web/app/fury/page.tsx`
- `src/web/app/settings/page.tsx`
- `src/web/app/contracts/[id]/page.tsx`

Each page's `useEffect` auth-check block can be removed since the middleware handles it. Keep the `useAuth()` hook for accessing user data, but remove the redirect logic.

**Test**: Existing page tests may need mock cookie setup. Add `middleware.test.ts` with `NextRequest` mocks.

---

### Documentation: Aegis/tier system interaction
**File**: `docs/architecture/aegis-tier-reconciliation.md` (new)
- Document that Aegis is the final safety gate, overriding tier-based maximums
- TIER_4 "unlimited" is unlimited *subject to Aegis ceiling* ($500)
- Recovery Protocol is a separate parallel gate for RECOVERY_ oath categories

---

## Execution Order

Tasks have dependencies. Execute in this order:

1. **Task 1** (Gate 06 fix) — no dependencies, 1 line
2. **Task 3** (Cloaker word boundaries) — no dependencies
3. **Task 4** (dateOfBirth validation) — no dependencies
4. **Task 5** (signToken private) — no dependencies
5. **Task 6** (Ledger indexes) — no dependencies
6. **Task 8** (event_log immutability trigger) — no dependencies
7. **Task 16** (jwt.verify algorithms) — no dependencies
8. **Task 2** (Stripe idempotency keys) — no dependencies
9. **Task 12** (Account lockout) — schema change + auth service
10. **Task 7** (verifyChain scheduler + endpoint) — depends on 8 (trigger should exist first)
11. **Task 13** (BMI/velocity in Aegis) — no dependencies
12. **Task 10+11+14** (useFuryStore SSE rewrite) — grouped as one change
13. **Task 15** (Integer cents migration) — largest change, touch many files
14. **Task 9** (Refresh token flow) — complex, multiple files
15. **Task 17** (GDPR) — depends on 15 (should use cents), 9 (revoke tokens on deletion)
16. **Task 18** (Web middleware) — last, simplest web-side change
17. **Documentation** — Aegis/tier reconciliation doc

## Verification

After each phase:
- `make test` — all 1,318+ tests pass (will grow with new tests)
- `npx turbo run lint` — TypeScript strict mode passes
- `npx tsx scripts/validation/06-security-invariant-check.ts` — Gate 06 passes (after Task 1 fix + build)

After all phases:
- Manual smoke test: login → create contract → submit proof → fury audit → wallet check
- Verify refresh token cycle: wait 15min, confirm silent refresh
- Verify `GET /admin/integrity/chain` returns `{ valid: true }`
- Verify `GET /users/me/data-export` returns complete user data
- Verify middleware redirects unauthenticated users from `/dashboard` to `/login`
