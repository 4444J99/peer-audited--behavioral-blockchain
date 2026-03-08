# Plan: Bake "No Contact" Recovery Stream into Styx

## Context

Partner feedback: "Do you think there is an angle to test this with a very targeted group of people with the goal of moving on from a relationship? For example, staying no contact." The founder wants this as a first-class feature, not just positioning.

This is a natural fit. Styx's loss aversion mechanics (lambda=1.955) map perfectly to breakup relapse prevention — the pain of losing $50 can override the emotional pull to text an ex. The existing research docs already anticipate this: the behavioral physics manifesto defines `SLOTH -> RECOVERY / BRAKE` as a distinct structural role (docs/research/research--behavioral-physics-manifesto.md:155), and the psychology research lists `[Sobriety & Recovery]` as a top-level onboarding category (docs/research/research--psychology-behavior.md:573).

**Key design challenge**: "No contact" is a *negative action* — proving you DIDN'T do something. All 22 existing oaths verify positive actions (gym photo, screen time data, creative time-lapse). This requires a new verification model.

---

## 1. Add RECOVERY as 7th Oath Stream

**File**: `src/shared/libs/behavioral-logic.ts`

Add to `OathCategory` enum:
```typescript
// 7. Recovery Stream (Abstinence Oracle)
NO_CONTACT_BOUNDARY = "RECOVERY_NOCONTACT",
SUBSTANCE_ABSTINENCE = "RECOVERY_SUBSTANCE",
BEHAVIORAL_DETOX = "RECOVERY_DETOX",
ENVIRONMENT_AVOIDANCE = "RECOVERY_AVOIDANCE",
```

Add to `VerificationMethod` enum:
```typescript
DAILY_ATTESTATION = "ATTESTATION",
```

Add to `OATH_METHOD_MAP`:
```typescript
RECOVERY: [VerificationMethod.DAILY_ATTESTATION, VerificationMethod.API_SCREEN_TIME, VerificationMethod.FURY_CONSENSUS],
```

Add recovery-specific constants:
```typescript
export const MAX_NOCONTACT_DURATION_DAYS = 30;
export const MAX_NOCONTACT_TARGETS = 3;
export const NOCONTACT_MISS_STRIKE_THRESHOLD = 3;
```

**Rationale for separate stream** (not under Character/SOCIAL_): Character stream uses `[FURY_CONSENSUS, GPS]` for positive social actions (civic engagement, charity, family presence). Recovery inverts this — proving absence, not presence. Mixing them would confuse the `validateOathMapping()` function which splits on `_` prefix. Also aligned with existing research docs.

---

## 2. Verification Model: Daily Attestation + Accountability Partner

**MVP approach** (no invasive permissions needed):

1. **Daily check-in**: User opens app in a configurable window (e.g., 9-11pm) and confirms "I maintained no contact today"
2. **Accountability Partner (AP) co-sign**: At contract creation, user designates a friend/therapist/sponsor. AP gets a daily notification and co-signs the attestation within 24h
3. **Streak resolution**: Miss 1 attestation = strike. Miss 3 within contract period = auto-FAIL (stake captured). Existing `strikes` column on `contracts` table handles this
4. **Grace days still apply**: Existing 2/month mechanism from `useGraceDay()` works as-is

**Why not call log monitoring**: Requires invasive permissions (READ_CALL_LOG, READ_SMS). Apple doesn't grant these at all. Financial stakes do the real enforcement; attestation is the cadence trigger.

**Phase 2 upgrade path**: Opt-in Screen Time API integration — if messaging apps show 0 minutes, auto-verify attestation. Reuses existing `API_SCREEN_TIME` infrastructure from Cognitive stream.

---

## 3. Ethical Guardrails: RecoveryProtocolService

**New file**: `src/api/services/health/recovery-protocol.service.ts` (mirrors `aegis.service.ts` pattern)

Hardcoded rules (not configurable):

