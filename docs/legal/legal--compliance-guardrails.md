> **Research memo (external synthesis), not legal policy.**
>
> This document aggregates external analysis and references for legal/compliance exploration.
> It is **not** the authoritative implementation policy for the product. For current runtime-enforced controls,
> refer to `/docs/legal/legal--aegis-protocol.md` and `/docs/planning/implementation-status.md`.

# Pillar 4: Legal \& Ethical Compliance (The "Gambling" Question)

The Objective: To definitively answer the question raised in your brainstorm: Is betting on yourself illegal?
> "Act as a Legal Consultant specializing in tech startups and gaming law in the United States. I am building an app where users put money into a pool. If they achieve a personal, verifiable goal (like losing 10 pounds or hitting a sales target), they win their money back or win a portion of the shared pot. If they fail, they lose the money.
> Please answer the following:
>  * Does this mechanic meet the legal definition of 'gambling' or 'sports betting' under US law?
>  * Explain the legal distinction between a 'game of chance' and a 'skill-based contest' as it applies to betting on one's own weight loss or habit formation.
>  * How do existing companies like DietBet or HealthyWage legally operate across state lines without a gambling license?
>  * What are the strict regulatory guardrails I must implement (e.g., age limits, health minimums) to ensure the app is not shut down by regulators?"
>

In U.S. law this kind of product sits right on the line between “gambling” and “skill contest.” It is not automatically illegal, and it is definitely not “sports betting” in the classic sense, but the design details will determine whether regulators see it as (a) an unlicensed gambling product, or (b) a lawful skill‑based contest / “commitment device.”

Below is a founder‑oriented walkthrough. This is not legal advice; you will still need a U.S. gaming / promotions lawyer to do a 50‑state analysis and bless the final structure.

***

## 1. Does your mechanic meet the legal definition of “gambling” or “sports betting”?

### The core U.S. gambling test

Most U.S. jurisdictions (statutes, AG opinions, case law) use some variation of the same three‑part test for gambling:

1. **Prize** – The participant can win something of value (usually money or a prize).
2. **Consideration** – The participant pays or gives something of value to play (entry fee, stake, etc.).
3. **Chance** – The outcome depends on chance, randomness, or uncertain events rather than predominantly on the player’s skill or effort.

Where all three are present, you typically have “gambling” or an illegal “lottery” unless you are licensed or fit an explicit exception. Many modern analyses of online products (loot boxes, Twitch monetization, etc.) explicitly describe gambling around these three elements: consideration, chance, and prize.[^1_1][^1_2][^1_3]

Your proposed mechanic:

- Users pay into a money pool → **Consideration** is clearly present.
- Winners get their money back plus potentially a share of other people’s stakes → **Prize** is clearly present.
- Whether a given user hits a weight‑loss or sales target → this is where you argue **skill vs. chance**.

If regulators decide that “chance” predominates in whether a person hits the goal (because of genetics, illness, market volatility, etc.), all three elements are present and the product starts to look like gambling or a private lottery in some states. If they accept that skill/effort predominates, it can fall into the “skill contest” bucket rather than gambling.

### Is it “sports betting”?

Under both federal law and state sports‑betting statutes, “sports betting” is about wagering on the outcome of **sporting events or athletes’ performances**, not on your own life metrics.

- You are not taking bets on a team or athlete.
- Outcomes are not tied to a sporting event recognized by a sports governing body.
- Users are effectively entering a **performance‑based contest** involving themselves.

So the risk is **not** that this is treated as “sports betting,” but that it is treated as a form of unlicensed gambling / lottery if structured poorly.

**Bottom line:**
Across much of the U.S., a “bet on your own weight loss” or “habit challenge” can be structured as a **skill‑based contest** rather than gambling. But there are states with stricter standards (see below), and if you simply copy a “pot of money / house rake” gambling mechanic without careful structuring, you create real gaming‑law risk.

***

## 2. Game of chance vs. skill‑based contest — applied to weight loss \& habits

### The three main state tests

States differ in how they decide whether an activity is “chance” or “skill”:

1. **Predominance test (majority rule)**
    - If **skill predominates** over chance in determining the outcome, it is a skill game, not gambling.
    - Used by many states in analyzing fantasy sports, e‑sports, and similar products.
2. **Material‑element test (some states)**
    - If **chance is a material element** of the outcome, it can still be gambling even if skill also matters.
    - Harder for you, because real‑world factors you cannot control (illness, genetics, job changes) can be framed as “chance.”
3. **Any‑chance test (a few jurisdictions)**
    - If **any chance at all** is present, it may fall under gambling definitions.
    - These are the most conservative and dangerous for your product.

