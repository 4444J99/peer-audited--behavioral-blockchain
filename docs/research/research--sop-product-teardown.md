# SOP: Deep-Dive Product & Competitor Analysis

> **Note:** This is a project-specific instance of the system-wide SOP at `meta-organvm/SOP--market-gap-analysis.md`. Customize the Reporting Template columns for your product.

This Standard Operating Procedure (SOP) defines the rigorous, multi-dimensional research framework used to analyze competitors, parallel products, and market niches. It is designed to move beyond surface-level feature lists into the "Skeleton, Bones, and Meat" of a product's existence.

---

## 1. Discovery Phase (The "Net")
Before analyzing, you must cast a wide net to find direct and indirect competitors.

*   **Direct Competitors:** Products solving the *exact same* problem for the same audience.
*   **Indirect Competitors:** Products solving the *same* problem for a *different* audience (e.g., HealthyWage for weight loss vs. Styx for breakups).
*   **Parallel Products:** Products using the *same technology or methodology* in an unrelated field (e.g., decentralized insurance for behavioral auditing).
*   **Tools:**
    *   Google Search: `[niche] apps`, `[problem] solutions`, `[competitor] alternatives`.
    *   App Store / Play Store: Search keywords and check "Similar Apps."
    *   Crunchbase / Pitchbook: Find funding rounds and related companies.
    *   Social Media Ads Library: Search for active ads from competitors.

---

## 2. Structural Analysis (The "Skeleton, Bones, Meat")
Analyze the target product using this three-layer framework:

### A. The Skeleton (Technical Architecture)
*   **Tech Stack:** Frontend (React, Next, Vue), Backend (Node, Rails, Python), Mobile (Native, Flutter, React Native).
*   **Technical Deduction Checklist:** For closed-source products, deduce the stack by checking past Job Postings (e.g., "React Developer"), looking at platform-specific Integrations, and running BuiltWith scans. 
    *   *Note: When exact technical details are unknown, theorize. Use the unknown as an opportunity to tease out ideas and explore multiple architectural paths, eventually converging on superior procession strategies for our own build.*
*   **Data Integrity:** How do they handle transactions? (Postgres, Blockchain, Double-entry).
*   **Verification Engine:** How do they verify user claims? (Self-reporting, API/Sensor, Human Audit).
*   **Infrastructure:** Hosting (AWS, Vercel), Payment (Stripe, PayPal).

### B. The Bones (Behavioral Logic & Messaging)
*   **Value Proposition:** What is the "One Big Promise"?
*   **Behavioral Economics:** Which principles are used? (Loss Aversion, Scarcity, Social Proof).
*   **Psychological Hook:** What is the "Aha!" moment? What keeps them coming back?
*   **Tone:** Clinical, Sassy, Clinical, or Encouraging?

### C. The Meat (Features & Social Proof)
*   **Core Features:** List the top 3-5 functional elements.
*   **Marketing Funnel:** How do users enter? (Ads -> Landing Page -> Wizard -> Signup).
*   **Evidence of Failure:** Dig beneath the marketing. Hunt for Reddit "rants", Trustpilot 1-star reviews, and "Why I quit" blog posts to find the product's actual rot.
*   **Social Proof:** Specific stats ($ on the line, user count, PR logos).
*   **Pricing:** Subscription vs. One-time vs. Commission-based.

---

## 3. The "Life Course" Investigation
Trace the product's history and growth trajectory.

*   **Founders:** What is their pedigree? (Academic, Serial Entrepreneur, Technical).
*   **Funding:** Seed -> Series A -> Exit. Who are the investors?
*   **Pivots:** Did they start B2C and move to B2B? (e.g., stickK's move to corporate wellness).
*   **Ad History:** What were their early ads vs. current ads? Use the Wayback Machine or Ads Library.
*   **Brand & SEO Sensitivity Check:** Audit for naming collisions. Does the product name or core terminology conflict with high-risk or illicit industries (e.g., dark-web marketplaces) that could damage trust?

---

## 4. Gap Identification (The "Shatter Point")
Identify where the product is "broken" or "vulnerable."

*   **The Oracle Problem:** Can the user cheat? (e.g., hardware spoofing on StepBet).
*   **The Weasel Point:** Identify exactly where the user is most likely to lie because it's easier than complying, and how the system attempts—and fails—to stop them.
*   **Economic Flaws:** Does the house take too much? (e.g., DietBet's high commission).
*   **UX Friction:** Is it too technical/intimidating? (e.g., Beeminder's "data nerdery").
*   **Emotional Gaps:** Is it too "soft" or too "cold"?

---

## 5. Phase V: Synthesis
After individual analyses are complete, aggregate all findings into a single **Market Matrix** (CSV or Markdown table). Map all competitors against the product's primary Core Drives to identify unifying market vulnerabilities and broad white-space opportunities.

---

## 6. Reporting Template
Every deep dive should conclude with a table:

| Dimension | [Competitor Name] | [Our Counter-Strategy] |
| :--- | :--- | :--- |
| **Verification** | [Self-Report/API] | [Our verification approach] |
| **The Weasel Point** | [Where users lie/cheat] | [How we close the loophole] |
| **Stakes** | [Subscription/Pledges] | [Our stakes/incentive model] |
| **Enforcement Economics** | [Who gets the money on failure: House/Charity?] | [Our audit/payout distribution] |
| **Audit** | [Internal Referees/Staff] | [Our audit approach] |
| **Trust** | [Brand/PR] | [Our trust architecture] |

---
*Version: 1.2.0 | Compiled: March 6, 2026*
