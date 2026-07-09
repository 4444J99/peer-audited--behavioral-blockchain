# Sequence B → A → C, register `${CANONICAL_DOMAIN}`, close revenue gap

**Date:** 2026-05-17 | **Version:** 4 | **Predecessor:** v3 archived at `~/.claude/plans/archive/2026-05/` (slug `spicy-bubbling-treehouse.md`). v4 is the authoritative plan and supersedes v3 in response to the user's audit challenge ("eat off the floor — no bandaids, fundamental fixes").

> **Naming note ([#601](https://github.com/a-organvm/peer-audited--behavioral-blockchain/issues/601)):** The `B / A / C` sequence labels here are **grandfathered**. Each maps to a descriptive phase, spelled out in the Phase sections below — **B** = market activation + URL standup · **A** = IRF propagation (validated) · **C** = audit-engine / technical extraction (demand-driven). Per the plan-file naming convention in [`docs/CLAUDE.md`](../CLAUDE.md#conventions), **new** plans use descriptive branch names, not generic letters.

## Context

This plan resolves the standing A/B/C decision carried forward from `.conductor/active-handoff.md`. The underlying decision (sequence is B first, then A, then C; register `${CANONICAL_DOMAIN}` in Phase 1) was reached in v2/v3 and is preserved. v4 rebuilds the encoding at the value layer — references to dynamic values go through `.env.example` and other canonical authorities, not through inline hard-coded strings.

## Authority pointers (this plan does not duplicate values)

| Value class | Authority file | Resolves to |
|---|---|---|
| Runtime identity (`CANONICAL_DOMAIN`, `PROJECT_NAME`, `MOBILE_BUNDLE_ID`, `DEEP_LINK_SCHEME`, `CONTACT_EMAIL_DOMAIN`, `RENDER_*_SERVICE_NAME`, `CANONICAL_REPO_URL`) | `${CANONICAL_REPO_PATH}/.env.example` Project Identity section [26] | Values in `.env.example`; runtime overrides in gitignored `.env` |
| IRF (work registry) | Home `~/CLAUDE.md` four-registry table | `~/Code/organvm/organvm-corpvs-testamentvm/INST-INDEX-RERUM-FACIENDARUM.md` |
| Plan-action ratio (≤3:1) | `.conductor/active-handoff.md:99` [20] + premortem [21][22] | Hard-stop |
| Phase 1 targets (5 cold messages, ≥1 reply) | Premortem checklist [21] + handoff [20] | Integer counters |
| Domain registration budget | `docs/departments/fin/artifacts/runway-tracker.md:29` [23] | `$36/year`, estimated |
| Dissertation URL (`${DISSERTATION_URL}`) | `~/Code/organvm/public-process/_config.yml` + canonical tags [19] | Jekyll-built site |
| Outreach log path | Forward-declared: `${CANONICAL_REPO_PATH}/.outreach-log` (flat append-only; format TBD until Phase 1 reveals shape) | n/a |

The plan REFERENCES these authorities. It does not duplicate their values. Where this plan uses `${VAR}` notation, the binding comes from the authority listed above.

## URL gravitational center

**The center is `https://${CANONICAL_DOMAIN}`** — currently resolves to `https://styx.app` per `.env.example` [26].

Convergent evidence:
- Named 100+ times across 11+ distinct files in `${CANONICAL_REPO_PATH}` — legal docs [1][10], outreach [3], EXPORT [2]
- `${MOBILE_BUNDLE_ID}` orbits the domain — iOS [4][5], Android [6][7]
- `${DEEP_LINK_SCHEME}://` declared on both mobile platforms — Android [8], iOS [9]
- Email convention `*@${CONTACT_EMAIL_DOMAIN}` — privacy [1], terms [10], outreach [3]
- `${RENDER_API_SERVICE_NAME}` / `${RENDER_WEB_SERVICE_NAME}` orbit the domain — render.yaml [11], docker-compose [12], ngrok [13], vercel [14], ops CONTEXT [15]

**Constitutional gap (Möbius at the URL layer):** `${CANONICAL_DOMAIN}` is named 100+ times in the repo, declared in `.env.example`, and has never been registered. The gravitational center exists in documents, not in DNS [16][17][18]. Closure: `$36/year` per `runway-tracker.md:29` [23] + one-page minimal landing.

**Currently-live URLs (the smeared center):**

| URL | Status | Role |
|---|---|---|
| `${DISSERTATION_URL}` | Live; per-chapter `<link rel="canonical">` [19] | Documentation node — not product hub |
| `${CANONICAL_REPO_URL}` | Live [24] | OSS canonical repo — for developers, not buyers |
| `https://${CANONICAL_DOMAIN}` | **Not registered** | What the repo writes toward [2][16] |

## Ideal logical order: B → A → C

Alphabetical labels inherited from prior handoffs are NOT priority-ordered. Logic dictates:

**B first.** The prior handoff's hardest constraint — *"If plan-to-action ratio exceeds 3:1, send an email instead of writing another plan"* [20][21][22] — is a logic gate, not a preference. B is the only path that starts external. A and C both add internal artifact before external contact, re-entering the diagnosed Möbius [17][20].

**A second.** IRF propagation is bookkeeping. Done before B → codifies pre-validation assumptions. Done after B → records validated demand. Same activity at different positions has opposite information value.

**C third.** Technical extraction of `${CANONICAL_REPO_PATH}/packages/audit-engine/` is build-ahead-of-demand [20][21]. C resolves only after B reveals a buyer who needs the package.

## Phase-by-phase

### Phase 1 — B (market activation + URL standup)
- **Trigger:** User acts (not "approves in text"). The two-track action below IS the approval.
- **First action (two-track, both required):**
  1. User names ≥1 real person/company who needs peer-audited verification.
  2. User authorizes registering `${CANONICAL_DOMAIN}` (~`$36/year` per [23]) and shipping a one-page minimal landing (links to `${CANONICAL_REPO_URL}` + `${DISSERTATION_URL}`; nothing else).
- **Gate to advance:** 5 cold messages sent + ≥1 substantive reply [20][21]. Names + responses logged to `${CANONICAL_REPO_PATH}/.outreach-log` (flat append-only; no schema until format is genuinely needed).

### Phase 2 — A (IRF propagation, validated)
- **Trigger:** Phase 1 gate met.
- **First action:** Append entries to `~/Code/organvm/organvm-corpvs-testamentvm/INST-INDEX-RERUM-FACIENDARUM.md` reflecting Phase 1 ground truth — named buyers, stated needs, `${CANONICAL_DOMAIN}` registration, validated demand evidence. Also append the three IRF candidates surfaced by v4 itself (see Propagation gap section).
- **Gate to advance:** IRF reflects B's results.

### Phase 3 — C (technical extraction, demand-driven)
- **Trigger:** Phase 2 gate met **AND** ≥1 named buyer has explicitly asked for the extracted package.
- **First action:** Create `${CANONICAL_REPO_PATH}/packages/audit-engine/` skeleton.
- **Gate:** Buyer reviews and approves the package contract before any npm publish.

## Propagation gap (3 IRF candidates surfaced by v4)

`.env.example` declares the AUTHORITY but doesn't yet ENFORCE propagation. Brand strings still live independently across the file tree. Each is an IRF candidate:

1. **Build-time brand propagation.** Templating from `.env` → mobile (`Info.plist`, `build.gradle`, `AndroidManifest.xml`, `project.pbxproj`), deploy (`render.yaml`, `docker-compose.yml`, `ngrok_app.yml`, `vercel/project.json`), identity (`package.json`, `README.md`), legal docs, outreach copy. Implementation candidates: pre-commit hook diffing `.env.example` against propagation targets (warning), or a generator script that materializes platform-specific files from `.env`.
2. **README badge / git remote drift.** `README.md:5` cites `organvm-iii-ergon/` namespace; git remote is `a-organvm/` [24][25]. Surfaced 2026-05-17 by the multi-citation requirement itself — the very act of looking for a second source revealed the divergence. The git remote is authoritative.
3. **AB/C label deprecation.** "A/B/C" propagates through `.conductor/active-handoff.md`, prior session memories, this plan, future handoffs. Replace with descriptive names ("market activation", "IRF propagation", "audit-engine extraction") in the next IRF revision.

**Until these land, this plan's authority declaration is documentation, not enforcement.** Naming the gaps explicitly IS the strict-branding compliance — claiming `.env.example` is the source of truth without acknowledging the propagation gap would be bandaid territory.

## What this plan deliberately omits

- Cold message templates (no template until ≥1 real name)
- Response tracking schema (no schema until ≥1 real response)
- IRF row drafts (no draft until B reveals what)
- `package.json` / `tsconfig.json` scaffolds for `audit-engine/`
- Codex/Gemini dispatch envelopes, voice-scorer pipelines, file-location decisions for outreach scaffolding
- Build-time templating implementation (forward-declared as IRF candidate #1)

Deliberate. Pre-building re-enters the loop.

## Self-audit (forced)

Every artifact-producing agent including Claude is a smoothing agent. This plan is itself an internal artifact — the recursive risk is real. The bulwarks:

1. **Phase 1's trigger is external.** Plan approval ≠ approved-in-text; it is the user's two-track act (name + domain authorization). Without those, this plan does not advance the system; it accretes.
2. **Phase gates are external integer counters,** not internal milestones. 5 messages sent. ≥1 reply. Either the count is reached or it is not.
3. **The plan is committed under `${CANONICAL_REPO_PATH}/docs/planning/`,** not in a session-scoped home directory. The act of committing makes this plan answerable to future sessions, git review, and the same SHA gates as the code it governs.
4. **v3 is archived, not deleted.** The history is preserved for future audit.

## Verification

- **Plan-level:** succeeds iff next user message provides ≥1 real name AND/OR authorizes `${CANONICAL_DOMAIN}` registration. Fails iff this file or its successors accrete Phase 2/3 scaffolding before Phase 1 actions are in flight.
- **Compliance:** every empirical assertion below carries ≥2 citations (or routes to an authority that does). v3's single-source flags are closed: `RENDER_*_SERVICE_NAME` now multi-sourced [11][12][13][14][15]; `DOMAIN_REGISTRATION_BUDGET` removed from plan-coordination layer and sourced from `runway-tracker.md:29` [23] directly.
- **Phase gates:** each phase's gate is its own verification — no separate test suite.

## Risks

- **Möbius reassertion at the URL layer.** Registering `${CANONICAL_DOMAIN}` but populating with internal artifact (strategy docs, dissertations) [16][17] leaves the center smeared. Landing must be minimal and outbound-pointing.
- **Sequence drift.** Three phases tempts three-phases-of-scaffolding [20][21]. The hard-stop applies to THIS plan, not just to the system in general.
- **`${PROJECT_NAME}`-vocabulary leak.** External-facing artifacts (landing, cold messages) must pass the "explain without `${PROJECT_NAME}` vocabulary" test [20]. (Separate from the ORGANVM-vocabulary leak: technical/internal terminology must not appear in buyer-facing copy.)
- **A-before-B regression.** Under pressure, "just clean up IRF first" will reassert [20]. Phase 2's trigger — *Phase 1 gate met* — is the bulwark. Not optional.
- **Propagation gap reassertion.** If build-time templating (IRF candidate #1) isn't implemented soon, future edits to brand values will continue to drift independently. The README badge / git remote divergence [24][25] is the canary case.

## Citations

[1] `docs/legal/privacy-policy.md` — `privacy@${CONTACT_EMAIL_DOMAIN}`
[2] `docs/EXPORT-ALL-REPORTS-AND-TRANSCRIPTS-2026-05-17.md:5` — "Acquire `${CANONICAL_DOMAIN}` domain | P1 | Operations | Pre-beta"
[3] `docs/departments/b2b/artifacts/outreach-sequences.md` — `partners@${CONTACT_EMAIL_DOMAIN}`
[4] `src/mobile/ios/Styx/Info.plist:31` — `<string>${MOBILE_BUNDLE_ID}</string>`
[5] `src/mobile/ios/Styx.xcodeproj/project.pbxproj` — `PRODUCT_BUNDLE_IDENTIFIER = "${MOBILE_BUNDLE_ID}";`
[6] `src/mobile/android/app/build.gradle:92` — `applicationId '${MOBILE_BUNDLE_ID}'`
[7] `src/mobile/android/app/build.gradle:90` — `namespace '${MOBILE_BUNDLE_ID}'`
[8] `src/mobile/android/app/src/main/AndroidManifest.xml:27` — `<data android:scheme="${DEEP_LINK_SCHEME}"/>`
[9] `src/mobile/ios/Styx/Info.plist:30` — `<string>${DEEP_LINK_SCHEME}</string>` in CFBundleURLSchemes
[10] `docs/legal/terms-of-service.md` — `legal@${CONTACT_EMAIL_DOMAIN}`
[11] `render.yaml:{7,30,58,69}` — `name: ${RENDER_API_SERVICE_NAME}` / `name: ${RENDER_WEB_SERVICE_NAME}`
[12] `.config/docker/docker-compose.yml:{5,57}` — service names
[13] `.config/ngrok/ngrok_app.yml:{4,8}` — `${RENDER_API_SERVICE_NAME}-tunnel`, `${RENDER_WEB_SERVICE_NAME}-tunnel`
[14] `.config/vercel/.vercel/project.json:4` — `"projectName": "${RENDER_WEB_SERVICE_NAME}"`
[15] `.claude/agents/ops/CONTEXT.md:8` — operations doc references both render service names
[16] `.conductor/active-handoff.md:29` — "Core diagnosis: Möbius strip of self-validation (internal certification substitutes for external payment)"
[17] `docs/research/expansive-inquiry--styx-revenue-gap/06-synthesis.md:59` — "Certification Displacement: substitution of internal certification for external validation"
[18] `docs/planning/premortem-report-20260517-144746.md:{31,64}` — plan-action ratio hard-stop restatements
[19] `~/Code/organvm/public-process/_site/dissertations/styx-behavioral-market/00-preliminary-pages/index.html` — `<link rel="canonical" href="${DISSERTATION_URL}00-preliminary-pages/">`; corroborated by `_config.yml` `url:` and collection `permalink: /dissertations/:path/`
[20] `.conductor/active-handoff.md:99` — "If plan-to-action ratio exceeds 3:1, send an email instead of writing another plan."
[21] `docs/planning/premortem-report-20260517-144746.md:31` — "If ratio exceeds 3:1, do not start a new plan. Send an email instead."
[22] `docs/planning/premortem-report-20260517-144746.md:64` — "Plan-to-action ratio exceeds 3:1 in any 7-day window."
[23] `docs/departments/fin/artifacts/runway-tracker.md:29` — `| | Domain (styx.app or similar) | $3.00 | $36.00 | Estimated, varies by registrar |`
[24] `git remote -v` (executed 2026-05-17 in working tree of `${CANONICAL_REPO_PATH}`) — `origin git@github.com:a-organvm/peer-audited--behavioral-blockchain.git`
[25] `README.md:5` — CI badge URL (cites `organvm-iii-ergon/` namespace; stale relative to [24] — divergence flagged as IRF candidate #2)
[26] `${CANONICAL_REPO_PATH}/.env.example` Project Identity section (committed by this change) — declares the authority for all runtime-identity vars listed in the Authority pointers table