Scholarship and regulators debating loot boxes and novel digital gambling‑like products routinely use these same frameworks; they focus on whether randomization or uncertainty, rather than player skill, drives the result.[^1_4][^1_3][^1_1]

### How this applies to betting on your own goal

For something like “lose 10 pounds in 3 months” or “make 50 sales calls per day”:

**Skill / effort components:**

- Consistent adherence to diet and exercise
- Following a training or sales process
- Time management, discipline, and deliberate practice
- Use of provided coaching, tools, or educational content

**Chance‑like components:**

- Unexpected illness or injury
- Genetic metabolic differences
- Sudden life events (job loss, caregiving responsibilities)
- External market forces affecting sales targets

In a **predominance** state, you can argue:

- The platform does not randomize anything.
- The criteria are objective, knowable in advance, and directly within the user’s behavioral control.
- There is no RNG, no house‑determined odds, no spinning wheels, no random prizing.

That is what allows weight‑loss contests, chess tournaments, and even many fantasy sports formats to be framed as “skill contests” rather than gambling when designed carefully.[^1_2][^1_3]

In **material‑element** or **any‑chance** states, the argument is weaker: regulators can say that because real‑world contingencies outside the user’s control materially influence success, the outcome contains enough “chance” to qualify as gambling if the other two elements (prize, consideration) are present.

### Design tactics to push you firmly into “skill contest” territory

To strengthen the skill characterization:

- **Objective, performance‑based goals:**
    - Use metrics clearly tied to user behavior (logged steps, workouts, number of sales calls) rather than purely outcome numbers (scale weight) when possible.
- **User‑controlled difficulty:**
    - Let users choose among standardized challenge types, but make the success conditions purely rule‑based, not discretionary or random.
- **No randomization anywhere:**
    - No random drawing for extra prizes, no lottery‑style bonus rounds, no “spin to boost your odds.”
- **Transparent scoring:**
    - Publish clear rules and algorithms; let users see how their own actions move them toward success in real time.
- **Verification focused on skill input:**
    - Emphasize logging and verifying actions (e.g., workouts, logged meals, completed sales tasks) not just end‑state outcomes.

Even in optimal design, you will have some states where counsel recommends excluding residents or modifying mechanics, but these decisions are exactly what your gaming lawyer will calibrate.

***

## 3. How DietBet and HealthyWage operate across state lines

### What DietBet actually does (from the record)

An academic study of DietBet’s system describes exactly the mechanic you have in mind:

- Players **“bet money and join a game.”**
- All players have **4 weeks to lose 4% of their initial body weight.**
- At the end, **all players within each game who hit the goal are “winners” and split the pool of money bet at the start.**
- DietBet keeps **15–25% of the starting pool** as its fee, depending on the bet size.[^1_5]

Roughly 40,000 players participated in just seven months; the paper treats DietBet as a commercial web‑based weight‑loss program, not as an underground gambling site.[^1_5]

HealthyWage has publicly described a similar “bet on your weight loss” structure in media and consumer‑facing materials. Both companies have operated for years in the U.S. without being shut down as illegal casinos.

### How they likely make this legal (high level)

Public information, industry practice, and how similar products are structured suggest several strategies (you should confirm specifics with current counsel, since their legal memos are not public):

1. **Positioning as skill‑based contests, not gambling**
    - They emphasize that:
        - Participants are “betting on themselves,” not on random events or sports outcomes.
        - Success depends on personal effort and adherence to health behaviors.
    - The DietBet paper explicitly frames the program as using **financial incentives and social influence** to promote weight loss, similar to deposit contracts and workplace wellness incentives studied in behavioral economics, not as games of random chance.[^1_5]
2. **Operating under promotions / contest law frameworks**
    - They publish detailed “official rules” for each challenge.
    - In states where contests with prizes above certain thresholds must register and bond (e.g., New York, Florida, Rhode Island), they can tailor formats so they are treated as **skill contests** rather than random sweepstakes, which carry different requirements.
    - They may have state‑by‑state carve‑outs (e.g., “void where prohibited,” excluding particular jurisdictions).
3. **Using a “contest service + fee” economic model**
    - DietBet takes a fixed percentage (15–25%) of the entry pool to cover verification, administration, and transaction costs.[^1_5]
    - That looks more like a **contest operator’s fee** than a classic “house edge” based on odds.
    - There is no house‑set line, no betting odds; the company is not wagering against users, only charging for running the challenge.
