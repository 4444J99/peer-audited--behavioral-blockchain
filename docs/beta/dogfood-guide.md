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
2. From the cloned repository, install the locked dependencies and launch the isolated, test-money demo:
   ```bash
   npm ci
   npm run demo:launch
   npm run demo:credentials
   ```
   This single launcher runs the migrations, base seed and `seed-circles.sql`, and provisions local synthetic credentials. Use the API/Web URLs printed by the launcher. Do **not** run `make dev` or another Compose application stack alongside it. An already-running demo is checked rather than treated as proof that seeding succeeded.
3. Keep the local credentials private. For the review step, use `alecto@demo.styx.protocol` (role `FURY`); use `dr.moira@demo.styx.protocol` for the separate practitioner view. Both passwords come from `npm run demo:credentials`, not this document. No real participants or real money belong in this seeded environment.

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
3. Choose the verification method and a duration of at most 30 days. Enter a test-money stake within the limit shown for the account's current integrity tier.
4. Enter the required **accountability-partner email** using a synthetic consenting demo participant.
5. For No-Contact, the implemented optional input is a comma-separated list of **hashed no-contact identifiers**. There is no Text/Call/DM multi-select; do not paste private contact data into the form.
6. Confirm all four required safety acknowledgments: voluntary participation, no minors, no dependents, and no legal obligations requiring contact.
7. Review and submit the form. Confirm that the request succeeds and the dashboard shows the contract; do not describe a separate cryptographic signing UI that this form does not expose.

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

## Step 5 — Fury Review (Web — Fury Workbench)

Use the web app already started by `npm run demo:launch`; do not start another `make dev` process.

1. Retrieve the local password with `npm run demo:credentials`, sign out of the participant account, and sign in as `alecto@demo.styx.protocol` (role `FURY`).
2. Open `/fury`; this is the implemented Fury Workbench backed by `GET /fury/queue`.
3. Inspect the assignment's proof ID, masked media, contract, description, and assigned timestamp.
4. Submit a test verdict only when the dogfood account is authorized to alter that assignment.
5. If the submitted proof is absent, mark assignment propagation **not verified**. The Judge desktop currently exposes aggregate oversight, not a proof-level review queue.

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
