# Research: Competitor Annotated Bibliography

**Status:** Completed | **Version:** 2.0.0 | **Date:** March 6, 2026
**Scope:** 10 Commitment Device & Behavioral Market Competitors
**Governing Standard:** `meta-organvm/METADOC--research-standards.md` (Stage I)

---

## 1. General Behavioral Economics & Context

*   **Source:** [Kahneman & Tversky: Prospect Theory](https://scholar.google.com/scholar?q=Kahneman+Tversky+Prospect+Theory)
    *   **Trust Score:** 10/10
    *   **The Nugget:** Loss aversion coefficient is ~2.0. Styx uses 1.955 for precise calibration.
    *   **Keywords:** `Loss Aversion`, `Mathematical Foundation`.
*   **Source:** [Atomic Habits (James Clear) - Habit Contracts](https://jamesclear.com/habit-contract)
    *   **Trust Score:** 9/10
    *   **The Nugget:** Habit contracts require a witness and a penalty. Styx digitizes both.
    *   **Keywords:** `Commitment Contracts`, `Behavioral Framework`.
*   **Source:** [Thaler & Sunstein: Nudge (2008)](https://scholar.google.com/scholar?q=Thaler+Sunstein+Nudge)
    *   **Trust Score:** 10/10
    *   **The Nugget:** Choice architecture shapes behavior more than willpower. Styx's contract structure is itself a nudge — it pre-commits the user before temptation strikes.
    *   **Keywords:** `Choice Architecture`, `Libertarian Paternalism`, `Pre-Commitment`.
*   **Source:** [Ariely & Wertenbroch (2002): Procrastination, Deadlines, and Performance](https://scholar.google.com/scholar?q=Ariely+Wertenbroch+procrastination+deadlines)
    *   **Trust Score:** 9/10
    *   **The Nugget:** Self-imposed deadlines improve performance but are weaker than external deadlines. Styx converts self-imposed commitments into externally-enforced contracts.
    *   **Keywords:** `Self-Binding`, `External Enforcement`, `Procrastination`.

---

## 2. Technical & Competitor Specifics

### A. stickK.com (The Academic Baseline)
*   **Primary URL:** [stickK.com](https://www.stickk.com)
*   **Support/FAQ:** [How stickK Works](https://stickk.zendesk.com/hc/en-us/articles/206833157-How-it-Works)
*   **Trust Score:** 8/10
*   **The Nugget:** Reliance on human referees. Success rate jumps from 35% to 78% with stakes + referee. But referee collusion is endemic.
*   **Theorized Procession:** Likely a monolithic PHP/Ruby app using standard web-hooks for notifications. No real-time sensor logic.
*   **Keywords:** `Commitment Contract`, `Referee Collusion`, `Academic Origin`.

### B. Beeminder (The Data Nerdery)
*   **Primary URL:** [Beeminder.com](https://www.beeminder.com)
*   **API Docs:** [api.beeminder.com](https://api.beeminder.com)
*   **Trust Score:** 8/10
*   **The Nugget:** "Akrasia Horizon" (7-day rule). Integrations with 100+ Autodata sources. But Autodata sync errors create a "Dispute Debt" where users fight the system rather than changing behavior.
*   **Theorized Procession:** Distributed worker system polling third-party APIs (RescueTime, Duolingo) hourly/daily to update the "Bright Red Line."
*   **Keywords:** `Quantified Self`, `API Fragility`, `Akrasia Horizon`.

### C. Forfeit (The Hardcore Challenger)
*   **Primary URL:** [forfeit.app](https://www.forfeit.app)
*   **Verification:** Uses GPT-4 Vision + small human team.
*   **Trust Score:** 7/10
*   **The Nugget:** First mover on AI-assisted visual verification. But centralized review creates a bottleneck: the platform is judge and beneficiary of forfeiture.
*   **Theorized Procession:** High-volume image upload to S3 -> Lambda triggers GPT-4 Vision API -> Confident approvals auto-processed -> Ambiguous cases sent to a web-based human review dashboard.
*   **Keywords:** `AI Verification`, `Centralized Bottleneck`, `House Wins`.

### D. Pavlok (Hardware Aversion)
*   **Primary URL:** [pavlok.com](https://pavlok.com)
*   **Manuals:** [Shock Clock 3 Hardware Specs](https://manuals.plus/pavlok/shock-clock-3-manual)
*   **Trust Score:** 6/10
*   **The Nugget:** 136V-610V shock intensity. Hand-to-mouth detection via accelerometer. But users simply remove the band — hardware enforcement has a trivial bypass.
*   **Theorized Procession:** Bluetooth Low Energy (BLE) connection from band to phone. Local DSP on the band detects "Zap" triggers; the phone app logs events and manages settings.
*   **Keywords:** `Aversion Therapy`, `Hardware Bypass`, `Physical Punishment`.

### E. Focusmate (Social Body Doubling)
*   **Primary URL:** [focusmate.com](https://focusmate.com)
*   **Infrastructure:** [Daily.co Video Integration](https://www.daily.co/blog/focusmate-body-doubling/)
*   **Trust Score:** 7/10
*   **The Nugget:** Polyvagal Theory (co-regulation via presence). But passive scrolling during sessions is undetectable — presence != productivity.
*   **Theorized Procession:** WebRTC sessions managed by Daily.co. Matchmaking via a simple calendar availability database (PostgreSQL/Redis).
*   **Keywords:** `Body Doubling`, `Social Presence`, `Passive Scrolling Gap`.

### F. HealthyWage / WayBetter (The Social Betting Incumbents)
*   **Primary URL:** [healthywage.com](https://www.healthywage.com), [waybetter.com](https://www.waybetter.com)
*   **Trust Score:** 7/10
*   **The Nugget:** Communal prize pools with video-verified weigh-ins. But 25% house take creates misaligned incentives, and water-loading/timing exploits are well-documented.
*   **Theorized Procession:** Centralized pot management with manual staff review of video weigh-ins (24-72hr latency). Step verification via Apple Health/Google Fit sync — same fragile API pattern as Beeminder.
*   **Keywords:** `Social Betting`, `House Commission`, `Weight Spoofing`, `Oracle Problem`.

### G. Habitica (The Gamified Honor System)
*   **Primary URL:** [habitica.com](https://habitica.com)
*   **API Docs:** [habitica.com/apidoc](https://habitica.com/apidoc/)
*   **Trust Score:** 7/10
*   **The Nugget:** RPG tropes (XP, Gear, Party Quests) applied to habit tracking. Massive ADHD/gaming community. But the Honor System is the Oracle — users click checkboxes to "complete" habits with zero verification. "Saving the party" by lying is normalized.
*   **Theorized Procession:** Node.js/Express/MongoDB (open source). API v3 updates character stats on self-report. No verification layer whatsoever.
*   **Keywords:** `Gamification`, `Honor System`, `Social Pressure`, `Self-Deception Loop`.

### H. Accountable AI / Opal / Freedom (The Distraction Gaters)
*   **Primary URL:** [opal.so](https://www.opal.so), [freedom.to](https://freedom.to)
*   **Trust Score:** 6/10
*   **The Nugget:** Hard app-gating via OS hooks (Apple FamilyControls, Android AccessibilityService). But Apple/Google privacy API changes continuously erode capability. The Uninstall Loophole is trivial: removing the app removes all enforcement.
*   **Theorized Procession:** iOS uses `FamilyControls`/`ManagedSettings`/`DeviceActivity` frameworks (requires Apple entitlements). Android uses AccessibilityService + VPN DNS sinkholing. Desktop uses local process monitoring agents.
*   **Keywords:** `OS Sandboxing`, `Uninstall Loophole`, `Privacy API Fragility`, `App Gating`.

### I. TaskRatchet (The Minimalist Binary Commitment)
*   **Primary URL:** [taskratchet.com](https://taskratchet.com)
*   **Trust Score:** 6/10
*   **The Nugget:** Per-task staking with Stripe enforcement. Clean, utility-driven model for one-off commitments. But total reliance on self-reporting — the user clicks "Done" and the system believes them. No artifact verification.
*   **Theorized Procession:** Modern web stack (React/Node). Stripe for direct financial enforcement. Outbound Beeminder integration for meta-goals.
*   **Keywords:** `Binary Commitment`, `Self-Report`, `Minimalist Scope`, `Honor System`.

### J. Coach Lee / Brad Browning / Mend (No Contact & Recovery Niche)
*   **Primary URL:** [myexbackcoach.com](https://www.myexbackcoach.com) (Coach Lee), [mend.com](https://www.mend.com)
*   **Trust Score:** 5/10 (content quality varies; enforcement = zero)
*   **The Nugget:** Multi-million dollar industry built on two pillars: Healing (Mend, Let It Go) and Strategy (Coach Lee, Brad Browning). 80% failure rate in first 30 days of No Contact. All platforms are "cheerleader" apps — zero enforcement, zero verification. Days-since-contact counters are manually reset by users.
*   **Theorized Procession:** Content delivery platforms (audio lessons, journaling prompts, "panic buttons"). "Fake text" scratchpads for venting. No behavioral monitoring whatsoever.
*   **Keywords:** `No Contact`, `Enforcement Gap`, `Empathy Over Integrity`, `80% Failure Rate`.

---

## 3. Market Rot & Failure Evidence (Rants & Reviews)

### Referee & Honor System Failures
*   **Source:** [Reddit r/ExNoContact - "I broke No Contact"](https://www.reddit.com/r/ExNoContact/)
    *   **Trust Score:** 6/10 (anecdotal but high-volume)
    *   **The Nugget:** 80% failure rate in the first 30 days due to dopamine withdrawal. Users report breaking at 2am when willpower is lowest.
    *   **Keywords:** `No Contact Failure`, `Dopamine Withdrawal`, `Willpower Depletion`.
*   **Source:** [Trustpilot: stickK - "Referees don't check"](https://www.trustpilot.com/review/www.stickk.com)
    *   **Trust Score:** 7/10
    *   **The Nugget:** Collusion is the standard operating procedure for users wanting to avoid loss. Friends rubber-stamp compliance without verification.
    *   **Keywords:** `Referee Collusion`, `Social Gaming`, `Trust Failure`.
*   **Source:** [Reddit r/Beeminder - "Weaseling out of a charge"](https://www.reddit.com/r/beeminder/)
    *   **Trust Score:** 7/10
    *   **The Nugget:** Users spend significant effort fighting "unfair" data sync errors rather than changing behavior. The system creates adversaries of its own users.
    *   **Keywords:** `Dispute Debt`, `API Sync Failure`, `User Adversarial`.

### Gamification & Bypasses
*   **Source:** [Reddit r/habitica - "I just check everything off"](https://www.reddit.com/r/habitica/)
    *   **Trust Score:** 6/10
    *   **The Nugget:** Users routinely fabricate completions to protect party members from HP damage. The cooperative social structure incentivizes lying.
    *   **Keywords:** `Honor System Abuse`, `Party Damage Exploit`, `Self-Deception`.
*   **Source:** [Reddit r/Focusmate - "Partner was scrolling the whole time"](https://www.reddit.com/r/Focusmate/)
    *   **Trust Score:** 6/10
    *   **The Nugget:** Body doubling only works when both parties are genuinely working. Passive presence (scrolling, AFK) is undetectable by the system.
    *   **Keywords:** `Passive Presence`, `Accountability Theater`, `Social Loafing`.

### Economic & Platform Rot
*   **Source:** [Reddit r/HealthyWage - "The house always wins"](https://www.reddit.com/r/HealthyWage/)
    *   **Trust Score:** 6/10
    *   **The Nugget:** 25% house take means most winners barely break even. Water-loading before weigh-ins is openly discussed.
    *   **Keywords:** `House Commission`, `Weight Spoofing`, `Misaligned Incentives`.
*   **Source:** [Pavlok Amazon Reviews - "Took the band off"](https://www.amazon.com/dp/B07GR99Y3X)
    *   **Trust Score:** 7/10
    *   **The Nugget:** Hardware aversion has a trivial bypass: removal. Multiple reviews report the novelty wearing off within 2 weeks.
    *   **Keywords:** `Hardware Bypass`, `Novelty Decay`, `Aversion Tolerance`.
*   **Source:** [App Store Reviews: Opal - "Just delete and reinstall"](https://apps.apple.com/us/app/opal-screen-time-for-focus/id1497465230)
    *   **Trust Score:** 7/10
    *   **The Nugget:** The Uninstall Loophole is the most commonly discussed bypass. Apple's privacy changes continuously reduce what gating apps can actually enforce.
    *   **Keywords:** `Uninstall Loophole`, `OS Sandbox Ceiling`, `Privacy API Erosion`.
*   **Source:** [TaskRatchet GitHub Discussions - "I just clicked done"](https://github.com/TaskRatchet/taskratchet-web)
    *   **Trust Score:** 6/10
    *   **The Nugget:** Self-reporting with real money creates a perverse incentive: users lie to avoid payment rather than completing the task.
    *   **Keywords:** `Self-Report Fraud`, `Perverse Incentive`, `Honor System Failure`.

---
*Generated per METADOC Stage I & Gold Path SOP | Styx Research | v2.0.0*
