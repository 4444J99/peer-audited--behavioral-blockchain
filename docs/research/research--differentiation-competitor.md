<img src="https://r2cdn.perplexity.ai/pplx-full-logo-primary-dark%402x.png" style="height:64px;margin-right:32px"/>

# Pillar 2: Market Differentiation \& Competitor Analysis

The Objective: To tear down the existing players in the habit-tracking space so you know exactly where their weaknesses are.
> "Act as a Senior Product Strategist. I need a teardown of the gamified habit-tracking and financial-stakes app market.
> Please analyze the top competitors, specifically: DietBet, StepBet, HealthyWage, Habitica, and Beeminder.
> For each competitor, provide:
>  * Their core mechanic (How do they keep users engaged?).
>  * Their monetization strategy (How do they make money?).
>  * Their primary weakness or vulnerability (Where does their system fail regarding cheating, user retention, or feature sprawl?).
>  * Based on their weaknesses, suggest three distinct market gaps a new app could exploit by introducing a 'Fury Bounty' (financially incentivizing users to catch others faking their progress)."
>

Here’s a structured teardown of the five products, plus how a “Fury Bounty” mechanic could exploit their blind spots.

***

## 1. DietBet

### Core mechanic

- Group weight‑loss betting. Users join “games” with a buy‑in (e.g., 20–100+ dollars) and must lose a fixed percentage of body weight (e.g., 4% in 4 weeks, or 10%+ in longer “Transformer” games). Winners split the pot.[^1_1][^1_2]
- Verification via photo (and sometimes video) weigh‑ins: users submit scale photos with a keyword; referees approve.[^1_3][^1_1]
- Engagement levers:
    - Short, time‑boxed challenges (30 days, 6 months).
    - Social feeds inside each game, sometimes with influencers/coaches.
    - The sunk‑cost + fear‑of‑loss effect: “don’t lose your bet”.


### Monetization model

- Takes a fixed commission off the total pot, commonly cited around 10–25%.[^1_4][^1_5]
- Uses that commission to ensure “no winner loses money” even when many people succeed, which in practice caps upside: in some scenarios winners effectively just get their stake back minus membership fees.[^1_4]
- Additional revenue from:
    - Memberships (e.g., to play multiple overlapping games or special formats).[^1_6][^1_4]
    - Sponsored/celebrity games and affiliate partnerships.[^1_5]


### Primary weaknesses / vulnerabilities

1. **Cheating and unhealthy optimization**
    - Known pattern: users “water load” for the initial weigh‑in and then crash‑diet / dehydrate for the final weigh‑in to hit the number without real fat loss.[^1_7][^1_1]
    - Some users openly describe “fighter-style” weight cuts just for final weigh‑ins, not sustainable lifestyle change.[^1_7]
    - Verification is limited to a couple of snapshots; there is no robust longitudinal fraud detection.
2. **Perceived unfair economics and low ROI**
    - In some games, if many people hit their goal, DietBet’s cut means winners may get back only their original stake (or marginally more), leading to posts like “PSA do not use DietBet”.[^1_4]
    - Commission is taken from the entire pot, not just “profits”, which feels unintuitive to many and gets labeled “scammy” even if technically disclosed.[^1_8][^1_5][^1_4]
3. **Short‑termism and retention**
    - Games are typically one‑off, short sprints: motivate strongly for 4 weeks, then drop off.
    - Once users are near their target weight, the fixed % goals become increasingly difficult and encourage unhealthy behavior or churn.[^1_8][^1_4]
    - After a couple of cycles, many either burn out or feel they have “harvested” the system and leave.

### Fury Bounty–driven market gaps vs DietBet

1. **Continuous, crowd‑audited verification instead of two weigh‑in snapshots**
    - Gap: current model checks only start/end weights; everything in between is invisible and easy to game.
    - Fury Bounty angle: require periodic micro‑proofs (short videos with dynamic prompts, body circumference, heart‑rate/step summaries) that can be randomly surfaced for peer audit. “Furies” who spot inconsistent patterns (e.g., implausible weight trajectory, reused photos, obvious editing) earn a bounty from the offender’s stake.
    - Result: a reputation for being meaningfully harder to cheat than DietBet, while still remote‑friendly.
2. **Reward structure tied to *quality* of loss, not just final number**
    - Gap: DietBet implicitly rewards any method that hits the final number, including crash dieting and water manipulation.[^1_7][^1_4]
    - Fury Bounty angle: add bounties for catching “unhealthy wins” (suspicious patterns such as massive week‑of drop after flat weight, or body measurements not matching claimed loss). Users could earn by flagging and evidencing “cutting” behavior against clearly stated rules (e.g., >X% loss in last 3 days invalidates win).
    - This positions the new app as “evidence‑based, sustainable weight betting,” explicitly differentiating from DietBet’s loopholes.
3. **Transparent economics with user‑aligned anti‑fraud pool**
    - Gap: DietBet’s commission feels extractive and opaque.[^1_5][^1_4]
    - Fury Bounty angle: publish a clear split such as:
        - 80% pot to honest winners
        - 10% to an “Integrity Pool” used to pay Fury Bounties and fund dispute resolution
        - 10% platform fee
    - When a fury successfully proves cheating, their bounty comes from the offender’s stake plus the Integrity Pool, not from honest winners. This creates a differentiator: “you’re not competing with hidden house rake; you’re competing with cheaters for bounties.”

***

## 2. StepBet (WayBetter / StepBet)

### Core mechanic

- Users bet (often around 40 dollars) that they can hit personalized step goals for multi‑week games (typically 6 weeks: 1 warm‑up + 5 active weeks).[^1_9][^1_10][^1_11]
- App reads historic activity from a tracker (Fitbit, Apple Watch, Garmin, Apple Health, etc.) to set:
    - “Active” days target
    - Higher “Power” or “Stretch” days
- To win, you must hit Active targets 4 days/week and Power targets 2 days/week (typical default) across the game; miss and you’re out.[^1_12][^1_10][^1_13]


### Monetization model

- Non‑members: StepBet takes a cut of the pot (commonly cited 12.5–15%, rising over time; some games now around 15–25%).[^1_10][^1_14][^1_15]
- Membership / WayBetter subscription:
    - Annual or multi‑month membership lets you play multiple simultaneous games and often avoids the pot cut.[^1_15][^1_11]
    - Recently, users report WayBetter membership pricing increases (e.g., 129 dollars for six months), which significantly shifts ROI and perceived value.[^1_16][^1_17][^1_18]


### Primary weaknesses / vulnerabilities

1. **Small upside vs. rising fixed costs**
    - Typical profit per successful six‑week game is on the order of 5–10 dollars, with many users reporting about 6–7 dollars for 40 dollar bets in non‑member games.[^1_14][^1_10][^1_16]
    - With higher membership fees (e.g., 129 dollars/6 months), users must win many games just to break even, and perceived payoff has trended downward over time.[^1_17][^1_16]
2. **Goal inflation and opaque difficulty**
    - Step targets increase based on historical activity; long‑time users report that goals can become unsustainably high.[^1_13][^1_10]
    - “Maintenance” or “recovery” games that stabilize or lower targets are often locked behind membership tiers, which feels like pay‑to‑fix‑a‑problem-they-created.[^1_13]
3. **Easy to spoof tracker data; minimal anti‑cheat**
    - As with any step‑based system, users can game it by shaking the device, attaching it to pets/fans, or doing micro‑movements not equivalent to real activity. There is no strong social or adversarial verification layer.
    - Complaints around technicalities (missed syncs causing failure) and rigid customer support further erode trust.[^1_19]
4. **Perception that WayBetter/StepBet may be financially strained**
    - Users report payout delays (from instant to 1–8 days), weaker support, and WayBetter crowdfunding pitches, raising questions about platform stability.[^1_20]
    - Higher minimum bets and fewer players per game also appear, which can affect both community feel and pot dynamics.[^1_20]

### Fury Bounty–driven market gaps vs StepBet

1. **Device‑agnostic, anomaly‑detected steps with crowd verification**
    - Gap: StepBet relies mainly on raw step counts; it has little tooling to detect obviously artificial patterns.
    - Fury Bounty angle: algorithmically surface suspicious traces (e.g., perfect hourly stepping, abrupt spikes at 11:59 pm) and let rats scrutinize them. If they can show convincing evidence of spoofing (for example, video of a device on a paint shaker posted by the user, inconsistent GPS, or implausible cadence profiles), they collect a bounty.
    - This enables marketing the product as “cheat‑resistant step betting” and will attract users frustrated by perceived cheaters.
2. **Geo‑and‑social verification for higher‑stakes games**
    - Gap: StepBet is purely remote; there is no meaningful identity or real‑world co‑presence check.
    - Fury Bounty angle:
        - Introduce “High‑Integrity Leagues” where:
            - Participants verify identity once (KYC‑style).
            - Local clusters (same city/region) can opt into occasional in‑person check‑ins (e.g., weekly community walk/race).
            - Furies in that cluster can challenge obviously inconsistent claims (“never seen this person on any runs; steps look fake”), with strong proof incentives.
    - This opens a segment for much higher stakes than StepBet can safely support.
