# Founder Decision Brief — 2026-07-31

**For:** the business-strategy session following today's demo (DR-009)
**From:** Anthony · **Decides:** Jessica, or jointly where marked

---

## How to read this

Every item below **already has a default and is already shipping.** Nothing is
waiting on you. A reply changes what ships; silence keeps the default.

That format is deliberate. On 2026-03-09 a briefing went out with five open
questions, you answered all five on 2026-03-10 in doc comments, and nothing
carried the answers back. For four and a half months the code held a constant
labelled *"pending Jessica decision"* for a call you had already made. Two things
caused that: answers landed on a surface the repo couldn't see, **and** the code
was parked in a waiting state instead of shipping something.

So: answers from this session go into
`planning--founder-decisions-of-record.md` as `DR-010`+ **today**, and no constant
in this codebase is ever again labelled "pending" anyone.

---

## First, the one that is not a question

**A. Sign the founder agreement (DR-007).** Drafted 2026-03-05, unsigned for 147
days. 50/50 equity, four-year vest, one-year cliff, Host LLC, POC triggers NewCo.

Unsigned means no vest, no cliff, and **no IP assignment** — across 382 commits.
It is the only item here that gets strictly worse the more we build, and the only
one that later work cannot repair. It is also upstream of every signature we need
next: the counsel retainer, the Apple account, and the merchant application all
want an entity as counterparty.

DocuSign it in the room, or name the single term blocking it and timebox that to a
week.

---

## Decisions

**Q-1 · Pricing posture.** Five monetization models are live in code — `MVP_39`
($30 stake + a $9 fee), `EARLY_ACCESS_199`, a $4.99 per-contract ticket, a
$14.99/mo subscription, and a $5 appeal fee. **No decision of record covers any of
them.** Until today the app told users "Entry total $39" and the terms of service
asserted a non-refundable $9 fee — for money that is never charged. I removed the
false numbers; I did not pick real ones.
› *Default:* beta is free, all pricing constants collapse to one disabled source,
the number gets decided before any real-money charge.
› *Cost to change later:* **low now, high after launch** — repricing on live users
is a different conversation than pricing before them.
› **Joint decision under DR-007.**

**Q-2 · Counsel budget and authority.** Three P0 beta blockers (#315, #316, #317)
are legal and have not moved in 144 days. The counsel packet is already written —
appendices A–E exist on disk. What is missing is a retainer. #315 has sat because
"retain outside counsel" is a category, not an action, and because engaging one is
a "significant financial commitment," which DR-007 makes joint.
› *Default:* I send 5–8 referral requests Monday and bring you the shortlist.
› *Ask:* a cap I can proceed under without coming back. This single line converts
the oldest blocker on the board into a Monday task.

**Q-3 · Strike threshold — 2 or 3?** Your self-reporting sketch implies one
warning then forfeiture on the **second** miss. Code forfeits on the **third**.
› *Default:* **stays 3.** Tightening the condition under which someone loses their
deposit is not a change I will make on the strength of an example.
› *Note:* the constant is shared by missed check-ins **and** self-reported relapse.
Moving it to 2 also tightens relapse forfeiture, which nobody has proposed — so
"yes, 2" likely means splitting it into two constants.

**Q-4 · Check-in deadline, in whose time?** You asked "time needs to be clear
11:59PM?" Right now the cron runs on **server** time, not the participant's.
› *Default:* server midnight, which is fine for a single-timezone cohort and
breaks the moment one participant is in another.
› *Recommend:* participant-local 11:59 PM before the first cohort spans zones.

**Q-5 · What do pod members see on a miss?** Your sketch says the warning should
be "visible to pod members." Today it is a private notification to the user only.
Pod-visible miss state does not exist and is the largest unbuilt item on the list.
› *Default:* stays private until decided.
› *Ask:* miss **count** only, or the fact of a miss with any context? This is a
breakup-recovery cohort — "River missed a check-in" reads differently here than in
a fitness pod.

**Q-6 · Endowed progress at $0.** DR-005 removes the $5 onboarding bonus. The
progress mechanic it feeds is a display effect — it grants no money — so removing
the money leaves the mechanic intact but unfunded.
› *Default:* keep the mechanic, remove the money.
› *Ask:* confirm, so DR-005 can ship without half-wiring a behavioral feature.

**Q-7 · Apple account holder.** #141 has been blocked 144 days and is the only
hard gate on distributing a Phase 1 iOS build. Its literal ask: who owns the
Apple Developer account, who controls App Store Connect, who uploads.
› *Default:* individual enrolment under me (1–3 days), transferred to the Host LLC
at NewCo. Organisation enrolment needs a D-U-N-S number and is slower.

**Q-8 · Merchant account timing (your DR-008 item).** Underwriters ask for the
legal opinion, so applying before counsel wastes the application.
› *Default:* after counsel, not now. Deliberately parked, not forgotten.

**Q-9 · User terms (your DR-008 item).** Open 143 days.
› *Default:* counsel drafts, you review. This converts it from something you owe
into something downstream of Q-2 — which is the correct shape and takes it off
your plate.

**Q-10 · Pitch deck contradicts DR-001.** The deck sells a two-phase
**fitness-first** go-to-market with enterprise second; DR-001 decided no-contact →
fitness → B2B, no-contact first. It also still sells the $5 onboarding bonus
(removed by DR-005) and a 15%/85% platform-Fury split (superseded by DR-002).
› *Default:* unchanged. The deck is the artifact most likely to reach an outsider,
so I am not editing the strategy in it unilaterally.
› **Joint decision under DR-007.**

**Q-11 · Product name review (DR-008, joint).** Open since March.
› *Default:* five minutes today, or we drop it permanently.

---

## One proposal

**Start the dogfood cohort on web next week, not on iOS.**

`planning--phase1-private-beta-scope.md` defers non-iOS distribution "**unless
iOS/TestFlight is blocked**." It has been blocked 144 days, so that condition is
met. The web app has the complete no-contact journey — dashboard, contract
creation, daily attestation, wallet, Fury review — and today's demo runs on it.

That would put founders plus 5–10 trusted people through a real contract with test
money next week, instead of after an Apple enrolment we do not control. **We have
383 commits, ~3,000 tests, and zero users.** Every remaining feature decision is
currently being made with no information.

It is a scope amendment under that document's change-control, so it needs your
agreement, not just mine.

---

## What changed since we last spoke

Five defects that all looked fine from the outside — green CI, no TODOs:

- The **no-contact scan could not fail.** With no telephony source installed —
  which is every build — it reported "No Contact Maintained" for everyone. That is
  the verification behind the only contract type in the beta.
- The app granted full access **and stake capture** in Nevada and South Dakota,
  where our own 50-state survey says block.
- The deploy config **failed open** on unresolvable location, quietly defeating the
  US-only boundary.
- **Appeals have been charging $5** in violation of DR-004 since March.
- The **$9 platform fee** was advertised and contractually asserted, and never
  charged.

All five are fixed in PR #858. None of them were on any roadmap, because nothing
was measuring whether a user could reach the product — and nothing has been
deployed yet, so nobody could.
