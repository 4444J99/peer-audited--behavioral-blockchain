<img src="https://r2cdn.perplexity.ai/pplx-full-logo-primary-dark%402x.png" style="height:64px;margin-right:32px"/>

# Pillar 1: User Psychology \& Behavior

The Objective: To understand the exact scientific mechanisms of why people change behavior when money and ego are involved, specifically focusing on "Loss Aversion."
> "Act as a behavioral economist specializing in gamification and habit-building. I am developing an app where users place a financial 'buy-in' on their own goals (fitness, productivity) and lose the money if they fail.
> Please provide a comprehensive analysis of the following:
>  * How does the concept of 'Loss Aversion' (the idea that the pain of losing is psychologically twice as powerful as the pleasure of gaining) apply to habit formation?
>  * What is the 'Endowed Progress Effect' and how can I use it to keep users from churning?
>  * Provide a breakdown of extrinsic vs. intrinsic motivation in this context. At what point does financial penalty cause a user to abandon an app due to 'progress anxiety' rather than motivating them?
>  * Cite real-world psychological studies or papers that support these mechanisms."
>

Loss aversion and endowed progress are exactly the levers you want to pull—but they are sharp tools. They can drive behavior change very effectively, but overused they create anxiety, avoidance, and churn. Below is a synthesis of what is known from behavioral economics, self-determination theory, and habit-formation trials, plus concrete design implications for your app.

***

## 1. How loss aversion applies to habit formation

### 1.1. What loss aversion actually is

Prospect Theory shows that people evaluate outcomes relative to a reference point and that losses below this reference point carry more psychological weight than equivalent gains above it—commonly approximated as “about twice as powerful.” Neuro and psychophysiological work reinforces this:[^1_1][^1_2]

- The amygdala and related circuits encode the emotional salience of losses; rare patients with bilateral amygdala damage show almost no monetary loss aversion in lab tasks.[^1_3]
- Monetary loss functions as a powerful “secondary reinforcer”: losing money elicits aversive responses (skin conductance, conditioning) comparable to primary punishers like electric shock.[^1_4]
- The threat of losses changes behavior beyond simple choice–people explore more and are more vigilant when losses are on the line.[^1_5]

So monetary penalties plug directly into fear/threat systems, not just “rational cost–benefit” calculation. That’s why deposits and loss-framed incentives are potent even when the amounts are small.

### 1.2. Loss aversion in commitment devices and habit building

Commitment contracts that put money at risk have repeatedly been shown to change health behaviors:

- **Smoking cessation deposit contracts (Philippines, CARES)**: Smokers could deposit their own money for six months; if they passed a biochemical test, they got it back, otherwise forfeited it. Take-up was modest (≈11%), but those offered the product were significantly more likely to quit smoking at 6 months and 12 months than controls, indicating lasting behavior change.[^1_6]
- **Deposit-based abstinence reinforcement**: In a lab smoking trial, a deposit-contract group and a no-deposit voucher group achieved similar abstinence during treatment, but the deposit group required far less external money, because participants were effectively “paying themselves” via their own deposits.[^1_7]
- **Online weight-loss commitment contracts (stickK-style)**: In a retrospective analysis of 3,857 online weight-loss contracts, users who put up their own money lost a higher percentage of body weight than those who did not; deposit size and the presence of a financial stake were positively associated with weight loss.[^1_8]
- **Internet-based deposit contracts for smoking**: Participants who self-selected deposit amounts and could earn them back by meeting carbon monoxide goals showed meaningful reductions in smoking; deposit contracts were cost-effective but not universally liked.[^1_9]

Large-scale data from stickK.com (742k users, 397k commitments) reinforces this: external accountability (referees, supporters) and **putting money at stake** are relatively rare but are among the strongest predictors of successful goal completion.[^1_10]

In physical-activity and chronic-disease settings, many trials now use **loss-framed incentives**, where participants are given a virtual pot of money and lose part of it each day they fail to meet an activity goal. These designs tend to outperform equivalent gain-framed bonuses:

- A trial where sedentary adults were given a daily step goal found that a loss-framed incentive (money preallocated weekly; participants “lost” \$ each day they missed) produced significantly larger increases in steps than control, even though expected value was the same.[^1_11]
- In IHD patients, a trial that allocated \$14/week to a virtual account and deducted \$2 per non-compliant day produced substantial, sustained increases in daily steps versus control over both ramp-up and maintenance phases.[^1_12]

**Mechanistically for your app:**

- Users encode the *buy-in* not as “money spent on a product” but as **money they own that is now at risk**. Each failure day is experienced as a fresh realization of that loss.
- The reference point becomes “I should keep all of *my* stake,” and each missed workout or unproductive day is a step below that reference point, which feels like a painful deviation.
- Small, repeated potential losses (e.g., “you lose \$2 if you miss today”) harness ongoing vigilance and can be more motivating than a single lump-sum penalty at the end, because the pain is salient *every day*.

This is exactly why loss-based designs are so behaviorally powerful in early habit formation.

***

## 2. The Endowed Progress Effect and reducing churn

### 2.1. What the Endowed Progress Effect is

The “Endowed Progress Effect” describes how giving people *artificial* head start toward a goal (e.g., extra stamps on a loyalty card) significantly increases their completion rates and speeds up progress.[^1_13]

It builds on the classic **goal-gradient hypothesis**: as people perceive themselves to be closer to a goal, they increase effort—purchases occur more rapidly, actions bunch near the finish line, and “almost there” is a uniquely motivating state.[^1_14][^1_15]

Nunes \& Drèze’s experiments on loyalty cards show that when you:

- Keep the *objective* distance to the goal constant, but
- Reframe the task such that users see some progress already credited,

completion rates and persistence increase substantially.[^1_13]

### 2.2. How to use Endowed Progress in your app

You can use endowed progress to both increase early engagement and soften the sting of loss aversion (reducing churn risk):

**a) Start with a visible head start**

- On sign-up, pre-credit users with some progress:
    - “You’re already 20% of the way to your 30-day streak because you completed onboarding and set a goal.”
- For financial framing, you can **lock in a portion of their stake as already “protected”** when they complete initial tasks:
    - “You’ve already secured \$10 of your \$50 stake by setting your plan and logging your first week.”

This leverages loss aversion in a softer way: users now fear losing *their endowed progress* and “protected” money, not just the full stake.

**b) Use progress bars and milestones that compress the early distance**

- Rather than a flat 0–100% bar for a 90-day goal, cluster early milestones so that the first few actions move the bar disproportionately.
- Breaking a long goal into clearly defined sub-goals (“Weeks 1–3: Establishing the habit”) makes each sub-goal feel closer and more achievable.[^1_16]

**c) Give “catch-up” endowed progress to at-risk users**

When someone has slipped:

- Immediately after a lapse, instead of only saying “you lost \$X,” emphasize remaining endowed progress:
    - “You’ve still preserved 70% of your stake and completed 9 of 12 planned sessions; you’re closer than you think to locking in this month.”
- For returning users, consider **crediting extra buffer progress** (“We’re counting your earlier streak toward this new challenge”) to offset feelings of being “too far behind.”

This reduces the subjective distance to the goal and counters the “I’ve blown it, might as well quit” dynamic.

***

