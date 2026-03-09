---
generated: true
department: CXS
artifact_id: C1
governing_sop: "SOP--customer-support.md"
phase: hardening
product: styx
date: "2026-03-08"
---

# Frequently Asked Questions

## Getting Started

### What is Styx?
Styx is a peer-audited behavioral accountability platform. You create a behavioral contract (an "Oath"), stake real money on it, submit proof of compliance, and a peer auditor (a "Fury") verifies whether you followed through. If you succeed, your money comes back. If you fail, you lose your stake. The system uses loss aversion (λ=1.955) — the psychological principle that losing hurts roughly twice as much as winning feels good — to make quitting genuinely costly.

### How do I create my first contract?
1. Sign up at styx.app and complete identity verification
2. Choose an Oath category (Recovery, Biological, Cognitive, Professional, Creative, Environmental, or Character)
3. Define your commitment in specific, verifiable terms (e.g., "No contact with [person] for 30 days" or "Exercise 4x per week for 4 weeks")
4. Stake your money ($39 minimum, which includes the $9 platform fee)
5. Submit proof at the intervals your contract requires
6. A Fury reviews your proof and issues a verdict

### What's a Fury?
A Fury is a peer auditor in the Styx network. Named after the Greek mythological figures who enforced oaths, Furies review the proof you submit and determine whether you've met your contract terms. They're real people — not algorithms — which means your accountability is verified by human judgment, not self-reporting.

### How much does it cost?
- **Per contract:** $39 minimum stake, of which $9 is a non-refundable platform fee. You choose how much to stake above the $39 minimum (up to $999 during beta).
- **If you succeed:** You get your stake back minus the $9 platform fee. A $39 contract returns $30 on success.
- **If you fail:** You lose your entire stake.
- **B2B practitioners:** Subscription plans from $49/mo (Solo) to $999+/mo (Enterprise).

### What oath categories are available?
Styx supports 7 categories of behavioral contracts:

| Category | Examples |
|----------|---------|
| **Biological** | Exercise frequency, sleep schedule, nutrition goals, hydration |
| **Cognitive** | Reading goals, study hours, meditation practice, screen time limits |
| **Professional** | Job applications, project deadlines, networking targets |
| **Creative** | Writing output, practice hours, portfolio pieces |
| **Environmental** | Decluttering tasks, sustainability habits, space organization |
| **Character** | Anger management, punctuality, communication commitments |
| **Recovery** | No-contact contracts, sobriety milestones, boundary enforcement |

## Money & Escrow

### Is my money safe?
Yes. All stakes are held in a Stripe FBO (For Benefit Of) escrow account — a segregated account managed by Stripe, not by Styx directly. Your money is never commingled with Styx operating funds. A double-entry integrity ledger tracks every transaction, ensuring perfect accounting at all times.

### What happens if I fail my contract?
If a Fury determines you've violated your Oath terms, your stake is forfeited. The forfeited amount is distributed as follows:
- Fury audit fee (paid to the auditor who reviewed your proof)
- Platform retention (covers infrastructure and dispute resolution costs)
- Community pool (funds future platform improvements)

The exact distribution percentages are documented in the contract terms at time of creation.

### When do I get my money back after succeeding?
Upon successful contract completion (verified by your Fury), funds are released from escrow within 3-5 business days. You'll receive a notification when the release is initiated and another when funds arrive in your linked bank account or card.

### What if the Fury makes a wrong decision?
Styx has a formal dispute resolution process:
1. **Appeal window:** You have 48 hours after a verdict to file an appeal
2. **Panel review:** A panel of 3 additional Furies reviews the original evidence
3. **Majority rules:** If 2 of 3 panel Furies overturn the original verdict, your stake is returned
4. **Final decision:** Panel verdicts are final and binding

### Can I cancel a contract mid-way?
No. Once an Oath is staked and active, it cannot be cancelled. This is by design — the inability to quit is what makes financial accountability effective. The only exception is if the Aegis protocol triggers a health safety intervention (see "What's the Aegis protocol?" below).

