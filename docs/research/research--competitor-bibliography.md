# Research: Competitor Annotated Bibliography

**Status:** Draft | **Version:** 1.0.0 | **Date:** March 6, 2026
**Scope:** 10 Commitment Device & Behavioral Market Competitors

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

---

## 2. Technical & Competitor Specifics

### A. stickK.com (The Academic Baseline)
*   **Primary URL:** [stickK.com](https://www.stickk.com)
*   **Support/FAQ:** [How stickK Works](https://stickk.zendesk.com/hc/en-us/articles/206833157-How-it-Works)
*   **The Nugget:** Reliance on human referees. Success rate jumps from 35% to 78% with stakes + referee.
*   **Theorized Procession:** Likely a monolithic PHP/Ruby app using standard web-hooks for notifications. No real-time sensor logic.

### B. Beeminder (The Data Nerdery)
*   **Primary URL:** [Beeminder.com](https://www.beeminder.com)
*   **API Docs:** [api.beeminder.com](https://api.beeminder.com)
*   **The Nugget:** "Akrasia Horizon" (7-day rule). Integrations with 100+ Autodata sources.
*   **Theorized Procession:** Distributed worker system polling third-party APIs (RescueTime, Duolingo) hourly/daily to update the "Bright Red Line."

### C. Forfeit (The Hardcore Challenger)
*   **Primary URL:** [forfeit.app](https://www.forfeit.app)
*   **Verification:** Uses GPT-4 Vision + small human team.
*   **Theorized Procession:** High-volume image upload to S3 -> Lambda triggers GPT-4 Vision API -> Confident approvals auto-processed -> Ambiguous cases sent to a web-based human review dashboard.

### D. Pavlok (Hardware Aversion)
*   **Primary URL:** [pavlok.com](https://pavlok.com)
*   **Manuals:** [Shock Clock 3 Hardware Specs](https://manuals.plus/pavlok/shock-clock-3-manual)
*   **The Nugget:** 136V-610V shock intensity. Hand-to-mouth detection via accelerometer.
*   **Theorized Procession:** Bluetooth Low Energy (BLE) connection from band to phone. Local DSP on the band detects "Zap" triggers; the phone app logs events and manages settings.

### E. Focusmate (Social Body Doubling)
*   **Primary URL:** [focusmate.com](https://focusmate.com)
*   **Infrastructure:** [Daily.co Video Integration](https://www.daily.co/blog/focusmate-body-doubling/)
*   **The Nugget:** Polyvagal Theory (co-regulation via presence).
*   **Theorized Procession:** WebRTC sessions managed by Daily.co. Matchmaking via a simple calendar availability database (PostgreSQL/Redis).

---

## 3. Market Rot & Failure Evidence (Rants & Reviews)
*   **Source:** [Reddit r/ExNoContact - "I broke No Contact"](https://www.reddit.com/r/ExNoContact/)
    *   **The Nugget:** 80% failure rate in the first 30 days due to dopamine withdrawal.
*   **Source:** [Trustpilot: stickK - "Referees don't check"](https://www.trustpilot.com/review/www.stickk.com)
    *   **The Nugget:** Collusion is the standard operating procedure for users wanting to avoid loss.
*   **Source:** [Reddit r/Beeminder - "Weaseling out of a charge"](https://www.reddit.com/r/beeminder/)
    *   **The Nugget:** Users spend significant effort fighting "unfair" data sync errors.

---
*Generated per SOP Stage I | Styx Research*