## 3. Extrinsic vs intrinsic motivation in this context

### 3.1. The self-determination theory lens

Self-determination theory (SDT) distinguishes:

- **Intrinsic motivation**: Doing an activity because it is inherently satisfying (enjoyment, interest, identity).
- **Extrinsic motivation**: Doing it for an external outcome (money, grades, weight target), which can vary from externally controlled (“to avoid punishment”) to more internalized (“because it aligns with my values”).[^1_17][^1_18]

The classic meta-analysis by Deci, Koestner \& Ryan reviewed >100 experiments and found that:

- **Tangible, expected, contingent rewards** often *reduce* intrinsic motivation for interesting tasks—especially when perceived as controlling.[^1_19][^1_20]
- Verbal praise and informational feedback that support competence/autonomy can *increase* intrinsic motivation.
- For “boring” or low-intrinsic-value tasks, extrinsic rewards can increase engagement without much undermining effect.[^1_20]

Subsequent work nuances this: rewards are most damaging when they are experienced as **controlling** and when people *already* enjoy the activity; they are less problematic or even helpful when they feel **supportive** and when the task is not intrinsically rewarding yet.[^1_21][^1_22]

In gamification, effects on intrinsic motivation depend heavily on whether design supports autonomy, competence, and relatedness vs. being purely transactional.[^1_23][^1_24]

### 3.2. How this plays out with financial penalties

In your app:

- Early in a habit (e.g., exercise for someone who currently dislikes it), the behavior is *not* yet intrinsically rewarding. Here, **financial stakes can serve as “training wheels”** to get behavior above activation energy.[^1_25][^1_26]
- Over time, if users start to experience competence (improvement, energy, mood) and identity benefits (“I’m the kind of person who trains”), intrinsic motivation can grow.

However, persistent high-pressure penalties can:

- Make the behavior feel like an obligation imposed by the app (external control).
- Focus attention on **avoiding loss** rather than on gaining health, mastery, or identity benefits.
- Interact with negative affect from the activity itself (exercise discomfort, cognitive fatigue) to produce an overall aversive experience, which predicts dropout.[^1_27][^1_28]

There is also emerging work on **reference-based motivation** showing that motivation rises with expected value *relative to a reference point*; when the reference point is too ambitious or the probability of success falls, optimal effort can *decrease*—people rationally (and emotionally) disengage from “hopeless” goals.[^1_29]

So your design needs dynamic calibration: high enough stakes to be felt, but not so large or rigid that users feel controlled or doomed.

***

## 4. When penalties flip from motivating to “progress anxiety” and abandonment

There is no universal numeric threshold (e.g., “2% of income”), but research points to several *patterns* where financial/ loss-based designs backfire.

### 4.1. Evidence of backfire or limits

1. **Low uptake and acceptability of deposit contracts**
    - In many deposit-contract trials, only a minority of eligible people choose to put their own money at risk (e.g., 11% in the CARES smoking trial), even though the product is beneficial.[^1_6]
    - In an internet-based nationwide smoking cessation program that required a \$50 deposit, participants rated the deposit component as the *least* acceptable part of the intervention, even though incentives improved short-term abstinence.[^1_30]
    - A smartphone app trial that compared self-funded deposit contracts versus equivalent externally-funded rewards found that deposit contracts were **not more effective** than rewards and had markedly lower uptake; unexpectedly, **loss framing (emphasizing what was lost) performed worse than gain framing** in that sample.[^1_31]

This suggests that while loss aversion is powerful among those who opt in, aggressive penalty framing can deter sign-ups and create negative user sentiment.
2. **Anxiety and negative affect from loss-framed messages**
Loss-framed health communications (emphasizing the risks of not exercising) can increase anxiety—e.g., in one study on lifelong exercise intentions, high-risk, loss-framed messages about aging risks simultaneously promoted intentions and **increased aging-related anxiety**, a paradox the authors highlight. Analogously, strong loss framing around fitness/productivity may inflate “progress anxiety” without proportionate behavioral gains.[^1_32]
3. **Affective experience and exercise adherence**
Reviews of the “exercise–affect–adherence” pathway show that when exercise consistently feels aversive, people drop out, regardless of knowing its benefits. If your app adds *monetary fear* on top of *bodily discomfort* and *time cost*, the net affective state can become so negative that users disengage entirely.[^1_33][^1_27]
4. **Dropout in real-world fitness settings**
Longitudinal work tracking new fitness-club members shows high drop-out in the first year, with key barriers including lack of time, low enjoyment, and feeling that one is not progressing. If your app’s penalties repeatedly highlight “you’re failing,” they may amplify precisely those feelings that drive dropout.[^1_34][^1_28]
5. **Long-term incentive withdrawal and behavior**
A large natural experiment on a national financial-incentive program for physical activity found that after more than a year of incentives, **scaling back** rewards led to only modest declines in activity, suggesting that once habits form, heavy ongoing incentives are not necessary. This supports a design where financial stakes **taper down** as intrinsic and identity-based motivation grows.[^1_35]

### 4.2. Translating this into a “progress anxiety” curve

Combine three ingredients:

1. **Loss aversion**: losses loom larger than gains, so stakes increase motivation—up to a point.[^1_1]
2. **Reference-based motivation**: when perceived distance to goal is large and probability of success is low, effort drops; when close and success is likely, effort rises.[^1_15][^1_29]
3. **Self-determination and affect**: overly controlling, high-pressure contingencies plus negative affect from the activity reduce intrinsic motivation and increase dropout.[^1_20][^1_27]

In practice, **progress anxiety and abandonment become likely when**:

- The **stake is large relative to the user’s means** or psychological comfort, so each failure feels like a serious personal threat, not a nudge.
- The **goal horizon is long and rigid** (e.g., “hit 90% of days for 6 months”) and a few early misses make eventual success feel mathematically unlikely; users then rationally disengage to avoid repeated failure.
- Feedback is framed almost exclusively as **losses and deficits** (“you missed 3 days, you lost \$10, you’re off track”), with little emphasis on remaining progress or partial success.
- Users cannot adjust stakes or goals in response to life events, so the contract feels like a trap rather than a tool.

Empirically, deposit-contract studies plus the app trial above suggest that:

- **Opt-in and retention fall off** when stakes are high and non-adjustable;
- Psychological acceptability of deposits is a real bottleneck;[^1_30][^1_31]
- Loss framing is not universally superior; its effectiveness is context-dependent and can be undermined when it induces too much threat or when users distrust the system.[^1_36][^1_11][^1_31]

Your product should assume there is a **sweet spot**: enough at stake to hurt a little and grab attention, but not enough to trigger defensive avoidance or resignation when users slip.

***

## 5. Concrete design principles for your app

Below is a synthesis of all the above into practical recommendations.

### 5.1. Design the financial “buy-in” as a supportive commitment, not a punishment

- **User-chosen stake size** (within bounds): Let users choose a stake from a suggested range. Many deposit-contract studies show that self-selected deposits improve acceptability, even if they are smaller than what designers might pick.[^1_37][^1_9]
- **Cap maximum daily/weekly loss**: Instead of “you lose your whole \$100 if you fail,” use something like “you lose up to \$3 per missed day, but can never lose more than \$15 per week.” This keeps the loss salient but bounded.
- **Offer “charity” or prosocial loss options**: Some evidence suggests small donation-based incentives can motivate activity and feel more meaningful/less punitive (e.g., \$1/day to charity for meeting goals). Allow users to choose whether lost funds go to charity, a disliked cause, or simply back to your platform; this adds an ego and moral dimension without increasing pressure unboundedly.[^1_38]


