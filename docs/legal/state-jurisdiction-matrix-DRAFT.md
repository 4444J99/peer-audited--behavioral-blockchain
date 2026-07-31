# State Jurisdiction Matrix — 50 States + DC

> **DRAFT — REQUIRES COUNSEL SIGN-OFF.**
> Generated 2026-07-30 from the code that actually enforces jurisdiction policy. This
> matrix reports what the platform **does**, not what it should do; every "OPEN
> QUESTION" is a decision only counsel can close. Statute citations are drawn from
> `docs/legal/legal--50-state-skill-contest-survey.md` (the survey) and are **not**
> encoded in the enforcement code unless the "Code-encoded hook" column says so.

## Sources of Truth (read before the table)

1. **Compile-time tier map:** `STATE_TIERS` in `src/api/services/geofencing.ts`.
   Fail-closed: unknown/non-US/unlisted → `TIER_3 HARD_BLOCK`
   (`classifyJurisdiction`).
2. **Runtime DB registry:** `jurisdictions` table seeded to match the code map
   (`src/api/database/migrations/010_settlements_and_jurisdictions.sql`), read via
   `CompliancePolicyService.getJurisdictionPolicy`
   (`src/api/src/modules/compliance/compliance-policy.service.ts`), admin-updatable
   with TruthLog audit (`src/api/src/modules/admin/admin.controller.ts`).
   **GOVERNANCE OPEN QUESTION:** the TS map and the DB registry are dual sources of
   truth; an admin DB update does not change `STATE_TIERS`, which request-time guards
   read. Reconciliation policy needed.
3. **Request-time enforcement:** `src/api/src/common/guards/geofence.guard.ts` +
   `compliance-policy.service.ts` (`evaluateRequestPolicy`, `evaluateActionPolicy`).
   Missing/unresolvable location → blocked (fail-closed default).
4. **Settlement disposition:**
   `src/api/src/modules/compliance/jurisdiction-disposition.mapper.ts` —
   TIER_1 → CAPTURE; TIER_2 → REFUND; TIER_3 → REFUND; unknown → REFUND (fail-closed).
   Kill switch forces all → REFUND.

**Geofence action legend** (from `evaluateActionPolicy`):
- **FULL_ACCESS** (TIER_1): all actions permitted.
- **REFUND_ONLY** (TIER_2): contract creation, dispute filing, and ticket purchase
  blocked (`JURISDICTION_REFUND_ONLY_RESTRICTED`); proof submission and reads allowed.
- **HARD_BLOCK** (TIER_3): all monetized actions blocked (`JURISDICTION_BLOCKED`).

**Counsel-status legend:**
- **ALIGNED** — code tier matches the survey recommendation.
- **CODE-CONSERVATIVE** — code is stricter than the survey; counsel may relax.
- **⚠ OPEN QUESTION** — code is **more permissive** than the survey recommendation, or
  a governance question exists. These rows are the sign-off blockers.

## The Matrix