| Rule | Value | Reason |
|------|-------|--------|
| Max duration | 30 days (not 365) | Forces re-evaluation; prevents indefinite isolation |
| Max no-contact targets | 3 per contract | Prevents "no contact with everyone" isolation |
| Mandatory AP | Required for all RECOVERY_NOCONTACT | Ensures someone in user's life is aware |
| AP veto power | AP can cancel contract + trigger refund | Escape hatch for coercive control |
| Emergency exemption | Hardcoded: contacts to crisis hotlines, therapists, legal counsel never count as violations | Like the BMI floor — compiled in |
| Safety acknowledgments | User confirms: voluntary, no minors, no dependents, no legal obligations | Stored as JSONB metadata on contract |

**Ethics screening update**: `src/api/services/intelligence/GeminiClient.ts` — extend `screenGoalEthics()` prompt for RECOVERY_ oaths to also screen for: coercive control, isolation from support network, stalking, preventing contact with emergency services.

**Privacy**: No-contact target stored as one-way hash only. Styx never knows who the target is. Cannot be subpoenaed for target identity — the plaintext data doesn't exist.

---

## 4. Database Changes

**File**: `src/api/database/schema.sql`

```sql
-- A. Add metadata JSONB to contracts
ALTER TABLE contracts ADD COLUMN metadata JSONB DEFAULT '{}';

-- B. Accountability partners table
CREATE TABLE accountability_partners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contract_id UUID REFERENCES contracts(id) ON DELETE CASCADE,
    partner_user_id UUID REFERENCES users(id),
    partner_email TEXT,
    status TEXT DEFAULT 'PENDING',  -- PENDING, ACTIVE, VETOED
    invited_at TIMESTAMPTZ DEFAULT NOW(),
    accepted_at TIMESTAMPTZ
);

-- C. Daily attestation tracking
CREATE TABLE attestations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contract_id UUID REFERENCES contracts(id),
    user_id UUID REFERENCES users(id),
    attestation_date DATE NOT NULL,
    attested_at TIMESTAMPTZ,
    cosigned_by UUID REFERENCES users(id),
    cosigned_at TIMESTAMPTZ,
    status TEXT DEFAULT 'PENDING',
    UNIQUE(contract_id, attestation_date)
);

-- D. Add proof_type discriminator to proofs
ALTER TABLE proofs ADD COLUMN proof_type TEXT DEFAULT 'MEDIA';
```

---

## 5. API Changes

### ContractsService (`src/api/src/modules/contracts/contracts.service.ts`)

In `createContract()`, after existing validations:
- Detect `RECOVERY_` prefix on `dto.oathCategory`
- Call `RecoveryProtocolService.validateRecoveryContract(dto)` — checks duration cap, target count, mandatory AP, acknowledgments
- Store recovery metadata in new `metadata` JSONB column
- Create `accountability_partners` row
- If RECOVERY_NOCONTACT: enforce `MAX_NOCONTACT_DURATION_DAYS` (30) override on `dto.durationDays`

### New: RecoveryProtocolService (`src/api/services/health/recovery-protocol.service.ts`)

Mirrors `AegisProtocolService` pattern — `@Injectable()` with `validateRecoveryContract()` that throws `HttpException(406)` on guardrail violations.

### New: AttestationScheduler (`src/api/src/modules/contracts/attestation.scheduler.ts`)

Mirrors `ContractsScheduler` pattern:
- `@Cron(CronExpression.EVERY_HOUR)`: Create pending attestation rows for active RECOVERY contracts where today's attestation doesn't exist yet
- `@Cron('0 0 * * *')` (midnight): Mark yesterday's PENDING attestations as MISSED, apply strikes, auto-FAIL contracts that hit 3 misses

### DTO extension (`src/api/src/modules/contracts/dto.ts`)

Add optional `RecoveryMetadataDto` with:
- `accountabilityPartnerEmail: string` (required for RECOVERY_)
- `noContactIdentifiers: string[]` (hashed client-side before sending)
- `acknowledgments: { voluntary: boolean, noMinors: boolean, ... }`

---

## 6. Web UI Changes

### Contract creation (`src/web/app/contracts/new/page.tsx`)

