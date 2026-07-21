# External Beta via TestFlight -- Build Distribution & Tester Management
> Issue: #372
> Phase: Pre-Launch (After Dogfood)

## Overview

Styx will distribute beta builds via Apple TestFlight for iOS and Google Play Console's internal/closed testing for Android. This doc covers beta app review, build distribution, tester management (50-100 users), feedback collection, and crash reporting. Web beta (Next.js) runs in parallel for desktop users.

## Beta App Review Preparation

### Apple App Store Connect

**Timeline:** Submit for beta review 2 weeks before planned tester invitation.

**Build prerequisites:**

| Requirement | Check |
|-------------|-------|
| Apple Developer account ($99/yr, enrolled) | |
| App Store Connect record created | |
| Bundle ID registered (com.styx.app) | |
| Certificates + provisioning profiles configured | |
| Xcode archive build (Release configuration) | |
| Build uploaded via Xcode or altool | |
| TestFlight build number incremented | |
| Export Compliance: No encryption (or exempt) answered | |
| App privacy questionnaire completed | |

**Beta App Review checklist:**

- [ ] App description (English, 4000 char max)
- [ ] Screenshots: 6.7" iPhone (1290x2796), iPad (2048x2732) if applicable
- [ ] App icon: 1024x1024 PNG (no transparency)
- [ ] Privacy policy URL (styx.app/privacy)
- [ ] Terms of service URL (styx.app/terms)
- [ ] Demo account credentials for reviewer
- [ ] "Contact information" for reviewer questions
- [ ] Notes for reviewer explaining the app (see below)

**Notes for App Store Reviewer:**

```
Styx is a behavioral accountability platform -- NOT gambling.

Users set personal goals (exercise, reading, no-contact recovery)
and stake real money via Stripe escrow. They submit proof of
completion. Peer reviewers ("Furies") verify the proof.

Key points:
- Outcome is controlled entirely by user behavior (not chance)
- Money returns to user on success
- Aegis Protocol prevents dangerous contracts (BMI floor, loss caps)
- Linguistic Cloaker replaces gambling terminology with neutral language
- No real-money features for users under 18 (age-gated)

Demo account: demo.reviewer@styx.app / password provided separately.
Test card: 4242 4242 4242 4242 (Stripe test mode -- no real charges).
```

**Expected review time:** 24-48 hours for initial beta review. Subsequent builds typically < 24 hours.

### Google Play Console

**Timeline:** Submit 1 week before planned tester invitation.

**Prerequisites:**

| Requirement | Check |
|-------------|-------|
| Google Play Developer account ($25, one-time) | |
| App listing created (closed track) | |
| App bundle (AAB) uploaded | |
| Store listing: description, screenshots, icon, category | |
| Content rating questionnaire completed | |
| Target API level: Android 14 (API 34) minimum | |
| Privacy policy linked | |
| Closed track: Internal testing OR Closed alpha | |

**Google Play note:** Google is generally less restrictive than Apple for beta. The "gambling" risk is lower because Google has clearer guidelines distinguishing betting from skill-based commitment devices.

## Build Distribution

### TestFlight Distribution (iOS)

| Setting | Value | Notes |
|---------|-------|-------|
| Distribution method | Public link (email + link) | Max 10,000 testers |
| Beta app review | Required (one-time per major version) | Re-review needed for new versions with significant changes |
| Test groups | Internal (25 users) + External (up to 10,000) | Use external for beta testers |
| Internal testers | Founders + close team | No beta review needed |
| External testers | Beta participants | Beta review required |
| Build expiration | 90 days | Must re-upload before expiry |
| Auto-update | Enabled | Testers auto-update on new build |

**TestFlight Group Structure:**

```
Styx Beta (External)
+-- Group A: Early adopters (25 users) -- immediate access
+-- Group B: General beta (50 users) -- week 2
+-- Group C: Waitlist overflow (up to 500) -- as needed
```

**Invite flow:**

```
1. Build uploaded to App Store Connect
2. Passes beta review
3. Invite link generated
4. Shared via email / Discord / waitlist page
5. Tester accepts via TestFlight app
6. Build downloads automatically
7. Updates pushed automatically on new builds
```

### Android Beta Distribution

| Setting | Value | Notes |
|---------|-------|-------|
| Distribution method | Google Play Closed track | Invite by email |
| Tester limit | 100 (internal), 1000 (closed alpha) | Use closed alpha for 50-100 testers |
| Beta review | Not required for closed tracks | Only for open tracks |
| Build type | AAB (Android App Bundle) | Google Play manages APK generation |
| Update mechanism | Automatic via Play Store | Testers must opt-in |

**Google Groups for Tester Management:**

