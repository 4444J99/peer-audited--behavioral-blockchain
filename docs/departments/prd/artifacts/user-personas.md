---
generated: true
department: PRD
artifact_id: P2
governing_sop: "SOP--user-research.md"
phase: genesis
product: styx
date: "2026-03-08"
---

# User Personas

Four primary personas representing Styx's core user segments. Each persona captures the motivations, frustrations, and usage patterns that drive product decisions.

---

## Persona 1: Alex -- The Heartbroken Enforcer

### Demographics

| Attribute | Value |
|-----------|-------|
| Age | 28 |
| Location | Austin, TX |
| Occupation | UX designer at a mid-size SaaS company |
| Income | $75,000/year |
| Relationship status | Recently single (3 weeks post-breakup) |
| Tech comfort | High (daily smartphone user, familiar with fintech apps) |

### Background

Alex ended a 2.5-year relationship and is struggling with the urge to text their ex. Friends have been supportive but inconsistent -- they say "don't text them" but there is no enforcement mechanism. Alex has already broken no-contact twice in the first week, each time feeling worse afterward. Alex found Styx through a Reddit thread about breakup recovery apps.

### Goals

1. **Maintain no-contact for 30 days** without caving to the urge to reach out
2. **Feel accountable to something real** -- not just willpower or friends' advice
3. **Track progress** and see evidence of their own discipline over time
4. **Recover faster** by breaking the feedback loop of contact-regret-contact

### Frustrations

- "My friends say 'just don't text them' but that's not enough. I need consequences."
- "I deleted the number but I still remember it. I need something that catches me if I slip."
- "Therapy is helpful but my therapist can't monitor me 24/7."
- "Other habit apps don't take breakups seriously -- they treat it like quitting soda."

### Usage Scenario

Alex creates a **Recovery Oath** with the following parameters:
- Duration: 30 days
- No-contact targets: ex-partner (1 target)
- Stake: $39 (standard contract)
- Verification: Daily check-in (self-report) + digital exhaust monitoring (call/text log screenshot)

Every morning, Alex opens Styx and confirms no contact was made. Every 3 days, a Fury auditor reviews the submitted call log screenshots. The $39 stake is real -- Alex can afford to lose it, but the loss aversion (lambda = 1.955) makes the threat feel like losing $76. This psychological amplification is the product working as designed.

On Day 12, Alex feels a strong urge to text. They open Styx, see the stake amount, see their integrity score (55 after completing the first week), and the urge passes. The "Grill Me" AI feature asks: "What would contacting them actually accomplish?" Alex closes the app and goes for a run instead.

### Key Features Used

- Recovery contract creation
- Daily check-in
- Digital exhaust proof submission
- Grill Me AI challenge
- Integrity score dashboard
- Progress timeline

### Success Criteria

- Completes the 30-day no-contact contract
- Receives full stake return ($39)
- Integrity score rises to 55+
- Returns to create a second contract (cognitive oath: daily journaling)

---

## Persona 2: Jordan -- The Disciplined Professional

### Demographics

| Attribute | Value |
|-----------|-------|
| Age | 35 |
| Location | Denver, CO |
| Occupation | Senior software engineer (remote) |
| Income | $145,000/year |
| Relationship status | Married, one child (age 3) |
| Tech comfort | Very high (builds software for a living) |

### Background

Jordan has been trying to lose 20 pounds for two years. They have a gym membership they use 2x/week but need to hit 4x/week to see results. Jordan has tried Habitica (too gamified, felt childish), Beeminder (self-reporting felt dishonest), and a personal trainer (too expensive long-term at $120/session). Jordan wants something that combines financial accountability with external verification.

### Goals

1. **Exercise 4x/week for 12 weeks** to hit a target weight
2. **Have someone else verify** that they actually went to the gym (not just checked a box)
3. **Spend less than a personal trainer** while getting similar accountability
4. **See measurable progress** in both habit consistency and physical results

### Frustrations

- "I can lie to an app. I can't lie to someone looking at my gym selfie with a timestamp."
- "Beeminder charges me when I fail but I know I'm the one reporting -- it feels hollow."
- "My wife supports me but she's not going to check if I went to the gym at 6am."
- "I don't need motivation. I need enforcement."

### Usage Scenario