3. **Transparent, user‑owned anti‑cheat pool**
    - Gap: StepBet’s economics feel like small wins plus invisible rake and rising membership fees.[^1_14][^1_16][^1_17]
    - Fury Bounty angle: again, clearly reserve a portion of every pot for bounties and explicitly show, per game:
        - How many suspected cheaters were caught
        - How much was redistributed
        - Which users earned bounties
    - Honest grinders feel that their upside includes harvesting cheaters, not just subsidizing the house.

***

## 3. HealthyWage

### Core mechanic

- Individual “make your own bet” on weight loss:
    - User picks target weight, timeline (6–36 months), and monthly wager.
    - The site returns a promised payout if the goal is met, often significantly higher than the total stake.[^1_21][^1_22][^1_23]
- Verification via video weigh‑ins, doctor/health-club verification for some products.[^1_24][^1_21]
- Also runs team challenges and step‑based challenges similar to StepBet.[^1_25][^1_22]


### Monetization model

- Built on actuarial math: most participants fail, so lost bets finance winners and margin.[^1_26][^1_23]
- Revenue sources:
    - The difference between total stakes and payout obligations (embedded “admin fee”).
    - Team and corporate‑wellness challenges, sometimes sponsored or packaged via insurers/employers.[^1_27][^1_26]
    - Step challenges with entry fees and small profit margins per user.[^1_25]


### Primary weaknesses / vulnerabilities

1. **Opaque prize calculations**
    - Prize calculators appear dynamic and sometimes change; users notice that formulas and sample payouts shift, which can feel manipulative.[^1_28][^1_22]
    - People often do not understand effectively what spread/edge the company is taking, only that “they make money when you lose”.[^1_23][^1_21]
2. **Health and sustainability issues**
    - Same pattern as DietBet: crash dieting, extreme regimes to beat the clock. Some users or observers highlight laxative dehydration strategies and fast regain after the bet.[^1_21][^1_27]
    - There is almost no reward for *maintaining* weight after success.
3. **Verification limitations**
    - Video weigh‑ins are stricter than photos, but still remote. Subtle manipulations (e.g., using hidden weights at the initial weigh‑in, clothing tricks) are hard to detect.
    - Limited ongoing monitoring between endpoints; cheaters can maintain two different “weigh‑in setups” without peers noticing.
4. **Retention problem post‑bet**
    - Many report winning a large bet and then gaining weight back within months.[^1_21]
    - Once a big bet is cashed out, there is no structural reason to stay; the economics and stress of another big commitment are daunting.

### Fury Bounty–driven market gaps vs HealthyWage

1. **Actuarially fair, auditable odds + crowd‑audited actuarial engine**
    - Gap: HealthyWage’s calculator is a black box; trust relies on brand and testimonials.[^1_28][^1_23]
    - Fury Bounty angle:
        - Publish simplified actuarial assumptions and expected win/loss rates by segment (age, BMI, timeframe).
        - Allow “actuarial rats” (quant‑minded users) to audit for exploitable inconsistencies; if they find mispriced bet categories or statistical anomalies, pay out a bounty in governance tokens or credits.
    - This ladders into a positioning of “transparent, user‑audited weight betting.”
2. **Bounties for exposing unhealthy-but-technically-legal behavior**
    - Gap: current incentives don’t distinguish healthy vs. harmful means; only the final scale reading matters.[^1_27][^1_21]
    - Fury Bounty angle:
        - Explicitly outlaw certain behaviors (e.g., dehydration at >X% rapid loss, diuretics) and invite rats to flag social‑media posts or logs where users brag about using them.
        - Use captured stakes to fund support for “maintainers” (long‑term maintenance pools).
3. **Maintenance pools that pay rats for catching relapses (with consent)**
    - Gap: no structured support once a challenge is over; people often rebound weight.[^1_21]
    - Fury Bounty angle:
        - After a successful bet, users can optionally enter a maintenance pool where they stake a smaller monthly amount that they only lose if they cross an agreed regain threshold.
        - Furies (peers in the same pool) can earn small bounties for flagging unreported regains or obviously manipulated weigh‑ins, using longer time‑series of photos, body measurements, and lifestyle data.
    - This reframes the product as a multi‑year commitment architecture, not a one‑off stunt.

***

## 4. Habitica

### Core mechanic

- Gamified habit/task manager styled as an RPG:
    - Users create Habits, Dailies, and To‑dos; completing them grants XP and gold.[^1_29][^1_30]
    - Gold buys in‑game items, equipment, pets, mounts; leveling unlocks classes (Warrior, Mage, Rogue, Healer).
    - Parties \& quests: groups fight bosses where each member’s Dailies/Habits translate into damage or party damage taken.[^1_31][^1_29]
- Everything is self‑reported; no device integration or external proof.


### Monetization model

- Freemium:
    - Free for core habit features.[^1_32][^1_29]
    - Monetizes via gems (premium currency) and subscriptions:
        - Direct gem purchases with real money.
        - Subscriptions grant a monthly allowance of gems and the ability to convert gold to gems up to a cap (e.g., up to 45–50 gems/month at highest subscription tiers).[^1_33][^1_34][^1_35]
    - Group plans for teams/organizations.
- Cosmetic content (gear, backgrounds, pets, mounts, seasonal items) is the main monetized value.[^1_36][^1_33]


### Primary weaknesses / vulnerabilities

1. **Pure honor system; trivial to “cheat”**
    - Community and devs explicitly frame cheating as only hurting yourself; many responses say there is “no such thing as cheating” unless you are in competitive challenges.[^1_37][^1_38]
    - For many, this is a strength (low pressure). But for users who need real external accountability or financial stakes, it is a non‑starter.
2. **Limited “game depth” and slow feature progress**
    - Frequent criticism: not enough actual game; tasks feel disconnected from shallow RPG mechanics.[^1_38]
    - Very slow pace of new functional features; recent history dominated by cosmetic additions and bug fixes.[^1_39][^1_40]
3. **Volunteer‑heavy model and community scandals**
    - Habitica has relied heavily on unpaid moderators, artists, and community managers; critics argue the for‑profit company benefits from large volumes of free labor.[^1_39]
    - 2022–2024 saw controversies: mistreatment of moderators, removal of guilds and taverns, perceived hollowing‑out of community features.[^1_40][^1_39]
    - This degrades the social layer that was Habitica’s differentiator versus generic habit trackers.
4. **No built‑in financial stakes**
    - External stakes are manual (e.g., users privately agree to penalties/rewards). There is no integrated, enforceable “if I fail, I lose money” mechanic.

### Fury Bounty–driven market gaps vs Habitica

1. **RPG‑like habit app with *trustable* progress**
    - Gap: Habitica proves nothing about real‑world behavior; some users literally treat it as a clicker game.[^1_30][^1_37]
    - Fury Bounty angle:
        - Keep an RPG shell but require proof for certain high‑value habits (photos, geotagging, integration logs).
        - Furies can inspect and challenge suspect submissions in competitive modes; confirmed fakes lose in‑game progress *and* money.
    - This fills the niche of “Habitica, but with real accountability and money on the line.”
2. **Paid moderators and fury auditors instead of unpaid labor**
    - Gap: Habitica’s moderation/content system depends on unpaid volunteers, leading to burnout and scandal.[^1_39]
    - Fury Bounty angle:
        - Pay a percentage of platform revenue into a shared “governance bounty” pool.
        - Moderators and fury‑auditors earn from this pool based on work performed (fraud investigations, rule enforcement, dispute resolution).
    - This becomes part of the brand: “your fees pay the people who keep the game fair,” a direct rebuttal to Habitica’s criticized model.
3. **Cross‑party competitive leagues with audited scoring**
    - Gap: Habitica’s PvE boss fights are mostly cooperative, with minimal ranking or trustworthy competition; proposals for rankings have been resisted largely due to cheating risk and design complexity.[^1_41][^1_42]
    - Fury Bounty angle:
        - Create seasons where parties compete for real prize pools.
        - Every scoring event in high‑stakes leagues can be challenged by rats for bounty; parties must maintain clean records.
    - That opens a more esport‑like, spectator‑friendly layer that Habitica cannot safely support on an honor system.

***

## 5. Beeminder

### Core mechanic

- “Goal tracking with teeth”:
    - User defines a numerical goal and a goal rate (e.g., 3 gym sessions/week, 400 XP/day in Duolingo).[^1_43][^1_44]
    - Beeminder draws a “yellow brick road” between current value and target; user must keep their cumulative data points on or within a safe buffer of that road.
    - If the user falls off the road, they “derail” and are charged a pledge amount (starting at 5 dollars and escalating with repeated derailments).[^1_45][^1_43]