| State | Code | Tier (code) | Geofence action | Failed-stake disposition | Code-encoded hook (`geofencing.ts` comment) | Primary statute (survey, not code) | Counsel status |
|---|---|---|---|---|---|---|---|
| Alabama | AL | TIER_1 | FULL_ACCESS | CAPTURE | none encoded — OPEN QUESTION | ALA. CODE § 13A-12-20; Fantasy Contests Act § 8-19E-1 | ALIGNED (survey: Low) |
| Alaska | AK | TIER_1 | FULL_ACCESS | CAPTURE | none encoded — OPEN QUESTION | ALASKA STAT. § 11.66.200; skill exclusion § 11.66.280(3) | ALIGNED (survey: Low) |
| Arizona | AZ | TIER_3 | HARD_BLOCK | REFUND | survey-aligned 2026-07-31 | ARIZ. REV. STAT. § 13-3301; DFS § 5-1201 | ✅ CODE-CONSERVATIVE — survey recommends BLOCK (any-chance history + licensing) and the code now blocks. Was TIER_2 refund-only until 2026-07-31. Counsel may relax. |
| Arkansas | AR | TIER_3 | HARD_BLOCK | REFUND | none encoded (state name only) — OPEN QUESTION | ARK. CODE ANN. § 5-66-101; skill-betting prohibition § 5-66-113 | ALIGNED (survey: Block) |
| California | CA | TIER_1 | FULL_ACCESS | CAPTURE | none encoded — OPEN QUESTION | CAL. PENAL CODE § 330 | ALIGNED (survey: Low) |
| Colorado | CO | TIER_1 | FULL_ACCESS | CAPTURE | none encoded — OPEN QUESTION | COLO. REV. STAT. § 18-10-101 | ALIGNED (survey: Medium — monitor) |
| Connecticut | CT | TIER_2 | REFUND_ONLY | REFUND | "regulated" | CONN. GEN. STAT. § 53-278a | CODE-CONSERVATIVE (survey: Medium, ALLOWED) |
| Delaware | DE | TIER_1 | FULL_ACCESS | CAPTURE | none encoded — OPEN QUESTION | DEL. CODE ANN. tit. 11, § 1401 | ALIGNED (survey: Low) |
| Florida | FL | TIER_1 | FULL_ACCESS | CAPTURE | none encoded — OPEN QUESTION | FLA. STAT. § 849.01 | ALIGNED (survey: Low) |
| Georgia | GA | TIER_1 | FULL_ACCESS | CAPTURE | none encoded — OPEN QUESTION | GA. CODE ANN. § 16-12-20 | ALIGNED (survey: Medium — monitor) |
| Hawaii | HI | TIER_3 | HARD_BLOCK | REFUND | "no gambling allowed" | HAW. REV. STAT. § 712-1220 | ALIGNED (survey: Block) |
| Idaho | ID | TIER_3 | HARD_BLOCK | REFUND | none encoded (state name only) — OPEN QUESTION | IDAHO CODE § 18-3801 | ALIGNED (survey: Block — AG opinion) |
| Illinois | IL | TIER_1 | FULL_ACCESS | CAPTURE | none encoded — OPEN QUESTION | 720 ILL. COMP. STAT. 5/28-1 | ALIGNED (survey: Low) |
| Indiana | IN | TIER_2 | REFUND_ONLY | REFUND | "regulated" | IND. CODE § 35-45-5-1 | CODE-CONSERVATIVE (survey: Low, ALLOWED) |
| Iowa | IA | TIER_2 | REFUND_ONLY | REFUND | "regulated" | IOWA CODE § 725.7 | CODE-CONSERVATIVE (survey: Medium, ALLOWED) |
| Kansas | KS | TIER_1 | FULL_ACCESS | CAPTURE | none encoded — OPEN QUESTION | KAN. STAT. ANN. § 21-6403 | ALIGNED (survey: Medium — monitor) |
| Kentucky | KY | TIER_1 | FULL_ACCESS | CAPTURE | none encoded — OPEN QUESTION | KY. REV. STAT. ANN. § 528.010 | ALIGNED (survey: Low) |
| Louisiana | LA | TIER_2 | REFUND_ONLY | REFUND | "parish-level regulation" | LA. REV. STAT. ANN. § 14:90 | CODE-CONSERVATIVE (survey: Medium, ALLOWED; parish-level geofencing flagged) |
| Maine | ME | TIER_2 | REFUND_ONLY | REFUND | "skill game licensing" | ME. REV. STAT. ANN. tit. 17-A, § 951 | CODE-CONSERVATIVE (survey: Low, ALLOWED) |
| Maryland | MD | TIER_1 | FULL_ACCESS | CAPTURE | none encoded — OPEN QUESTION | MD. CODE ANN., CRIM. LAW § 12-101 | ALIGNED (survey: Low) |
| Massachusetts | MA | TIER_1 | FULL_ACCESS | CAPTURE | none encoded — OPEN QUESTION | MASS. GEN. LAWS ch. 271, § 1 | ALIGNED (survey: Low) |
| Michigan | MI | TIER_1 | FULL_ACCESS | CAPTURE | none encoded — OPEN QUESTION | MICH. COMP. LAWS § 750.301 | ALIGNED (survey: Low) |
| Minnesota | MN | TIER_1 | FULL_ACCESS | CAPTURE | none encoded — OPEN QUESTION | MINN. STAT. § 609.75 | ALIGNED (survey: Medium — monitor) |
| Mississippi | MS | TIER_1 | FULL_ACCESS | CAPTURE | none encoded — OPEN QUESTION | MISS. CODE ANN. § 97-33-1 | ALIGNED (survey: Medium — monitor) |
| Missouri | MO | TIER_1 | FULL_ACCESS | CAPTURE | none encoded — OPEN QUESTION | MO. REV. STAT. § 572.010 | ALIGNED (survey: Low) |
| Montana | MT | TIER_3 | HARD_BLOCK | REFUND | survey-aligned 2026-07-31 | MONT. CODE ANN. § 23-5-112 | ✅ CODE-CONSERVATIVE — survey recommends BLOCK (AG guidance, no safe harbor) and the code now blocks. Was TIER_2 refund-only until 2026-07-31. Counsel may relax. |
| Nebraska | NE | TIER_1 | FULL_ACCESS | CAPTURE | none encoded — OPEN QUESTION | NEB. REV. STAT. § 28-1101 | ALIGNED (survey: Low) |
| Nevada | NV | TIER_3 | HARD_BLOCK | REFUND | survey-aligned 2026-07-31 | NEV. REV. STAT. § 463.010 et seq. | ✅ CODE-CONSERVATIVE — survey recommends BLOCK (full gaming licensure required; GCB enforces) and the code now blocks. **Was TIER_1 FULL_ACCESS + CAPTURE until 2026-07-31**, the highest-priority row in this matrix; tightened without counsel because tightening is fail-safe. Counsel may relax. |
| New Hampshire | NH | TIER_1 | FULL_ACCESS | CAPTURE | none encoded — OPEN QUESTION | N.H. REV. STAT. ANN. § 647:2 | ALIGNED (survey: Low) |
| New Jersey | NJ | TIER_1 | FULL_ACCESS | CAPTURE | none encoded — OPEN QUESTION | N.J. STAT. ANN. § 2C:37-1 | ALIGNED (survey: Low) |
| New Mexico | NM | TIER_1 | FULL_ACCESS | CAPTURE | none encoded — OPEN QUESTION | N.M. STAT. ANN. § 30-19-1 | ALIGNED (survey: Medium — monitor tribal compacts) |
| New York | NY | TIER_2 | REFUND_ONLY | REFUND | "requires bonding for large prizes" | N.Y. PENAL LAW § 225.00 | CODE-CONSERVATIVE (survey: Low, ALLOWED — statutory DFS authorization upheld) |
| North Carolina | NC | TIER_1 | FULL_ACCESS | CAPTURE | none encoded — OPEN QUESTION | N.C. GEN. STAT. § 14-292 | ALIGNED (survey: Low) |
| North Dakota | ND | TIER_1 | FULL_ACCESS | CAPTURE | none encoded — OPEN QUESTION | N.D. CENT. CODE § 12.1-28-01 | ALIGNED (survey: Low) |
| Ohio | OH | TIER_1 | FULL_ACCESS | CAPTURE | none encoded — OPEN QUESTION | OHIO REV. CODE ANN. § 2915.01 | ALIGNED (survey: Low) |
| Oklahoma | OK | TIER_1 | FULL_ACCESS | CAPTURE | none encoded — OPEN QUESTION | OKLA. STAT. tit. 21, § 941 | ALIGNED (survey: Low) |
| Oregon | OR | TIER_1 | FULL_ACCESS | CAPTURE | none encoded — OPEN QUESTION | OR. REV. STAT. § 167.117 | ⚠ OPEN QUESTION — survey: Medium with "Any Chance" history and Lottery jurisdiction assertions; confirm TIER_1 is defensible |
| Pennsylvania | PA | TIER_2 | REFUND_ONLY | REFUND | "regulated + tax" | 18 PA. CONS. STAT. § 5513 | CODE-CONSERVATIVE (survey: Low, ALLOWED) |
| Rhode Island | RI | TIER_1 | FULL_ACCESS | CAPTURE | none encoded — OPEN QUESTION | R.I. GEN. LAWS § 11-19-1 | ⚠ OPEN QUESTION — survey: Medium, "Any Chance" historical standard mitigated only by DFS safe harbor; confirm TIER_1 |
| South Carolina | SC | TIER_3 | HARD_BLOCK | REFUND | none encoded (state name only) — OPEN QUESTION | S.C. CODE ANN. § 16-19-10 | CODE-CONSERVATIVE (survey: High but ALLOWED-with-monitoring; code hard-blocks) |
| South Dakota | SD | TIER_3 | HARD_BLOCK | REFUND | survey-aligned 2026-07-31 | S.D. CODIFIED LAWS § 22-25-1 | ✅ CODE-CONSERVATIVE — survey recommends BLOCK (broadest "in part upon chance" language; AG opposition) and the code now blocks. **Was TIER_1 FULL_ACCESS + CAPTURE until 2026-07-31**, the second-highest-priority row. Counsel may relax. |
| Tennessee | TN | TIER_2 | REFUND_ONLY | REFUND | "regulated DFS" | TENN. CODE ANN. § 39-17-501; skill defense § 39-17-501(c) | CODE-CONSERVATIVE (survey: Low, ALLOWED — explicit skill/endurance defense) |
| Texas | TX | TIER_1 | FULL_ACCESS | CAPTURE | none encoded — OPEN QUESTION | TEX. PENAL CODE ANN. § 47.01; AG Op. KP-0057 | ALIGNED (survey: Low) |
| Utah | UT | TIER_3 | HARD_BLOCK | REFUND | "constitutional gambling ban" | UTAH CODE ANN. § 76-10-1101 | ALIGNED (survey: Block) |
| Vermont | VT | TIER_1 | FULL_ACCESS | CAPTURE | none encoded — OPEN QUESTION | VT. STAT. ANN. tit. 13, § 2131 | ALIGNED (survey: Low) |
| Virginia | VA | TIER_2 | REFUND_ONLY | REFUND | "regulated" | VA. CODE ANN. § 18.2-325 | CODE-CONSERVATIVE (survey: Low, ALLOWED — first DFS state) |
| Washington | WA | TIER_3 | HARD_BLOCK | REFUND | "strictest anti-online-gambling" | WASH. REV. CODE § 9.46.010; MHMDA for wearables | CODE-CONSERVATIVE (survey: High but ALLOWED-with-monitoring; code hard-blocks — note MHMDA applies to health data regardless) |
| West Virginia | WV | TIER_1 | FULL_ACCESS | CAPTURE | none encoded — OPEN QUESTION | W. VA. CODE § 61-10-1 | ALIGNED (survey: Low) |
| Wisconsin | WI | TIER_1 | FULL_ACCESS | CAPTURE | none encoded — OPEN QUESTION | WIS. STAT. § 945.01 | ALIGNED (survey: Medium — monitor) |
| Wyoming | WY | TIER_1 | FULL_ACCESS | CAPTURE | none encoded — OPEN QUESTION | WYO. STAT. ANN. § 6-7-101 | ALIGNED (survey: Low) |
| District of Columbia | DC | TIER_1 | FULL_ACCESS | CAPTURE | none encoded — OPEN QUESTION | D.C. CODE § 22-1701 | ALIGNED (survey: Low) |