Jordan creates a **Biological Oath** with the following parameters:
- Duration: 84 days (12 weeks)
- Verification: 4x/week photo proof (gym selfie with timestamp + location metadata)
- Stake: $150 (elevated stake, Jordan's integrity score allows up to $200)
- Grace days: 2/month (for illness or travel)

Jordan submits gym selfies through the Styx mobile app. EXIF metadata (timestamp, GPS) is extracted and displayed to Fury auditors alongside the photo. Furies verify: (1) the photo shows a gym environment, (2) the timestamp is within the verification window, (3) the location is consistent with a gym.

The Aegis protocol validated Jordan's contract at creation: BMI is 28.1 (above the 18.5 floor), and the target weight loss rate is 1.2 lbs/week (well under the 2% velocity cap). The contract was approved automatically.

At week 6, Jordan uses a grace day for a family vacation. The ledger records the grace day usage; no penalty applied. Jordan's integrity score has risen to 62 from successful weekly verifications.

### Key Features Used

- Biological oath creation with Aegis validation
- Photo proof submission with EXIF metadata
- Fury audit verification
- Grace day management
- Integrity score progression
- Progress analytics dashboard
- ELI5 AI feature (explains contract terms simply)

### Success Criteria

- Completes the 12-week contract (48 of 48 required sessions, minus grace days)
- Receives full $150 stake return
- Integrity score reaches 70+
- Converts to recurring contracts (new 12-week cycle)
- Recommends Styx to colleagues (referral channel)

---

## Persona 3: Dr. Sarah Chen -- The B2B Practitioner

### Demographics

| Attribute | Value |
|-----------|-------|
| Age | 42 |
| Location | Portland, OR |
| Occupation | Licensed clinical psychologist (CBT specialty) |
| Income | $130,000/year (private practice) |
| Practice size | Solo practitioner, 35 active clients |
| Tech comfort | Moderate (uses practice management software, telehealth) |

### Background

Dr. Chen has been practicing CBT for 14 years. Her biggest frustration is homework compliance -- she assigns behavioral experiments and journaling exercises, but only about 35% of clients follow through between sessions. She has tried apps like Noom (too consumer-focused) and therapy-specific platforms (too clinical, no real consequences). She heard about Styx at a behavioral health conference and was intrigued by the financial accountability model.

### Goals

1. **Increase client homework compliance** from 35% to 60%+
2. **Assign structured behavioral contracts** that integrate with her treatment plans
3. **Monitor client progress between sessions** without manual check-ins
4. **Generate outcome data** for insurance reporting and practice improvement

### Frustrations

- "I can assign homework but I have no way to verify or enforce it between sessions."
- "My clients want accountability but I can't be their accountability partner 24/7."
- "Other therapy apps are passive trackers. I need something with teeth."
- "I need HIPAA-adjacent data handling. I can't use consumer apps for clinical work."

### Usage Scenario

Dr. Chen subscribes to the **Solo Practitioner** plan ($49/month, 10 active client contracts). She uses the B2B dashboard to:

1. **Create contract templates** for common CBT homework (daily thought records, behavioral experiments, exposure exercises)
2. **Assign contracts to clients** during sessions, customizing stake amount and duration per client
3. **Monitor compliance** between sessions via the practitioner dashboard
4. **Review outcomes** in aggregate for practice reporting

For a client working on social anxiety, Dr. Chen creates a 4-week Professional Oath: attend one social event per week, submit photo proof. The client stakes $39. Dr. Chen can see the contract status, Fury verification results, and completion rate in her dashboard.

The key insight for Dr. Chen: she does not need to be the verifier. The Fury network handles proof review. She just assigns the contract and reviews the data. This scales her accountability capacity from 1 (herself) to the entire Fury network.

### Key Features Used

- B2B practitioner dashboard
- Contract template creation
- Client contract assignment
- Compliance monitoring
- Outcome analytics and reporting
- Batch contract management
- Practitioner-specific Fury review escalation

### Success Criteria

- Client homework compliance increases to 55%+ within 3 months
- Retains subscription for 6+ months
- Upgrades to Practice tier ($199/mo) as she onboards more clients
- Provides testimonial for B2B marketing
- Refers 2+ practitioner colleagues

---

## Persona 4: Marcus -- The Fury Auditor

### Demographics

| Attribute | Value |
|-----------|-------|
| Age | 31 |
| Location | Chicago, IL |
| Occupation | Freelance graphic designer |
| Income | $55,000/year (variable) |
| Platform role | Fury (peer auditor) |
| Tech comfort | High |

### Background

Marcus discovered Styx as a regular user -- he completed a 30-day Professional Oath (daily design practice). After reaching an integrity score of 65, he was invited to apply as a Fury auditor. Marcus is attracted to the Fury role because: (1) it pays a small bounty per audit, (2) it appeals to his sense of fairness, and (3) it supplements his freelance income during slow months.

### Goals

1. **Earn consistent supplemental income** from audit bounties ($2-5 per audit)
2. **Maintain a high auditor reputation** to receive more assignments
3. **Contribute to a fair system** -- Marcus believes in accountability and dislikes self-reporting honor systems
4. **Audit efficiently** -- spend < 2 minutes per proof review

### Frustrations

- "Some proof submissions are borderline. I need clear criteria, not just vibes."
- "I worry about being unfair. What if I fail someone who actually did the work?"
- "The $2 stake per audit is small but it keeps me honest. I don't want to lose it on a bad call."
- "Round-robin assignment sometimes gives me audits outside my area of knowledge."

### Usage Scenario

Marcus opens the **Fury Workbench** each morning and reviews his assigned audits. Today he has 6 pending reviews:

1. **Gym selfie** (Biological Oath): Photo shows a gym, timestamp matches window, GPS is consistent. Marcus votes PASS. Time: 45 seconds.
2. **Study session screenshot** (Cognitive Oath): Screenshot shows a code editor with timestamp. The code looks fresh (not a cached page). Marcus votes PASS. Time: 30 seconds.
3. **Social event photo** (Professional Oath): Photo shows a coffee shop but no other people visible. Ambiguous. Marcus votes NEEDS_MORE_INFO and requests a follow-up photo. Time: 90 seconds.
4. **No-contact check-in** (Recovery Oath): Call log screenshot shows no outgoing calls to the blocked number. Marcus votes PASS. Time: 20 seconds.
5. **Weight check-in** (Biological Oath): Scale photo shows weight and date. Marcus checks that the loss rate is within Aegis velocity cap. Votes PASS. Time: 60 seconds.
6. **Meditation session** (Cognitive Oath): Timer app screenshot showing 20 minutes completed. Marcus votes PASS. Time: 15 seconds.

Marcus completes all 6 audits in under 8 minutes. His auditor reputation ticks up. He earns $12-30 in bounties for this batch depending on quorum outcomes. He checks back at lunch for new assignments.

### Key Features Used

- Fury Workbench (audit queue)
- Proof review interface (photo viewer + metadata panel)
- Vote casting (PASS / FAIL / NEEDS_MORE_INFO)
- Auditor reputation dashboard
- Bounty earnings tracker
- Conflict-of-interest auto-detection
- Quorum result notifications

### Success Criteria

- Maintains audit accuracy > 95% (agreement with quorum consensus)
- Audits 20+ proofs per week consistently
- Earns $200+/month in bounty income
- Auditor reputation stays above 80 (scale 0-100)
- Does not get flagged for conflict-of-interest or bad-faith auditing
- Remains an active Fury for 6+ months

---

## Persona Interaction Map

```
Alex (User) ----creates----> Recovery Oath
                                  |
                            Fury Assignment
                                  |
Marcus (Fury) ---audits---> Proof Submission
                                  |
                            Quorum Decision
                                  |
Alex (User) <---receives--- Stake Return / Forfeit

Dr. Chen (B2B) ---assigns--> Contract to Client
                                  |
                            Client submits proof
                                  |
Marcus (Fury) ---audits---> Proof
                                  |
Dr. Chen (B2B) <--monitors-- Compliance Dashboard
```

## Persona Priority

| Persona | Segment | Beta Priority | Revenue Channel |
|---------|---------|---------------|-----------------|
| Alex | Breakup recovery | P0 (launch wedge) | Consumer contract fee ($9 per $39) |
| Jordan | Fitness/health | P1 (beta expansion) | Consumer contract fee (variable) |
| Dr. Chen | B2B practitioner | P1 (beta soft launch) | Subscription ($49-999+/mo) |
| Marcus | Fury auditor | P0 (required for all) | Bounty cost (platform expense) |