- Data entry via manual input or numerous autodata integrations (RescueTime, GitHub, Duolingo, Fitbit, etc.).[^1_44][^1_46]


### Monetization model

- Primary: derailment charges (penalties for failure).[^1_45][^1_43]
    - Pledges escalate exponentially by default (e.g., 5 → 10 → 30 → 90 dollars), though users can cap them.[^1_43][^1_45]
- Secondary: premium subscriptions:
    - Unlock higher pledge caps, custom goal types, auto‑ratcheting, multi‑goal tools, and other power features.[^1_47][^1_48][^1_45]
    - Some users pay for plans mainly to get advanced automation, not necessarily to pay more in derails.


### Primary weaknesses / vulnerabilities

1. **Cheating and “weaseling” by falsifying data**
    - Multiple users report being tempted to (or actually) lie to avoid charges, especially when pledges become large.[^1_49][^1_47]
    - Even with autodata, some integrations allow retroactive editing of source data or recorded values.[^1_50][^1_51]
    - Beeminder recognizes this; the founders have written about “cheating” and introduced “weasel‑proofing” and supporters, but it remains a fundamental risk.[^1_52][^1_53]
2. **Cognitive and UX friction**
    - New users find setup confusing (slopes, safety buffer, yellow brick road semantics), and the UI feels technical.[^1_54][^1_45]
    - Many churn after first few days by just cancelling all goals or lowering pledges; the teeth never really bite, so the value proposition is never felt.[^1_48]
3. **Penalty anxiety and avoidance**
    - Some users find monetary penalties so stressful that they either:
        - Stop entering data honestly (cheating), or
        - Cancel/pause goals preemptively whenever life gets complex.[^1_55][^1_48]
    - This makes Beeminder self‑selecting for a niche who are both willing to risk real money and confident enough not to panic.

### Fury Bounty–driven market gaps vs Beeminder

1. **Externalized verification instead of self‑report**
    - Gap: Beeminder largely trusts whatever data shows up, with only weak weasel‑proof mechanisms.[^1_51][^1_52][^1_55]
    - Fury Bounty angle:
        - For high‑stakes goals, require proof artifacts (screenshots, logs, GPS traces) that are stored and can be randomly audited.
        - Furies can browse past “on-the-edge” days and challenge suspicious points; if the challenge is upheld, the user is retroactively derailed and the challenger earns part of the derail fee.
    - This reduces the incentive to “just lie in the app” and creates a stronger distinction between honest and dishonest Beeminder‑style users.
2. **Shared‑pot commitment contracts**
    - Gap: Beeminder’s penalties go solely to the company; some users wish money went to anti‑charities or peers instead.[^1_52][^1_45]
    - Fury Bounty angle:
        - Allow creation of shared‑pot goals where failure moves funds to a pool that can only be claimed by rats who prove misreporting or by peers who met their own commitments.
    - This diversifies the value proposition away from pure “pay Beeminder” toward “put money into a market where honesty is defended by bounty hunters.”
3. **“Weasel detection” as a built‑in feature**
    - Gap: When users change or pause goals strategically to avoid derailment, the integrity of the system declines.[^1_48][^1_45]
    - Fury Bounty angle:
        - Make certain changes (e.g., big slope decreases right before a tough day) flaggable. Furies can review a change timeline and, if they can show that the change violated pre‑agreed rules (like no last‑minute slope reduction), they earn a bounty and the user is forced to pay or revert.
    - This codifies “no excuses mode” into a socially enforced system.

***

## Three Cross‑Market Gaps for a “Fury Bounty” Entrant

Synthesizing across all five competitors:

### Gap 1: A trustable, adversarial verification layer for remote, self‑reported behavior

**Problem across incumbents:**

- DietBet / HealthyWage: only see start and end weights; easy to game with water manipulation and camera tricks.[^1_1][^1_24][^1_7]
- StepBet: only see raw step counts; trivial to spoof device motion.[^1_10][^1_13]
- Habitica / Beeminder: largely honor‑based; success often depends on not lying to yourself/app.[^1_37][^1_49][^1_55]

**Opportunity with Fury Bounty:**

- Make verification a *first‑class mechanic*, not an afterthought:
    - Every high‑stakes claim (weight, steps, study hours, etc.) must have an associated proof object: time‑stamped data, short video, screenshot, or third‑party integration log.
    - The system randomly highlights candidates for audit based on anomaly detection (e.g., suspicious trajectories, edge‑of‑failure saves, repeated last‑minute miracles).
- Introduce a two‑sided market:
    - “Doers” stake money on their habits.
    - “Furies” stake time and attention reviewing proof; when they demonstrate fraud or rule‑breaking, they earn bounties funded by offenders’ forfeits and a dedicated integrity pool.
    - False accusations carry a small penalty or reputation hit, discouraging witch hunts.

This directly targets the most important unsolved piece for financial‑stakes habit apps: credible remote verification without building a giant in‑house compliance team.

***

### Gap 2: Long‑term adherence rather than last‑minute sprints and crash behavior

**Problem across incumbents:**

- DietBet / HealthyWage emphasize discrete challenges, encouraging crash behavior and short‑term hacks.[^1_7][^1_21]
- StepBet emphasizes short windows (e.g., 6 weeks) with rising goals; long‑term sustainability is secondary.[^1_10][^1_13]
- Beeminder’s default escalation can push users into cheating or quitting once stakes feel too high, instead of building a stable, long‑term pace.[^1_49][^1_55]
- Habitica drives streaks, but because there are no external consequences, long‑term adherence is entirely self‑driven.[^1_29][^1_30]

**Opportunity with Fury Bounty:**

- Structure bets as *longitudinal contracts* with:
    - Gentle, consistent daily/weekly requirements.
    - Built‑in maintenance phases after initial goals are hit.
    - Rewards for avoiding dramatic reversals (e.g., large weight regain, long inactivity gaps).
- Fury Bounty variant:
    - Furies do not only look for outright fraud, but also for “Goodharting”: behaviors that technically satisfy metrics while violating health rules (crash diets, step farming without real exertion).
    - When rules define clearly forbidden tactics, rats can earn bounties by providing evidence of those tactics even if the numeric goal was met.
- Combining this with streak‑friendly gamification (avatars, guilds, quests) positions the app as: “a game for building a life‑long identity, protected from metric‑hacking by fury auditors.”

This exploits the dissatisfaction of people who have lost weight or hit step goals with existing apps, only to backslide quickly.

***

### Gap 3: A reputation and governance layer that aligns honest users against cheaters and the “house”

**Problem across incumbents:**

- Habitica’s reputation is purely social and unverified; cheaters can still show off high levels and gear.[^1_38][^1_37]
- DietBet / StepBet / HealthyWage concentrate power and surplus in the platform; users see fees but not a clear link between fees and fairness.[^1_23][^1_4][^1_10]
- Beeminder’s penalties all flow to the company, making cheating or quitting privately attractive when goals feel mis‑set.[^1_55][^1_45][^1_49]

**Opportunity with Fury Bounty:**

- Treat reputation as a key asset:
    - Every user has a publicly visible “integrity score” (e.g., based on frequency of successful unchallenged completions, the outcome of disputes, and whether they have ever been found cheating).
    - Furies also have a reputation: successful, accurate auditors vs. frivolous accusers.
- Money flows are transparent:
    - Show, per league/game/goal: total stakes, total platform fee, total bounties paid, number of cheaters caught, and their identity or pseudonym.
    - Allow high‑reputation users to take on paid roles (judges, super‑rats) with elevated powers.
- Over time, governance features can be opened:
    - High‑rep users can vote on rule changes (e.g., what counts as proof, how severe certain penalties should be).
    - A portion of fees is earmarked for fury and judge compensation, visibly.

This builds a *civic* layer absent in current products. Instead of “house vs. user,” the framing becomes: “honest users + rats vs. cheaters, with the platform as protocol and referee,” which dovetails perfectly with your “Fury Bounty” concept.

***

### How this positions a new app

Relative to the analyzed competitors, a Fury Bounty‑driven product can credibly claim:

- More trustworthy outcomes than DietBet/StepBet/HealthyWage due to adversarial, incentivized verification and explicit anti‑crash rules.
- More game depth and social dynamics than Beeminder, with less cognitive overhead and a clearer sense of “fair competition”.
- More real‑world accountability and fair compensation for oversight than Habitica, while still retaining an RPG‑like aesthetic if desired.

The key is to design the “fury economy” so that:

- Bounties are meaningful but not so large as to incentivize harassment.
- False positives are penalized.
- The overall experience still feels fun and aspirational, not punitive and carceral.

