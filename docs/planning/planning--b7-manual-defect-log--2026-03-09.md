# B7 Manual Defect Log (2026-03-09)

This is the manual exploratory bug-sweep artifact for `B7`.

It records what was actually exercised locally, what failed, what passed, and what still could not be validated because the backend could not boot.

## Scope Exercised

- local web app via `npm run dev` in `src/web`
- local API boot via `npm start` in `src/api`
- manual browser checks on:
  - `/`
  - `/login`
  - `/register`
  - `/dashboard`
  - `/legal/responsible-use`
- browser evidence:
  - `output/playwright/b7-console.log`
  - `output/playwright/b7-register-network-error.png`

## Defects

| ID | Severity | Area | Finding | Reproduction | Release Impact | Evidence |
|---|---|---|---|---|---|---|
| `B7-01` | `High` | API bootstrap | API cannot start because `ComplianceModule` does not provide `TruthLogService` for `MedicalExemptionService`. | `cd src/api && npm start` | Blocks meaningful end-to-end auth, contract, and readiness validation against a local backend. | [compliance.module.ts](/Users/4jp/Workspace/organvm-iii-ergon/peer-audited--behavioral-blockchain/src/api/src/modules/compliance/compliance.module.ts#L16), [medical-exemption.service.ts](/Users/4jp/Workspace/organvm-iii-ergon/peer-audited--behavioral-blockchain/src/api/src/modules/compliance/medical-exemption.service.ts#L17) |
| `B7-02` | `Medium` | Web auth UX | Login failure state surfaces raw transport error text instead of a product-safe degraded-state message. | Open `/login`, enter credentials, click `SIGN IN` while API is unavailable. | Poor tester UX and avoidable reviewer confusion if a backend dependency is down during review. | [login/page.tsx](/Users/4jp/Workspace/organvm-iii-ergon/peer-audited--behavioral-blockchain/src/web/app/login/page.tsx#L17), [b7-console.log](/Users/4jp/Workspace/organvm-iii-ergon/peer-audited--behavioral-blockchain/output/playwright/b7-console.log) |
| `B7-03` | `Medium` | Web auth UX | Register failure state also surfaces raw transport error text after a valid submission. | Open `/register`, fill a valid form, click `CREATE ACCOUNT` while API is unavailable. | Same degraded-state problem as login; new-user entry path does not fail gracefully. | [register/page.tsx](/Users/4jp/Workspace/organvm-iii-ergon/peer-audited--behavioral-blockchain/src/web/app/register/page.tsx#L20), [b7-register-network-error.png](/Users/4jp/Workspace/organvm-iii-ergon/peer-audited--behavioral-blockchain/output/playwright/b7-register-network-error.png) |
| `B7-04` | `Medium` | Web auth bootstrap | Public/auth/legal routes unconditionally call `/users/me` on mount, producing noisy `ERR_CONNECTION_REFUSED` console errors when the API is offline. | Open `/`, `/login`, `/register`, or `/legal/responsible-use` with API unavailable and inspect console. | Increases noise, obscures real failures, and makes public pages look broken when the backend is down. | [AuthContext.tsx](/Users/4jp/Workspace/organvm-iii-ergon/peer-audited--behavioral-blockchain/src/web/contexts/AuthContext.tsx#L43), [api-client.ts](/Users/4jp/Workspace/organvm-iii-ergon/peer-audited--behavioral-blockchain/src/web/services/api-client.ts#L288), [b7-console.log](/Users/4jp/Workspace/organvm-iii-ergon/peer-audited--behavioral-blockchain/output/playwright/b7-console.log) |
| `B7-05` | `Medium` | Web marketing / scope lock | Homepage copy still markets stake, `Ex-Bounty`, and escrow language that exceeds the narrow Phase 1 beta framing. | Open `/` and compare live copy to the Phase 1 scope lock. | Residual claim drift on a public surface; can misframe the current beta to testers and reviewers. | [page.tsx](/Users/4jp/Workspace/organvm-iii-ergon/peer-audited--behavioral-blockchain/src/web/app/page.tsx#L17), [planning--phase1-private-beta-scope.md](/Users/4jp/Workspace/organvm-iii-ergon/peer-audited--behavioral-blockchain/docs/planning/planning--phase1-private-beta-scope.md#L5) |
| `B7-06` | `Low` | Web asset hygiene | Homepage requests a missing favicon and returns `404`. | Open `/` and inspect console/network. | Cosmetic only, but unnecessary noise during review. | [b7-console.log](/Users/4jp/Workspace/organvm-iii-ergon/peer-audited--behavioral-blockchain/output/playwright/b7-console.log) |
| `B7-07` | `Low` | Form polish | Register form password inputs emit missing `autocomplete` warnings. | Open `/register` and inspect console. | Non-blocking, but avoidable browser warning on the first-user path. | [register/page.tsx](/Users/4jp/Workspace/organvm-iii-ergon/peer-audited--behavioral-blockchain/src/web/app/register/page.tsx#L92), [b7-console.log](/Users/4jp/Workspace/organvm-iii-ergon/peer-audited--behavioral-blockchain/output/playwright/b7-console.log) |

## Passes

- `/dashboard` redirected to `/login` when unauthenticated.
- `/legal/responsible-use` rendered successfully.
- `/register` correctly blocked mismatched passwords before submission.

## Coverage Gaps

These B7 checks could not be completed from local repo state:

- mobile device resume / background behavior
- TestFlight install / update behavior
- real authenticated end-to-end contract creation against a running backend
- moderation/reporting path inside a live session
- wallet / profile flows behind auth

Reason:

- local API bootstrap is currently broken by `B7-01`
- no TestFlight/device session exists in this environment

## Release Read

Current release impact from B7 alone:

- `B7-01` is a real release hold for local/manual backend-backed QA.
- `B7-02` through `B7-04` should be fixed before release if the web companion is expected to be usable in degraded conditions or shown to reviewers.
- `B7-05` should be reconciled with the final `B6` scope-lock decision before any public-facing web traffic is intentionally sent to the homepage.

## Recommended Order

1. Fix `B7-01` so local API-backed manual QA is possible again.
2. Replace raw auth transport errors with product-safe offline/degraded messages.
3. Gate or soften the eager `/users/me` bootstrap on public pages.
4. Resolve the remaining homepage claim drift against the Phase 1 beta scope.
5. Re-run B7 with a working backend and a real authenticated session.

## Remediation Follow-Up (2026-03-10)

Resolved in the working tree:

- `B7-01` bootstrap dependency wiring: the API now clears the original `MedicalExemptionService` and `WalletController` DI failures and reaches full route mapping before hitting external Redis connectivity.
- `B7-02` and `B7-03`: auth forms now translate transport failures into `Styx service is temporarily unavailable. Please try again shortly.` instead of raw fetch text.
- `B7-04`: public/auth/legal routes no longer eagerly hydrate `/users/me`, which removed the previous background console noise on those pages.
- `B7-05`: homepage copy now matches the narrower Phase 1 beta framing.
- `B7-06`: `src/web/app/icon.svg` now exists, so the favicon `404` is removed.
- `B7-07`: password fields now include `autocomplete` attributes, and the prior browser warnings are gone.

Remaining follow-up after remediation:

- local API startup still needs either live Redis on `localhost:6379` or a safe local-disable path for Redis-backed consumers to avoid repeated `ECONNREFUSED` noise during manual QA
- authenticated B7 flows still need to be re-run against a live backend session
- TestFlight/device-specific checks are still pending outside this local repo environment
