---
generated: true
department: PRD
artifact_id: P3
governing_sop: "SOP--ux-review.md"
phase: hardening
product: styx
date: "2026-03-08"
---

# UX Audit

A structured UX audit template for evaluating Styx's user experience across all critical flows. This document provides the framework, heuristics, and checklists. Findings should be recorded inline during the audit and tracked as issues.

## 1. Scope

This audit covers the following surfaces:

| Surface | Platform | Status |
|---------|----------|--------|
| Onboarding flow | Web (Next.js 16) | Built |
| Contract creation | Web + Mobile | Built |
| Proof submission | Mobile (Expo) + Web | Built (camera placeholder on mobile) |
| Fury audit workbench | Web | Built |
| Wallet/escrow visibility | Web + Mobile | Built |
| Dashboard | Web | Built |
| Recovery contract UX | Web + Mobile | Built |
| B2B practitioner dashboard | Web | Partial |
| Desktop app | Tauri | Stub |

## 2. Onboarding Flow

### 2.1 Current Flow

1. Landing page with value proposition
2. "Start Your Oath" CTA
3. Email/password registration (or OAuth)
4. Oath category selection (7 categories displayed)
5. First contract creation wizard
6. Stripe payment for stake deposit
7. Dashboard landing

### 2.2 Audit Questions

- [ ] Is the value proposition clear within 5 seconds of landing?
- [ ] Does the CTA use approved vocabulary ("Oath" not "bet", "Vault" not "stake")?
- [ ] Is the 7-category selection overwhelming? Should Recovery be highlighted as a wedge?
- [ ] Does the registration flow collect only necessary information (email, password, name)?
- [ ] Is there a "learn more" path for users not ready to commit financially?
- [ ] Is the Stripe payment step trustworthy? Does it show FBO escrow explanation?
- [ ] How long does onboarding take? Target: < 3 minutes to first contract.
- [ ] Is the $5 onboarding bonus surfaced clearly as an incentive?

### 2.3 Findings

| Finding | Severity | Heuristic | Recommendation |
|---------|----------|-----------|----------------|
| _To be filled during audit_ | | | |

## 3. Contract Creation

### 3.1 Current Flow

1. Select oath category
2. Define habit and verification criteria
3. Set duration (7-90 days) and frequency (daily/weekly)
4. Set stake amount (limited by integrity tier)
5. Aegis validation (biological oaths only)
6. Review and confirm
7. Stripe payment
8. Contract active

### 3.2 Audit Questions

- [ ] Is the oath category selection intuitive? Are descriptions sufficient?
- [ ] Can users understand verification criteria before committing money?
- [ ] Is the stake amount slider clear about limits (integrity tier)?
- [ ] Is Aegis validation explained when it blocks a biological oath (BMI floor, velocity cap)?
- [ ] Does the review screen show all parameters clearly before payment?
- [ ] Is the grace day allowance (2/month) explained during creation?
- [ ] For recovery contracts: is the no-contact target entry sensitive and clear?
- [ ] For recovery contracts: are the guardrails (max 30 days, max 3 targets) explained?
- [ ] Can users easily modify parameters before confirming, or must they restart?

### 3.3 Findings

| Finding | Severity | Heuristic | Recommendation |
|---------|----------|-----------|----------------|
| _To be filled during audit_ | | | |

## 4. Proof Submission

### 4.1 Current Flow

1. Notification: "Verification window open"
2. Open proof submission screen
3. Capture/upload photo or screenshot
4. Add optional note
5. Submit
6. Confirmation: "Proof submitted, Fury review pending"

### 4.2 Audit Questions

- [ ] Is the notification timely and clear about the verification window deadline?
- [ ] Is the camera integration functional on mobile? (Currently placeholder on Expo)
- [ ] Can users upload from camera roll, or must they take a live photo?
- [ ] Is EXIF metadata extraction explained to the user (privacy implications)?
- [ ] Is the "what counts as valid proof" guidance visible during submission?
- [ ] How does the flow handle poor connectivity (queued upload, retry)?
- [ ] Is there confirmation that the proof was received (not just submitted)?
- [ ] For recovery contracts: is call log screenshot guidance clear?

### 4.3 Mobile-Specific Considerations