If helpful, the next step can be a concrete product spec: flows for submitting proof, raising a bounty claim, adjudication, and how pots/bounties are split in different game modes.
<span style="display:none">[^1_100][^1_101][^1_102][^1_103][^1_104][^1_105][^1_106][^1_107][^1_108][^1_109][^1_110][^1_111][^1_112][^1_113][^1_114][^1_115][^1_116][^1_117][^1_118][^1_56][^1_57][^1_58][^1_59][^1_60][^1_61][^1_62][^1_63][^1_64][^1_65][^1_66][^1_67][^1_68][^1_69][^1_70][^1_71][^1_72][^1_73][^1_74][^1_75][^1_76][^1_77][^1_78][^1_79][^1_80][^1_81][^1_82][^1_83][^1_84][^1_85][^1_86][^1_87][^1_88][^1_89][^1_90][^1_91][^1_92][^1_93][^1_94][^1_95][^1_96][^1_97][^1_98][^1_99]</span>

<div align="center">⁂</div>

[^1_1]: https://www.reddit.com/r/beermoney/comments/4t1e4r/make_a_lot_of_money_by_losing_weight_with_dietbet/

[^1_2]: https://www.reddit.com/r/loseit/comments/1tvihx/need_a_kickstart_to_2014_join_this_dietbit_the/

[^1_3]: https://www.reddit.com/r/orangetheory/comments/cx41yg/dietbet_30_day_weight_loss_challenge_sept_4th/

[^1_4]: https://www.reddit.com/r/loseit/comments/ewra4q/psa_do_not_use_dietbet/

[^1_5]: https://www.reddit.com/r/gymsnark/comments/oo352a/fatgirlfedup/

[^1_6]: https://www.reddit.com/r/beermoney/comments/djs363/using_various_site_to_maximize_earning_from/

[^1_7]: https://www.reddit.com/r/beermoney/comments/8c3cqh/those_who_have_used_dietbet_do_you_win_more_money/

[^1_8]: https://www.reddit.com/r/Scams/comments/g5bdgn/is_dietbet_a_scam/

[^1_9]: https://www.reddit.com/r/orangetheory/comments/a7f9nx/stepbet_next_game_starts_dec_24/

[^1_10]: https://www.reddit.com/r/loseit/comments/5myjbi/my_stepbet_review/

[^1_11]: https://www.reddit.com/r/StepBet/comments/7717j6/new_to_stepbet_start_here/

[^1_12]: https://www.reddit.com/r/weightwatchers/comments/1fs83vf/anyone_do_stepbet/

[^1_13]: https://www.reddit.com/r/StepBet/comments/bt7cv7/do_power_days_count_as_active_days_other/

[^1_14]: https://www.reddit.com/r/beermoney/comments/w6gxbp/which_apps_pay_you_to_walk/

[^1_15]: https://www.reddit.com/r/StepBet/comments/ji6co7/do_you_find_the_membership_to_be_worthwhile_in/

[^1_16]: https://www.reddit.com/r/WeightLossAdvice/comments/14uinhv/waybetter_app/

[^1_17]: https://www.reddit.com/r/StepBet/comments/td6t2v/is_it_worth_it/

[^1_18]: https://www.reddit.com/r/Advice/comments/u4m0p0/looking_for_an_app_similar_to_runbet_or_stepbet/

[^1_19]: https://www.reddit.com/r/WayBetter/

[^1_20]: https://www.reddit.com/r/WayBetter/comments/1aifjcg/how_many_of_you_feel_the_company_is_struggling/

[^1_21]: https://www.reddit.com/r/AMA/comments/1ax6avf/i_did_one_of_those_weight_loss_bets_and_actually/

[^1_22]: https://www.reddit.com/r/weightwatchers/comments/hg5i17/lost_50_more_pounds_and_hit_my_healthywage_goal/

[^1_23]: https://www.reddit.com/r/loseit/comments/1emweh/anyone_ever_used_healthywagecom_you_can_bet_on/

[^1_24]: https://www.reddit.com/r/beermoney/comments/g1tn8p/healthywage_payout_confirmation/

[^1_25]: https://www.reddit.com/r/beermoney/comments/b9gsz3/review_healthywage_step_challenge/

[^1_26]: https://www.reddit.com/r/IsItBullshit/comments/avil29/isitbullshit_healthywagecom/

[^1_27]: https://www.reddit.com/r/Entrepreneur/comments/thdgm8/pros_and_cons_of_my_gym_offering_free_membership/

[^1_28]: https://www.reddit.com/r/loseit/comments/1toix2/according_to_their_website_and_this_interview/

[^1_29]: https://www.reddit.com/r/YourMorningGuru/comments/t0edx7/habitica_an_incomplete_guide/

[^1_30]: https://www.reddit.com/r/habitrpg/comments/16xseme/dummy_guide_to_habitica/

[^1_31]: https://www.reddit.com/r/habitica/comments/10ewl5h/taskhero_vs_finch/

[^1_32]: https://www.reddit.com/r/habitica/comments/185aqla/would_you_say_the_free_plan_is_good_enough_for_a/

[^1_33]: https://www.reddit.com/r/habitica/comments/1auhuyp/free_vs_paid/

[^1_34]: https://www.reddit.com/r/habitica/comments/1g6yzy5/buying_gems/

[^1_35]: https://www.reddit.com/r/habitrpg/comments/937tbh/how_to_get_gems_as_a_subscriber/

[^1_36]: https://www.reddit.com/r/habitrpg/comments/5b2njv/subscribers_is_it_worth_it/

[^1_37]: https://www.reddit.com/r/habitica/comments/kiz8dx/cheating_on_habitica/

[^1_38]: https://www.reddit.com/r/productivity/comments/fbk2up/if_you_could_improve_habitica_what_would_you/

[^1_39]: https://www.reddit.com/r/habitica/comments/zr7lba/does_habitica_as_a_forprofit_company_that_relies/

[^1_40]: https://www.reddit.com/r/habitica/comments/1dwv0uk/just_found_habitica_then_found_the_habitica/

[^1_41]: https://www.reddit.com/r/habitica/comments/1igukx4/would_you_be_interested_in_a_habitica_alternative/

[^1_42]: https://www.reddit.com/r/habitica/comments/p52r9v/harder_bosses_in_habitica/

[^1_43]: https://www.reddit.com/r/getdisciplined/comments/43ae8o/method_beeminder_goal_tracking_with_teeth_web_app/

[^1_44]: https://www.reddit.com/r/loseit/comments/mqgj6/procrastinating_about_weightloss_check_out/

[^1_45]: https://www.reddit.com/r/slatestarcodex/comments/42iucb/any_beeminder_users_here_prospective_beeminders/

[^1_46]: https://www.reddit.com/r/getdisciplined/comments/xqd5fc/needadvice_helpi_feel_im_losing_my_job_due_to/

[^1_47]: https://www.reddit.com/r/beeminder/comments/sm1n70/have_people_kept_using_beeminder/

[^1_48]: https://www.reddit.com/r/beeminder/comments/120ptwm/is_there_a_way_to_keep_myself_from_flaking_out/

[^1_49]: https://www.reddit.com/r/slatestarcodex/comments/3t14j3/beeminder_for_adhd/

[^1_50]: https://www.reddit.com/r/beeminder/comments/vqdiw3/i_realized_that_we_can_change_autodata_values_is/

[^1_51]: https://www.reddit.com/r/HabitHelp/comments/6ce65r/how_can_i_stop_being_complacent_about_objects_and/

[^1_52]: https://www.reddit.com/r/getdisciplined/comments/27ktn8/discussion_stickkcom_binds_you_to_goals_via_the/

[^1_53]: https://www.reddit.com/r/beeminder/best/

[^1_54]: https://www.reddit.com/r/beeminder/comments/4umvw3/i_have_no_idea_what_im_looking_at/

[^1_55]: https://www.reddit.com/r/ProductivityApps/comments/1qkzfr9/looking_for_a_beeminder_alternative_without/

[^1_56]: https://www.reddit.com/r/beermoney/comments/qa7wey/are_there_any_apps_that_pay_you_to_stay_off_your/

[^1_57]: https://www.reddit.com/r/habitica/comments/1moc00z/built_a_modern_gamified_rpg_task_manager_inspired/

[^1_58]: https://www.reddit.com/r/slatestarcodex/comments/11nsrt1/signing_up_for_beeminder_a_commitment_contract/

[^1_59]: https://www.reddit.com/r/beermoney/comments/prnyrc/apps_that_pay_you_to_exercise/

[^1_60]: https://www.reddit.com/r/habitrpg/comments/1modx1y/built_a_modern_gamified_rpg_task_manager_and_we/

[^1_61]: https://www.reddit.com/r/slatestarcodex/comments/1cc6u9e/using_financial_commitments_to_overcome_akrasia/

[^1_62]: https://www.reddit.com/r/fatgirlfedupsnark/comments/1nvnxwt/dietbet/

[^1_63]: https://www.reddit.com/r/povertyfinancecanada/comments/1g114iq/money_making_app_for_things_like_walking_and_old/

[^1_64]: https://www.reddit.com/r/antiMLM/comments/jc7076/a_super_popular_instagram_dietician_with_222k/

[^1_65]: https://www.reddit.com/r/blogsnark/comments/spuyyo/influencer_discussion_friday_feb_11/

