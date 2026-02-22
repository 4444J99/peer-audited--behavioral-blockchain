# Styx End-to-End Testing (Ironclad)

## 1. Module Definition
This directory contains the **Critical User Journey (CUJ)** tests. These tests treat the system as a black box.

## 2. Test Frameworks
- **Web**: Playwright.
- **Mobile**: Maestro (yaml-based flows).
- **API**: Supertest.

## 3. The "Golden Path" Suite
1.  **User Onboarding**: Register -> Stripe FBO Deposit -> Contract Sign.
2.  **The Truth Pipeline**: Upload Valid Photo -> Anomaly Check Pass -> Fury Router Assign -> Consensus -> Contract Update.
3.  **The Fraud Attempt**: Upload Duplicate Photo -> Anomaly Check Fail -> User Penalized.

## 4. Execution
- `npm run test:e2e:local`: Runs against local dockerized stack.
- `npm run test:e2e:staging`: Runs against Staging environment (Post-Deploy).

## 5. Failure Protocol
- If E2E fails in CI, **BLOCK DEPLOYMENT**. No exceptions.
