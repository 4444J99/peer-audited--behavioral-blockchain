# The Road Ahead for Styx: Alpha to Omega

**What this document is:** A plain-language account of everything that must still be built — and why, and in what order — from the current moment through the final milestone. Written for someone who has never written a line of code. No jargon. No acronyms. Just the logic of what comes next, what it unlocks, and what it protects against.

**Companion to:** *Building Styx: A Narrative History* (the sibling document covering February 22 – March 4, 2026)
**Prepared for:** Non-technical stakeholders
**Baseline date:** March 4, 2026

---

## I. Restatement / Precis

Styx exists. It works. A person can create a commitment, stake money, submit proof, have that proof reviewed by strangers, and receive a verdict — all the way through. The website, the phone app, the desktop administration tool, the investor pitch, the financial ledger, the peer-review economy, the health safeguards, the ethics screening, and over 1,300 automated quality checks are in place.

What Styx cannot yet do is move *real* money safely at scale.

The road from here to there — from a working prototype to a publicly defensible, revenue-generating institution — passes through five named phases. Each phase has a single governing question:

- **Phase Zero** (complete): *Do we know what we're building and why?*
- **Phase Alpha** (complete, with minor finishing work): *Does the core machinery work?*
- **Phase Beta** (March–April 2026): *Can we move real money without legal or operational exposure?*
- **Phase Gamma** (May–June 2026): *Can we trust the evidence at scale?*
- **Phase Delta** (July–September 2026): *Will people come back?*
- **Phase Omega** (October–December 2026): *Can enterprises buy this?*

The phases are sequential and non-negotiable. Each one must be completed and evidenced before the next begins. The logic is simple: you cannot scale money movement until you've proven the money is safe. You cannot scale the reviewer network until you've proven the evidence is trustworthy. You cannot sell to enterprises until you've proven people actually change their behavior. Each phase earns the right to attempt the next one.

Nineteen specific pieces of work have been identified, prioritized, and sequenced. Five of them are absolute blockers — the system cannot launch with real money until all five are resolved. The remaining fourteen are enhancements that make the system more trustworthy, more humane, more resilient, and more commercially viable. None of them are optional; they are ordered by urgency.

---

## II. Descriptive Summary

This document is organized into six sections, one for each phase of the roadmap, preceded by three summaries and followed by a glossary. Within each phase, the document describes:

1. **The governing question** — the single test the phase must satisfy.
2. **What the phase unlocks** — the business capability that becomes possible once the phase is complete.
3. **The work items** — each described in terms of what it does for the user, why it matters now, and what would go wrong without it.
4. **The exit gate** — the evidence required before the next phase can begin. Not opinions. Evidence.

The phases proceed in this order:

- **Phase Zero** and **Phase Alpha** are retrospective — they document what has already been accomplished. They are included for completeness and to establish the foundation on which everything else rests.
- **Phase Beta** is the immediate priority. It addresses the five things that must be true before real money can move: the settlement system must be deterministic, the proof camera must be tamper-resistant, the identity verification system must be active, the geographic restrictions must be fail-safe, and the rules for what happens to forfeited money must be jurisdiction-specific.
- **Phase Gamma** addresses the integrity of the evidence itself at scale: can the system process video proof, redact identities from reviewers, detect collusion among reviewers, and integrate with health-tracking hardware?
- **Phase Delta** addresses whether the product creates lasting behavior change: do people come back, do they complete their commitments, does the community grow, and does the experience deepen over time?
- **Phase Omega** addresses whether the product can be sold to organizations: is the legal defense documented and approved by counsel, is the compliance posture auditable, and is the enterprise packaging credible?

---

## III. Analytical Summary

Three observations about this roadmap, each with strategic implications.

**First: the roadmap is governed by a single principle — earned permission.** Phase Beta earns the permission to handle real money. Phase Gamma earns the permission to scale the reviewer network. Phase Delta earns the permission to market the product. Phase Omega earns the permission to sell to enterprises. No phase can be skipped, because each one produces the trust that the next one requires. This is not project management methodology; it is risk architecture. The roadmap is structured so that the most dangerous capabilities (handling money, scaling users, contracting with corporations) are unlocked last, only after the safeguards that constrain them have been proven.