4. **Insurance / risk‑transfer**
    - Many large‑payout contests (e.g., “make a half‑court shot and win \$1M”) buy **prize indemnity insurance** instead of self‑insuring.
    - While DietBet’s paper does not discuss insurance, several weight‑loss and promotion businesses in this space have publicly talked about using insurers. That helps structure the business more like a promotions / marketing operation than a bookmaker, even though it does not alone solve gambling‑law classification.
5. **Health‑oriented guardrails**
    - They implement eligibility rules and safety constraints (see next section).
    - That helps from a **consumer‑protection and regulatory optics** standpoint: the narrative is wellness, not gambling.

**Key point:**
These companies’ continued operation without high‑profile enforcement actions is evidence that, if designed and papered correctly, a “bet on yourself” model can be run as a lawful contest or wellness program. It is not proof that any particular implementation (including yours) will be legal in every state.

***

## 4. Regulatory guardrails you should build in from day one

Below are the guardrails that both reduce legal risk and make you look more like a wellness / productivity tool than a gambling app. A U.S. gaming / promotions lawyer will treat these as design levers when they draft your terms and do the 50‑state analysis.

### A. Eligibility, age limits, and health protections

- **Age minimum:**
    - Make **18+** your absolute floor nationwide.
    - Consider **21+** for certain high‑risk jurisdictions or product tiers, depending on counsel’s view.
- **Health‑based eligibility:**
    - Exclude:
        - Users below a safe BMI threshold (e.g., underweight individuals).
        - Pregnant users for weight‑loss challenges.
        - Users with certain medical conditions unless they have **doctor’s clearance**.
    - Require explicit acknowledgement that:
        - Participation is voluntary.
        - The app is not medical advice.
        - Users should consult a physician before undertaking any significant change.
- **Goal safety constraints:**
    - Limit the **maximum weight‑loss or performance goals** (e.g., weight‑loss rate per week) to medically safe ranges.
    - For performance goals (sales, coding hours, etc.), avoid goals that incentivize overwork in a way that could trigger employment law or occupational health scrutiny.
- **Geographic restrictions:**
    - Implement **geolocation and address verification** to:
        - Exclude states where counsel says the risk is too high.
        - Present state‑specific terms when necessary (“void where prohibited”).


### B. Game design to avoid being seen as a lottery

1. **Structure as a skill contest**
    - Make success criteria entirely **objective and behavior‑driven**.
    - No random drawings for entry or prizes.
    - No “mystery multipliers,” loot‑box‑style rewards, or random bonuses, which regulators already associate with gambling.[^1_3][^1_1][^1_4]
2. **Strong argument that skill predominates**
    - Provide tools and education (meal plans, training content) that directly help users succeed.
    - Emphasize in your marketing and rules that **user effort is the driver** of success, not luck.
    - Avoid tying payouts to events outside the user’s control (e.g., “If the S\&P 500 goes up and you hit your target, you get triple”).
3. **Economic model**
    - Prefer:
        - A **fixed platform fee** per contest or per user, disclosed up front.
        - Or a clearly fixed **percentage of the entry pool** akin to DietBet’s 15–25% fee for verification and operations, not tied to outcomes beyond covering costs.[^1_5]
    - Avoid:
        - Variable “house edge” structures where your profits directly scale with user losses.
        - Side bets, parlays, or any odds‑based betting UI.
4. **Safer alternative variant (if you want to de‑risk further)**

Consider building an option that *removes the “prize” element*:
    - User stakes an amount as a **refundable commitment**.
    - If they hit the goal, they simply get their own money back.
    - If they fail, the money is:
        - Donated to a pre‑selected charity, or
        - Kept as a **fixed fee** by the platform.
    - No participant ever wins more than they put in; there is only a risk of loss, not a chance of gain.

This starts to look less like a gambling product and more like a classic behavioral‑economics “commitment device” (deposit contract), which has a long academic and workplace‑wellness pedigree. It also dramatically simplifies promotions‑law analysis in many states.[^1_5]

### C. Compliance with promotions / contest law

- **Official rules for every contest:**
    - Clearly state:
        - Eligibility (age, geography, health, etc.).
        - Start / end dates and time zone.
        - Exact performance criteria and verification methods.
        - How winners are determined and how prizes are calculated.
        - Maximum number and value of prizes.
        - Dispute‑resolution procedure.
    - Ensure these rules are **consistent with your product behavior** and enforced identically for all users.
- **Registration \& bonding where needed:**
    - If you ever run **chance‑based sweepstakes** alongside your core product (e.g., random giveaways), you must:
        - Follow state rules on registration and bonding for large‑prize promotions (e.g., NY, FL, RI thresholds).
    - For **pure skill contests**, some of those requirements do not apply, but you must keep the contests genuinely skill‑based.