### 5.2. Implement Endowed Progress + goal-gradient mechanics

- **Seed early progress**:
    - Treat sign-up actions as completing the first steps toward their goal.
    - Consider auto-crediting the first week upon consistent on-boarding to give a strong sense of “already started.”[^1_15][^1_13]
- **Chunk long goals into shorter “seasons”**:
    - Use 4–8 week cycles; both stickK data and habit literature suggest 6–8-week windows are tractable and predictive of longer-term success.[^1_10][^1_25]
    - At the end of each season, roll forward endowed progress (e.g., better starting multipliers, badges, or lower required stake next season).
- **Visualize proximity to meaningful goals**:
    - Multiple nested progress bars: daily goal, weekly streak, and seasonal “cash-secured” goal.
    - Emphasize “distance remaining” shrinking as they advance—goal-gradient effect in UI.


### 5.3. Use loss aversion strategically, not constantly

- **Virtual account framing over real-time charges**:
    - Put the user’s stake into an in-app “vault” or “pot.” Each failure *reduces* that pot, but avoid immediate external charges (e.g., per-miss debits to their bank). This delivers the subjective experience of loss without constant financial friction.
- **Partial protection and “save-points”**:
    - Periodically lock in part of their pot as irrevocably safe when they hit milestones (“You’ve now permanently secured \$20 of your \$50”). This taps loss aversion *toward* protecting the saved portion and decreases catastrophic “all-or-nothing” anxiety.
- **Grace days and forgiveness mechanisms**:
    - Allow a limited number of “skip tokens” or “safety nets” per month that prevent loss when redeemed. Research on adaptive goal setting and incentives suggests flexible systems can sustain behavior better than rigid ones.[^1_39][^1_40]


### 5.4. Protect and cultivate intrinsic and identity-based motivation

- **Shift emphasis over time from money to mastery and identity**:
    - Early: highlight money at risk and concrete goals.
    - Later: highlight fitness improvements, consistency streaks, and identity (“you’ve worked out 3x/week for 10 weeks; that’s what athletes do”).[^1_16][^1_27]
- **Autonomy support features**:
    - Allow users to adjust goals and stakes for the next “season” based on experience.
    - Offer multiple goal types (performance, process, identity) to match values, consistent with SDT’s focus on autonomy and internalization.[^1_17][^1_20]
- **Non-monetary gamification**:
    - Use badges, levels, social recognition, and narrative framing that celebrate competence and effort, not just financial outcomes.[^1_24][^1_23]

This reduces overreliance on extrinsic punishment and aligns with evidence that informational, non-controlling feedback bolsters intrinsic motivation.[^1_22][^1_20]

### 5.5. Managing “progress anxiety” explicitly

Build features that detect and respond to anxiety markers:

- **Detect risk states**:
    - Repeated misses early in a season.
    - Large proportion of stake already lost.
    - Reduced app opens / logging.
- **Respond by:**
    - **Reframing progress**: emphasize what remains and what is salvageable: “You’ve lost \$12, but \$38 is still protected, and a strong next week can lock in another \$10.”
    - **Offering adaptive “downshifts”**: allow users to lower their stake or adjust their goal difficulty for the *next* period without shame. In goal theory, flexible goal adjustment can prevent complete disengagement when goals become unrealistic.[^1_41][^1_29]
    - **Introducing non-monetary wins**: e.g., a “resilience badge” for returning after a lapse, or focusing them on a shorter sub-goal to restore self-efficacy.
- **Track subjective experience**:
    - Short in-app pulse questions (“How stressed do you feel about your current commitment?”).
    - If stress is high, prompt them to adjust goals or stakes before they silently churn.


### 5.6. Ego and social stakes

Beyond money, **ego and social image** are powerful:

- Data from stickK show that having an external referee and supporters increases success rates; these add social and reputational stakes on top of financial ones.[^1_10]
- Gamified trials where financial incentives were combined with social support or team-based structures often outperformed purely individual, money-only designs.[^1_42][^1_36]

Design implications:

- Allow users to nominate a referee or accountability partner who sees their progress and stakes.
- Consider “public” versus “private” modes, with clear consent; public commitments tap into ego and identity beyond pure financial calculus.
- Use cooperative or team structures (shared pots, group streaks) to harness social motivation alongside loss aversion.

***

## 6. Pulling it together

Conceptually:

- **Loss aversion** ensures that even modest financial stakes loom large, making “not losing money” a powerful near-term motivator for habit execution.[^1_4][^1_1]
- The **Endowed Progress Effect** and goal-gradient dynamics mean that people work harder and stick around longer when they feel already on the way, and especially when they are close to the next meaningful milestone.[^1_13][^1_15]
- **Extrinsic penalties** are particularly helpful early, when intrinsic motivation is low, but can become counterproductive if they stay high, rigid, and controlling as intrinsic interest and identity begin to form.[^1_35][^1_20]
- “Progress anxiety” emerges when high stakes meet low perceived odds of success and a strongly loss-framed narrative; users respond by disengaging to escape repeated failure and threat.

Design your app to:

1. Use *self-chosen*, bounded financial stakes with loss-framed elements,
2. Layer in endowed progress and short goal cycles to keep distance-to-goal small,
3. Gradually shift the motivational spotlight from **not losing money** to **being the kind of person who does this habit**,
4. Detect and respond to early signs of anxiety and disengagement with adaptive, autonomy-supportive adjustments.

If you like, the next step can be to sketch concrete product flows (onboarding, daily check-in, loss/feedback screens) that embody these principles while minimizing dropout risk.
<span style="display:none">[^1_100][^1_101][^1_102][^1_103][^1_104][^1_105][^1_106][^1_107][^1_108][^1_109][^1_110][^1_111][^1_112][^1_113][^1_114][^1_115][^1_116][^1_117][^1_118][^1_119][^1_43][^1_44][^1_45][^1_46][^1_47][^1_48][^1_49][^1_50][^1_51][^1_52][^1_53][^1_54][^1_55][^1_56][^1_57][^1_58][^1_59][^1_60][^1_61][^1_62][^1_63][^1_64][^1_65][^1_66][^1_67][^1_68][^1_69][^1_70][^1_71][^1_72][^1_73][^1_74][^1_75][^1_76][^1_77][^1_78][^1_79][^1_80][^1_81][^1_82][^1_83][^1_84][^1_85][^1_86][^1_87][^1_88][^1_89][^1_90][^1_91][^1_92][^1_93][^1_94][^1_95][^1_96][^1_97][^1_98][^1_99]</span>

<div align="center">⁂</div>

[^1_1]: https://pmc.ncbi.nlm.nih.gov/articles/PMC5406753/

[^1_2]: https://pmc.ncbi.nlm.nih.gov/articles/PMC5133187/

[^1_3]: https://pmc.ncbi.nlm.nih.gov/articles/PMC2840433/

[^1_4]: https://pmc.ncbi.nlm.nih.gov/articles/PMC1807267/