## Sign-Off Blockers (rank ordered)

> **Resolved 2026-07-31 — NV, SD, AZ, MT.** These were blockers 1–3 and are now
> closed in the fail-safe direction rather than left open: all four are `TIER_3
> HARD_BLOCK` in both `STATE_TIERS` and the `jurisdictions` registry (migration
> `066_jurisdiction_survey_reconciliation.sql`). The code is no longer more
> permissive than our own survey **in these four states** — OR and RI remain open
> below. **This is not counsel sign-off** — it
> removes the exposure while the question is open. Counsel may relax any of them;
> reversing requires a new migration *and* the `STATE_TIERS` edit in the same change.

1. **OR / RI** — TIER_1 in code with any-chance history per survey. Now the only
   rows where the code may be more permissive than the survey.
2. **Dual source of truth** — `STATE_TIERS` (compile-time, used by guards) vs.
   `jurisdictions` DB (runtime, admin-editable). Define which one counsel's sign-off
   binds and add a reconciliation check (candidate: extend
   `scripts/validation/09-realm-sync-check.ts` pattern).
3. **No statutory hooks encoded for TIER_1** — the code carries rationale comments
   only for restricted states. Once counsel signs off, per-state statutory citations
   should be added to the `jurisdictions` table (`legal_basis_ref` column pattern
   already exists on `settlement_runs`).

## What Cannot Drift Silently

Fail-closed properties that hold regardless of matrix errors: unknown state → HARD_BLOCK
(`classifyJurisdiction`), unknown tier at settlement → REFUND
(`jurisdiction-disposition.mapper.ts`), missing location → blocked
(`compliance-policy.service.ts`), kill switch → all REFUND. The worst case of a wrong
row in this matrix is lost revenue in an over-blocked state or exposure in NV/SD-style
under-blocked states — the latter is exactly what counsel review must close.