- [ ] Camera permission request is explained with context (not a bare system dialog)
- [ ] Photo compression is appropriate (quality vs. upload speed)
- [ ] Offline proof capture with sync-on-reconnect
- [ ] EXIF stripping options for privacy-conscious users (if stripping is offered, document that Furies may reject unverifiable proofs)

### 4.4 Findings

| Finding | Severity | Heuristic | Recommendation |
|---------|----------|-----------|----------------|
| _To be filled during audit_ | | | |

## 5. Fury Audit Workbench

### 5.1 Current Flow

1. Fury logs in and sees audit queue
2. Select an audit assignment
3. View proof (photo + metadata panel)
4. Cast vote (PASS / FAIL / NEEDS_MORE_INFO)
5. See quorum result when all 5 votes are in
6. Bounty credited to Fury wallet

### 5.2 Audit Questions

- [ ] Is the audit queue sorted by deadline (most urgent first)?
- [ ] Is proof metadata (timestamp, GPS, EXIF) presented clearly alongside the photo?
- [ ] Are voting options clearly labeled with consequences?
- [ ] Is the NEEDS_MORE_INFO option discoverable and does it pause the quorum timer?
- [ ] Can Furies zoom/enhance proof photos?
- [ ] Is the conflict-of-interest detection visible (does the Fury know why they were or weren't assigned)?
- [ ] Is the bounty amount visible before casting a vote (or only after quorum)?
- [ ] Can Furies review their historical accuracy and reputation score?
- [ ] Is the $2 auditor stake explained in context of each assignment?

### 5.3 Findings

| Finding | Severity | Heuristic | Recommendation |
|---------|----------|-----------|----------------|
| _To be filled during audit_ | | | |

## 6. Wallet and Escrow Visibility

### 6.1 Audit Questions

- [ ] Can users see their current vault balance (money at risk) at all times?
- [ ] Is the distinction between "platform balance" and "escrow (FBO)" clear?
- [ ] Is the ledger history accessible and understandable to non-financial users?
- [ ] Are pending settlements (contracts awaiting final verification) visible?
- [ ] Is the $5 onboarding bonus shown in the wallet?
- [ ] Can users initiate withdrawal of available (non-escrowed) balance?
- [ ] Is the Stripe payment history accessible from within Styx?

### 6.2 Findings

| Finding | Severity | Heuristic | Recommendation |
|---------|----------|-----------|----------------|
| _To be filled during audit_ | | | |

## 7. Dashboard

### 7.1 Audit Questions

- [ ] Does the dashboard surface the most important information first (active contracts, pending proofs, integrity score)?
- [ ] Is the integrity score explanation accessible (how it is calculated, what it means)?
- [ ] Are contract status transitions (active, pending verification, completed, failed) clearly communicated?
- [ ] Is progress visualization motivating without being gamified (Styx is not Habitica)?
- [ ] Are notifications/alerts actionable (links to the relevant action)?
- [ ] Does the dashboard load within 2 seconds?

### 7.2 Findings

| Finding | Severity | Heuristic | Recommendation |
|---------|----------|-----------|----------------|
| _To be filled during audit_ | | | |

## 8. Recovery Contract UX

### 8.1 Special Considerations

Recovery contracts deal with emotionally sensitive situations (breakups, addiction recovery). The UX must be:

- [ ] **Empathetic in tone.** No judgmental language. No "you failed" -- instead "contract not completed."
- [ ] **Clear about guardrails.** Max 30 days, max 3 targets, mandatory cooldown between contracts.
- [ ] **Privacy-first.** No-contact target names are never shown to Fury auditors. Auditors see only anonymized identifiers.
- [ ] **Non-triggering.** Proof submission (call log screenshots) does not display the ex's messages or call content -- only call/text metadata.
- [ ] **Exit-friendly.** Users can cancel a recovery contract at any time (with stake forfeit). No guilt mechanics on cancellation.
- [ ] **Cooldown explanation.** When a user tries to create a new recovery contract during cooldown, the explanation is clear and compassionate.

### 8.2 Findings

| Finding | Severity | Heuristic | Recommendation |
|---------|----------|-----------|----------------|
| _To be filled during audit_ | | | |

## 9. Heuristic Evaluation (Nielsen's 10)

| # | Heuristic | Score (1-5) | Notes |
|---|-----------|-------------|-------|
| 1 | **Visibility of system status** | _/5 | Are contract states, proof status, and escrow balance always visible? |
| 2 | **Match between system and real world** | _/5 | Does the linguistic cloaker vocabulary feel natural? (Oath, Vault, Fury) |
| 3 | **User control and freedom** | _/5 | Can users undo or cancel actions? Is contract cancellation (with forfeit) clear? |
| 4 | **Consistency and standards** | _/5 | Is vocabulary consistent across web, mobile, and notifications? |
| 5 | **Error prevention** | _/5 | Does Aegis catch dangerous biological oaths before payment? |
| 6 | **Recognition rather than recall** | _/5 | Are verification criteria visible during proof submission (not just at creation)? |
| 7 | **Flexibility and efficiency** | _/5 | Can power users (Furies, practitioners) batch actions? |
| 8 | **Aesthetic and minimalist design** | _/5 | Is financial information presented without visual clutter? |
| 9 | **Help users recognize/recover from errors** | _/5 | Are Stripe payment failures explained with recovery steps? |
| 10 | **Help and documentation** | _/5 | Is the FAQ accessible? Are tooltips present for Styx-specific terms? |

## 10. Accessibility Checklist (WCAG 2.1 AA)

### 10.1 Perceivable

- [ ] All images (proof photos, UI icons) have alt text
- [ ] Color is not the only means of conveying information (contract status uses icons + color + text)
- [ ] Text contrast ratio meets 4.5:1 for normal text, 3:1 for large text
- [ ] Audio/video content has captions (if any)
- [ ] Content is readable at 200% zoom without horizontal scrolling

### 10.2 Operable

- [ ] All interactive elements are keyboard-accessible
- [ ] Focus order is logical (tab through contract creation wizard makes sense)
- [ ] No content flashes more than 3 times per second
- [ ] Skip-to-content link is present
- [ ] Touch targets are at least 44x44px on mobile

### 10.3 Understandable

- [ ] Language is set in HTML (`lang="en"`)
- [ ] Form inputs have visible labels (not just placeholders)
- [ ] Error messages identify the field and describe the error
- [ ] Stake amount input has clear formatting guidance ($XX.XX)
- [ ] Styx-specific terms (Oath, Vault, Fury, Integrity Score) have tooltip definitions

### 10.4 Robust

- [ ] HTML is valid and well-structured
- [ ] ARIA landmarks are used correctly (navigation, main, complementary)
- [ ] Custom components (proof viewer, vote buttons) have appropriate ARIA roles
- [ ] Screen reader testing completed on VoiceOver (macOS/iOS) and TalkBack (Android)

## 11. Linguistic Cloaker Review

The linguistic cloaker maps internal terminology to user-facing vocabulary to avoid app store rejection for gambling-adjacent language.

| Internal Term | User-Facing Term | Audit Status |
|---------------|-----------------|-------------|
| Stake | Vault deposit | [ ] Verified consistent |
| Bet/wager | Oath/commitment | [ ] Verified consistent |
| Gamble | Challenge | [ ] Verified consistent |
| Win/lose | Complete/forfeit | [ ] Verified consistent |
| Payout | Return | [ ] Verified consistent |
| House edge | Platform fee | [ ] Verified consistent |
| Bookie | Fury (auditor) | [ ] Verified consistent |

**Audit task:** Search all user-facing strings (UI text, notifications, emails, error messages) for uncloaked terminology. Any instance of "stake", "bet", "wager", "gamble", "win", "lose", "payout" in user-facing context is a blocking finding.

## 12. Audit Summary

| Section | Status | Critical Findings | Recommendations |
|---------|--------|-------------------|-----------------|
| Onboarding | _Pending_ | | |
| Contract creation | _Pending_ | | |
| Proof submission | _Pending_ | | |
| Fury workbench | _Pending_ | | |
| Wallet/escrow | _Pending_ | | |
| Dashboard | _Pending_ | | |
| Recovery UX | _Pending_ | | |
| Heuristic eval | _Pending_ | | |
| Accessibility | _Pending_ | | |
| Linguistic cloaker | _Pending_ | | |

**Overall UX readiness for beta:** _Pending audit completion_