[^1_5]: https://pmc.ncbi.nlm.nih.gov/articles/PMC5486855/

[^1_6]: https://pubs.aeaweb.org/doi/10.1257/app.2.4.213

[^1_7]: https://pmc.ncbi.nlm.nih.gov/articles/PMC2606603/

[^1_8]: https://pmc.ncbi.nlm.nih.gov/articles/PMC5316505/

[^1_9]: https://pmc.ncbi.nlm.nih.gov/articles/PMC5817895/

[^1_10]: https://ojs.aaai.org/index.php/ICWSM/article/view/31440

[^1_11]: https://pmc.ncbi.nlm.nih.gov/articles/PMC6029433/

[^1_12]: https://www.ahajournals.org/doi/10.1161/JAHA.118.009173

[^1_13]: https://academic.oup.com/jcr/article-lookup/doi/10.1086/500480

[^1_14]: https://pmc.ncbi.nlm.nih.gov/articles/PMC4024896/

[^1_15]: https://journals.sagepub.com/doi/10.1509/jmkr.43.1.39

[^1_16]: https://pmc.ncbi.nlm.nih.gov/articles/PMC4520322/

[^1_17]: https://pmc.ncbi.nlm.nih.gov/articles/PMC9340849/

[^1_18]: https://www.cambridge.org/core/services/aop-cambridge-core/content/view/3FC35CD80D991744CD764AF2FBCD3BBB/S0033291722001611a.pdf/div-class-title-on-what-motivates-us-a-detailed-review-of-intrinsic-span-class-italic-v-span-extrinsic-motivation-div.pdf

[^1_19]: https://pmc.ncbi.nlm.nih.gov/articles/PMC2731358/

[^1_20]: https://pmc.ncbi.nlm.nih.gov/articles/PMC2755352/

[^1_21]: https://pmc.ncbi.nlm.nih.gov/articles/PMC2742036/

[^1_22]: https://pmc.ncbi.nlm.nih.gov/articles/PMC2733619/

[^1_23]: https://www.semanticscholar.org/paper/52476983f2778ae1a027ae87aec6c761478f414c

[^1_24]: https://pmc.ncbi.nlm.nih.gov/articles/PMC6369195/

[^1_25]: https://pmc.ncbi.nlm.nih.gov/articles/PMC5899425/

[^1_26]: https://pmc.ncbi.nlm.nih.gov/articles/PMC6156024/

[^1_27]: https://pmc.ncbi.nlm.nih.gov/articles/PMC4996983/

[^1_28]: https://pmc.ncbi.nlm.nih.gov/articles/PMC7497044/

[^1_29]: https://pmc.ncbi.nlm.nih.gov/articles/PMC9722883/

[^1_30]: https://pmc.ncbi.nlm.nih.gov/articles/PMC5382065/

[^1_31]: https://pmc.ncbi.nlm.nih.gov/articles/PMC11042509/

[^1_32]: https://link.springer.com/10.1007/s10804-022-09420-9

[^1_33]: https://pmc.ncbi.nlm.nih.gov/articles/PMC6188716/

[^1_34]: https://linkinghub.elsevier.com/retrieve/pii/S146902922030279X

[^1_35]: https://pmc.ncbi.nlm.nih.gov/articles/PMC10632955/

[^1_36]: https://pmc.ncbi.nlm.nih.gov/articles/PMC8271358/

[^1_37]: https://pmc.ncbi.nlm.nih.gov/articles/PMC6134401/

[^1_38]: https://pmc.ncbi.nlm.nih.gov/articles/PMC7078055/

[^1_39]: https://pmc.ncbi.nlm.nih.gov/articles/PMC8734590/

[^1_40]: https://pmc.ncbi.nlm.nih.gov/articles/PMC5372290/

[^1_41]: http://arxiv.org/pdf/2302.02633.pdf

[^1_42]: https://pmc.ncbi.nlm.nih.gov/articles/PMC4907949/

[^1_43]: https://linkinghub.elsevier.com/retrieve/pii/S0165188915000287

[^1_44]: https://www.semanticscholar.org/paper/a66fc788cf52ff10e0c8d4c075d4eb19bc26c3ae

[^1_45]: https://www.semanticscholar.org/paper/8af3182a185753d7730e12e5b135b01fb3c7ca62

[^1_46]: http://www.ssrn.com/abstract=1494265

[^1_47]: https://www.aimsciences.org//article/doi/10.3934/jimo.2022051

[^1_48]: https://www.semanticscholar.org/paper/13a62e9d34b82a0754a3928fca67a5c5a2fdef74

[^1_49]: https://www.semanticscholar.org/paper/d6eff1fbcb87ccfa08a96116a4c92207dd1c964e

[^1_50]: https://www.mdpi.com/1660-4601/16/16/2938

[^1_51]: https://www.semanticscholar.org/paper/fdb52c8a6c80e033e1a53e1b6aeed478d3d5bce2

[^1_52]: https://direct.mit.edu/imag/article-pdf/doi/10.1162/imag_a_00047/2185335/imag_a_00047.pdf

[^1_53]: https://www.frontiersin.org/articles/10.3389/fnins.2017.00237/pdf

[^1_54]: https://pmc.ncbi.nlm.nih.gov/articles/PMC7260957/

[^1_55]: https://actacommercii.co.za/index.php/acta/article/download/1056/1823

[^1_56]: https://www.tandfonline.com/doi/pdf/10.1080/09593969.2023.2287998?needAccess=true

[^1_57]: https://pmc.ncbi.nlm.nih.gov/articles/PMC4763083/

[^1_58]: https://managementdynamics.researchcommons.org/cgi/viewcontent.cgi?article=1325\&context=journal

[^1_59]: https://jurnaljam.ub.ac.id/index.php/jam/article/download/2006/1484

[^1_60]: https://academicjournals.org/journal/ERR/article-full-text-pdf/B5A9ADD52906.pdf

[^1_61]: https://www.frontiersin.org/articles/10.3389/fpsyg.2016.00204/pdf

[^1_62]: https://pmc.ncbi.nlm.nih.gov/articles/PMC9130984/

[^1_63]: https://www.semanticscholar.org/paper/f47498ecfaae3709521c486fd37a1459feecf832

[^1_64]: https://journals.sagepub.com/doi/pdf/10.1177/01461672231190719

[^1_65]: https://journals.sagepub.com/doi/pdf/10.1177/1470594X18810439

[^1_66]: https://pmc.ncbi.nlm.nih.gov/articles/PMC9621428/

[^1_67]: https://www.cambridge.org/core/services/aop-cambridge-core/content/view/3CA5AB066917F7A542126099F35FA469/S0045509119000432a.pdf/div-class-title-achievement-and-enhancement-div.pdf

[^1_68]: https://pmc.ncbi.nlm.nih.gov/articles/PMC6380459/

[^1_69]: https://europepmc.org/articles/pmc3660783?pdf=render

[^1_70]: https://www.semanticscholar.org/paper/1715687e1e74ebdf23dcd4a010d83817cf4accaa

[^1_71]: https://downloads.hindawi.com/journals/josc/2021/6612505.pdf

[^1_72]: https://pmc.ncbi.nlm.nih.gov/articles/PMC8279199/

