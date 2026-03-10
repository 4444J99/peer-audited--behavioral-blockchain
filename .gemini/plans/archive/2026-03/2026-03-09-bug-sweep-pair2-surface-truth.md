# Plan: Bug Sweep Pair 2 - Surface Truth (2026-03-09)

Aligning web surfaces with beta reality and fixing UI inconsistencies.

## Objectives
- Remove misleading technical details (hardcoded ports).
- Soften implementation claims to match "Partial" status.
- Improve UX consistency for whistleblower/ex-bounty terminology.

## Proposed Boundary
- `src/web/app/dashboard/page.tsx`
- `src/web/app/login/page.tsx`
- `src/web/app/page.tsx`
- `src/web/app/whistleblower/[linkId]/page.tsx`

## Sub-tasks

1.  **[B3] Generalize API Error Messages**
    *   Find and replace "Ensure the API is running on port 3000" with "Ensure the backend service is reachable."
    *   Check `dashboard/page.tsx` and `login/page.tsx`.

2.  **[B6] Soften "Hardware-Verified" Claim**
    *   Update `src/web/app/page.tsx` feature grid: change "HARDWARE-VERIFIED PROGRESS" to "MOBILE-INTEGRATED PROGRESS".
    *   Update description to mention "Initial support for mobile health data" rather than "total commitment."

3.  **[B6] Unify Whistleblower/Ex-Bounty Branding**
    *   Update `src/web/app/whistleblower/[linkId]/page.tsx` header to mention "Ex-Bounty Intake."
    *   Change placeholder artifact URL to `https://shared-link.com/screenshot.jpg`.

4.  **[B3] Dashboard UX Polish**
    *   Refine the "No contracts yet" message to: "Your recovery journey starts here. Create your first contract."

## Validation Strategy
- **Visual Inspection**: Read back the files to ensure text is correct.
- **Build Verification**: Run `npm run build` in `src/web` to ensure no syntax errors.
- **Unit Tests**: Run `npm run test` in `src/web` to ensure existing tests pass.
