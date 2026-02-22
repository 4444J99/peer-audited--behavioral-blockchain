# Styx: Gatekeeper Compliance Forensics

## Executive Summary
This report analyzes the two primary "Execution Choke Points" for the Styx platform: **Payment Processors** and **Mobile App Stores**. While our legal theory (Skill-Based Contest) is robust under US law, the internal policies of Stripe, Apple, and Google are frequently stricter and more arbitrary. Failure to pre-clear these gatekeepers results in instant de-platforming.

---

## 1. Payment Processor "Shadow Ban" Forensics

### The Stripe Reality
- **Status**: **Prohibited/High-Risk.** Stripe explicitly prohibits "Games of skill... with a monetary or material prize" and "Contests with entry fees."
- **The Risk**: Using a standard Stripe account for Styx will likely trigger a "Risk Review" within 48 hours of the first $1,000 in volume, leading to a permanent account freeze and 120-day fund hold.
- **Competitor Strategy (DietBet/HealthyWage)**:
    - Use specialized **High-Risk Merchant Accounts** (e.g., Worldpay, Corepay, Allied Wallet).
    - Leverage **FBO (For Benefit Of)** structures with partner banks to stay outside the flow of funds.
    - Utilize **PayPal** for payouts, as PayPal has more nuanced underwriting for "skill contests" than Stripe’s automated systems.

### Strategic Mitigation
1.  **Avoid Standard Stripe**: Do not use a generic Stripe integration for "Wagers/Stakes." 
2.  **High-Risk Underwriting**: Apply for a high-risk account early in Phase Alpha. This requires a 3-6% transaction fee (vs Stripe's 2.9%) and a 5-10% rolling reserve.
3.  **Terminology Sanitization**: In merchant applications, use the term **"Performance-Based Accountability Escrow"** rather than "Contest" or "Betting."

---

## 2. App Store "Section 5.3" Forensics (Apple/Google)

### Apple Guideline 5.3 (Gaming, Gambling, and Lotteries)
- **5.3.3 Prohibition**: Apps may not use In-App Purchase (IAP) to buy credit or currency for real-money gaming. 
- **The Benefit**: This legally allows us to use external payment processors (Stripe/PayPal) for stakes, bypassing the 30% "Apple Tax."
- **5.3.4 Requirement**: Real-money gaming must be geo-restricted to licensed jurisdictions and must be **Native iOS Code** (no HTML5 wrappers for the core contest logic).

### The "UI Redaction" Cloaking Strategy
To maintain a "Health & Fitness" categorization rather than "Gambling":
1.  **Linguistic Cloaking**: Remove all instances of "bet," "wager," "pot," and "odds" from the iOS binary. Replace with "Stake," "Commitment," "Vault," and "Integrity Bonus."
2.  **Web-Only Onboarding**: Handle the initial deposit and contract signing on the **Web Dashboard**. The Mobile App should be a "Verification Utility" that tracks progress but does not initiate the financial "Bet."
3.  **Geo-Fencing**: Hard-block IP addresses from "Any Chance" states (e.g., Arizona, Arkansas, Delaware) at the API level.

---

## 3. Revised Implementation Tasks (Gatekeeper Additions)

### **Phase Alpha (Month 1) Updates:**
- [ ] **Task**: Submit "High-Risk Merchant Account" applications (Corepay/Allied Wallet).
- [ ] **Task**: Implement "Linguistic Middleware" to swap themed terms (Fury/Fury) for "Stake/Vault" depending on the client platform.

### **Phase Beta (Month 2) Updates:**
- [ ] **Task**: Ensure all HealthKit bridges are written in **100% Native Swift** to satisfy Guideline 4.7.
- [ ] **Task**: Implement IP-based Geofencing for restricted jurisdictions.

---

## 4. Final Verdict
Styx is viable, but **Mainstream FinTech (Stripe/Square) is the enemy.** We must embrace the High-Risk industry infrastructure early to avoid a catastrophic launch-day freeze. 

**"The gatekeepers don't care if it's legal; they care if it's risky. We must look like a medical tool, not a casino."**