[^1_73]: https://pmc.ncbi.nlm.nih.gov/articles/PMC7011078/

[^1_74]: https://doi.apa.org/doi/10.1037/0033-2909.125.6.669

[^1_75]: https://journals.sagepub.com/doi/10.3102/00346543071001001

[^1_76]: https://jae-online.org/index.php/jae/article/view/748

[^1_77]: https://www.semanticscholar.org/paper/6a257f7b47f1f04920d730b3a8fa2449c0b2064d

[^1_78]: https://www.nature.com/articles/354432a0

[^1_79]: https://www.semanticscholar.org/paper/0cd691cf1e07dcda953e00253565abf2706bcc36

[^1_80]: https://doi.apa.org/doi/10.1037/h0099969

[^1_81]: https://doi.apa.org/doi/10.1037/h0100045

[^1_82]: https://www.semanticscholar.org/paper/8cebe025c6b5b87cf57913efee3d4ef71deb16f7

[^1_83]: https://onlinelibrary.wiley.com/doi/10.1111/sms.13736

[^1_84]: https://pmc.ncbi.nlm.nih.gov/articles/PMC4381662/

[^1_85]: https://pmc.ncbi.nlm.nih.gov/articles/PMC11992532/

[^1_86]: https://pmc.ncbi.nlm.nih.gov/articles/PMC5359829/

[^1_87]: https://onlinelibrary.wiley.com/doi/10.1002/ejsc.12173

[^1_88]: https://arxiv.org/html/2501.01779v1

[^1_89]: https://www.sjweh.fi/download.php?abstract_id=3871\&file_nro=1

[^1_90]: https://bmjopen.bmj.com/content/bmjopen/9/8/e027566.full.pdf

[^1_91]: https://bmjopen.bmj.com/content/bmjopen/11/1/e037784.full.pdf

[^1_92]: https://pmc.ncbi.nlm.nih.gov/articles/PMC7079439/

[^1_93]: https://www.mdpi.com/1660-4601/18/5/2235/pdf

[^1_94]: https://europepmc.org/articles/pmc7825050?pdf=render

[^1_95]: http://downloads.hindawi.com/journals/bmri/2017/1460262.pdf

[^1_96]: https://pmc.ncbi.nlm.nih.gov/articles/PMC11435772/

[^1_97]: https://www.frontiersin.org/articles/10.3389/fspor.2020.589813/pdf

[^1_98]: https://www.semanticscholar.org/paper/ed86f82f981e50d8b1ba802fffe153a2cfaf1d8a

[^1_99]: https://www.semanticscholar.org/paper/412e289ef78fc4f5961c690851de18cebb3af4b8

[^1_100]: https://www.semanticscholar.org/paper/23c4be31a1959c9f65c9039d5bf6292ff6dda462

[^1_101]: https://arxiv.org/pdf/1404.7591.pdf

[^1_102]: https://pmc.ncbi.nlm.nih.gov/articles/PMC9090680/

[^1_103]: http://arxiv.org/pdf/2412.16559.pdf

[^1_104]: https://pmc.ncbi.nlm.nih.gov/articles/PMC3545167/

[^1_105]: https://bpspsychub.onlinelibrary.wiley.com/doi/10.1111/bjep.12728

[^1_106]: https://pmc.ncbi.nlm.nih.gov/articles/PMC12101773/

[^1_107]: https://pmc.ncbi.nlm.nih.gov/articles/PMC6526403/

[^1_108]: https://www.semanticscholar.org/paper/259875314cf611c8f58f2e0dbacefa0b2f999901

[^1_109]: https://www.semanticscholar.org/paper/7fab8e781f9f9b3ccd91055d9970a9472539e3c6

[^1_110]: https://www.ahajournals.org/doi/10.1161/CIRCULATIONAHA.124.069531

[^1_111]: https://jamanetwork.com/journals/jamanetworkopen/fullarticle/2781732

[^1_112]: https://diabetesjournals.org/diabetes/article/73/Supplement_1/1032-P/154997/1032-P-Behavioral-Economics-Based-Financial-and

[^1_113]: http://hdl.handle.net/20.500.11850/460895

[^1_114]: https://www.mdpi.com/1660-4601/21/5/630

[^1_115]: https://www.jmir.org/2022/10/e38339

[^1_116]: https://dx.plos.org/10.1371/journal.pone.0216355

[^1_117]: https://journals.library.ualberta.ca/eureka/index.php/eureka/article/download/28753/21058

[^1_118]: https://www.semanticscholar.org/paper/85b31020b85ff97d12b1662d30d47712e07b11d1

[^1_119]: https://www.emerald.com/insight/content/doi/10.1108/EJM-10-2019-0781/full/pdf?title=loyal-customers-tipping-points-of-spending-for-services-a-reciprocity-perspective


---

# sketch concrete product flows (onboarding, daily check-in, loss/feedback screens) that embody these principles while minimizing dropout risk.

Based on the behavioral economics principles and evidence we've covered, here are concrete product flows designed to maximize motivation while minimizing dropout risk:

***

# Product Flow Design: Loss-Aversion-Based Habit App

## Flow 1: Onboarding \& Commitment Setup

**Goal:** Get users to make a **low-stakes initial commitment** that builds trust, establishes autonomy, and seeds endowed progress.[^2_1][^2_2][^2_3]

### Screen 1: Welcome \& Value Proposition (5 seconds)

**Visual:**

- Clean, calm interface
- Single hero message

**Copy:**

```
"Build habits that stick—
backed by your own money."

[Start Building] button
```

**Design principle:** Immediately proclaim value; avoid multi-screen tutorials that cause drop-off.[^2_4][^2_1]

***

### Screen 2: Goal Selection (Personalization)

**Visual:**

- Card-based selection interface
- Icons for each category

**Copy:**

```
"What habit do you want to build?"

[Fitness & Health]
[Productivity & Focus]
[Creative Practice]
[Sobriety & Recovery]
[Financial Discipline]
[Custom Goal]
```

**Design principle:** Ask **one question** to personalize the experience; branching paths increase relevance and retention. This single choice determines the rest of onboarding.[^2_5][^2_6]

***

### Screen 3: Specific Goal Setup (Low-friction commitment)

**Visual:**

- Pre-filled example based on category
- Easy edit interface

**Copy (if "Fitness" selected):**

```
"Let's get specific.

Your goal: Work out 3x per week
Duration: 4 weeks

[Edit goal]  [This works ✓]
```

**Behind the scenes:**

- Default to **4–6 week "season"** (not 90 days) — shorter horizons feel more achievable and align with habit-formation research.[^2_7][^2_8]
- Offer adjustable difficulty (3x vs 5x per week)

**Design principle:** Pre-populate with sensible defaults; let users edit rather than build from scratch (reduces cognitive load and increases completion).[^2_9][^2_5]

***

### Screen 4: Stake Selection (User-Chosen, Bounded)

**Visual:**

- Slider interface
- Visual representation of "your vault"
- Three suggested amounts with labels

**Copy:**

```
"Choose your commitment stake.

This money goes into YOUR vault.
Meet your goals → keep it all.
Miss days → lose a portion.

[Suggested amounts]
$20 (Light nudge)
$50 (Meaningful ✓)  ← Pre-selected
$100 (Serious commitment)

[Custom amount: $___]

Your stake, your choice.
```