- **Truth‑in‑advertising:**
    - Avoid:
        - Overstating odds of success.
        - Implying guaranteed results.
    - Do:
        - Disclose average success rates and typical outcomes once you have data.
        - Make all conditions for winning clear in marketing, not only in fine print.


### D. Payments, AML, and consumer‑protection basics

- **KYC / identity checks:**
    - At least collect:
        - Legal name
        - Date of birth
        - Address
    - For higher stakes, consider ID verification to:
        - Enforce age limits.
        - Reduce fraud / money‑laundering risk.
- **AML / transaction monitoring:**
    - Even if you are not a money services business, implement:
        - Limits on deposit and withdrawal frequency and amounts.
        - Monitoring for unusual patterns (rapid in‑and‑out transfers with no real participation).
        - A written policy for handling suspicious activity.
- **Refunds and chargebacks:**
    - Have a clear policy, particularly for:
        - Early contest cancellation.
        - Technical failures (e.g., verification system outages).
- **Data privacy (esp. health data):**
    - Treat weight and other metrics as **sensitive personal data**.
    - Comply with:
        - State privacy laws (e.g., CCPA/CPRA in California, and analogs elsewhere).
        - Any future state “health data” laws your counsel flags.


### E. Responsible gambling / wellness safeguards

Even if you avoid the gambling label, regulators look at **harm minimization**:

- **Deposit \& loss limits:**
    - Cap:
        - Maximum stake per challenge.
        - Maximum total at risk per month, per user.
- **Self‑exclusion \& cool‑off:**
    - Allow users to:
        - Self‑exclude for a set period.
        - Set personalized weekly/monthly caps.
    - Enforce a **cool‑off** after repeated failures or significant losses.
- **Warnings and resources:**
    - Prominent disclosures:
        - “You can lose money; this is not an investment product.”
        - “This is not medical advice; talk to your doctor.”
    - Links to:
        - Problem gambling resources (e.g., NCPG in the U.S.).
        - Eating‑disorder and mental‑health resources, given the weight‑loss context.
- **Fairness \& anti‑abuse:**
    - Rigorous verification to prevent cheating (DietBet uses photo and video weigh‑ins, algorithms to flag suspicious patterns, and in‑person or live video checks when needed).[^1_5]
    - Consistent enforcement of rules to avoid deceptive or arbitrary outcomes.

***

## 5. Practical steps as a founder

1. **Engage specialized counsel before launch**
    - Look for a U.S. firm / boutique that explicitly lists:
        - “Gaming and wagering”
        - “Promotions, contests, sweepstakes”
        - “Fantasy sports / online skill games”
    - Ask for:
        - A **50‑state risk memo** on your exact mechanic.
        - A **design‑feedback pass** on your product spec before engineering.
2. **Decide your risk posture**
    - Conservative:
        - Start with a **pure “commitment device” / refund‑only** model.
        - No prize beyond a user’s own stake; money goes to charity or platform fees on failure.
    - Moderate:
        - Shared‑pot contests (DietBet‑style) but:
            - Skill‑heavy design.
            - Strong guardrails.
            - Exclude “red flag” states.
    - Aggressive:
        - More elaborate prize structures or higher stakes.
        - Likely demands more licensing / registrations and higher legal spend.
3. **Build compliance into the product, not as an afterthought**
    - Age gates, geolocation, verification, contest rules, and audit logs should be **core features**, not patched on.
    - Design your data model so you can easily:
        - Prove outcomes were determined exactly as described in your rules.
        - Produce logs if a regulator ever asks.
4. **Document your “skill” story**
    - Internal whitepaper laying out:
        - Why your contests are skill‑based.
        - How user actions determine outcomes.
        - How you’ve removed random elements.
    - This both guides product design and gives outside counsel something concrete to react to.

***

### Direct answers to your four bullets

1. **Does your mechanic meet the legal definition of “gambling” or “sports betting”?**
    - **Sports betting:** No, this is not “sports betting” as that term is used in U.S. law; you are not wagering on sports events or athlete performance.
    - **Gambling:** It **can** satisfy the three traditional elements (prize, consideration, chance) and thus be treated as gambling / an illegal lottery in some states if you are not licensed and do not design it as a skill contest. In many jurisdictions, a carefully designed “bet on yourself” product has a solid argument to be a **skill‑based contest** rather than gambling, but you must design and market it with that legal theory in mind and accept that some states may need to be excluded.[^1_2]