```
styx-beta-testers@googlegroups.com  -- All beta testers
styx-beta-power@googlegroups.com    -- Power users (priority feedback)
styx-beta-internal@googlegroups.com -- Founders + close team
```

### Web Beta (Desktop)

| Aspect | Detail |
|--------|--------|
| URL | `https://beta.styx.app` (Next.js, separate deployment) |
| Access | Password-gated (shared beta password) |
| Auth | Same as mobile (email + magic link) |
| Features | Core loop + dashboard + Fury |
| Push | Not applicable (PWA notifications) |

**Desktop beta note:** Web beta runs in parallel with mobile. Desktop users access via browser. All users share the same backend regardless of platform.

## Tester Management (50-100 Users)

### Tester Sourcing

| Source | Expected Volume | Channel |
|--------|-----------------|---------|
| Waitlist (Phase 1) | 200 sign-ups, ~30% convert to beta | Email invite |
| Discord community | 50 members, ~40% join beta | Discord announcement |
| Practitioner clients | 20-30 clients via 3-5 practitioners | Practitioner referral |
| Social media (Twitter, Reddit) | 50-100 applications | Application form |
| Direct outreach (target segments) | 20-30 qualified applicants | Direct email |

### Tester Application Form

**Fields:**
- Name
- Email
- Device: iOS / Android / Web only
- Current phone model (for compatibility checks)
- Why are you interested in Styx? (free text, 200 char)
- What goal would you use Styx for? (dropdown: recovery, fitness, productivity, cognitive, other)
- Have you used commitment devices before? (yes/no -- which ones?)
- Willing to provide weekly feedback? (yes/no)
- How did you hear about Styx? (dropdown)
- Age verification (must be 18+)

**Acceptance criteria:**
- Age 18+
- Matching a target segment (see docs/marketing/audience-map.md)
- Willing to provide feedback
- Has compatible device
- Even spread across segments (max 30% in any one category)

### Tester Cohort Management

| Cohort | Size | Invite Date | Focus |
|--------|------|-------------|-------|
| Cohort 1 (Pioneers) | 25 | Week 1 | Core loop validation, iOS primary |
| Cohort 2 (Early Adopters) | 35 | Week 3 | Android + cross-platform, feature coverage |
| Cohort 3 (Growth) | 40 | Week 6 | Scale testing, real-money contracts |

### Tester Demographics Target

| Segment | Target % | Target Count (100) |
|---------|----------|-------------------|
| Recovery (no-contact, sobriety) | 25% | 25 |
| Productivity / ADHD | 25% | 25 |
| Fitness / biological | 20% | 20 |
| Cognitive / learning | 15% | 15 |
| B2B practitioners | 15% | 15 |

### Tester Communication

| Touchpoint | Frequency | Channel | Content |
|------------|-----------|---------|---------|
| Welcome email | Upon acceptance | Email | App download link, getting started guide, FAQ |
| Build update | Per build | Email + Discord | Changelog, what to test |
| Weekly check-in | Weekly | Email survey | NPS + 3 structured questions |
| Bug report reminder | Weekly | Discord | Pinned post in #bugs |
| Beta completion | End of beta | Email | Thank-you, next steps, testimonial request |

## Feedback Collection

### In-App Feedback (Implemented via Styx API)

| Trigger | Mechanism | Data Captured |
|---------|-----------|---------------|
| After contract completion | "Rate this experience" (1-5) + optional comment | Completion satisfaction |
| After Fury audit result | "Was this audit fair?" (yes/no) + optional comment | Audit satisfaction |
| After first login | "What brought you to Styx?" (dropdown) | Acquisition attribution |
| After 3 failed proof attempts | "What's blocking you?" (free text) | Friction identification |
| After 7 days inactive | "Why haven't you created a contract?" (dropdown + free text) | Churn analysis |

### Crash Reporting

| Tool | Platform | Key Configuration |
|------|----------|-------------------|
| Sentry | iOS (Sentry Cocoa SDK) | Capture all errors, send with user consent |
| Sentry | Android (Sentry Android SDK) | Same as iOS |
| Sentry | Web (Sentry JavaScript SDK) | Capture unhandled errors |
| TestFlight crashes | iOS (Apple) | Symbolicated crash logs, auto-collected |
| Play Console crashes | Android (Google) | ANR + native crash reporting |

**Crash report analysis cadence:**

| Cadence | Action | Owner |
|---------|--------|-------|
| Daily | Review new crash groups (Sentry dashboard) | Technical founder |
| Per-build | Compare crash rate to previous build | Technical founder |
| Weekly | Top 3 crash types, fix progress | Engineering standup |

**Crash thresholds (beta):**