### What payment methods do you accept?
Styx accepts major credit and debit cards (Visa, Mastercard, American Express) and ACH bank transfers (US accounts only). All payments are processed through Stripe. We do not accept cryptocurrency, PayPal, or cash.

## Privacy & Safety

### What data do you collect?
Styx collects:
- **Account data:** Name, email, phone number (for identity verification)
- **Financial data:** Payment method (processed and stored by Stripe — Styx never sees full card numbers)
- **Behavioral data:** Contract terms, proof submissions (photos, text, timestamps), Fury verdicts
- **Usage data:** App interactions, session duration, feature usage (anonymized analytics)

We do **not** sell your data. We do **not** use your behavioral data for advertising. Full details in our Privacy Policy.

### Can my therapist see my data?
Only if you are assigned a contract through a B2B practitioner. In that case, your practitioner can see:
- Contract status (active, completed, failed)
- Proof submission history (timestamps and Fury verdicts)
- Your Integrity Score

Your practitioner **cannot** see the content of your proof submissions unless you explicitly grant photo/text access. They see verdicts, not evidence.

### What's the Aegis protocol?
The Aegis protocol is Styx's health and safety guardrail system. It activates when:
- A contract involves potentially dangerous behavior (extreme fasting, excessive exercise)
- Proof submissions indicate signs of distress or self-harm
- A Fury flags a safety concern during audit

When triggered, Aegis can pause a contract, connect you with crisis resources, or terminate a contract with a full refund — overriding normal contract rules. User safety always takes precedence over accountability mechanics.

### Is Styx HIPAA compliant?
HIPAA Business Associate Agreements (BAAs) are planned for the Enterprise tier ($999+/mo). During beta and for Solo/Practice tiers, Styx implements strong security practices (encryption, access controls, audit logging) but does not currently execute BAAs. Practitioners handling PHI should consult their compliance officer before assigning Styx contracts.

### Do you share data with insurance companies?
No. Styx never shares behavioral data, contract history, or Integrity Scores with insurance companies, employers (unless through an explicitly opted-in Corporate Wellness program), or any third party. Your accountability journey is private.

## Recovery Contracts

### How does no-contact tracking work?
Recovery Oaths (particularly no-contact contracts) are verified through proof of compliance rather than surveillance. You are not tracked — instead, you submit periodic proof that you've maintained no-contact. This might include:
- A screenshot showing no recent calls/texts to the specified contact
- A check-in statement affirming no contact
- A Fury may ask clarifying questions about edge cases