2. **Legal distinction between game of chance and skill‑based contest here**
    - A **game of chance** is one where random factors or uncontrollable external events materially determine who wins.
    - A **skill‑based contest** is one where users compete based on their abilities and efforts, under objective, transparent rules, without randomization.
    - Weight‑loss or habit‑formation challenges can be argued to be skill contests if they:
        - Use clear, behavior‑based goals under user control.
        - Avoid any random elements.
        - Are framed and supported as wellness / performance programs rather than speculative wagers.
3. **How DietBet/HealthyWage operate across state lines without a gambling license**
    - They:
        - Frame the product as a **skill‑based weight‑loss contest**, not random gambling.[^1_5]
        - Use **objective criteria** (e.g., “lose 4% of starting weight in 4 weeks”).[^1_5]
        - Charge a **contest operator fee** (e.g., DietBet’s 15–25% of the initial pot) rather than acting as a traditional house bookmaker.[^1_5]
        - Publish official rules and use robust verification systems to enforce them.[^1_5]
        - Almost certainly run on top of a detailed state‑by‑state legal analysis, excluding or tailoring for jurisdictions where the risk is too high.
4. **Regulatory guardrails you must implement to reduce shutdown risk**
    - Age limits (18+, possibly 21+ in some contexts).
    - Health minimums and exclusions (no underweight participants, pregnancy safeguards, safe goal limits, doctor clearance in higher‑risk cases).
    - Clear contest rules and skill‑based design; no randomization, no loot‑box‑style mechanics.
    - Transparent, fixed fee structure; avoid acting like a bookmaker.
    - Geolocation and state‑specific eligibility (“void where prohibited”).
    - Strong verification, anti‑cheating systems, and dispute resolution processes.
    - Responsible‑use features: deposit/loss caps, self‑exclusion, cooling‑off periods, and links to health and problem‑gambling resources.
    - KYC and basic AML monitoring, plus robust privacy and data‑security practices.

If you’d like, a next step could be to sketch two or three concrete product variants (e.g., “refund‑only commitment device,” “shared pot for steps logged,” “team‑based company challenges”) and walk through how each can be tuned legally and commercially.
<span style="display:none">[^1_10][^1_11][^1_12][^1_13][^1_14][^1_15][^1_16][^1_17][^1_18][^1_19][^1_20][^1_21][^1_22][^1_23][^1_24][^1_25][^1_26][^1_27][^1_28][^1_29][^1_30][^1_31][^1_32][^1_33][^1_34][^1_35][^1_36][^1_37][^1_38][^1_39][^1_40][^1_41][^1_42][^1_43][^1_44][^1_45][^1_46][^1_47][^1_48][^1_49][^1_50][^1_51][^1_52][^1_6][^1_7][^1_8][^1_9]</span>

<div align="center">⁂</div>

[^1_1]: https://www.tandfonline.com/doi/full/10.1080/14459795.2024.2390827

[^1_2]: https://www.tandfonline.com/doi/full/10.1080/14459795.2020.1766097

[^1_3]: https://enforcement.omsu.ru/jour/article/view/759

[^1_4]: https://jurnal.unived.ac.id/index.php/jhs/article/view/7298

[^1_5]: https://games.jmir.org/2014/1/e2/PDF

[^1_6]: https://international.appihi.or.id/index.php/IJLCJ/article/view/565

[^1_7]: https://ijins.umsida.ac.id/index.php/ijins/article/view/1728

[^1_8]: https://journal.staisar.ac.id/index.php/mediasas/article/view/171

[^1_9]: https://journals.sagepub.com/doi/full/10.1089/glr2.2024.0022

[^1_10]: https://link.springer.com/10.1007/s40429-025-00656-5

[^1_11]: https://ejournal.undiksha.ac.id/index.php/janapati/article/view/103511

[^1_12]: https://ijsshr.in/v8i11/34.php

[^1_13]: https://www.spiedigitallibrary.org/conference-proceedings-of-spie/13181/3031241/Data-mining-of-encrypted-network-traffic-for-adult-content-and/10.1117/12.3031241.full

[^1_14]: https://archive.sreif.us/index.php/mpm/article/view/37

[^1_15]: https://www.entsportslawjournal.com/article/id/842/

[^1_16]: https://linkinghub.elsevier.com/retrieve/pii/S2468266720302899

[^1_17]: https://dinastires.org/JLPH/article/view/1947

[^1_18]: https://sciendo.com/article/10.25143/socr.28.2024.1.09-17

[^1_19]: http://visnyk-pravo.uzhnu.edu.ua/article/view/324782

[^1_20]: https://ijins.umsida.ac.id/index.php/ijins/article/view/977

[^1_21]: https://ijlso.ccdsara.ro/index.php/international-journal-of-legal-a/article/view/106