**Behind the scenes:**

- Cap maximum at \$200 (or reasonable % of self-reported income if you collect that)
- Allow as low as \$10 for accessibility
- Default to mid-range (\$50) to anchor expectations

**Design principle:** User-chosen stakes improve acceptability and commitment while reducing resentment. Bounded maximums prevent catastrophic anxiety.[^2_10][^2_11][^2_12]

***

### Screen 5: Loss Structure (Transparency + Control)

**Visual:**

- Simple math breakdown
- "Protection" framing

**Copy:**

```
"How it works:

Your vault: $50
Cost per missed day: $2
Weekly loss cap: $10 max

You get 2 "Grace Days" per month—
use them to protect your vault when life happens.

[I understand] [Wait, tell me more]
```

**Design principle:**

- **Transparent, predictable losses** reduce anxiety.[^2_13][^2_14]
- **Weekly cap** prevents runaway catastrophic loss
- **Grace days** = autonomy and flexibility = lower dropout.[^2_15][^2_16]

***

### Screen 6: Charity/Anti-Charity Option (Ego stake)

**Visual:**

- Toggle interface
- Icons for causes

**Copy:**

```
"Where do lost funds go?

○ Back to the platform (default)
● To a charity I support
○ To a cause I oppose (anti-charity)

[Select charity/cause]
```

**Design principle:** Prosocial or "anti-charity" options add moral/ego stakes beyond money, increasing commitment without increasing financial pressure.[^2_17][^2_7]

***

### Screen 7: Endowed Progress Activation ⭐

**Visual:**

- Progress bar already at 20%
- Confetti animation
- Vault with first portion "locked"

**Copy:**

```
"🎉 You're already 20% there!

By setting your goal and stake,
you've secured $10 of your $50.

This is LOCKED and protected.
Complete Week 1 to lock another $10.

[Start Day 1]
```

**Design principle:** **Endowed progress effect** in action—give artificial advancement to increase completion rates and effort. Users now fear losing *their progress*, not just the stake.[^2_18][^2_19]

**Behind the scenes:**

- This is pure framing—they haven't "earned" anything yet, but perceiving progress boosts motivation
- Lock visualization (padlock icon on portion of vault) makes it tangible

***

## Flow 2: Daily Check-In Experience

**Goal:** Make logging **friction-free** and **rewarding**, emphasize progress over deficit, detect risk early.

### Screen 1: Daily Dashboard (Goal-Gradient Visualization)

**Visual:**

- Large progress circle showing week completion
- Today's task prominent
- Vault status visible but not dominating

**Copy:**

```
[Monday, Week 1 of 4]

Today: 30-min workout ✓ or ✗

This week: ⚫⚫⚪⚪⚪  (2 of 5 sessions)
Protected vault: $10 🔒
Active vault: $40

[Log Workout] [Skip with Grace Day]
```

**Design principle:**

- **Goal-gradient**: Show proximity to weekly goal; effort increases as users get closer.[^2_19]
- **Protected vs Active**: Reframe vault as "what you've saved" vs "what's at risk" (loss aversion + endowed progress)
- One-tap logging (minimize friction)

***

### Screen 2: Success Logging (Immediate Positive Feedback)

**User taps [Log Workout]**

**Visual:**

- Checkmark animation
- Progress bar advances
- Encouraging copy

**Copy:**

```
✓ Workout logged!

This week: ⚫⚫⚫⚪⚪  (3 of 5 sessions)

You're 60% to this week's goal.
One more session locks another $5.

[View Stats] [Done]
```

**Design principle:**

- Immediate feedback reinforces behavior (operant conditioning)
- Emphasize **proximity to next milestone** (goal-gradient)
- Use percentage completion prominently
- Small vault increments create frequent "wins"

***

### Screen 3: Miss Day (Loss-Framed but Not Catastrophic)

**User misses a day without logging**

**Visual:**

- Yellow (caution) not red (alarm)
- Remaining vault emphasized
- Path forward clear

**Copy:**

```
You missed Sunday's workout.

Vault impact: -$2

Protected vault: $10 🔒
Active vault: $38 (was $40)

This week: ⚫⚫⚫⚪⚫ (3 of 5)

You still have 2 sessions to hit your weekly goal
and avoid the $10 weekly penalty.

[Plan Tomorrow] [Use Grace Day]
```

**Design principle:**

- **Small, incremental losses** feel less catastrophic than lump sum[^2_13]
- Show **what remains** (endowed progress protection)
- Offer **path to recovery** (reduces resignation/disengagement)[^2_20]
- Yellow warning, not red alarm (calibrated emotional tone)

***

### Screen 4: Grace Day Redemption (Autonomy \& Control)

**User taps [Use Grace Day]**

**Visual:**

- Shield animation
- Grace day counter updates

**Copy:**

```
🛡️ Grace Day used.

Your $2 is protected.

Grace Days remaining this month: 1

Life happens. That's why these exist.
Tomorrow is a fresh start.

[Got it]
```

**Design principle:**

- **Autonomy** = users control when to invoke safety net (SDT: reduces "controlled" feeling)[^2_21]
- Limited quantity (2/month) maintains stakes
- Normalizing language ("life happens") reduces shame

***

## Flow 3: Weekly Milestone \& Endgame

**Goal:** Celebrate progress, "lock in" vault portions, maintain momentum through visual wins.

### Screen 1: Weekly Success (Lock More Vault)

**User hits 3/5 sessions target**

**Visual:**

- Fireworks animation
- Padlock clicking shut on vault portion
- Week 1 badge unlocked

**Copy:**

```
🎉 Week 1 complete!

You hit 3 workouts. Goal crushed.

New protected vault: $20 🔒 (+$10)
Active vault: $30

You're now 40% through your season
and 40% of your stake is PERMANENTLY safe.

[Week 2 →]

Progress so far:
Week 1: ✓ $10 locked
Week 2: ⚪ $10 available
Week 3: ⚪ $10 available
Week 4: ⚪ $10 available
```

**Design principle:**

- **Endowed progress amplification**: Each week locks more vault, increasing what they "have to lose" (loss aversion in their favor)
- **Milestone celebrations** boost competence and identity[^2_22][^2_23]
- **Nested progress bars** (weekly + seasonal) maintain goal-gradient effect across scales
- **Badge/achievement** adds non-monetary reward layer

***

### Screen 2: End of Season (Full Success)

**User completes 4 weeks meeting goals**

**Visual:**

- Trophy animation
- Full vault opens
- Identity-focused messaging

**Copy:**

```
🏆 Season 1 Complete!

Your vault: $50 → ALL YOURS

You worked out 14 times in 4 weeks.
That's not luck. That's discipline.

You're not just someone who "tries" to work out—
you're someone who DOES.

[Claim $50] [Start Season 2]

Season 2 perks:
• Start with $15 already locked
• Lower stake option ($30)
• OR increase challenge (4x/week)
```

**Design principle:**

- **Identity reinforcement** > financial gain (shift from extrinsic to intrinsic)[^2_23][^2_24]
- **Roll forward endowed progress** into next season (continue goal-gradient effect)
- **Offer stake adjustment** (autonomy + adaptive difficulty)[^2_15]
- Make "continuing" feel like natural next step, not starting over