| Metric | Warning | Critical | Action |
|--------|---------|----------|--------|
| Crash-free rate (session) | < 99.5% | < 99.0% | Investigate, P1 fix |
| User crash rate (daily) | > 2% | > 5% | Consider build rollback |
| Error rate (API calls) | > 1% | > 5% | Investigate backend |

### Structured Feedback Forms

**Weekly survey (Google Forms / Typeform):**

```
1. NPS: "How likely are you to recommend Styx to a friend?" (0-10)
2. "What did you use Styx for this week?" (multi-select)
3. "Did you complete your contract(s) this week?" (yes / no / pending)
4. "What was the most frustrating part this week?" (free text)
5. "What almost made you quit this week?" (free text)
6. "What feature would most improve your experience?" (free text)
7. "Did support resolve your issue(s)?" (yes / no / didn't need support)
8. "Any other feedback?" (free text)
```

**End-of-beta survey (Google Forms / Typeform):**

```
1. Overall satisfaction (1-5)
2. Would you continue using Styx after beta? (yes / no / maybe)
3. What was the most valuable part of Styx? (free text)
4. What was the least valuable part? (free text)
5. Would you pay $9/contract for this? (yes / no / maybe)
6. Would you recommend to a friend? (yes / no)
7. What features are missing? (free text)
8. Anything else? (free text)
9. Permission to quote? (yes / no)
10. Referral: know anyone who'd benefit? (free text)
```

## Crash & Issue Triage

| Priority | Definition | Response | Examples |
|----------|------------|----------|----------|
| **P0 - Blocker** | Core loop broken, all users affected | < 1 hour fix, possible rollback | Login broken, payment processing down, app crashes on launch |
| **P1 - Critical** | Major feature broken, workaround available | < 4 hours fix | Contract creation fails, proof upload broken, audit verdict not returned |
| **P2 - Major** | Feature works but degraded | < 24 hours fix | Dashboard loading slowly, notifications delayed, search broken |
| **P3 - Minor** | Cosmetic, non-functional | Next sprint | UI misalignment, typo, animation glitch |
| **P4 - Suggestion** | Feature request | Backlog | New contract type, UI improvement idea |

## Beta Exit Criteria

### Technical Exit Criteria (Move to Public Beta)

| Criterion | Target | Measurement |
|-----------|--------|-------------|
| Crash-free session rate | > 99.5% | Sentry |
| Critical bugs (P0) | 0 open | Bug tracker |
| Major bugs (P1) | < 3 open, all with workarounds | Bug tracker |
| Test coverage | > 90% on critical paths | Jest |
| API error rate | < 1% | Sentry / server logs |
| Core loop completion rate | > 90% successful (contract create -> audit -> payout) | Internal metric |
| Stripe integration | All flows tested with test mode | Manual verification |

### User Satisfaction Exit Criteria

| Criterion | Target | Measurement |
|-----------|--------|-------------|
| Beta tester NPS | > 30 | Weekly survey |
| Contract completion rate | > 55% | Internal metric |
| Active user rate (weekly) | > 60% of accepted testers | PostHog |
| Support tickets/user/week | < 0.5 | Support tool |
| App Store rating (beta) | N/A (no public listing yet) | -- |
| User retention (week 4) | > 40% of week 1 users still active | PostHog |

## Beta Timeline

| Week | Activity | Owner |
|------|----------|-------|
| T-2 | Submit app for beta review (iOS + Android) | Technical founder |
| T-1 | Recruit testers (50), send acceptance emails | Non-technical founder |
| T-0 | Build approved, invite link sent | Technical founder |
| W1 | Cohort A onboarded, first contracts created | All |
| W1 | Crash monitoring, P0/P1 fixes | Technical founder |
| W2 | Cohort B onboarded | Non-technical founder |
| W2 | First weekly survey | Non-technical founder |
| W3 | Cohort C onboarded (if capacity) | Non-technical founder |
| W3 | Mid-beta check: metrics vs exit criteria | Both founders |
| W4 | Feature freeze for bugs only | Technical founder |
| W5 | Beta retrospective + final survey | Both founders |
| W6 | Exit criteria review -> move to open beta or iterate | Both founders |

## Risk Mitigation

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Low tester engagement (< 40% active) | Medium | High | Over-recruit by 25%, send engagement nudges, remove inactive testers |
| iOS beta review rejection | Medium | High | Pre-submit to Apple for guidance, have legal explanation ready |
| Crash-on-launch for specific devices | Low | Medium | Test top 5 devices before release, Sentry detects immediately |
| TestFlight build expires | Low | Low | Calendar reminder 14 days before expiry |
| Tester churn > expected | Medium | Medium | Maintain extra capacity on waitlist, fast replacement |
| Negative tester sentiment spreads | Low | High | Proactive support, public acknowledgment, quick fixes |
