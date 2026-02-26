# Styx Web Client (The Portal) - Ironclad Directive

## 1. Module Definition
This is the **Primary Consumer Interface** (Next.js) and the **Fury Workbench**. It allows users to stake, track, and appeal, while allowing Furies to audit and judge.

## 2. Core Mandates
1.  **Server-Side Rendering (SSR)**: Use Next.js App Router for SEO and performance.
2.  **No Logic in UI**: Components must be dumb. All "Business Logic" (e.g., Integrity Score calc) belongs in `src/shared` or the API.
3.  **Linguistic Middleware**: If `userAgent` implies iOS Wrapper, hide "Betting" terms. (Though Web is the primary "Uncensored" zone).

## 3. Key Components
- `components/PitchDeck/`: The interactive investor presentation.
- `components/FuryWorkbench/`: The Split-Screen "Minority Report" UI for auditing.
- `components/Vault/`: The Visualization of Staked Funds (The "Golden Handcuffs").

## 4. State Management
- **Global**: `zustand` or `React Context` for User Session.
- **Server State**: `tanstack-query` (React Query) for API data.

## 5. Security
- **Auth (Current)**: Browser sessions use HttpOnly `styx_auth_token` cookies; bearer JWT remains supported for non-browser clients and compatibility flows.
- **CSRF (Current)**: Mutating browser requests send `x-csrf-token` and are validated against `styx_csrf_token` (double-submit cookie pattern).

## 6. Testing
- **E2E**: Playwright. Flow: Login -> Stake -> Upload Proof -> Logout.
- **Unit**: React Testing Library for components.