[^1_22]: http://eudl.eu/doi/10.4108/eai.12-11-2022.2327269

[^1_23]: https://dinastires.org/JLPH/article/view/2293

[^1_24]: https://pmc.ncbi.nlm.nih.gov/articles/PMC526104/

[^1_25]: https://www.bmj.com/content/bmj/365/bmj.l1807.full.pdf

[^1_26]: https://ejournal.ipinternasional.com/index.php/jsh/article/view/1595

[^1_27]: https://ejournal.uinfasbengkulu.ac.id/index.php/mizani/article/view/7158

[^1_28]: https://ejournal.radenintan.ac.id/index.php/adalah/article/view/21254

[^1_29]: https://ejournal.uinmybatusangkar.ac.id/ojs/index.php/Juris/article/view/10537

[^1_30]: https://jurnal.unissula.ac.id/index.php/akta/article/view/27868

[^1_31]: https://jurnal.unissula.ac.id/index.php/akta/article/view/37618

[^1_32]: https://jurnal.unissula.ac.id/index.php/ldj/article/view/37456

[^1_33]: https://journal.uinjkt.ac.id/index.php/citahukum/article/view/16525

[^1_34]: https://mljsl.sljol.info/article/10.4038/mljsl.v7i1.7387/

[^1_35]: https://journal-rabiza.com/index.php/JHK/article/view/15

[^1_36]: https://pmc.ncbi.nlm.nih.gov/articles/PMC10478046/

[^1_37]: https://pmc.ncbi.nlm.nih.gov/articles/PMC11577719/

[^1_38]: https://journals.sagepub.com/doi/10.1177/10482911221133796

[^1_39]: https://pmc.ncbi.nlm.nih.gov/articles/PMC4880250/

[^1_40]: https://pmc.ncbi.nlm.nih.gov/articles/PMC2638047/

[^1_41]: https://pmc.ncbi.nlm.nih.gov/articles/PMC9582739/

[^1_42]: https://www.semanticscholar.org/paper/ac6ed6886a1495b0ecfa8dfc86a09a439afefac6

[^1_43]: https://ejournal.stih-awanglong.ac.id/index.php/juris/article/view/592

[^1_44]: https://www.semanticscholar.org/paper/53c1fa7aa89e22bf12f893a3c183adf69d579926

[^1_45]: https://journals.sagepub.com/doi/10.1177/0038038502036003015

[^1_46]: https://www.cambridge.org/core/product/identifier/S0023921600006551/type/journal_article

[^1_47]: https://www.semanticscholar.org/paper/115e1bb09956bd6c9db78ce0bb14eaefc73cbdc1

[^1_48]: https://www.semanticscholar.org/paper/caa43e8759291c902ef93645705e0d48fe8ddbe4

[^1_49]: https://journals.sagepub.com/doi/full/10.1089/109218801753204388

[^1_50]: https://arxiv.org/pdf/2312.10331.pdf

[^1_51]: https://zenodo.org/record/4289341/files/article.pdf

[^1_52]: https://pmc.ncbi.nlm.nih.gov/articles/PMC10397120/


---

# sketch two or three concrete product variants (e.g., “refund‑only commitment device,” “shared pot for steps logged,” “team‑based company challenges”) and walk through how each can be tuned legally and commercially.

Here are three concrete variants, from most conservative legally to most aggressive (and potentially most lucrative). Each can be tuned along a spectrum, but this will give you clear design “templates.”

***

## Variant 1: Refund‑Only Personal Commitment Device

### Core mechanic

- User stakes a fixed amount (e.g., 50–200 dollars) into a **personal lockbox** tied to a clear, time‑bound goal:
    - Health: “Log 10,000 steps on at least 25 of the next 30 days.”
    - Productivity: “Complete 2 hours of deep work on 20 of the next 30 days.”
    - Sales: “Make 50 outbound calls on at least 15 workdays this month.”
- If the user meets the criteria, they **get back 100% of their own money**.
- If they fail, the stake is:
    - Donated to a **charity** they preselect; or
    - Retained as a **fixed platform fee** (or split between charity and platform).
- Crucially: they never win more than they put in; the only “upside” is preserving their stake and intrinsic goal achievement.


### Legal posture and tuning

- **Consideration:** yes, the user stakes money.
- **Prize:** arguable. Many lawyers will characterize “getting your own money back” as **not a prize in the gambling sense** (since you are not better off than before).
- **Chance:** heavily de‑emphasized by:
    - Focusing on **behavioral inputs** (logged actions) rather than outcome‑only metrics.
    - Allowing some slack (e.g., “20 of 30 days”) so one bad day or illness doesn’t kill the whole contract.