**Second: the five Phase Beta blockers are all forms of the same problem — the gap between "this works in a test" and "this works in the real world."** The settlement system works with test money but not real money. The proof camera accepts photos but doesn't verify they were taken live. The identity system has a flag but doesn't enforce it. The geographic restrictions exist but fail open (meaning: if the system can't determine your location, it lets you through — the opposite of what regulators require). The forfeiture rules are written down but not encoded into the system per jurisdiction. Each of these is a case where the *concept* is implemented but the *constraint* is not. Phase Beta's entire purpose is to close that gap.

**Third: the consumer product and the enterprise product are built on the same foundation but serve different masters.** The consumer product (no-contact commitments after a breakup) serves the individual user's need for external accountability during a period of biological vulnerability. The enterprise product (corporate wellness, therapist licensing, behavioral data) serves the organization's need for measurable outcomes and compliance documentation. The roadmap builds the consumer product first (Phases Beta through Delta) and the enterprise product last (Phase Omega), because the consumer product generates the behavioral data and outcome evidence that makes the enterprise product credible. You cannot sell "our platform changes behavior" to a corporation until you have proof that it does.

---

## IV. Where We Stand Today

Before describing the road ahead, a clear accounting of the ground already covered.

### Phase Zero — The Thesis (Complete)

**Governing question:** *Do we know what we're building and why?*

This phase produced the intellectual foundation: 37 research documents synthesized (covering behavioral economics, loss aversion theory, breakup psychology, competitor analysis, market sizing, legal compliance, and app store regulation). The core insight — that a loss aversion coefficient of 1.955 means losing money hurts roughly twice as much as gaining it feels good, and that this asymmetry can be leveraged to create accountability that willpower alone cannot provide — was established through literature review, not assumption.

The legal framing was defined: Styx is a skill-based behavioral commitment system, not a gambling platform. The distinction rests on the "Dominant Factor Test" — whether the outcome depends primarily on the user's own effort (skill) or on chance. Since the user controls whether they follow through on their commitment, the outcome is skill-determined.

**Evidence of completion:** Research corpus, legal analysis, competitive positioning, product thesis — all documented, cross-referenced, and cataloged.

### Phase Alpha — The Core Machinery (Complete, with carryover hardening)

**Governing question:** *Does the core machinery work?*

This phase produced the working system: the double-entry financial ledger (which tracks every penny with bank-grade accounting), the peer-review network (with the Fury bounty economy, honeypot integrity testing, and consensus voting), the escrow vault (which holds staked money in trust), the health safeguards (the Aegis Protocol — BMI floors, weekly loss caps, cool-off periods), the ethics screening service (which evaluates whether a proposed goal is appropriate), the website, the phone app, the desktop administration tool, the investor pitch deck, and 1,318 automated quality checks.

The accountability loop works end-to-end: a user creates a commitment, stakes money, submits proof, peer reviewers examine the proof and vote, a consensus is reached, and the money is either returned or forfeited. This has been demonstrated and tested.

**Evidence of completion:** Working product across four platforms. 1,318+ automated tests. Six validation gates passing in continuous integration. Formal promotion to PUBLIC_PROCESS status.

**Carryover:** Minor hardening items from Alpha have been folded into the Beta work package rather than reopening Alpha scope.

---

## V. The Road Ahead

---

### Phase Beta — The Regulatory Shield
**March – April 2026**

**Governing question:** *Can we move real money without legal or operational exposure?*

This is the most consequential phase in the entire roadmap. Everything before it was preparation. Everything after it depends on it. Phase Beta is where the product transitions from a demonstration that works with play money to a system that can be trusted with real dollars in real jurisdictions under real regulatory scrutiny.

There are five absolute blockers and one safety companion. Until all five blockers are resolved, the system cannot accept a single real dollar from a single real user.

---

#### Beta Work Item 1 — Real-Money Settlement
*The system must be able to move actual money, not just pretend to.*

**What it does for the user:** When a contract resolves — when the peer reviewers have voted and a verdict has been reached — the user's staked money must actually move. If they succeeded, it comes back to them. If they failed, the platform fee is collected and the reviewer bounties are paid. Right now, this entire flow works with test credentials. This work item makes it real.

**Why it matters now:** Without this, there is no product. A commitment platform that cannot actually hold and release money is a sophisticated to-do list.

**What would go wrong without it:** The settlement must be *deterministic* — meaning the same inputs always produce the same outputs, even if the payment processor is temporarily unavailable. It must be *idempotent* — meaning if the system retries a failed settlement, it doesn't accidentally charge someone twice or pay a reviewer double. It must be *auditable* — meaning every settlement can be reconstructed from the ledger after the fact. And it must be *reconcilable* — meaning the platform's internal accounting always matches the payment processor's records. If any of these properties fail, the platform is either legally exposed (unreconcilable money movement) or user-hostile (duplicate charges, lost refunds).

**What must be true before this is done:**
- A user can preview the exact breakdown of their settlement before it executes.
- The settlement can be retried after a processor failure without duplication.
- Every settlement is recorded in the ledger with a matching entry in the payment processor.
- The desktop administration tool shows settlement status with retry controls.

---

#### Beta Work Item 2 — Native Camera Proof Capture
*The proof must come from a live camera, not a photo album.*

**What it does for the user:** When a user submits proof of their commitment (a photo of their gym check-in, a screenshot of their focus timer, a video of their daily attestation), the system must verify that the proof was captured *live* — taken right now, with the phone's camera — and not pulled from the photo library (which could be an old photo, a photo from the internet, or a doctored image).

**Why it matters now:** The entire value proposition of Styx rests on the idea that the proof is real. If users can submit pre-existing photos, the verification system is theater. The peer reviewers are examining evidence that may have been manufactured. The financial stakes become meaningless because the user can "prove" anything by pulling the right image from their library.

**What would go wrong without it:** A user stakes $100 on going to the gym every day. Instead of actually going, they submit a saved photo of a gym from last month. The reviewers, seeing a gym photo, approve it. The user keeps their money without doing anything. The system's credibility is destroyed from within.

**How it works:** When the user opens the proof capture screen, only the live camera is available — no gallery picker, no photo library access. A challenge word or number (a "nonce") is displayed on screen and must appear in the proof, proving it was taken at that exact moment. The nonce is cryptographically signed and time-stamped. If the nonce in the uploaded proof doesn't match the one the server issued, the proof is automatically rejected before it ever reaches a reviewer.

**What must be true before this is done:**
- The gallery/photo library is blocked on the proof capture screen for high-integrity commitment categories.
- Every proof includes a server-issued challenge that is verified before the proof enters the review queue.
- Replaying an old challenge (submitting yesterday's nonce today) is automatically rejected.

---

#### Beta Work Item 3 — Identity Verification
*The system must know who its users are before allowing high-stakes commitments.*

**What it does for the user:** Before a user can stake large amounts of money, they must verify their identity — a process known in the financial world as "Know Your Customer" (KYC). This is not optional; it is a regulatory requirement for any platform that handles financial transactions above certain thresholds. The verification is tiered: small stakes require minimal verification, larger stakes require progressively more.

**Why it matters now:** Without identity verification, the platform is exposed to fraud (people creating multiple accounts to game the system), money laundering (using the platform to move illicit funds through the settlement cycle), and regulatory action (operating a financial platform without the identity controls that regulators require).

**What would go wrong without it:** A bad actor creates ten accounts, stakes small amounts on fake commitments, submits fake proofs, approves their own proofs from other accounts, and extracts the bounty payments. Without identity verification, there is no way to detect that ten accounts are one person.

**What must be true before this is done:**
- Users attempting to stake above a configured threshold are required to complete identity verification.
- All verification events are logged in an auditable trail.
- The verification status is visible to the user (so they understand why they can't stake more).
- The system works with a third-party identity verification provider, not a homegrown solution.

---

#### Beta Work Item 4 — Geographic Restriction Enforcement
*The system must refuse service in jurisdictions where it cannot legally operate.*

**What it does for the user:** Different U.S. states have different laws about financial commitment platforms. Some states permit them. Some states restrict them. Some states prohibit them outright. The system must determine which state a user is in and enforce the rules accordingly. Currently, it attempts to do this — but if it *can't* determine the user's location (because the location signal is missing or unreliable), it defaults to *allowing* the transaction. This is backwards. In regulated financial services, ambiguity must result in denial, not permission.

**Why it matters now:** If a user in a restricted state successfully creates a financial commitment, the platform has violated that state's regulations. "We didn't know where they were" is not a defense. The system must fail closed — meaning, if it doesn't know where you are, it doesn't let you stake money.

**What would go wrong without it:** A user in a state that prohibits financial commitment platforms successfully stakes money. The state's attorney general discovers this. The platform faces regulatory action, fines, or a cease-and-desist order — not because it intentionally operated in a restricted state, but because it failed to prevent it.

**What must be true before this is done:**
- No money-movement transaction succeeds when the user's jurisdiction cannot be determined with confidence.
- The list of restricted jurisdictions is maintained as a policy registry (not hardcoded), so it can be updated as laws change.
- Override mechanisms exist only in test environments and are blocked in production.
- A compliance log records the jurisdiction determination for every financial transaction.

---

#### Beta Work Item 5 — Forfeiture Disposition Rules
*What happens to lost money must be determined by the rules of the jurisdiction where the user lives.*

**What it does for the user:** When a user fails their commitment and forfeits their stake, what happens to that money? The answer depends on jurisdiction. In some states, the platform may retain the forfeited funds (minus the reviewer bounties). In other states, the only legally safe option is to refund everything — the platform collects no forfeiture revenue and absorbs the reviewer bounty cost. The system must know which rule applies in which state and enforce it automatically.

**Why it matters now:** This is the flipside of geographic restriction. Even in states where the platform *can* operate, the rules about what happens to forfeited money vary. Operating with a one-size-fits-all forfeiture policy exposes the platform to legal challenges in every jurisdiction where its policy doesn't match local law.

**What would go wrong without it:** A user in a state with strict consumer protection laws forfeits their stake. The platform retains the money. The user files a complaint with their state's consumer protection agency. The agency discovers that the platform's forfeiture policy doesn't comply with local law. The platform faces refund obligations, fines, or injunctive relief.

**What must be true before this is done:**
- Every settlement applies the forfeiture rule specific to the user's jurisdiction.
- A "refund-only kill switch" exists so that, in an emergency, the platform can instantly switch any jurisdiction to full-refund mode.
- Every forfeiture decision is logged with the legal basis that applied at the time of execution.
- The compliance administration panel allows authorized staff to change a jurisdiction's disposition mode with a mandatory written rationale.

---

#### Beta Safety Companion — Self-Exclusion Controls
*Users must be able to remove themselves from the platform if they recognize they're in over their heads.*

**What it does for the user:** A user can voluntarily exclude themselves from the platform for a defined period. During that period, they cannot create new commitments or stake money. This is the behavioral equivalent of a casino's self-exclusion program — a recognition that the same psychological mechanisms that make the product effective (loss aversion, financial stakes) can, for vulnerable individuals, become harmful.

**Why it matters now:** This is not technically a blocker for launch — the platform could operate without it. But it is a *moral* prerequisite and a *legal* shield. Regulators, app store reviewers, and journalists will ask: "What happens if someone uses your platform in a way that harms them?" Self-exclusion is the answer. Its absence invites the question; its presence demonstrates institutional seriousness.

**What must be true before this is done:**
- Users can activate self-exclusion from their settings.
- During the exclusion period, all contract creation and payment operations are blocked.
- Every exclusion activation and deactivation is logged.
- The exclusion cannot be reversed early without a defined cooling-off period.

---

#### Phase Beta Exit Gate
*All of the following must be demonstrably true before Phase Gamma can begin:*

- No unresolved blocker items remain.
- Geographic restriction and forfeiture rules are enforceable per jurisdiction.
- Money settlement is deterministic, auditable, and retry-safe.
- Identity verification is active for configured stake tiers.
- The platform can be switched to full-refund mode in any jurisdiction within minutes.

**What this unlocks:** The safe, controlled transition from test-money operation to real-money operation. The first real dollar can enter the system.

---

### Phase Gamma — The Trust Network
**May – June 2026**

**Governing question:** *Can we trust the evidence at scale?*

Phase Beta proved that the money is safe. Phase Gamma proves that the *evidence* is trustworthy. As the platform grows beyond a small test group, the peer-review network faces new challenges: more proof to process, more sophisticated attempts at fraud, and more potential for reviewers to collude or cut corners. Phase Gamma hardens the verification system against these threats.

---

#### Gamma Work Item 1 — Health Data Integration
*The system must be able to verify health commitments using data from wearable devices.*

**What it does for the user:** Users who commit to health-related goals (sleep quality, heart rate variability, physical activity) should be able to submit proof directly from their fitness tracker or smartwatch — Apple Health, Whoop, Google Fit — rather than relying solely on photos or self-reports. But the system must be able to distinguish between real measurements from a device and manually entered data that a user typed in. (Apple Health, for example, allows users to manually add health records, which could be fabricated.)

**Why it matters now:** Self-reported proof is the weakest form of evidence. Device-verified proof is much stronger, but only if the system can distinguish between genuine device measurements and manual entries. Without this distinction, a user could simply type fake health data into Apple Health and submit it as "device-verified" proof.

**What must be true before this is done:**
- Health data submitted from devices is accepted only if it was recorded by a hardware sensor, not manually entered by the user.
- The source of every health data point is preserved in the system's records.
- Users can see which of their data sources are trusted and which are not.

---

#### Gamma Work Item 2 — Video Proof Processing
*Video evidence must be fully processable, not just uploadable.*

**What it does for the user:** Users can already upload video proof. But the processing pipeline — the system that receives the video, verifies its metadata, transcodes it for reviewers, and tracks its status — is incomplete. A user who uploads a video may not know whether it's being processed, has failed, or is ready for review.

**Why it matters now:** As the platform scales, video proof will become increasingly common (especially for commitments that are hard to prove with a single photo). An incomplete processing pipeline means lost evidence, confused users, and reviewers who receive proof in formats they can't evaluate.

**What must be true before this is done:**
- Every video proof reaches a clear final status (processed, failed, or rejected) with stage-level visibility.
- The challenge token (the nonce from the camera capture) is validated before the proof enters the review queue.
- Users can see the processing status of their submission and take action if it fails.

---

#### Gamma Work Item 3 — Reviewer Identity Redaction
*Reviewers must not be able to see who submitted the proof they're evaluating.*

**What it does for the user:** When a reviewer examines proof, they should see only the evidence itself — not the submitter's name, face (if visible in the proof), or other identifying information. This prevents bias (a reviewer who recognizes the submitter might be more lenient or more harsh) and protects privacy.

**Why it matters now:** As the reviewer pool grows, the statistical likelihood of a reviewer encountering someone they know increases. Without identity redaction, the review system's objectivity is compromised.

**What must be true before this is done:**
- Reviewers see only anonymized identifiers (aliases), not real names or profile information.
- Proof media is processed to redact or mask identifying information where technically feasible.
- The redaction process is logged so it can be audited.

---

#### Gamma Work Item 4 — Anti-Collusion Reviewer Routing
*The system must prevent reviewers from being assigned to review people they might collude with.*

**What it does for the user:** Two friends sign up for Styx. One submits proof. The other is assigned to review it. The reviewer approves the proof regardless of its quality, because they're friends. The system must prevent this by tracking relationships between users and ensuring that reviewers are never assigned to review someone in their social or geographic proximity.

**Why it matters now:** In a small test group, collusion is unlikely because the operator can monitor interactions directly. At scale, it becomes inevitable — unless the assignment algorithm is designed to prevent it.

**What must be true before this is done:**
- The reviewer assignment system enforces exclusion rules (no recent pairings, no social connections, geographic diversity).
- Suspected collusion patterns are flagged for administrator review.
- The assignment algorithm has been tested under conditions of reviewer saturation (when there are few reviewers available, can the system still enforce the rules?).

---

#### Gamma Work Item 5 — Collusion Penalties and Appeals
*Caught colluders must face real consequences, and those consequences must be reversible if wrong.*

**What it does for the user:** When the system detects collusion (through the honeypot system, through pattern analysis, or through administrator investigation), the colluding reviewers face financial penalties — their bounty earnings are reduced or their reviewer status is suspended. But because the detection system is probabilistic (it can be wrong), every penalty must be appealable. A reviewer who believes they were wrongly penalized can file an appeal, which is reviewed by an administrator with access to the full evidence.

**Why it matters now:** Detection without consequence is toothless. But consequence without appeal is tyrannical. Phase Gamma builds both sides.

**What must be true before this is done:**
- High-confidence collusion incidents trigger automatic penalties.
- Every penalty is tied to specific evidence and is visible to the penalized reviewer.
- An appeal process exists with defined review criteria and resolution outcomes (upheld, reversed, escalated).
- Reversed penalties are fully unwound in the financial ledger.

---

#### Phase Gamma Exit Gate
*All of the following must be demonstrably true before Phase Delta can begin:*

- Proof submissions have end-to-end processing traceability (from camera capture through reviewer verdict).
- Reviewers cannot see the identity of the people whose proof they're evaluating (for masked categories).
- Collusion prevention *and* enforcement are both active — not just detection, but consequences.
- Health data integration distinguishes between device-measured and manually entered data.

**What this unlocks:** Higher trust in outcomes. Lower fraud exposure. A verification system that gets *more* trustworthy as it scales, not less.

---

### Phase Delta — The Behavioral Flywheel
**July – September 2026**

**Governing question:** *Will people come back?*

Phase Beta proved the money is safe. Phase Gamma proved the evidence is trustworthy. Phase Delta asks the question that determines whether Styx is a product or a novelty: do people actually change their behavior, and do they return to the platform to commit again?

This phase is grounded in the behavioral science that underlies the entire product. The research is clear: financial stakes alone are sufficient to motivate a single behavior change, but they are insufficient to sustain long-term engagement. Sustained engagement requires *momentum* (the feeling of making progress), *social proof* (seeing others succeed), *identity formation* (seeing yourself as the kind of person who keeps commitments), and *protective scaffolding* (systems that catch you during your most vulnerable moments). Phase Delta builds all four.

---

#### Delta Work Item 1 — Recovery Danger-Zone Protections
*The system must actively protect users during the moments when they are most likely to break.*

**What it does for the user:** The research on post-breakup psychology identifies specific windows of extreme vulnerability: Day 3 (the first weekend alone), Day 21 (the dopamine trough — the point of maximum neurochemical depletion), and weekends generally (when routines dissolve and loneliness peaks). During these windows, the temptation to break no-contact is not a matter of weak willpower — it is a biological imperative, driven by the same neural pathways involved in substance withdrawal.

The system must do two things during these windows. First, it must make it *harder* to break — not impossible (the user is always free to leave), but harder. A 24-hour "timelock" is introduced: if a user decides to break their commitment during a danger zone, the break doesn't take effect for 24 hours. During that 24-hour window, the user can cancel the break request. This gives the rational mind time to overrule the emotional impulse. Second, the system must make the *cost* of breaking more visible — showing the user, in real time, exactly how much money they will lose and how much progress they will forfeit.

**Why it matters now:** The entire consumer product is built around recovery commitments. If users consistently break during the predictable danger zones, the product's completion rates will be low, its reputation will suffer, and its behavioral claims will be unsubstantiated. Danger-zone protections are not a feature — they are the product's thesis in operational form.

**What must be true before this is done:**
- A user who requests to break their commitment during a designated danger zone must wait 24 hours before the break takes effect.
- The user can cancel the break request during the 24-hour window.
- The timelock state is immutable and auditable (the system cannot be tricked into shortening the window).
- Dashboard banners clearly indicate when a user is in a known danger zone.

---

#### Delta Work Item 2 — Weekend Risk Multiplier
*The financial stakes increase during the statistically most dangerous hours.*

**What it does for the user:** For recovery commitments, the penalty for breaking during a weekend window (Friday 5 PM through Sunday 9 AM, local time) is multiplied. The user is told about this in advance, at the time they create their commitment. The logic is drawn directly from the research: weekend relapse rates for no-contact commitments are significantly higher than weekday rates. The multiplier makes the cost of weekend weakness proportionally higher, directly countering the biological pressure to reach out.

**Why it matters now:** A flat penalty structure treats all hours equally. But the research shows that vulnerability is not evenly distributed across time. A penalty system that doesn't account for this is leaving money on the table — both metaphorically (in terms of behavioral effectiveness) and literally (in terms of completion rates).

**What must be true before this is done:**
- Recovery contracts apply a configured multiplier during the weekend window.
- The multiplier is disclosed to the user before they commit.
- The penalty preview (shown to the user before any break) reflects the multiplied amount when applicable.
- Timezone boundary cases (including daylight saving transitions) are handled correctly.

---

#### Delta Work Item 3 — Accountability Partner Protocol
*A trusted person can serve as a second line of defense.*

**What it does for the user:** A user can designate an "accountability partner" — a friend, family member, or therapist — who receives notifications about the user's progress and, in certain circumstances, can veto a break request. If a user in a recovery commitment requests to break their no-contact commitment, the accountability partner can intervene during the 24-hour timelock window.

**Why it matters now:** The research on behavior change consistently shows that external accountability — a human being who knows what you committed to and cares whether you follow through — is one of the strongest predictors of success. Financial stakes provide one form of accountability. A human partner provides another. The combination is more powerful than either alone.

**What must be true before this is done:**
- A user can invite an accountability partner to their commitment.
- The partner can accept, decline, or later revoke their role.
- In recovery commitments, an active partner can veto a break request during the timelock window.
- The partner's authority and the limits of their visibility are clearly disclosed to both parties.
- Every partner interaction (invitation, acceptance, veto) is logged.

---

#### Delta Work Item 4 — Endowed Progress and Downscaling
*The system must create momentum and offer a graceful path when commitments become overwhelming.*

**What it does for the user:** Two behavioral science principles are at work here.

First, the **endowed progress effect**: research shows that people are significantly more likely to complete a goal if they feel they've already made some progress toward it — even if that progress is artificial. When a user creates a new commitment, the system presents their starting position as already partially advanced (for example, showing a progress bar that starts at 20% rather than 0%). This is not deception — it is behavioral architecture, leveraging a well-documented cognitive bias to increase completion rates.

Second, **dynamic downscaling**: if a user accumulates three consecutive failures (strikes), the system proactively recommends reducing their stake to a lower amount rather than simply penalizing them again. The logic is that repeated failure at a given stake level indicates that the commitment exceeds the user's current capacity. Rather than driving the user into a spiral of losses (which would cause them to abandon the platform entirely), the system recalibrates to a level where success becomes achievable again. The user's money is split between a "protected vault" (safe, already earned through prior success) and an "active vault" (still at risk).

**Why it matters now:** Without endowed progress, the onboarding experience feels cold and daunting. Without downscaling, the system punishes struggle rather than adapting to it. Both are essential for retention beyond the first commitment.

**What must be true before this is done:**
- New users see an endowed progress visualization that reflects both artificial advancement and real milestones.
- Users who accumulate three strikes receive a proactive downscale recommendation (not just a penalty).
- The distinction between the protected vault and the active vault is visible and understandable.
- Downscale actions are logged and testable.

---

#### Delta Work Item 5 — Identity-Based Onboarding
*The first experience should feel like taking an oath, not filling out a form.*

**What it does for the user:** Instead of a generic sign-up flow, new users go through an identity-framing process: they select an identity archetype ("I am someone who keeps my word"), choose their commitment category, and make a formal pledge. The language is deliberate, drawing on research showing that identity-based framing ("I am a person who does X") is significantly more effective at sustaining behavior change than goal-based framing ("I want to achieve X").

**Why it matters now:** The first three minutes of a user's experience determine whether they feel like they've joined an institution or downloaded an app. Identity-based onboarding creates the former. A generic form creates the latter.

**What must be true before this is done:**
- New users cannot skip directly to contract creation without completing the identity-oath flow.
- The identity selection is available to downstream systems (notifications, progress displays, the dashboard).
- The language has been reviewed to ensure it remains within the skill-based commitment framing (not coercive, not gambling-adjacent).

---

#### Delta Work Item 6 — Progress Dashboard and Live Leaderboard
*Users must be able to see their progress and their place in the community.*

**What it does for the user:** The dashboard shows daily, weekly, and streak-based progress toward their commitment. A goal-gradient visualization (a multi-layered progress display) creates the visual sensation of advancement. The community leaderboard (the "Tavern Board") updates in real time, showing rank changes as they happen — so when a user completes their daily attestation, they can see their rank tick upward immediately.

**Why it matters now:** Progress that isn't visible isn't motivating. A leaderboard that refreshes only when you manually reload the page feels dead. Real-time feedback creates the sensation that the community is alive and that your actions matter within it.

**What must be true before this is done:**
- The dashboard renders multi-layer progress visuals without requiring a manual refresh.
- The leaderboard updates in real time (with a reliable fallback if the real-time connection drops).
- All badge labels and copy have been verified against the terminology-sanitization policy (no gambling-adjacent language in the user-facing product).

---

#### Delta Work Item 7 — Remote Push Notifications
*The phone must be able to reach the user even when the app isn't open.*

**What it does for the user:** Push notifications — the alerts that appear on a phone's lock screen — are the primary channel for attestation reminders ("Time for your daily check-in"), grace day warnings ("You have 1 grace day remaining this month"), danger-zone alerts ("This is a high-risk window — your commitment is worth protecting"), and social proof nudges ("3 people in your cohort completed their check-in today").

**Why it matters now:** Without push notifications, the app is passive — it sits on the phone and waits for the user to open it. With push notifications, the app is active — it reaches out at the moments that matter. For recovery commitments, where a 24-hour lapse can undo weeks of progress, the difference between passive and active is the difference between success and failure.

**What must be true before this is done:**
- Push notifications are delivered on both iOS and Android.
- Users can control which notification types they receive (attestation reminders, danger-zone alerts, social updates).
- Duplicate and stale device tokens are handled automatically (so users don't receive duplicate notifications or notifications on devices they no longer use).
- The notification policy matrix (which notifications are sent, when, and to whom) is configurable without requiring a new release of the app.

---

#### Phase Delta Exit Gate
*All of the following must be demonstrably true before Phase Omega can begin:*

- Recovery-path protections (danger-zone timelocks, weekend multipliers, accountability partners) are fully operational.
- The core retention loop is visible and continuous: onboarding leads to progress, progress leads to reminders, reminders lead to completion, completion leads to social proof, social proof leads to re-enrollment.
- Engagement systems are live with resilient fallback behavior (if the real-time connection drops, the system degrades gracefully rather than breaking).

**What this unlocks:** Behavioral outcome data. Completion rates. Re-enrollment rates. The empirical evidence that the product changes behavior — which is the prerequisite for everything that follows.

---

### Phase Omega — The Enterprise Institution
**October – December 2026**

**Governing question:** *Can enterprises buy this?*

Phase Omega transforms Styx from a consumer product into a platform that organizations can procure, integrate, and defend to their own stakeholders. This requires not just features, but *artifacts* — documented, counsel-approved, auditable evidence that the platform is legally sound, operationally trustworthy, and commercially viable.

---

#### Omega Work Item 1 — The Legal Defense Whitepaper and Release Gate
*The legal argument must be documented, approved by counsel, and tied to the release process.*

**What it does for the user:** This is not a user-facing feature. It is an institutional prerequisite. The skill-contest legal defense — the argument that Styx is a skill-based commitment system, not a gambling platform — must be formalized in a whitepaper, reviewed and signed by legal counsel, and cryptographically tied to the release process. This means: the system cannot be deployed to production unless a current, approved version of the legal whitepaper exists in the compliance registry.

**Why it matters now:** Every enterprise procurement process includes a legal review. "We believe we're legally compliant" is not sufficient. "Here is our counsel-approved legal defense, version 3.2, signed on this date, with this cryptographic hash, and here is proof that our production system will not deploy without it" — that is sufficient.

**What must be true before this is done:**
- A formal whitepaper exists, signed by counsel, with a version number and date.
- The release pipeline refuses to deploy if no current approved whitepaper is registered.
- The public-facing legal page always links to the current approved version.
- The whitepaper's integrity can be verified by any auditor via its cryptographic hash.

---

#### Omega Work Item 2 — Enterprise Compliance Packaging
*The compliance posture must be auditable and presentable.*

**What it does for the enterprise buyer:** Organizations considering Styx for their employees (corporate wellness programs, therapist licensing, behavioral data for research) need to see a compliance surface: what data is collected, how long it's retained, who has access, what happens if a user requests deletion, what certifications apply, and what the audit trail looks like. Much of this infrastructure already exists (the data retention policy, the audit logging, the identity verification). What remains is packaging it into a format that an enterprise procurement team can evaluate.

**Why it matters now:** Enterprise sales cycles are long. The compliance documentation must be ready before the sales conversation begins, not developed during it.

---

#### Omega Work Item 3 — Enterprise Revenue Packaging
*The billing model, reporting surface, and integration points must be enterprise-ready.*

**What it does for the enterprise buyer:** The B2B foundations already exist: CRM connectors (Salesforce, HubSpot), consumption billing, data anonymization, and webhook integrations. What remains is packaging these into a coherent enterprise offering: a clear pricing model (consumption-based billing on "insights generated"), a reporting dashboard (behavioral outcomes, completion rates, engagement metrics), and integration documentation.

**Why it matters now:** The consumer product generates the behavioral data. The enterprise product monetizes it. Without enterprise-grade packaging, the data exists but cannot be sold.

---

#### Phase Omega Exit Gate
*All of the following must be demonstrably true for the roadmap to be considered complete:*

- A counsel-approved legal defense is formally registered and tied to the release process.
- The enterprise compliance surface is auditable and presentable.
- The enterprise billing model, reporting surface, and integration points are documented and operational.
- The platform can support procurement conversations with evidence-backed controls.

**What this unlocks:** Credible enterprise sales. Reduced legal and procurement friction. The ability to scale revenue beyond consumer subscriptions.

---

## VI. The Calendar

| Date | Milestone |
|------|-----------|
| **March 31, 2026** | Phase Beta work is fully in flight — no scope ambiguity remains. |
| **April 30, 2026** | Phase Beta exit gate: all five blockers closed, money controls enforceable by jurisdiction. |
| **June 30, 2026** | Phase Gamma exit gate: trust network hardening complete, collusion prevention and enforcement active. |
| **September 30, 2026** | Phase Delta exit gate: retention flywheel live and measurable, recovery protections fully operational. |
| **December 31, 2026** | Phase Omega exit gate: enterprise packaging, legal release controls, and compliance surface complete. |

---

## VII. What We Explicitly Will Not Do (Scope Guardrails)

Clarity about what *won't* be built is as important as clarity about what will. The following are consciously deferred:

- **Shared-pot and player-versus-player mechanics** (where multiple users compete for a prize pool) remain post-Omega with separate legal gates. These mechanics introduce chance-like elements that could jeopardize the skill-based legal defense.
- **Experimental verification technologies** (brain-computer interfaces, blockchain-anchored proofs, zero-knowledge privacy layers) remain research-only until the core trust economics are proven.
- **New commitment category expansion** (adding new oath categories beyond the existing seven) does not preempt the locked Beta-through-Delta critical path. The consumer product is recovery-first; categories are expanded only after the recovery product's behavioral outcomes are demonstrated.
- **Android formal beta distribution** is deferred to Phase 2 of the consumer rollout unless the iOS/TestFlight path is blocked.
- **Broad consumer web parity** (making the website a full-featured consumer product, not just an administration tool) is explicitly deferred to Phase 2.

---

## VIII. The Governing Principle

Every phase earns the right to attempt the next one. This is not bureaucracy — it is earned permission.

Phase Beta earns the right to handle real money by proving the money is safe.
Phase Gamma earns the right to scale the reviewer network by proving the evidence is trustworthy.
Phase Delta earns the right to market the product by proving people actually change their behavior.
Phase Omega earns the right to sell to enterprises by proving the platform is legally and operationally defensible.

The cost of pausing to prove each claim is low. The cost of scaling a system that hasn't earned the right to scale is catastrophic — legally, financially, and reputationally. This roadmap chooses the low-cost path.

---

## IX. Glossary

| Term | Meaning |
|------|---------|
| **Fury** | A peer reviewer — someone who examines proof submitted by other users and votes on whether the commitment was fulfilled. Named after the Greek spirits who enforce oaths. |
| **Oath** | A behavioral commitment backed by a financial stake. |
| **Vault** | The escrow account that holds staked money in trust until a verdict is reached. |
| **Protected Vault** | The portion of a user's stake that has been "earned" through prior successful completions and is no longer at risk. |
| **Active Vault** | The portion of a user's stake that is still at risk in the current commitment period. |
| **Aegis Protocol** | The health safeguard system that prevents users from setting self-destructive goals (BMI floor, weekly loss cap, cool-off periods). Named after Zeus's shield. |
| **Tavern** | The community space — leaderboards, activity feed, badges. |
| **Honeypot** | A fake review task injected into the reviewer queue to test reviewer honesty. |
| **Linguistic Cloaker** | The vocabulary translation layer that swaps internal terminology for app-store-compliant language. |
| **Settlement Outbox** | The guaranteed-delivery queue for financial transactions — ensures no payment is ever silently lost. |
| **Nonce** | A one-time challenge word or number displayed during proof capture, proving the evidence was created at that exact moment. |
| **Timelock** | A mandatory waiting period between a user's request to break a commitment and the break taking effect — designed to give the rational mind time to overrule an emotional impulse. |
| **Loss Aversion Coefficient (lambda = 1.955)** | The empirically derived ratio indicating that losing something hurts approximately twice as much as gaining the same thing feels good. The mathematical foundation of the entire product. |
| **No-Contact Contract** | The flagship consumer product — a commitment to avoid contact with a specific person, backed by a financial stake. |
| **KYC (Know Your Customer)** | The regulatory requirement to verify the identity of users before allowing them to engage in financial transactions above certain thresholds. |
| **Fail Closed** | A design principle where ambiguity results in denial rather than permission. If the system doesn't know your location, it won't let you stake money. |
| **Endowed Progress Effect** | The psychological principle that people are more likely to complete a goal if they feel they've already made progress — even if that progress is artificial. |
| **Goal-Gradient Effect** | The observation that effort increases as people get closer to a goal — the final 10% of a progress bar motivates more than the first 10%. |
| **Dopamine Trough** | The point around Day 21 of no-contact when the brain's residual neurochemical reserves are fully depleted, resulting in peak depressive symptoms and maximum vulnerability to relapse. |
| **Dominant Factor Test** | The legal test that determines whether an activity is skill-based (legal) or chance-based (regulated as gambling). Since Styx users control whether they follow through on their commitments, the outcome is skill-determined. |
| **FBO (For Benefit Of)** | A financial structure where the platform holds money in trust for the user, rather than taking ownership of it. This avoids Money Transmitter classification. |
| **Deterministic Settlement** | A settlement process where the same inputs always produce the same outputs — even if retried after a failure. No duplicate charges, no lost refunds. |
| **Phase Gate** | A formal checkpoint between phases. The evidence required to proceed must be demonstrated, not merely claimed. |
| **P0 / P1** | Priority levels. P0 = absolute blocker (the system cannot launch without it). P1 = important enhancer (the system is significantly better with it, but can technically function without it). |

---

*The road from "this works" to "this is trustworthy" is longer than the road from nothing to "this works." That is the nature of institutions. They are not built by the act of creation — they are built by the acts of constraint, verification, and earned permission that follow.*