[^1_66]: https://www.reddit.com/r/theticket/comments/y4wvkb/anyone_tried_sota_weight_loss/

[^1_67]: https://www.reddit.com/r/StepBet/

[^1_68]: https://www.reddit.com/r/Zepbound/comments/1eotw9l/healthy_wage_app/

[^1_69]: https://www.reddit.com/r/loseit/comments/rnujk/apparently_you_can_get_200_for_losing_10_of_your/

[^1_70]: https://www.reddit.com/r/IAmA/comments/34ak5w/i_am_tim_ferriss_author_angel_investor_host_of/

[^1_71]: https://www.reddit.com/r/SwagBucks/comments/dak7pg/26_mm_healthywage_revenue_universe/

[^1_72]: https://www.reddit.com/r/habitica/comments/1beu8lh/whats_keeping_you_on_habitica_today/

[^1_73]: https://www.reddit.com/r/tearsofthekingdom/comments/13oqtfi/new_duplication_glitch_that_doesnt_require_the/

[^1_74]: https://www.reddit.com/r/askscience/comments/mkwf2/why_do_humans_procrastinate_and_how_can_it_be_beat/

[^1_75]: https://www.reddit.com/r/habitica/comments/zzilrj/alternatives_to_habitica/

[^1_76]: https://www.reddit.com/r/IAmA/comments/615e3z/i_am_dr_jordan_b_peterson_u_of_t_professor/

[^1_77]: https://www.reddit.com/r/iosapps/comments/1pdj2nx/49_free_space_tasks_actually_get_sht_done_beta/

[^1_78]: https://www.reddit.com/r/getdisciplined/comments/1g02p8g/any_stories_of_people_who_changed_their/

[^1_79]: https://www.reddit.com/r/finch/comments/1kljqoh/lets_have_faith_in_the_devs/

[^1_80]: https://www.reddit.com/r/productivity/comments/uj3hpb/i_struggle_being_productive_without_being_forced/

[^1_81]: https://www.reddit.com/r/habitica/comments/fwdy3f/any_way_to_earn_gems_without_purchasing_a/

[^1_82]: https://www.reddit.com/r/slatestarcodex/comments/1cj8dlc/failure_to_model_people_with_low_executive/

[^1_83]: https://www.reddit.com/r/duolingo/comments/1gr3r9u/why_cheat_on_duolingo/

[^1_84]: https://www.reddit.com/r/habitica/comments/yc9ez9/question_for_people_whi_subscribe_does/

[^1_85]: https://www.reddit.com/r/ADHD/comments/v65716/rely_on_systems_not_discipline_you_do_not_rise_to/

[^1_86]: https://www.reddit.com/r/newzealand/comments/1q32hln/manage_my_health_data_to_be_released_in_48_hours/

[^1_87]: https://www.reddit.com/r/habitica/comments/1q6gryy/thinking_of_what_should_i_do_first_with_gems_can/

[^1_88]: https://www.reddit.com/r/52book/comments/a9okst/official_2019_introduction_thread/

[^1_89]: https://www.reddit.com/r/ADHD_Programmers/comments/1r9k2z8/this_is_the_only_thing_that_works_for_my_adhd/

[^1_90]: https://www.reddit.com/r/nosurf/comments/vwdmy5/can_someone_please_develop_an_app_that_makes_you/

[^1_91]: https://www.reddit.com/r/getdisciplined/comments/3mr01o/method_using_the_concept_of_options_for_habit/

[^1_92]: https://www.reddit.com/r/productivity/comments/16ddliq/i_have_trouble_establishing_daytoday_urgency_for/

[^1_93]: https://www.reddit.com/r/StepBet/comments/j2aagr/newbie_questions/

[^1_94]: https://www.reddit.com/user/xclexx/

[^1_95]: https://www.reddit.com/r/beeminder/comments/rht3br/captcha_on_registration/

[^1_96]: https://www.reddit.com/r/accountability/comments/15mfzg6/for_those_struggling_to_find_or_utilize_a_partner/

[^1_97]: https://www.reddit.com/r/ADHD_Programmers/comments/12u8tka/pulled_the_trigger_on_beeminder/

[^1_98]: https://www.reddit.com/r/GetMotivatedBuddies/comments/1pr37w5/23_male_utc6_looking_to_make_some_sort_of/

[^1_99]: https://www.reddit.com/r/getdisciplined/comments/hrt9k2/discipline_building_hack_method/

[^1_100]: https://www.reddit.com/r/Entrepreneur/comments/8m05g6/anyone_interested_in_an_app_that_lets_people_bet/

[^1_101]: https://www.reddit.com/r/getdisciplined/comments/k2qbeo/advice_outsourcing_your_discipline/

[^1_102]: https://www.reddit.com/r/habitrpg/comments/15mi0dt/how_do_you_use_habitica_rewards_and_wishlist/

[^1_103]: https://www.reddit.com/r/slatestarcodex/comments/i6nem3/crazy_nonobvious_life_advice/

[^1_104]: https://www.reddit.com/r/india/comments/f4jh0c/serious_what_are_some_of_the_apps_you_love_and/

[^1_105]: https://www.reddit.com/r/adhdwomen/comments/1he75qh/does_anyone_have_any_experience_with_habitica/

[^1_106]: https://www.reddit.com/r/ProductivityApps/comments/1m2p793/i_am_building_an_app_where_you_stake_real_money/

[^1_107]: https://www.reddit.com/r/perth/comments/1fmgojd/perth_royal_show_yellow_brick_road/

[^1_108]: https://www.reddit.com/r/productivity/comments/18ofxe7/habit_tracker_app_with_rewards/

[^1_109]: https://www.reddit.com/r/SaaS/comments/1mjn4ge/would_you_use_a_habit_tracker_that_makes_you_put/

[^1_110]: https://www.reddit.com/r/AdobeIllustrator/comments/6k686f/how_can_i_create_a_yellow_brick_road_effect_like/%3Ftl=fr

[^1_111]: https://www.reddit.com/r/habitica/comments/1c1rsmx/returning_player_many_questions/

[^1_112]: https://www.reddit.com/r/habitica/comments/1gczx6c/love_this_app_but/

[^1_113]: https://www.reddit.com/r/personalfinance/comments/nt07c5/how_do_i_get_out_of_monthly_payment_trap_and_get/

[^1_114]: https://www.reddit.com/r/habitica/comments/1gob7vy/how_do_you_balance_task_rewards_and_reward_costs/

[^1_115]: https://www.reddit.com/r/CrazyIdeas/comments/1hkq8mc/if_you_havent_watched_anything_from_a/

[^1_116]: https://www.reddit.com/r/habitica/comments/1gi46b3/how_much_money_should_i_spend_on_habitica/

[^1_117]: https://www.reddit.com/r/QuantifiedSelf/comments/17suakq/a_guiltfree_habit_tracker_to_quantify_and_track/

[^1_118]: https://www.reddit.com/r/beeminder/comments/1prfla9/flock_cowork_on_your_todos_with_friends/


---

# Product Specification: Fury Bounty Habit-Tracking System

## I. Core Architecture Overview

### Three-Sided Marketplace

**1. Doers** — Users who stake money on habit commitments
**2. Furies** — Users who audit proof and hunt for fraudulent claims
**3. Judges** — High-reputation users who adjudicate disputed claims

**Economic Flow:**

```
User Stake (100%) splits into:
├─ Prize Pool (70%) → Winners only
├─ Integrity Pool (20%) → Fury bounties + Judge fees
└─ Platform Fee (10%) → Operations + development
```


***

## II. Proof Submission System

### A. Proof Requirements by Habit Type

Each habit has a **Proof Tier** that determines verification rigor:

#### Tier 1: Low-Stakes Self-Report (< \$10/week stake)

- **Proof:** Simple checkbox + optional note
- **Audit probability:** 5% random spot-check
- **Example:** "Took vitamins," "Meditated 5 minutes"


#### Tier 2: Device-Verified (< \$50/week stake)

- **Proof:** Auto-sync from trusted integrations (Apple Health, Fitbit, Strava, RescueTime)
- **Additional:** User must upload one manual proof artifact per week (photo, short video, screenshot)
- **Audit probability:** 15% random + flagging system
- **Example:** "10K steps/day," "Study 2 hours/day"


#### Tier 3: High-Stakes Evidence (≥ \$50/week stake)

- **Proof:** All Tier 2 requirements PLUS:
    - Timestamped photo/video with dynamic daily prompt
    - Biometric markers where applicable (weight, body measurements, GPS route)
    - Weekly narrative summary (150+ words describing execution)
- **Audit probability:** 30% random + mandatory peer review for edge cases
- **Example:** Weight loss goals, marathon training, sobriety tracking


#### Tier 4: Social Verification (Competitive leagues)

- **Proof:** All Tier 3 requirements PLUS:
    - Optional: Local in-person check-ins with other league members
    - Social media cross-posting with unique hashtag
    - Video call spot-checks (scheduled or surprise, user opts in)