Tuning options:

- To make this as safe as possible:
    - Default the “failure” path to **charitable donation**, not platform profit.
    - Cap stakes low (e.g., max 200–300 dollars per contract).
    - Emphasize that this is a **behavioral commitment tool**, not a way to “win money.”
- For slightly more revenue:
    - Keep a **fixed fee** portion from forfeited stakes (e.g., platform always takes 10–20% for operating costs) and send the rest to charity.
    - This still feels much more like a wellness tool than gambling.


### Commercial model

- **Monetization options:**
    - Flat subscription (e.g., 9–15 dollars per month) to access unlimited or discounted “commitment contracts.”
    - Or low **platform fee on each commitment** (e.g., 5–10% upfront).
    - Ancillary revenue: selling **coaching, premium content, or integrations** (e.g., with wearables, CRMs) to increase success rates.
- **Pros:**
    - Easiest to defend as **non‑gambling**.
    - Positioning is clean: “put your money where your mouth is to keep yourself accountable.”
    - Charitable angle gives you good PR and potential partnerships.
- **Cons:**
    - Less virality: no “jackpot” shared pot to brag about.
    - Revenue per user is lower unless your engagement and volume are strong.

This is an excellent **MVP / pilot** variant: get behavioral data, UX learnings, and initial legal comfort before adding shared‑pot mechanics.

***

## Variant 2: Shared Pot Skill Contest (Steps / Workouts / Calls)

### Core mechanic

- Users join **time‑boxed public or private challenges** with fixed rules:
    - Example: “30‑Day Step Challenge: Hit 8,000 steps on 20+ days.”
    - Entry fee: say, 20–50 dollars.
- All fees go into a **shared pool**.
- At the end:
    - Everyone who meets the criteria is a **“winner”**.
    - Winners split the pool **pro rata** or equally, **minus a fixed platform fee** (e.g., 15–25% of the initial pool).
- Key design choice: use **behaviorally‑verified metrics**:
    - Steps via wearable / phone.
    - Logged workouts.
    - Logged action counts (sales calls, Pomodoro sessions), ideally with some automated verification.


### Legal posture and tuning

Here the classic three elements are clearly in play; your job is to win the **skill contest vs. gambling** argument.

- **Prize:** yes – users can get back more than they put in.
- **Consideration:** yes – entry fee.
- **Chance vs. skill:** you push hard on “skill/effort predominates” by:
    - Using metrics closely tied to user action (e.g., daily steps) rather than purely outcome metrics like “lose X pounds.”
    - Setting goals that are **attainable with consistent effort**.
    - Providing tools, reminders, and content that support that effort (coaching, programs).

Tuning levers:

- **Decrease chance, increase skill:**
    - Prefer daily **action‑based goals** (“log 20 push‑ups for 20 days”) over aggregated, outcome‑only metrics (“lose 10 pounds”).
    - Build **slack** into rules (e.g., “20 of 30 days”) so random life events don’t dominate outcomes.
    - Avoid any random elements in determining winners or prize amounts.
- **Economic model tuned for optics:**
    - Take a **transparent, fixed percentage** of the pool (e.g., 15–25%) as an admin/verification fee.
    - Do not dynamically change your fee based on outcomes or “odds.”
    - Do not bet against users or set “lines” the way a sportsbook does.
- **Jurisdictional tuning:**
    - Use **geofencing** and “void where prohibited” language to:
        - Exclude hardest‑line states or countries.
        - Offer a more conservative version (e.g., Refund‑Only) to residents of sensitive jurisdictions.


### Commercial model

- **Monetization:**
    - Percentage of each pot (similar to DietBet’s 15–25% fee).
    - Premium tiers with:
        - Higher maximum stakes.
        - Access to higher‑value contests.
        - Advanced analytics or coaching.
- **Growth loop:**
    - Built‑in virality: people love sharing “I turned 30 dollars into 70 dollars by walking every day.”
    - Referral bonuses (careful to structure these as **marketing credits**, not gambling‑style affiliate bounties).
- **Pros:**
    - Much stronger **engagement \& virality** than Variant 1.
    - Clear “fun” / game dynamic; compelling consumer story.
    - Proven model: close to what DietBet already runs.
- **Cons:**
    - Higher legal complexity, especially in a few stricter states.
    - Need robust **verification and anti‑cheating** systems.
    - Potential to attract scrutiny as a quasi‑gambling product if marketed recklessly (“double your money fast!”).

This is your “DietBet‑plus” model: you can refine the mechanics (e.g., use more behavior metrics, make it multi‑domain, focus on daily actions vs. outcomes) to improve both the legal story and user value.