### What counts as a violation?
Violations are defined in your contract terms. For a standard no-contact Recovery Oath:
- **Violations:** Initiating a phone call, text, DM, email, or in-person meeting with the specified person
- **Not violations:** Accidentally seeing them in public (unavoidable contact), receiving an unsolicited message from them (you didn't initiate), emergency situations (medical, legal)

Edge cases are resolved by your Fury using the preponderance-of-evidence standard.

### Can I have multiple recovery contracts simultaneously?
Yes. You can have up to 3 active contracts at once (across any categories). Each contract has its own Fury, its own stake, and its own timeline. Multiple Recovery Oaths can cover different contacts or different aspects of your recovery.

### What if I'm in danger and need to break no-contact?
The Aegis protocol covers genuine safety situations. If you need to contact someone for a legitimate emergency (medical crisis, legal requirement, child safety), document the situation and submit it as part of your proof. The Fury will evaluate whether the contact was a genuine emergency. Safety always overrides accountability.

## Fury Auditors

### How do I become a Fury?
1. Apply at styx.app/fury with your real identity (name, email, government ID verification)
2. Complete the Fury Training Module (approximately 45 minutes) covering audit standards, evidence evaluation, dispute procedures, and Aegis protocol awareness
3. Pass the certification quiz (80% minimum score)
4. Complete 5 supervised audits with a senior Fury reviewer
5. Receive full Fury status and begin receiving audit assignments

### How much can I earn as a Fury?
Furies earn an audit fee for each contract they review. Earnings depend on:
- **Contract value:** Higher-stake contracts pay higher audit fees
- **Audit volume:** More contracts reviewed = more earnings
- **Accuracy:** Furies with high accuracy ratings receive priority assignment
- Typical earnings during beta: $2-$8 per audit, with experienced Furies completing 5-15 audits per day

### What happens if I make a wrong verdict as a Fury?
If your verdict is overturned on appeal:
- Your accuracy score decreases
- You may be temporarily suspended from new assignments if accuracy drops below 85%
- Repeated overturned verdicts trigger a re-certification requirement
- You are not personally liable for financial losses — the appeal process and community pool handle that

### Can I be a Fury and also have contracts?
Yes, but you will never be assigned to audit your own contracts, and the matching algorithm prevents assignment conflicts (e.g., auditing someone you know). The system maintains separation between your auditor and participant roles.

## B2B / Enterprise

### How do I add clients as a practitioner?
1. Log into your practitioner dashboard at styx.app/dashboard
2. Navigate to "Clients" and click "Invite Client"
3. Enter the client's email — they'll receive an invitation to join Styx under your practice
4. Once they accept, you can assign contracts from your template library or create custom ones
5. Their contract activity appears in your dashboard analytics

### Can I customize contract templates?
Yes. Practice tier ($199/mo) and above can create custom contract templates:
- Define Oath terms, duration, proof frequency, and stake range
- Set default contract parameters for specific client cohorts
- Create category-specific templates (e.g., "4-Week Recovery Template" or "Executive Accountability Package")
- Templates can be shared across practitioners in your organization (Enterprise tier)

### What analytics are available for practitioners?
The practitioner dashboard shows:
- **Client overview:** Active contracts, completion rates, current Integrity Scores
- **Cohort analytics:** Aggregate completion rates by category, duration, and stake level
- **Trends:** Week-over-week and month-over-month client engagement metrics
- **Alerts:** Notifications when clients miss proof submissions or fail contracts
- Enterprise tier adds: data lake export (CSV/JSON), webhook integrations, and custom reporting

### Do you offer SSO for enterprise?
SAML 2.0 single sign-on is planned for the Enterprise tier ($999+/mo). During beta, enterprise accounts use email/password authentication with mandatory 2FA. SSO is on the roadmap for the launch phase.

### What about multi-location practices?
Enterprise tier supports multiple locations with:
- Centralized billing and administration
- Per-location practitioner accounts with role-based permissions
- Cross-location analytics and reporting
- Unified client management across all locations

## Technical

### What browsers are supported?
Styx web app supports the latest two versions of:
- Chrome (desktop and mobile)
- Firefox (desktop and mobile)
- Safari (desktop and mobile, including iOS Safari)
- Edge (desktop)

### Is there a mobile app?
A native mobile app (iOS and Android) built with React Native/Expo is in development and will be available at public launch. During beta, the web app is fully responsive and optimized for mobile browsers.

### Can I export my data?
Yes. Under Settings > Data, you can request a full export of your Styx data in JSON format. This includes:
- Account information
- Contract history (terms, verdicts, timestamps)
- Proof submissions (text and image references)
- Integrity Score history
- Financial transaction records

Exports are generated within 24 hours and available for download for 7 days. This supports your right to data portability.

### What happens to my data if I delete my account?
When you request account deletion:
1. Active contracts must be completed or resolved first (no mid-contract deletions)
2. A 30-day grace period begins during which your account is deactivated but data is retained
3. After 30 days, all personal data is permanently purged from our systems
4. Financial transaction records are retained for 7 years as required by law (anonymized)
5. Aggregated, anonymized behavioral data may be retained for platform improvement

### Is there an API?
A public API is planned for the Enterprise tier. During beta, no external API access is available. Enterprise API features will include:
- Webhook notifications for contract events (created, proof submitted, verdict issued, completed, failed)
- Client management endpoints (invite, assign, deactivate)
- Analytics export endpoints
- Contract template management