- **Audit probability:** 50%+ with crowd-sourced anomaly detection
- **Example:** High-stakes tournaments, team competitions with prize pools > \$500

***

### B. Proof Submission Flow (Tier 3 Example: Weight Loss)

**Daily/Weekly Cadence:**

```
Day 1 (Baseline):
├─ User receives dynamic prompt: "Hold paper with code JX7492"
├─ Record video: Full-body shot + scale reading + paper code
├─ System extracts: Weight, timestamp, EXIF metadata
├─ Store encrypted proof in immutable log (blockchain-lite or AWS S3 with hash)
└─ Auto-generate "Proof Receipt" with unique ID

Daily (ongoing):
├─ User logs: Meals (photo), exercise (GPS + device data), body measurements
├─ System flags anomalies:
│   ├─ Weight drop > 3 lbs in 24 hours
│   ├─ GPS shows no movement but 15K steps claimed
│   └─ Photo metadata shows edited timestamp
└─ Anomalies auto-escalate to Fury Queue

Weekly Check-In:
├─ User submits: New dynamic-prompt video, measurement photos, narrative
├─ System calculates: Progress rate, consistency score, anomaly index
└─ If anomaly index > threshold: Mandatory Fury review before credit
```

**Dynamic Prompt System:**

- Platform generates daily unique codes (alphanumeric + visual patterns)
- Prevents pre-recording or reusing old videos
- Codes are revealed only at submission time in app
- Example: "Today's code: Draw a star on your palm and show it with your scale reading"

***

### C. Proof Storage \& Immutability

**Technical Implementation:**

1. **Submission:**
    - User uploads proof → instant hash generation (SHA-256)
    - Hash + metadata written to append-only ledger
    - Original file stored in encrypted cold storage (S3 Glacier or similar)
2. **Audit Trail:**
    - Every view/download of proof logged with viewer ID
    - No deletion possible; only privacy-preserving redaction for PII (face blur, etc.)
3. **Access Control:**
    - Doer: full access to own proofs
    - Furies: time-limited access (48 hours) once audit initiated
    - Judges: full access during dispute resolution
    - Public: anonymized proof summaries for resolved disputes (educational)

***

## III. Fury Audit System

### A. How Furies Earn Access to Audit

**Reputation-Gated Access:**


| Fury Level | Requirements | Daily Audit Quota | Bounty Multiplier |
| :-- | :-- | :-- | :-- |
| **Novice Fury** | 0 successful audits | 3 audits/day | 1.0× |
| **Scout Fury** | 5 successful + 80%+ accuracy | 10 audits/day | 1.2× |
| **Elite Fury** | 25 successful + 85%+ accuracy | 25 audits/day | 1.5× |
| **Master Fury** | 100 successful + 90%+ accuracy | Unlimited | 2.0× + Judge nomination |

**Accuracy = (Successful challenges - False accusations × 3) / Total challenges**

**Staking Requirement:**

- Furies must stake 10–50 dollars (refundable) to access audit queue
- False accusations result in stake deductions
- Prevents spam and ensures skin-in-the-game

***

### B. Fury Audit Flow

#### Step 1: Claim Selection (Fury's Perspective)

**Fury Dashboard shows:**

```
Audit Queue (sorted by bounty potential)
┌────────────────────────────────────────────────────┐
│ User: Phoenix_87 (Integrity Score: 78/100)         │
│ Habit: "Lose 2 lbs/week for 8 weeks"              │
│ Current Week: 4/8                                  │
│ Anomaly Flags: 2 (weight spike + metadata warning)│
│ Potential Bounty: $18.50 (if fraud proven)        │
│ Evidence: 4 videos, 12 photos, 1 narrative        │
│ Time Remaining: 36 hours before auto-approval     │
│ [CLAIM AUDIT] button                              │
└────────────────────────────────────────────────────┘
```

**Claiming an audit:**

- Fury clicks [CLAIM AUDIT] → locks file for 48 hours
- Only one Fury per claim (first-come, first-served)
- If Fury abandons (no submission in 48 hrs), audit returns to queue and Fury reputation penalized

***

#### Step 2: Investigation

**Fury's Audit Workbench:**

```
Evidence Timeline:
├─ Week 1: Baseline video (JX7492) - 185.4 lbs
├─ Week 2: Check-in video (KL8823) - 183.1 lbs (−2.3 lbs ✓)
├─ Week 3: Check-in video (MN9045) - 180.8 lbs (−2.3 lbs ✓)
└─ Week 4: Check-in video (QR1267) - 178.2 lbs (−2.6 lbs ⚠️)

Anomaly Details:
⚠️ Week 4 video metadata:
   - File creation: Feb 10, 2026 11:43 PM
   - Submission time: Feb 11, 2026 12:02 AM
   - EXIF data: Image edited (Photoshop detected)
   - Audio analysis: Background noise inconsistent with previous videos

⚠️ Weight trajectory:
   - Predicted: 181.0 ± 0.5 lbs
   - Actual: 178.2 lbs (−2.8 lbs deviation)
   - Statistical likelihood: 8% (2.4 sigma outlier)
```

**Fury Tools:**

- Frame-by-frame video scrubber
- EXIF metadata viewer
- Audio waveform analyzer
- Comparison overlays (side-by-side video frames)
- Access to user's past flagged behaviors (if any)

***

#### Step 3: Filing a Bounty Claim

**Fury submits Challenge Report:**

```markdown
## Challenge Type: [Edited Media / Fraudulent Weight Reading]

## Evidence:
1. Video metadata shows Photoshop editing timestamp
2. Weight drop (2.6 lbs in 7 days) exceeds user's historical average (2.1 lbs/week) by 2.4 sigma
3. Scale background differs from previous weeks (different room?)
4. Audio analysis: voice pitch inconsistent (possible voice modulation or different person)

## Requested Ruling:
- Mark Week 4 proof as INVALID
- Apply strike to user Phoenix_87
- Award bounty from user's stake

## Attachments:
[Screenshot 1: EXIF data]
[Screenshot 2: Waveform comparison]
[Video clip: Background inconsistency highlighted]
```

**Submission triggers:**

- User (Phoenix_87) notified of challenge
- Challenge enters Judge Queue
- All proofs locked (no new submissions until resolved)

***

## IV. Adjudication System

### A. Judge Selection

**Auto-Assignment Algorithm:**

```
FOR each challenge:
  ├─ Filter judges by:
  │   ├─ Reputation score ≥ 95/100
  │   ├─ Successful resolutions ≥ 50
  │   ├─ No conflicts of interest (not friends with Doer or Fury)
  │   └─ Active in past 7 days
  ├─ Randomly select 3 judges
  └─ Assign with 72-hour resolution deadline
```

**Judge Compensation:**

- Base fee: \$5–15 per case (from Integrity Pool)
- Bonus: +\$5 if ruling matches majority (incentivizes consensus)
- Penalty: −10 reputation if ruling is later overturned on appeal

***

### B. Adjudication Flow

**Judge Dashboard:**

```
Case #47392: Phoenix_87 vs. Rat_Hunter_12
┌─────────────────────────────────────────┐
│ Challenge: Edited media + suspicious    │
│            weight drop                  │
│                                         │
│ Fury's Evidence:        Doer's Defense:  │
│ ├─ EXIF metadata      ├─ "Photoshop was│
│ ├─ Audio analysis     │    just to crop"│
│ └─ Statistical model  └─ "Natural flush"│
│                                         │
│ YOUR RULING (select one):               │
│ ○ FRAUD PROVEN → Award bounty to Fury   │
│ ○ INCONCLUSIVE → Return stakes, no win │
│ ○ FALSE CLAIM → Penalize Fury           │
│                                         │
│ [SUBMIT RULING + 200-word rationale]   │
└─────────────────────────────────────────┘
```

**Majority Rule:**

- 2/3 judges must agree for ruling to execute
- If split (1-1-1), case escalates to Master Judge panel (5 judges)
- All rulings and rationales published in anonymized public log

***

### C. Ruling Outcomes

#### Outcome 1: FRAUD PROVEN (Fury wins)

**Immediate effects:**

```
User Phoenix_87:
├─ Week 4 proof marked INVALID
├─ Loses $20 stake for that week
├─ Receives STRIKE #1 (3 strikes = permanent ban)
├─ Integrity score: 78 → 65 (−13 points)
└─ Must resubmit valid proof or forfeit entire challenge

Rat_Hunter_12:
├─ Receives $18.50 bounty (from Phoenix's stake)
├─ +15 reputation points
├─ +1 successful audit (toward Scout → Elite promotion)
└─ Audit accuracy: Updated based on correct challenge

Judges (×3):
├─ Each receives $5 base fee
└─ +5 bonus for unanimous decision
```

**User's Options After Strike:**

1. **Accept ruling** → Resubmit valid proof within 48 hours OR withdraw from challenge (forfeit remaining stake)
2. **Appeal** → Costs \$25 non-refundable, goes to Master Judge panel (high bar for reversal)