- Add RECOVERY stream to `OATH_CATEGORIES` array (4 new entries)
- Add `ATTESTATION` to `VERIFICATION_METHODS` array
- When RECOVERY_NOCONTACT is selected, show:
  - AP email field (required)
  - No-contact identifier field (hashed client-side, max 3)
  - Safety acknowledgment checkboxes
  - Duration capped at 30 days (hide 60/90-day options)

### New: Daily attestation screen (`src/web/app/contracts/[id]/attest/page.tsx`)

Simple screen: "Did you maintain your commitment today?" + confirm button. Shows streak count, days remaining, grace days available.

---

## 7. Pitch Deck Update

**File**: `src/pitch/src/data/slides.ts`

### Slide 6 (Market & B2B Pivot, line 258)

Update Phase 1 column:
- Change "Target: biohacker & hardcore fitness communities" to include "+ post-breakup recovery communities"
- Add stat: `{ value: '200K+', label: 'r/ExNoContact members (organic)', source: 'Reddit' }`

Add tough question:
> Q: "Isn't post-breakup a risky emotional space for financial stakes?"
> A: "It's the perfect space. These users are already experiencing acute loss aversion from the breakup. The financial stake channels that emotional energy into constructive behavior. The Recovery Protocol includes mandatory accountability partners, AP veto power, and emergency contact exemptions."

### Linguistic Cloaker (`src/web/utils/linguistic-cloak.ts`)

Add cloaking rules:
- `no.?contact` -> `personal boundary`
- `relapse` -> `setback`

---

## 8. Tests (~41 new)

| File | New tests | What they cover |
|------|-----------|-----------------|
| `behavioral-logic.spec.ts` (existing) | +8 | RECOVERY oath mapping, new constants, validateOathMapping for RECOVERY stream |
| `recovery-protocol.service.spec.ts` (new) | +12 | Duration cap, target count, mandatory AP, AP veto, emergency exemptions, acknowledgments |
| `attestation.scheduler.spec.ts` (new) | +6 | Daily creation, missed detection, strike application, auto-FAIL |
| `contracts.service.behavioral.spec.ts` (existing) | +8 | Recovery contract creation, AP requirement, metadata storage |
| `GeminiClient.spec.ts` or inline | +3 | Recovery-specific ethics screening |
| `linguistic-cloak` tests | +4 | New cloaked terms |

Estimated new total: ~466 tests (from current 425).

---

## 9. Verification

1. `make test` — all 466+ tests pass
2. `npx turbo run lint` — no TypeScript errors
3. `cd src/api && npx jest --testPathPattern="recovery|attestation"` — new tests specifically
4. `bash scripts/validation/05-behavioral-physics-check.ts` — new constants match spec
5. `bash scripts/validation/06-security-invariant-check.ts` — no hardcoded secrets
6. `cd src/pitch && npm run build` — pitch deck builds with updated slides
7. Manual: create a RECOVERY_NOCONTACT contract via Swagger (`localhost:3000/api/docs`), verify guardrails fire correctly

---

## Implementation Order

1. `src/shared/libs/behavioral-logic.ts` — enum + constants + method map
2. `src/api/database/schema.sql` — schema additions
3. `src/api/services/health/recovery-protocol.service.ts` — guardrail service (new file)
4. `src/api/src/modules/contracts/dto.ts` — DTO extension
5. `src/api/src/modules/contracts/contracts.service.ts` — recovery detection + validation
6. `src/api/src/modules/contracts/attestation.scheduler.ts` — daily cron (new file)
7. `src/api/src/modules/contracts/contracts.module.ts` — wire new providers
8. `src/api/services/intelligence/GeminiClient.ts` — ethics screening update
9. `src/web/app/contracts/new/page.tsx` — UI categories + recovery fields
10. `src/web/app/contracts/[id]/attest/page.tsx` — attestation screen (new file)
11. `src/web/utils/linguistic-cloak.ts` — new cloaking rules
12. `src/pitch/src/data/slides.ts` — beachhead positioning
13. Tests throughout
