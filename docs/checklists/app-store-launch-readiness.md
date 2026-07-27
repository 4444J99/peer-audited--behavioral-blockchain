# App Store Launch Readiness Gate (October 2026)

Every item must pass before we submit to Apple for App Store review.

## App Review Submission

- [ ] **App Review submission package complete** — UGC moderation policy, privacy nutrition label, all required disclosures written and reviewed by counsel. Verify: checklist of Apple's App Review Guidelines completed item-by-item. Owner: H:LC + H:RO
- [ ] **Age rating determined** — completed Apple's age rating questionnaire, rating consistent with app content. Verify: rating displayed in App Store Connect. Owner: H:RO
- [ ] **Screenshots and preview videos captured** — 5.5" and 6.7" iPhone sizes + iPad. Verify: uploaded to App Store Connect. Owner: H:GRO
- [ ] **Marketing text and description finalized** — 4000-character description, keywords, promotional text. Verify: reviewed by team. Owner: H:GRO
- [ ] **Privacy policy URL confirmed** — links to /legal/privacy. Verify: link works, content matches app data practices. Owner: H:LC
- [ ] **Terms of Service URL confirmed** — links to /legal/terms. Verify: link works. Owner: H:LC

## UGC Moderation

- [ ] **UGC moderation policy written** — covers Tavern discussions, proof comments, Fury review comments. Verify: policy reviewed by counsel. Owner: H:LC
- [ ] **In-app reporting mechanism active** — users can report inappropriate content. Verify: report flow end-to-end tested. Owner: H:ENG
- [ ] **Content filtering automated checks active** — profanity, PII, crisis keyword detection. Verify: test submissions caught. Owner: H:ENG
- [ ] **Moderation response SLA documented** — time to review reported content, escalation path. Verify: SOP exists. Owner: H:CXS

## Technical Requirements

- [ ] **iOS native app builds clean** — no simulator-only code, no private APIs, no deprecated API usage. Verify: `xcodebuild clean archive` passes. Owner: H:ENG
- [ ] **App uses latest iOS SDK** — deployment target iOS 16+, builds against Xcode 15+. Verify: build settings checked. Owner: H:ENG
- [ ] **Push notifications configured** — APNs key uploaded to Expo, push notification entitlement active. Verify: test push received on device. Owner: H:ENG
- [ ] **Sign-in with Apple configured** — required for apps using social login. Verify: flow works end-to-end. Owner: H:ENG
- [ ] **Account deletion flow active** — users can delete account from within the app. Verify: flow tested, Apple guideline 5.1.1 satisfied. Owner: H:ENG
- [ ] **No forced ratings or reviews** — no system that prompts for rating more than 3x/year. Verify: code review. Owner: H:ENG

## Legal & Compliance

- [ ] **Contest/rules compliance verified** — App Store guideline 5.4 (sweepstakes/contests) satisfied. Verify: legal review. Owner: H:LC
- [ ] **Health and safety disclaimers present** — no medical advice claims, appropriate disclaimers on recovery contracts. Verify: reviewed by counsel. Owner: H:LC
- [ ] **Data retention and deletion policy matches app behavior** — privacy policy accurately describes actual data practices. Verify: cross-reference audit. Owner: H:LC
- [ ] **Export compliance confirmed** — no encryption export restrictions violated. Verify: Apple's export compliance questionnaire submitted. Owner: H:LC

## Pass Criteria

All 22 checkboxes checked = gate passed. Any open item blocks App Store submission.