***

#### Outcome 2: INCONCLUSIVE (No winner)

**When used:**

- Evidence is ambiguous
- Technical issues prevent clear ruling
- Both parties acted in good faith

**Effects:**

```
User Phoenix_87:
├─ No strike applied
├─ Keeps current stake
├─ Integrity score: 78 → 76 (−2 points for ambiguity)
└─ Must resubmit proof with extra clarity

Rat_Hunter_12:
├─ No bounty
├─ No reputation gain
├─ No accuracy penalty (doesn't count toward stats)
└─ Audit claim quota refunded

Judges:
└─ Receive only $3 base fee (reduced for inconclusive)
```


***

#### Outcome 3: FALSE CLAIM (User wins)

**When used:**

- Fury's evidence is clearly fabricated or misinterpreted
- User's proof is valid

**Effects:**

```
User Phoenix_87:
├─ Proof approved
├─ +5 integrity points (bonus for defending against false accusation)
├─ Receives $10 compensation from Fury's stake
└─ Can optionally file counter-claim for harassment (if repeated)

Rat_Hunter_12:
├─ −$10 from stake (paid to User)
├─ −25 reputation points
├─ +1 FALSE CLAIM mark (3 false claims = demotion/suspension)
├─ Accuracy score drops
└─ If stake depleted, suspended until refill

Judges:
└─ Full $5 base fee + $5 bonus (rewarding correct identification of bad-faith audit)
```


***

## V. Game Modes \& Pot/Bounty Splits

### Mode 1: Solo Challenge (DietBet-style)

**Structure:**

- User stakes \$X per week for N weeks
- Must hit weekly targets (e.g., "Lose 1.5 lbs/week")
- All-or-nothing: complete all weeks to win, or lose stake

**Pot Split:**

```
User stakes $50/week × 8 weeks = $400 total

IF user completes successfully:
├─ User receives: $400 original stake + $50 bonus (from Integrity Pool interest)
├─ No Furies challenged, no bounties paid
└─ Platform keeps interest earned on locked funds

IF user fails week 5:
├─ User forfeits: $250 (weeks 1–5 stake)
├─ Refunded: $150 (weeks 6–8 prepaid stake)
├─ Forfeited split:
│   ├─ $175 (70%) → Integrity Pool (future bounties)
│   ├─ $50 (20%) → Platform
│   └─ $25 (10%) → Charity (user chooses at signup)
```

**Fury Bounty Potential:**

- If Fury proves fraud anytime during 8 weeks:
    - Fury earns \$40 (10% of total stake)
    - User forfeits entire \$400
    - Remaining \$360 → 70% Integrity Pool / 20% Platform / 10% Charity

***

### Mode 2: Group Pot (DietBet/StepBet model)

**Structure:**

- 50 users each stake \$40
- All must hit same goal (e.g., "4% weight loss in 4 weeks")
- Winners split the pot

**Pot Mechanics:**

```
Total pot: 50 users × $40 = $2,000

Assume 30 users complete successfully:

Split calculation:
├─ Winners' pool (70%): $1,400 → $46.67 per winner
├─ Integrity Pool (20%): $400 → Fury bounties
├─ Platform fee (10%): $200
└─ TOTAL PAID TO WINNERS: $46.67 each ($6.67 profit per winner)

If Fury catches 2 cheaters:
├─ Cheaters' stakes forfeited: 2 × $40 = $80
├─ Fury bounties: $40 each (paid from Integrity Pool)
├─ Winners' pool increases: $1,400 → $1,440
└─ Adjusted payout: $48.00 per winner ($8.00 profit)
```

**Fury Incentive:**

- Fixed bounty: \$40 per confirmed fraud
- Bonus: If Fury catches ≥3 cheaters in one challenge, earns 1.5× multiplier

***

### Mode 3: Competitive League (Habitica + Stakes)

**Structure:**

- 10-person league
- Each stakes \$100/month
- Daily quests + weekly boss battles
- Top 5 finishers split prize pool

**Pot Mechanics:**

```
Total pot: 10 users × $100 = $1,000

Leaderboard after 4 weeks:
1st place: $280 (28%)
2nd place: $210 (21%)
3rd place: $140 (14%)
4th place: $105 (10.5%)
5th place: $65 (6.5%)
─────────────────────
Subtotal: $800 (80% to winners)

Integrity Pool: $150 (15%)
Platform fee: $50 (5%)
```

**Fury Bounty Opportunities:**

- Any league member can challenge another's quest completion
- Bounty scales with rank:
    - Catching \#1 cheater: \$50
    - Catching \#5 cheater: \$20
- Furies can be league members (dual role) or external auditors

**Anti-Collusion:**

- League members who fury on each other must have challenge reviewed by external Judge (no internal adjudication)
- False accusations between league members = automatic disqualification from current league

***

### Mode 4: High-Stakes Tournament (Shark Tank)

**Structure:**

- Open entry, \$500 buy-in
- 8-week progressive elimination
- Only top 10% win prizes
- Massive prize pool (\$50K+ for large tournaments)

**Pot Mechanics:**

```
Example: 200 entrants × $500 = $100,000 total

Prize distribution:
├─ 1st place: $25,000
├─ 2nd place: $15,000
├─ 3rd place: $10,000
├─ 4th–10th: $2,500 each ($17,500 total)
├─ 11th–20th: $500 each ($5,000 total)
─────────────────────
Subtotal: $72,500 (72.5% to winners)

Integrity Pool: $20,000 (20%)
Platform fee: $7,500 (7.5%)
```

**Fury Bounty System:**

- "Bounty Hunters Guild" (dedicated Furies) review ALL top 20 finishers
- Bounty tiers:
    - Catching Top 3: \$2,000
    - Catching Top 10: \$1,000
    - Catching Top 20: \$500
- All bounties paid from Integrity Pool
- Falsely accusing a Top 10 finisher: \$500 penalty + 30-day suspension

**Extra Verification:**

- Top 10 finishers must submit to video exit interview (15 min)
- Random metabolic/body composition scan for Top 3 (in-person, expenses covered)
- Refusal to comply = automatic disqualification

***

## VI. Integrity Score System

### Calculation

```python
Integrity Score (0–100) =
    Base (50 points)
  + Completed challenges without flags (+5 per challenge, max 30)
  + Successful defenses against false claims (+5 per defense)
  - Valid fraud findings (−15 per incident)
  - Inconclusive rulings (−2 per incident)
  - Strikes (−20 per strike)
```

**Score Decay:**

- Inactive users (no challenges in 6 months): −1 point/month
- Prevents reputation hoarding

**Score Benefits:**


| Score Range | Benefits |
| :-- | :-- |
| 90–100 | Priority matching in leagues; reduced platform fees (8%); Judge eligibility |
| 75–89 | Standard access; 10% platform fee |
| 60–74 | Requires Tier 2+ proof for all challenges; 12% platform fee |
| 40–59 | Restricted to Solo Challenges only; 15% platform fee; mandatory Judge review |
| 0–39 | Suspended; must appeal to regain access |


***

## VII. Anti-Gaming Mechanisms

### A. Preventing Fury Harassment

**Rate Limiting:**

- Furies can only challenge each Doer once per challenge
- If Fury has 3+ false claims against same Doer, auto-suspended

**Reputation-Weighted Matching:**

- Low-rep Furies can only audit low-stakes challenges
- High-rep Furies see high-stakes queue

**Penalty Escalation:**

```
False Claim #1: −10 reputation, $10 penalty
False Claim #2: −25 reputation, $25 penalty, 7-day suspension
False Claim #3: −50 reputation, $50 penalty, 30-day suspension
False Claim #4: Permanent ban from Fury role
```


***

### B. Preventing Doer Fraud

**Behavioral Anomaly Flags:**

```python
AUTO-FLAG if:
  - Progress rate > 3 standard deviations from peer average
  - Submission times cluster at 11:58 PM (suggests last-minute fabrication)
  - EXIF metadata shows editing software
  - GPS/device data contradicts claimed activity
  - User has ≥2 strikes in past 12 months
```

**Progressive Penalties:**

```
Strike 1: Warning + mandatory enhanced proof next week
Strike 2: Forfeit current week stake + Integrity Score −15
Strike 3: Forfeit entire challenge + Integrity Score −30 + 90-day ban
Strike 4: Permanent ban
```


***

### C. Judge Quality Control

**Judge Performance Tracking:**

```
Judge Score =
    (Rulings matching majority / Total rulings) × 100
  + Bonus for thoughtful rationales (peer-voted)
  - Penalty for overturned rulings on appeal
```

**Judge Demotion:**

- Score < 85 for 10 consecutive cases → lose Judge status
- Must re-qualify by serving as Fury and reaching Master tier again

***

## VIII. User Flows (End-to-End)

### Flow 1: Doer Creates Challenge \& Gets Caught