***

## Flow 4: Risk Detection \& Intervention

**Goal:** Detect users at risk of abandonment and intervene with **adaptive, supportive** adjustments (not shaming).

### Trigger Conditions:

1. User misses 3+ days in Week 1
2. User loses >50% of active vault by Week 2
3. User hasn't opened app in 3 days after a miss
4. User clicks [Help] or [Adjust Goal]

### Screen 1: Adaptive Check-In (Detects Progress Anxiety)

**Triggered by risk condition**

**Visual:**

- Calm, supportive tone
- Not framed as "failure"

**Copy:**

```
Hey—life got busy?

We noticed you've missed a few days.
That happens. Let's make sure your goal
still fits your reality.

Quick check:
How's the challenge level feeling?

○ Too easy
○ About right
● Too hard right now

[Update my plan] [I'm good, just had a rough week]
```

**Design principle:**

- **Detect disengagement early** using behavioral signals[^2_25][^2_2]
- **Non-judgmental framing** (avoid shame which drives churn)
- **Offer adjustment** (autonomy-supportive response to low perceived success probability)[^2_20]

***

### Screen 2: Adaptive Goal Adjustment (Prevents Total Disengagement)

**If user selects "Too hard"**

**Visual:**

- Slider to adjust frequency
- Reframe as "recalibration" not "giving up"

**Copy:**

```
Let's recalibrate for the rest of this season.

Current: 5x per week
Adjusted: 3x per week

Your vault adjusts too:
Protected: $10 stays locked 🔒
Active: $30 → redistributed across remaining weeks

This isn't quitting—it's adapting.
Sustainable progress > burnout.

[Make this change] [Actually, I'll stick with 5x]
```

**Design principle:**

