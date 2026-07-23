# User Research Protocol

## When to Conduct Research

- **Exploratory**: Before building new features (understand user needs, pain points)
- **Evaluative**: Before shipping an experiment variant (usability test, comprehension check)
- **Validating**: After shipping (did it work? what broke?)
- **Continuous**: Churn interviews, win/loss analysis, NPS follow-ups

---

## Session Types

### Semi-Structured Interview (30-45 min)

Best for: Exploratory research, understanding motivations, pain point discovery.

**Structure:**
| Phase | Duration | Content |
|-------|----------|---------|
| Warm-up | 3 min | Consent reminder, context, "tell me about yourself" |
| Context | 5 min | Current behavior / habits around the problem space |
| Experience | 10-15 min | Walk through their actual experience with Styx (or a prototype) |
| Reflection | 5-10 min | What worked, what didn't, what surprised them |
| Close | 2 min | "Anything else?", thank you, incentive delivery |

### Usability Test (20-30 min)

Best for: Evaluative research on a specific flow.

**Structure:**
| Phase | Duration | Content |
|-------|----------|---------|
| Warm-up | 2 min | Consent, context |
| Task 1 | 5 min | "Please create a new contract" — observe, do not guide |
| Task 2 | 5 min | "Submit your daily proof" — observe |
| Task 3 | 5 min | "Check your earnings" — observe |
| Debrief | 5-8 min | SUS questionnaire, open feedback |
| Close | 2 min | Thank you, incentive |

### Survey (quantitative)

Best for: Validating findings at scale, measuring satisfaction.

- NPS survey: Sent 7 days after first contract completion
- Churn survey: Sent when user deletes account or lets 3 contracts expire
- Onboarding survey: After first oath + contract creation

---

## Interview Guide Template

### Exploratory Interview

```
## Introduction (3 min)
Hi [name], thanks for joining. We're working on improving Styx and want to hear about your experience.
A few quick notes:
- There are no right or wrong answers
- You can stop at any time
- Your responses are anonymized

Do you mind if I record this session? [ ] Yes [ ] No

## Background (5 min)
1. Tell me a bit about yourself and what brought you to Styx.
2. What were you hoping to get out of it?
3. Have you used similar accountability tools before? (Coaching, apps, communities)

## Experience Walkthrough (15 min)
4. Walk me through the last time you used Styx — start to finish.
   [Probe: What was easy? What was confusing? What surprised you?]
5. How did you feel when you received a verification request?
6. Talk me through a time when you almost skipped a proof — what happened?

## Reflection (10 min)
7. If you could change one thing about Styx, what would it be?
8. What part of the experience has been most valuable to you?
9. Is there anything that almost stopped you from continuing?

## Wrap-up (2 min)
10. Is there anything else you'd like to share?
Thanks for your time — your feedback is incredibly helpful.
```

### Usability Test Script

```
## Introduction (2 min)
Hi [name], I'm going to ask you to complete a few tasks in Styx.
- Please think aloud — say what you're looking at and what you're trying to do
- I didn't design this, so you can't hurt my feelings
- We're testing the app, not you

## Task 1: Create a Contract (5 min)
"Imagine you want to commit to exercising 3 times this week. Please create that contract."
Observations:
[ ] User finds Create button within 5 seconds
[ ] User understands stake amount
[ ] User completes flow without assistance
[ ] Time to complete: ____

## Task 2: Submit a Proof (5 min)
[If using test app] "It's the next day — please submit your exercise proof."
Observations:
[ ] User finds the proof submission flow
[ ] User understands the camera/upload step
[ ] User completes submission
[ ] Time to complete: ____

## Debrief (5 min)
1. On a scale of 1-7, how easy was creating a contract? (1=very hard, 7=very easy)
2. What was the most confusing part?
3. If you could wave a magic wand, what would change?

## System Usability Scale (SUS)
[Administer standard SUS questionnaire]
```

---

## Consent Form

```
# Styx User Research Consent Form

## Purpose
You are invited to participate in a user research session to help us improve Styx.
Your participation is voluntary.

## What to Expect
- Session duration: ~[30-45] minutes
- You will be asked about your experience with Styx
- With your permission, we may record audio/screen for analysis
- Recording is optional — you can decline and still participate

## Data Handling
- Responses are anonymized and aggregated
- Recordings are stored encrypted and deleted after analysis is complete
- No personal data is shared with third parties
- You may withdraw consent at any time by emailing [contact email]

## Risks and Benefits
- No known risks beyond those of everyday computer use
- Benefits: your feedback directly shapes the product
- Participants in paid research receive [$xx] compensation

## Contact
Questions or concerns: [research contact email]

## Consent
[ ] I have read and understood this form
[ ] I consent to participate in this session
[ ] I consent to audio/video recording (optional)

Name: ______________________
Date: ______________________
Signature: ______________________
```

---

## Analysis Protocol

### Qualitative (interviews, usability tests)

1. **Same-day debrief**: within 1h of session, write a 3-bullet summary
2. **Affinity mapping**: after 5 sessions, cluster findings into themes
3. **Severity rating**:
   - **Critical**: Blocks user from completing core flow
   - **Major**: User can complete flow but with significant friction
   - **Minor**: User completes flow but expresses confusion
   - **Cosmetic**: User preference or nice-to-have

### Quantitative (surveys)

- NPS: `promoters - detractors` per cohort
- SUS score: standard scoring formula (target > 68)
- Open-ended: thematic coding with frequency counts

---

## Participant Tracking

```yaml
session: USR-001
date: 2026-07-01
type: interview
user_type: new_user
cohort: consumer
status: analyzed
findings:
  - theme: "Stake confusion"
    severity: major
    quote: "I didn't understand what would happen if I lost the money"
  - theme: "Motivation clarity"
    severity: minor
    quote: "I wish I could see why I'm doing this every time"
```

Maintain a running log in `docs/research/sessions/`.
