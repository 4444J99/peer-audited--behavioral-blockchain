# Dogfood Beta Guide — Internal Founders

**Issue:** #369 | **Lane:** `lane/verify` | **Status:** Internal dogfood — founders + 5–10 trusted users

---

## Overview

This guide walks a dogfood participant through the full Styx behavioral commitment lifecycle on the **local development stack** (`http://localhost:3000` / `http://localhost:3001`). The goal is to run a real commitment contract against yourself and generate honest friction feedback before any external users see it.

> [!NOTE]
> This is the **test-money** rail (`STYX_TEST_MONEY_MODE=true`). No real money moves. Stakes are held in the internal double-entry ledger.

---

## Prerequisites

1. **Node 24+** and **Docker Desktop** installed
2. Repo cloned and `.env` set up:
   ```bash
   cp .env.example .env
   # Set GEOFENCE_FAIL_OPEN_ON_MISSING_HEADERS=true for local dev (no geo headers)
   ```
3. Stack running:
   ```bash
   make docker-up   # Postgres + Redis
   npm run dev:migrate
   make dev         # API (port 3000) + Web (port 3001)
   ```

---

## Step 1 — Register an Account

1. Open `http://localhost:3001`
2. Click **Get Started**
3. Enter email, date of birth, password, and password confirmation. The password must have at least 12 characters, an uppercase letter, a digit, and a symbol.
4. Confirm that you are at least 18 years old. There is no name field or phone/OTP step in this form.
5. Accept the terms and privacy policy, then submit registration.

**What to notice:** Is onboarding copy clear? Is the value prop obvious in 10 seconds?

---

## Step 2 — Create a No-Contact Commitment

1. Click **New Contract** on the dashboard
2. Choose oath type: **No-Contact Breakup Recovery**
3. Set parameters:
   - Duration: 30 days (recommended for dogfood)
   - Stake amount: $25 (test money)
   - Contact method ban: Text + Call + DMs
4. Review the behavioral physics summary (loss aversion multiplier, dispute window)
5. Sign the oath — confirm the cryptographic commitment

**What to notice:** Is the stake amount framing compelling? Does the loss-aversion math feel intuitive? Is any copy confusing?

---

## Step 3 — Daily Attestation

On day 1 (or any day), navigate to your active contract:

1. Click **Attest Today**
2. Answer the daily check-in questions honestly
3. Submit attestation (timestamped, SHA-256 hashed)

**What to notice:** Is the attestation flow fast (<60 seconds)? Does it feel meaningful or perfunctory?

---

## Step 4 — Submit a Proof (Mobile)

Open the mobile app in Expo Go (`expo start` from `src/mobile`):

1. Log in with the same credentials
2. Navigate to your active contract
3. Tap **Capture Proof**
4. Exercise the start/stop controls. This beta currently generates a **synthetic capture payload**; it does not record a native 10–30-second camera video.
5. Submit the generated payload and verify it is identified as `SYNTHETIC_BETA`.

**What to notice:** Are the synthetic preview, upload, and confirmation clearly labeled? Record native camera capture as **not verified**, not passed.

---

## Step 5 — Fury Review (Desktop — The Judge)

Open "The Judge" admin app:

```bash
cd src/desktop && npm run dev
```

1. Log in with an admin credential
2. Navigate to **Pending Reviews**
3. Find your submitted proof
4. Watch the Fury peer-audit assignment (2-of-3 quorum)
5. Review the audit result and any verdict details

**What to notice:** Is the admin interface clear for a non-technical practitioner? Does the verdict display make sense?

---

## Step 6 — Contract Settlement (Simulated)

There is no supported `--advance-contract` / `--to-day` command. Do not change live contract dates or claim that a harness invocation completed the lifecycle.

For deterministic **unit-test** coverage (not a live dogfood settlement), from the repository root run:

```bash
cd src/api
npx jest src/modules/payments/settlement.service.spec.ts --runInBand --coverage=false
```

For the real test-money dogfood contract, wait for its configured duration and normal settlement processing. On settlement day, inspect Wallet and the ledger inspector and record whether the stake outcome matches the contract. Until then, mark live settlement **pending**, even when unit tests pass.

---

## Feedback Capture

After your dogfood session, record your feedback using the [Beta Feedback Template](./feedback-synthesis-template.md).

**Priority questions:**
1. What was the single most confusing moment?
2. Did the stake amount feel motivating or arbitrary?
3. Would you trust Styx with a real personal commitment?
4. What is the one thing you'd change before showing this to a stranger?

---

## Escalation Path

Any bugs found during dogfood → open a GitHub issue using the **Bug Report** template, label `P0-blocker` if it blocks the demo flow.

Evidence file for triage: `docs/beta/dogfood-guide.md:1`