```
Day 0: User "Alex" creates challenge
├─ Selects: "Lose 2 lbs/week for 6 weeks"
├─ Stakes: $30/week ($180 total)
├─ Proof tier: Tier 3 (video weigh-ins)
└─ Receives: Dynamic prompt code for Day 1

Day 1: Baseline submission
├─ Films: Full-body + scale (182.4 lbs) + code "XR7743"
├─ Uploads → System validates → Proof Receipt generated
└─ Challenge officially starts

Week 3, Day 21: Alex struggles
├─ Current weight: 179.8 lbs (should be ~176.4 lbs)
├─ Alex edits photo in Photoshop to show 176.2 lbs
├─ Uploads edited proof
└─ System auto-flags: "EXIF editing detected" → Fury Queue

Day 22: Fury "ShadowHunter" claims audit
├─ Reviews evidence: EXIF, timeline, comparison to Week 2
├─ Files challenge: "Edited media + implausible drop"
├─ Alex notified: "You have 48 hours to respond"
└─ Alex panics, submits defense: "Cropped for privacy"

Day 24: 3 Judges review
├─ Judge A: FRAUD PROVEN (editing undeniable)
├─ Judge B: FRAUD PROVEN
├─ Judge C: FRAUD PROVEN (unanimous)
└─ Ruling: Alex loses Week 3 stake ($30) + Strike #1

Day 25: Consequences
├─ Alex's integrity score: 82 → 67
├─ ShadowHunter receives: $25 bounty + rep boost
├─ Alex must: Upload valid proof within 48 hrs or forfeit entire challenge
└─ Alex complies with real proof, completes challenge (but lost $30 + reputation damage)
```


***

### Flow 2: Fury Falsely Accuses Doer

```
Day 15: Fury "TriggerHappy" spots challenge
├─ User "Jordan" running "10K steps/day for 4 weeks"
├─ Jordan's week 2 shows 10,234 steps (barely met goal)
├─ TriggerHappy suspects: "Too convenient, probably spoofed"
└─ Files challenge: "Step count artificially inflated"

Day 16: Jordan responds
├─ Provides: Full GPS route, Apple Health raw data export, heart rate log
├─ Evidence shows: Legitimate 5-mile walk in city park
└─ TriggerHappy's claim looks weak

Day 18: 3 Judges review
├─ Judge A: FALSE CLAIM (evidence solid)
├─ Judge B: FALSE CLAIM
├─ Judge C: INCONCLUSIVE (conservative)
└─ Ruling: 2/3 FALSE CLAIM majority → TriggerHappy penalized

Day 19: Consequences
├─ TriggerHappy loses: $10 from stake (paid to Jordan)
├─ TriggerHappy reputation: 68 → 43 (−25 points)
├─ TriggerHappy accuracy: 72% → 65% (now at risk)
├─ Jordan receives: $10 compensation + integrity boost (82 → 87)
└─ TriggerHappy warning: "2 more false claims = suspension"
```


***

### Flow 3: Judge Resolves Ambiguous Case

```
Day 10: Fury "Sherlock_Fit" challenges User "Maya"
├─ Habit: "Study 3 hours/day tracked via RescueTime"
├─ Sherlock claims: "RescueTime shows browser idle time, not real focus"
├─ Maya defends: "I was reading PDFs offline, RescueTime doesn't track that"
└─ Both arguments plausible

Day 12: Judges struggle
├─ Judge A: FRAUD PROVEN (time tracking should be verifiable)
├─ Judge B: INCONCLUSIVE (offline work is reasonable)
├─ Judge C: INCONCLUSIVE (insufficient evidence)
└─ Ruling: 2/3 INCONCLUSIVE → No winner

Day 13: Resolution
├─ Maya must: Resubmit with screenshot proof of PDF reader + time logs
├─ Sherlock: No bounty, but audit doesn't count against accuracy
├─ Judges: Reduced $3 fee each
├─ Maya's revised proof accepted → challenge continues
└─ Future Maya challenges require: Enhanced offline proof or Tier 4 verification
```


***

## IX. Technical Implementation Notes

### Proof Storage Architecture

```
User uploads video → 
  ├─ Client-side hash (SHA-256) generated immediately
  ├─ Hash + metadata written to append-only DB (PostgreSQL + TimescaleDB)
  ├─ Video encrypted (AES-256) → uploaded to S3 Glacier
  ├─ Webhook triggers ML anomaly scan (EXIF, audio, visual inconsistencies)
  └─ If anomaly detected → Auto-add to Fury Queue
```

**Blockchain-lite approach:**

- Each proof gets immutable hash entry
- Hashes organized in Merkle tree per user/challenge
- Root hash published daily to public ledger (Ethereum or similar for auditability)
- Prevents retroactive editing

***

### Anomaly Detection ML Pipeline

**Models:**

1. **EXIF Analysis:** Flag any editing software signatures
2. **Audio Fingerprinting:** Detect voice deepfakes or inconsistent room acoustics
3. **Visual Consistency:** Compare body proportions, lighting, background across submissions
4. **Statistical Outliers:** Bayesian model flags improbable trajectories (e.g., 5 lb loss in 3 days)

**Output:**

- Anomaly score 0–100
- Auto-escalate if score > 70
- Scores 50–70 → suggest voluntary Fury review to user for transparency bonus

***

### Judge Dashboard Tech Stack

**Real-time Collaboration:**

- Judges see same evidence simultaneously
- Can annotate videos/photos (timestamp, circling regions)
- Built-in chat for Judges (not visible to Doer/Fury)
- 72-hour countdown timer per case

**Ruling Submission:**

- Each Judge submits ruling + 200-word rationale independently
- System reveals all rulings simultaneously (prevents anchoring)
- If majority agrees → auto-execute consequences
- If split → escalate to Master Judge panel

***

## X. Monetization Beyond Platform Fees

**Additional Revenue Streams:**

1. **Premium Memberships (\$15/month):**
    - Unlimited challenges (free users: 2 simultaneous max)
    - Advanced analytics dashboard
    - Priority Judge resolution (48-hour guarantee)
    - Custom challenge types
2. **Corporate Wellness Partnerships:**
    - Companies sponsor employee leagues
    - Employer contributes to prize pools
    - Aggregate anonymized health data reports (HIPAA-compliant)
3. **Fury-as-a-Service API:**
    - External apps integrate audit layer
    - Example: Dating app verifies "gym selfies" are real
    - Per-audit API fee
4. **NFT Reputation Badges (Web3 Extension):**
    - High-integrity users mint "Verified Achiever" NFTs
    - Transferable reputation across platforms
    - Small minting fee per badge
5. **Data Insights (Opt-In, Anonymized):**
    - Aggregate habit success rates by demographic
    - Sell to research institutions, public health agencies
    - Users who opt in get small revenue share

***

## XI. Roadmap Phases

### Phase 1: MVP (Months 1–6)

- Solo Challenges only (Mode 1)
- Tier 2 \& 3 proof types
- Basic Fury audit (manual review, no ML)
- 3-Judge adjudication
- Web app + iOS/Android apps


### Phase 2: Community (Months 7–12)

- Group Pot challenges (Mode 2)
- ML anomaly detection launched
- Fury reputation system + tiering
- Public dispute resolution log
- Judge performance tracking


### Phase 3: Competitive (Months 13–18)

- Competitive Leagues (Mode 3)
- High-Stakes Tournaments (Mode 4)
- Local check-in features (geofencing)
- Video call spot-checks
- Corporate wellness partnerships


### Phase 4: Ecosystem (Months 19–24)

- API launch for third-party integrations
- NFT reputation badges
- Governance DAO for rule changes
- International expansion (localized verification rules)

***

## XII. Key Success Metrics

**User Metrics:**

- Challenge completion rate (target: 60%+ for Solo, 50%+ for Group)
- Repeat participation rate (target: 70% create 2nd challenge within 3 months)
- Average integrity score (target: 80+)

**Fury Metrics:**

- Audit accuracy (target: 85%+ platform-wide)
- Average bounty earnings (target: \$50/week for active Elite Furies)
- False claim rate (target: <5%)

**Judge Metrics:**

- Resolution time (target: <48 hours median)
- Ruling consensus rate (target: 80%+ unanimous or 2/3)
- Appeal overturn rate (target: <10%)

**Economic Metrics:**

- Total stakes locked (AUM)
- Integrity Pool utilization (target: 60–80% paid as bounties)
- Platform fee collection vs. operational costs (target: 40% margin)

***

This spec provides the complete system architecture for Fury Bounty incentives integrated into habit tracking. The key innovations:

1. **Adversarial verification** makes remote challenges trustworthy
2. **Economic alignment** ensures Furies, Judges, and Doers all benefit from honest ecosystems
3. **Tiered proof** balances friction with stakes appropriately
4. **Reputation as currency** builds long-term platform value beyond individual challenges

Next step if needed: detailed wireframes for key screens (Doer dashboard, Fury audit workbench, Judge panel).

