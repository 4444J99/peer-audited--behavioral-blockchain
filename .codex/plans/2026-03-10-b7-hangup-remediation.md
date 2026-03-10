# B7 Hang-Up Remediation Note (2026-03-10)

Goal:

- close the code-side B7 follow-up defects after the manual sweep

Work completed:

- fixed backend DI/module wiring so bootstrap no longer dies in `ComplianceModule` or `WalletModule`
- aligned `PaymentsModule` with both Stripe service implementations actually used in the repo
- changed web transport failures to product-safe unavailable messaging
- stopped eager session bootstrap on public/auth/legal routes
- aligned homepage copy to the Phase 1 beta scope lock
- added a real app icon and form autocomplete attributes

Verification completed:

- `src/web`: targeted Jest slice passed (`52` tests)
- `src/web`: `npm run build` passed
- `src/api`: targeted compliance Jest slice passed (`8` tests)
- `src/api`: `npm start` now clears the original DI blockers and reaches route mapping before external Redis connection failures

Remaining:

- provide local Redis or disable Redis-backed local startup dependencies for cleaner manual QA
- rerun B7 against a live authenticated backend session