***

## Variant 3: Team‑Based B2B Challenges (Employer / Sales Org Focus)

### Core mechanic

- You sell the platform to **employers or sales organizations**, who invite their staff to participate in **team‑based challenges**:
    - Health: “Departments compete on average daily steps for a quarter.”
    - Productivity: “Sales teams compete on number of completed outreach tasks and pipeline generated.”
    - Learning: “Teams compete on number of completed training modules.”
- Funding flows:
    - The **company funds the prize pool** (e.g., 5,000 dollars in rewards).
    - Employees **do not stake their own money**; they just participate.
- Rewards:
    - Top teams or individuals win **cash bonuses**, gift cards, PTO days, or other incentives.
    - Prizes can be structured as part of **wellness or incentive compensation**.


### Legal posture and tuning

Here you can strip out at least one key element of gambling directly:

- If **employees do not pay to participate**, you largely remove **consideration** from the player side.
- The company is just running **incentive contests** and wellness programs, which already exist in huge numbers (wellness rebates, step challenges, sales SPIFFs).

Tuning options:

- **Zero employee stakes:**
    - The cleanest version: employees never pay; they only stand to gain from employer‑funded prizes.
    - This keeps you firmly in “incentive program / contest” land, not gambling.
- **Optional “commitment boosts” (careful extension):**
    - As an advanced option, you could later add **voluntary personal stakes** layered on top of the employer program (e.g., “I also put 50 dollars of my own money at risk to hit my targets”).
    - That reintroduces consideration and moves you closer to Variants 1 or 2, so you would handle that portion exactly as above (refund‑only vs. shared pot).
- **Employment and wellness law:**
    - You now primarily navigate:
        - Workplace wellness program regulations and nondiscrimination rules.
        - Tax treatment of prizes and bonuses.
        - HR/ERISA implications if some benefits are tied to health metrics.
    - There is a solid body of practice around these programs; they are common in the U.S. workplace wellness space.


### Commercial model

- **Monetization:**
    - SaaS: per‑employee per‑month (PEPM) or flat contract with each employer.
    - Implementation fees for custom configuration and integrations (HRIS, CRMs, wearable platforms).
    - Optional **“contest design” consulting** packages.
- **Pros:**
    - High **revenue per contract** (one company = hundreds or thousands of users).
    - Much safer legally if you keep employees from staking their own money.
    - Stickier: once embedded into wellness or sales programs, churn can be low.
- **Cons:**
    - Slower sales cycle (B2B procurement).
    - You must build admin tooling, reporting, and integrations to be enterprise‑grade.
    - Less consumer virality; growth comes from sales, not virality.

This variant lets you build a **stable, lower‑risk B2B business** that can later support or cross‑subsidize a higher‑risk consumer shared‑pot product if you want to go there.

***

## How these variants can coexist and evolve

You do not have to pick exactly one forever. A sensible roadmap:

1. **Phase 1 – Conservative consumer MVP (Variant 1):**
    - Launch a **refund‑only commitment app** (maybe with the charity‑on‑failure twist).
    - Nail:
        - Onboarding, goal configuration, and verification UX.
        - Integrations with wearables, CRMs, calendars.
    - Parallel track: get counsel to bless the architecture and do a state‑by‑state risk map for shared pots.
2. **Phase 2 – B2B team‑based challenges (Variant 3):**
    - While the consumer product grows, build a B2B layer:
        - Employer control panels.
        - Reporting dashboards.
    - This builds:
        - Stable revenue.
        - A brand positioned around **performance and wellness**, not gambling.
3. **Phase 3 – Shared‑pot contests in selected jurisdictions (Variant 2):**
    - Roll out **shared‑pot challenges**:
        - Initially in the most favorable states/countries.
        - Focused on action‑based metrics (steps, workouts, calls) to maximize the skill argument.
    - Maintain:
        - Conservative caps on stakes.
        - Strong responsible‑use features.
4. **Phase 4 – Optimization and segmentation:**
    - For high‑risk jurisdictions, keep only Variant 1 (or B2B only).
    - For low‑risk jurisdictions, offer the full portfolio:
        - Basic commitment contracts.
        - Social shared‑pot contests.
        - Employer programs.

***

If you want to go one level deeper, the next step is to pick **one concrete user story** (e.g., “solo salesperson using a commitment contract,” or “NYC tech company running a 90‑day wellness challenge”) and design the full funnel for that variant — from pricing and rule language all the way down to verification flows and edge‑case handling. That’s where you can see how the legal theory surfaces in actual product screens.