- **Flexible goal adjustment** prevents complete abandonment when goals become unrealistic[^2_26][^2_15]
- **Reframe adjustment as smart strategy** (protects self-image)
- **Maintain some stake** (don't eliminate all pressure)
- Reference-based motivation: lowering goal increases perceived success probability → effort rebounds[^2_20]

***

### Screen 3: "You're Closer Than You Think" (Reframe After Slip)

**Triggered after 2+ misses but >30% vault protected**

**Visual:**

- Focus on remaining progress
- Path to next milestone emphasized

**Copy:**

```
Real talk:

You've protected $20 of your $50.
That's 40% SAFE forever. 🔒

You have $30 in play and 2 weeks left.

If you hit your goals for 10 more days,
you'll lock another $20.

That's $40 total saved.
You're closer than it feels.

[See my plan] [Dismiss]
```

**Design principle:**

- **Endowed progress reminder** when users feel "too far behind"[^2_18]
- **Reframe glass as "half full"** (combat resignation)
- **Concrete path forward** (increases perceived control)
- Invoked during "danger zone" when effort might collapse

***

## Flow 5: Social \& Ego Amplification (Optional Layer)

**Goal:** Add social stakes beyond money for users who want it; make it **opt-in** to preserve autonomy.

### Screen 1: Accountability Partner (Opt-In)

**Offered after Week 1 completion**

**Visual:**

- Simple toggle
- Preview of what partner sees

**Copy:**

```
Add an Accountability Partner?

Invite someone to see your progress (not your vault amount).
They'll get weekly updates and can cheer you on.

Research shows: Users with referees
are 30% more likely to complete their goals.

[Invite Someone] [Maybe Later]
```

**Design principle:**

- **Social stakes** increase success rates (stickK data)[^2_7]
- **Opt-in only** (autonomy-supportive)[^2_21]
- **Don't show vault amount** (reduces embarrassment/comparison)

***

### Screen 2: Team Challenge (Cooperative, Not Competitive)

**Offered in Season 2+**

**Visual:**

- Team progress bar
- Shared vault visualization

**Copy:**

```
Join a Team Challenge?

Pool stakes with 4-6 people working on similar goals.
If the TEAM hits 80% of total goals, everyone keeps 100%.

Cooperative > competitive.
You're rooting for each other.

[Find a team] [Solo is fine]
```

**Design principle:**

- **Cooperative gamification** can outperform individual + pure competition[^2_27][^2_28]
- Lowers individual pressure (team dilutes personal failure)
- Adds social motivation layer without pure ego threat

***

## Flow 6: Feedback \& Progress Anxiety Monitoring

**Goal:** Continuously assess subjective experience; adjust before silent churn.

### Screen: Weekly Pulse Check (In-App Micro-Survey)

**Triggered Friday of each week**

**Visual:**

- Single-question modal
- 3-emoji interface

**Copy:**

```
Quick check-in:

How stressed do you feel about
meeting this week's goal?

😊 Feeling good
😐 A bit pressured
😰 Really stressed

[Submit] [Skip]
```

**Design principle:**

- **Subjective stress monitoring** = early warning system for progress anxiety
- One question = low burden, high completion
- If "stressed" selected → trigger adaptive intervention flow (see Flow 4)

**Behind the scenes:**

- Track stress ratings over time
- Correlate with completion rates
- Flag users with 2+ "stressed" responses for proactive outreach or auto-adjustment offer

***

## Key Design Patterns Summary

| Flow Element | Behavioral Mechanism | Dropout Prevention |
| :-- | :-- | :-- |
| **Endowed progress at start** | Artificial advancement (20% pre-credited) | Increases completion rates[^2_18]; users protect "earned" progress |
| **User-chosen stakes** | Autonomy, bounded loss | Improves acceptability vs imposed amounts[^2_11]; caps anxiety |
| **Weekly vault locking** | Goal-gradient + loss aversion | Frequent wins; incremental "saves" feel achievable |
| **Grace days** | Autonomy, forgiveness | Prevents "blown it" resignation; flexible commitment[^2_15] |
| **Adaptive goal adjustment** | Reference-based motivation | When success feels unlikely, lowering goal restores effort[^2_20] |
| **"Remaining vault" framing** | Endowed progress protection | Emphasizes what's saved, not just what's lost |
| **Weekly cap on losses** | Bounded risk | Prevents catastrophic loss spiral |
| **Identity messaging at milestones** | Intrinsic motivation cultivation | Shifts from "avoiding loss" to "I'm this kind of person"[^2_23] |
| **Stress pulse checks** | Progress anxiety detection | Intervene before silent churn |
| **Roll-forward progress to Season 2** | Continuity, endowment | Feels like continuing, not restarting |


***

## Why This Works (Theory → Practice)

1. **Loss aversion is harnessed but calibrated:**
    - Stakes are real but user-chosen and bounded
    - Losses are incremental (\$2/day) not catastrophic
    - Weekly caps prevent runaway anxiety[^2_12][^2_13]
2. **Endowed progress is layered at multiple scales:**
    - 20% at sign-up (artificial head start)
    - Weekly vault locks (incremental saves)
    - Season 2 bonus (roll-forward)
    - All tap the "closer than you started" effect[^2_19][^2_18]
3. **Autonomy is preserved:**
    - User picks goal, stake, duration, grace day usage
    - Can adjust mid-season if too hard
    - Opt-in social features
    - Aligns with SDT: autonomy-supportive design sustains intrinsic motivation[^2_24][^2_21]
4. **Goal-gradient is maintained:**
    - Multiple nested progress bars (daily, weekly, seasonal)
    - Proximity to next "lock" always visible
    - "You're 60% there" messaging throughout[^2_19]
5. **Progress anxiety is monitored and managed:**
    - Stress pulse checks
    - Adaptive interventions when risk detected
    - Reframing ("you're closer than you think")
    - Early adjustment prevents total disengagement[^2_25][^2_20]
6. **Shift from extrinsic to intrinsic over time:**
    - Early: money and vault dominate
    - Mid: milestones and identity messaging increase
    - Late: "You're someone who does this" > "Don't lose money"
    - Aligns with evidence that financial incentives are scaffolding, not permanent structure[^2_29][^2_23]

***

## Next Steps

This flow design is ready for prototyping. You can:

1. **Build low-fidelity mockups** of each screen
2. **User-test the onboarding flow** with target users (pay attention to stake selection and anxiety at commitment point)
3. **A/B test variations**:
    - Different endowed progress amounts (15% vs 25%)
    - Different loss structures (\$2/day vs \$10/week lump)
    - Grace day quantity (1 vs 3 per month)
4. **Instrument analytics** to track:
    - Completion rate by onboarding screen
    - Correlation between stake size and completion
    - Stress ratings → dropout
    - Grace day usage patterns

Would you like me to design specific UI mockups for any of these screens, or detail the backend logic for adaptive interventions?
<span style="display:none">[^2_30][^2_31][^2_32][^2_33][^2_34][^2_35][^2_36][^2_37][^2_38][^2_39][^2_40][^2_41][^2_42][^2_43][^2_44][^2_45][^2_46][^2_47][^2_48][^2_49][^2_50][^2_51][^2_52][^2_53][^2_54]</span>

<div align="center">⁂</div>

[^2_1]: https://www.adjust.com/resources/guides/user-retention/

[^2_2]: https://www.pendo.io/resources/how-to-build-user-onboarding-that-boosts-retention/

[^2_3]: https://www.nngroup.com/articles/commitment-consistency-ux/

[^2_4]: https://jimo.ai/blog/gamifying-user-onboarding-boosting-engagement-from-day-one-with-ai

[^2_5]: https://formbricks.com/blog/user-onboarding-best-practices

[^2_6]: https://userpilot.com/blog/onboarding-gamification/

[^2_7]: https://ojs.aaai.org/index.php/ICWSM/article/view/31440

[^2_8]: https://pmc.ncbi.nlm.nih.gov/articles/PMC5899425/

[^2_9]: https://www.appcues.com/blog/8-user-onboarding-strategies

[^2_10]: https://pubs.aeaweb.org/doi/10.1257/app.2.4.213

[^2_11]: https://pmc.ncbi.nlm.nih.gov/articles/PMC5817895/

[^2_12]: https://pmc.ncbi.nlm.nih.gov/articles/PMC11042509/

[^2_13]: https://pmc.ncbi.nlm.nih.gov/articles/PMC6029433/

[^2_14]: https://www.ahajournals.org/doi/10.1161/JAHA.118.009173

[^2_15]: https://pmc.ncbi.nlm.nih.gov/articles/PMC5372290/

[^2_16]: https://pmc.ncbi.nlm.nih.gov/articles/PMC8734590/

[^2_17]: https://pmc.ncbi.nlm.nih.gov/articles/PMC7078055/

[^2_18]: https://academic.oup.com/jcr/article-lookup/doi/10.1086/500480

[^2_19]: https://journals.sagepub.com/doi/10.1509/jmkr.43.1.39

[^2_20]: https://pmc.ncbi.nlm.nih.gov/articles/PMC9722883/

[^2_21]: https://pmc.ncbi.nlm.nih.gov/articles/PMC2755352/

[^2_22]: https://pmc.ncbi.nlm.nih.gov/articles/PMC4520322/

[^2_23]: https://pmc.ncbi.nlm.nih.gov/articles/PMC4996983/

[^2_24]: https://www.cambridge.org/core/services/aop-cambridge-core/content/view/3FC35CD80D991744CD764AF2FBCD3BBB/S0033291722001611a.pdf/div-class-title-on-what-motivates-us-a-detailed-review-of-intrinsic-span-class-italic-v-span-extrinsic-motivation-div.pdf

[^2_25]: https://www.jmir.org/2022/4/e35120

[^2_26]: http://arxiv.org/pdf/2302.02633.pdf

[^2_27]: https://pmc.ncbi.nlm.nih.gov/articles/PMC4907949/

[^2_28]: https://pmc.ncbi.nlm.nih.gov/articles/PMC8271358/

[^2_29]: https://pmc.ncbi.nlm.nih.gov/articles/PMC10632955/

[^2_30]: https://academic.oup.com/sleep/article/48/Supplement_1/A542/8135678

[^2_31]: http://preprints.jmir.org/preprint/23227

[^2_32]: https://arxiv.org/abs/2203.01374

[^2_33]: https://ieeexplore.ieee.org/document/6679313

[^2_34]: https://www.mdedge.com/obgyn/article/241968/practice-management/patient-facing-mobile-apps-are-obgyns-uniquely-positioned

[^2_35]: https://www.semanticscholar.org/paper/6b09bfbabd711c36f86e6784f0a9841cfdf9432b

[^2_36]: https://www.semanticscholar.org/paper/3f562f8e063bd3a6d8931d302e30ecad4eb760ee

[^2_37]: https://www.semanticscholar.org/paper/d4eb5f538069e7624b4db6c9547f656711493d85

[^2_38]: http://link.springer.com/10.1007/s11606-014-3145-x

[^2_39]: https://www.semanticscholar.org/paper/1dab3742c00ce322302e19b09e95b4f99850af38

[^2_40]: https://mhealth.jmir.org/2020/11/e16309/PDF

[^2_41]: https://jopm.jmir.org/2025/1/e50225

[^2_42]: https://jmir.org/api/download?alt_name=mhealth_v8i6e17802_app1.pdf\&filename=7714b0b05b3b167b30105f895e223c90.pdf

[^2_43]: https://arxiv.org/pdf/1802.08972.pdf

[^2_44]: https://arxiv.org/pdf/1603.01369.pdf

[^2_45]: https://pmc.ncbi.nlm.nih.gov/articles/PMC7728530/

[^2_46]: https://pmc.ncbi.nlm.nih.gov/articles/PMC11967695/

[^2_47]: https://insights.daffodilsw.com/blog/integrating-behavioral-economics-with-fintech-ux-design

[^2_48]: https://centrical.com/resources/onboarding-gamification/

[^2_49]: https://thisisglance.com/blog/behavioural-economics-in-app-design-making-every-interaction-count

[^2_50]: https://yukaichou.com/gamification-study/4-experience-phases-gamification-2-onboarding-phase/

[^2_51]: https://www.linkedin.com/pulse/maximizing-user-experience-leveraging-behavioral-economics-atticus-li-uezjc

[^2_52]: https://www.reddit.com/r/SaaS/comments/1m0pzhq/best_saas_onboarding_strategies_to_boost_user/

[^2_53]: https://www.docebo.com/learning-network/blog/onboarding-gamification/

[^2_54]: https://www.ungrammary.com/post/ux-behavioral-economics-how-design-shapes-decision-making

