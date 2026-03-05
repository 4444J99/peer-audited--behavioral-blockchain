# Chapter 2: Literature Review

This chapter surveys the theoretical and empirical foundations upon which the Styx platform is constructed. The review is organized into eight sections, each corresponding to a distinct disciplinary tradition that informs the system's design. Sections 2.1 through 2.4, presented here, establish the behavioral-economic, habit-formation, cybernetic, and financial-incentive foundations that ground the first three research questions (RQ1--RQ3). Subsequent sections (2.5--2.8) address game theory and mechanism design, verification and trust systems, platform economics, and legal-regulatory analysis.

The literature is not surveyed in isolation. Each section explicitly identifies the gaps, tensions, and unresolved questions that motivate specific design decisions within Styx. The goal is not merely to summarize prior work but to construct a cumulative argument: that the intersection of loss-averse commitment devices, decentralized peer audit, and cybernetic behavioral modeling constitutes a novel design space that no existing platform or scholarly contribution has adequately addressed.

---

## 2.1 Behavioral Economics and Loss Aversion

The theoretical architecture of Styx rests on a single empirical regularity more than any other: the asymmetric weighting of losses relative to gains in human decision-making. This section traces that regularity from its formal articulation in prospect theory through its applications in mental accounting, present-biased preferences, and commitment device design, concluding with the derivation of $\lambda = 1.955$ and the identification of three gaps in the commitment device literature that the present work aims to fill.

### 2.1.1 Prospect Theory Foundations

The modern study of decision-making under risk begins with the observation that actual human choices systematically violate expected utility theory. Kahneman and Tversky (1979) demonstrated that individuals evaluate outcomes relative to a psychologically determined reference point rather than in terms of final wealth states. The resulting value function is concave for gains, convex for losses, and --- critically --- steeper for losses than for gains. This last property, termed loss aversion, captures the finding that a loss of magnitude $x$ produces greater subjective disutility than a gain of $x$ produces subjective utility. The original estimate placed the loss aversion coefficient at $\lambda \approx 2.0$, derived from median indifference points across mixed gambles. The finding replicated across diverse populations, payoff magnitudes, and experimental paradigms, challenging the neoclassical assumption of a globally concave utility function defined over final wealth.

Tversky and Kahneman (1992) extended prospect theory into cumulative prospect theory (CPT), establishing the "fourfold pattern of risk attitudes" through a rank-dependent probability weighting scheme. Within this framework, the loss aversion coefficient was refined to $\lambda = 2.25$ in parametric fits, though with substantial individual variation. The fourfold pattern has direct implications for tiered commitment devices: users in Styx's micro-stakes tier (up to $20) occupy a different risk quadrant than high-roller users (up to $1,000). Micro-stakes users may exhibit risk-seeking behavior regarding contract compliance because the downside is psychologically trivial, while high-stakes users experience the full force of loss aversion. The tier system accommodates this heterogeneity by concentrating motivational force where it is most psychologically potent.

Kahneman (2011) situated loss aversion within the dual-process framework as a System 1 default --- an automatic emotional response preceding deliberative calculation. The endowment effect, a corollary of loss aversion, implies that once a user stakes money into a contract, the money's psychological status transforms: it becomes "mine" in a way that makes forfeiture disproportionately painful. The moment of staking is therefore the moment of maximum psychological commitment. Subsequent daily compliance decisions are governed not by reasoned cost-benefit analysis but by automatic loss avoidance. The user's System 2 makes the initial commitment; their System 1 enforces it thereafter.

Ariely (2008) demonstrated three additional effects relevant to Styx's design. The zero-price effect justifies the $5.00 onboarding bonus as a demand-discontinuity anchor. Pricing relativity explains why the presence of a $100 tier makes a $20 tier feel psychologically modest. Most consequentially, the tension between social and market norms (Ariely, 2008; Heyman & Ariely, 2004) creates a central design challenge: Styx's financial mechanism invokes market norms, while the Fury audit community requires social norms. If auditors treat their role as purely economic, the system degrades. Maintaining both normative registers simultaneously is addressed through the Fury accuracy scoring function and honeypot injection mechanism discussed in Section 2.5.

### 2.1.2 Mental Accounting and the Sunk Cost Effect

Thaler's (1999) mental accounting framework explains why the framing of financial flows amplifies loss aversion. Individuals cognitively segregate funds into distinct "accounts," each with emotional signatures: closing an account at a loss produces pain exceeding what the nominal dollar amount would predict. When a user stakes $100 into a Styx contract, the act creates a new mental account --- a "vault" --- and the money acquires a distinct psychological identity as "commitment money." Potential forfeiture is experienced not merely as monetary loss but as the forced closure of a mental account at a loss, a qualitatively more intense experience than an equivalent decline in overall wealth (Thaler, 1999).

The $5.00 onboarding bonus exploits the endowed-progress effect (Nunes & Dreze, 2006): users perceive the bonus as "theirs" despite having contributed nothing, and the prospect of losing it is psychologically weighted as a genuine loss. This is the zero-price effect and the endowment effect operating in concert.

Benartzi and Thaler (1995) introduced myopic loss aversion --- the combination of loss aversion with frequent evaluation --- to explain the equity premium puzzle. More frequent portfolio evaluation increases experienced loss aversion beyond what objective volatility warrants. Styx's daily check-in cadence deliberately applies this principle: requiring daily proof submission ensures that the stake remains psychologically salient through repeated evaluation events. However, excessively frequent evaluation risks producing paralyzing anxiety (Benartzi & Thaler, 1995). The Aegis Protocol's velocity caps and the grace day system (2 per month) provide pressure-relief mechanisms that prevent the daily cycle from becoming psychologically toxic.

Benartzi and Thaler (2004) demonstrated the power of pre-commitment through the Save More Tomorrow (SMarT) program, where employees committed to future savings increases. Enrollment reached 78%, and savings rates rose from 3.5% to 11.6% over 28 months. The mechanism exploits a temporal asymmetry: future sacrifices are evaluated by reflective System 2 while present sacrifices are resisted by impulsive System 1. Styx mirrors this architecture: users create contracts in "cold" deliberative states that bind their future selves to compliance in "hot" states where temptation is greatest.

### 2.1.3 Present Bias and Hyperbolic Discounting

Laibson (1997) formalized time-inconsistent preferences through the $\beta$-$\delta$ quasi-hyperbolic discounting model: $U_t = u_t + \beta \sum_{s=1}^{T} \delta^s u_{t+s}$, where $\beta < 1$ captures present bias. The key implication is that demand for commitment devices arises endogenously from self-aware present-biased agents. An agent who knows that their future self will be tempted to defect has rational incentive to constrain their future choice set. Styx users are precisely such agents: they stake money today to make defection tomorrow more costly than compliance.

O'Donoghue and Rabin (1999) distinguished between sophisticated agents (who accurately perceive their present bias) and naive agents (who overestimate their future self-control). Naifs procrastinate because they always believe "tomorrow I will do it"; sophisticates may over-commit and suffer unnecessary constraint. Styx's tiered staking implicitly segments these populations. The Aegis Protocol's failure-triggered downscaling provides a safety net for naifs who over-stake: after three consecutive failures, maximum allowable stakes are automatically reduced. The "Grill-Me" AI feature aims to convert naive agents into sophisticated ones by forcing reflective self-assessment before contract creation.

Loewenstein and Prelec (1992) identified gain-loss asymmetry in discounting --- losses are discounted less steeply than gains --- implying that future stake forfeiture retains its psychological weight over longer horizons than an equivalent reward. The magnitude effect (large outcomes discounted less steeply than small ones) provides additional rationale for Styx's tiered system: meaningful stakes ($100+) sustain motivational force more effectively over time than micro-stakes.

### 2.1.4 Commitment Devices

Bryan, Karlan, and Nelson (2010) provided the definitive taxonomy, distinguishing soft commitment devices (psychological constraints) from hard ones (tangible costs). Their review strongly favored hard devices: in the SEED study in the Philippines, 28% of bank customers voluntarily chose withdrawal-restricted savings accounts despite access to unrestricted alternatives. Bryan et al. identified four key design parameters --- stringency, stakes, monitoring, and social visibility --- all of which Styx addresses. Stringency is high (stakes cannot be withdrawn without completion or forfeiture). Stakes are calibrated through the tiered system. Monitoring is provided by the Fury network. Social visibility is provided by the Tavern and integrity scores.

Thaler and Sunstein (2008) situated commitment devices within libertarian paternalism and choice architecture. Styx is a choice architecture that is voluntarily entered (preserving autonomy) but reshapes the decision landscape once entered (providing structure). Default contract templates, grace days ("expect error"), and the linguistic cloaker are all framing interventions consistent with the NUDGES framework.

### 2.1.5 The Lambda Parameter

The loss aversion coefficient $\lambda$ occupies a unique position in Styx's architecture: simultaneously a theoretical construct, an empirical estimate, and a design parameter. In cumulative prospect theory (Tversky & Kahneman, 1992), the value of losses is given by $v(x) = -\lambda(-x)^\alpha$ for $x < 0$, where $\lambda$ governs steepness relative to gains. The empirical literature places the median estimate in the range 1.8 to 2.2. The value $\lambda = 1.955$ used in Styx is a conservative calibration within this supported range, avoiding overstatement while remaining empirically grounded.

As a design parameter, $\lambda = 1.955$ serves two functions. First, it informs stake calibration: a stake of $S$ dollars produces a perceived loss of $\lambda \times S$, so the stake must satisfy $\lambda \times S > g$, where $g$ is the subjective value of defecting. Second, it anchors the penalty-weighted utility function formalized in Chapter 3. This dual role connects directly to RQ1, which asks how loss aversion can be operationalized as a calibrated coefficient within a digital commitment device --- not merely cited as justification for "using financial stakes" but formally integrated with provable properties (monotonicity, boundedness, fairness).

### 2.1.6 Gaps in the Commitment Device Literature

The literature establishes three robust facts: (a) losses are psychologically more powerful than gains ($\lambda \approx 2$); (b) present-biased agents demand self-binding; and (c) financial deposit contracts produce stronger effects than soft psychological commitments. However, three significant gaps remain.

First, **the mechanism design gap**. Existing studies treat verification as unproblematic or delegate it to self-reporting and designated referees. No system in the literature addresses how compliance can be verified through a decentralized, incentive-compatible peer-audit mechanism where auditors have financial skin in the game. Styx's Fury network fills this gap (Section 2.5).

Second, **the cybernetic framing gap**. The commitment device literature draws on prospect theory and hyperbolic discounting but lacks a unified systems-theoretic framework integrating these partial models into a coherent account of multi-drive behavioral regulation. The HVCS model (Section 2.3) fills this gap.

Third, **the formal safety gap**. Existing platforms operate without formal safety guarantees. No platform provides a provably correct safety predicate set preventing iatrogenic harm across all reachable system states. The Aegis Protocol (Chapter 4, Theorem T5) fills this gap.

These three gaps define the contribution space of the present work. The remainder of this review surveys the additional foundations required to address them.

---

## 2.2 Habit Formation and Behavioral Maintenance

While Section 2.1 established the motivational foundation for commitment devices, this section examines the target of that motivation: the formation and maintenance of habitual behavior. The question is not merely whether a commitment device can motivate short-term compliance but whether it can catalyze the transition from externally motivated behavior to internally driven habit.

### 2.2.1 The Automaticity Timeline

Lally, van Jaarsveld, Potts, and Wardle (2010) tracked 96 participants over 84 days, finding a median time to automaticity of 66 days with a range of 18 to 254 days. Simpler behaviors (drinking water) formed faster than complex ones (exercise). Two findings bear directly on Styx's design. First, missing a single day did not significantly affect the habit formation trajectory, providing the empirical warrant for Styx's grace day system (2 per month). Grace days are not concessions to comfort; they are evidence-based features grounded in the finding that occasional misses do not derail automaticity acquisition. Second, the asymptotic shape of the automaticity curve implies that the highest-leverage period for a commitment device is the first 30 to 60 days, when the curve is steepest and the user is most vulnerable to defection.

The Aegis Protocol's minimum contract duration (7 days) is a floor for disrupting existing patterns. Recommended defaults of 30, 60, and 90 days are calibrated to the Lally et al. evidence, with 66-day contracts positioned as the standard recommendation for full habit formation.

### 2.2.2 Self-Determination Theory

Ryan and Deci (2000) identified three innate psychological needs --- autonomy, competence, and relatedness --- as requirements for intrinsic motivation. External rewards can undermine intrinsic motivation when perceived as controlling (Deci & Ryan, 1985; Deci, Koestner, & Ryan, 1999), creating a critical design tension for any platform using financial penalties.

Styx addresses this tension through three structural decisions. First, participation is entirely voluntary: users choose oath categories, stake levels, and success criteria, preserving autonomy and positioning the financial stake as a tool the user deploys rather than a constraint imposed externally. Second, the integrity score system satisfies the competence need through visible, progressive accomplishment. Third, the Fury community and Tavern satisfy the relatedness need by embedding individual commitment within social accountability.

The goal, in SDT's internalization taxonomy, is to facilitate transition from external regulation (avoiding financial loss) through identified regulation (personally valuing the outcome) to intrinsic motivation. If successful, the financial stake becomes unnecessary as motivation migrates from extrinsic to intrinsic --- the commitment device bootstraps the habit, which then becomes self-sustaining.

### 2.2.3 Implementation Intentions

Gollwitzer (1999) demonstrated that "if-then" implementation intentions dramatically increase goal attainment ($d = 0.65$), transforming goal pursuit from deliberative effort into pre-programmed responses triggered by environmental cues. Styx's contract creation process is a formalized implementation intention: users specify the behavior, verification method, deadline, and proof submission procedure. The resulting contract takes the form "If it is 6:00 AM, then I will go to the gym and submit a GPS-verified check-in." This structured specificity --- users cannot create vague commitments --- operates independently of and additively with the financial staking mechanism.

### 2.2.4 COM-B Model

Michie, van Stralen, and West (2011) proposed the COM-B model: Behavior requires Capability (physical/psychological), Opportunity (physical/social), and Motivation (reflective/automatic). Styx primarily operates on Motivation through financial stakes (reflective) and daily check-in habits (automatic). Physical Opportunity is enhanced through the mobile proof submission interface; Social Opportunity through the Fury community and Tavern. Psychological Capability is partially addressed through the "Grill-Me" AI reflection feature. The platform is weakest on the Capability axis --- it cannot teach users how to cook, meditate, or exercise effectively, assuming instead that users possess or can independently acquire the target capability.

Milkman et al. (2021) tested 54 behavioral interventions simultaneously on 61,293 gym members. The most effective single intervention was micro-rewards for returning after a missed workout (+27% attendance). This finding validates Styx's grace day design and re-engagement notification system, which specifically targets the post-lapse return moment. The megastudy also found that intervention combinations were often more effective than single interventions, supporting Styx's multi-mechanism approach.

The habit formation literature establishes that Styx's design is grounded in conditions known to promote behavioral persistence: sufficient duration for automaticity (Lally et al., 2010), preserved autonomy and competence feedback (Ryan & Deci, 2000), structured implementation intentions (Gollwitzer, 1999), and multi-component intervention (Michie et al., 2011). However, this literature does not address how individual mechanisms interact within a broader regulatory system with competing drives. That question requires a different theoretical framework, to which this review now turns.

---

## 2.3 Cybernetic Models of Behavior

This section introduces cybernetics and control theory as the systems-theoretic framework for understanding how behavioral drives interact within a complex, self-regulating system. This perspective is not merely metaphorical; it is the theoretical foundation for the Human Vice Control System (HVCS) model proposed in this dissertation, which serves as the principled design framework for Styx's architecture (RQ3).

### 2.3.1 Control Theory Foundations

Wiener (1948) defined cybernetics as "the scientific study of control and communication in the animal and the machine." The foundational insight is that the principles governing stable regulation --- negative feedback, error correction, information transmission --- are isomorphic across biological, mechanical, and social systems. Stability depends on closed feedback loops: output must be measured, compared against a reference signal, and fed back to correct subsequent behavior. When the loop is open, delayed beyond the system's response time, or decoupled from consequence, the system loses its capacity for self-regulation.

Ashby (1956) formalized a key constraint through the Law of Requisite Variety: a controller must have at least as many available states as the system it regulates. A thermostat with two states (on/off) regulates crudely; a proportional controller achieves finer regulation. Applied to behavioral technology, this implies that a binary intervention system (success/failure) is inherently limited as a regulator of a system with effectively infinite variety. Styx increases regulatory variety through graded integrity scoring, tiered staking, grace days, and 27 oath types across 7 behavioral streams.

### 2.3.2 Perceptual Control Theory

Powers (1973) reconceptualized behavior as the control of perception rather than the response to stimuli. The organism acts on the environment to bring perceptions into alignment with internal reference signals. When a discrepancy is detected, behavior reduces the error. Applied to Styx, the user's reference signal is the desired behavioral state, and the financial stake creates a second reference signal ("my money is safe") that amplifies the total control effort directed toward compliance. Powers also proposed hierarchical organization of control systems, with higher-order systems setting reference signals for lower-order ones --- a structure that maps onto the HVCS model's treatment of competing drives at different hierarchical levels.

### 2.3.3 The Conant-Ashby Good Regulator Theorem

Conant and Ashby (1970) proved that "every good regulator of a system must be a model of that system." An application capable of effectively regulating human behavior must embody a model accurate enough to predict user responses to incentives, penalties, and social pressures. If the model treats motivation as a simple scalar incrementable by badges and streaks, the regulator fails precisely when regulation is most needed. Existing behavioral technology platforms violate this theorem systematically by modeling behavior as simple reinforcement learning without capturing competing drives, time-varying preferences, or ego-depletion effects. The HVCS model is designed as the "good regulator" that the theorem demands.

### 2.3.4 The HVCS Model

The Human Vice Control System (HVCS) is the original theoretical contribution of this dissertation. It models fundamental human drives as interacting control signals within a multi-input, multi-output adaptive control loop, drawing on Wiener (1948), Ashby (1956), Powers (1973), and Carver and Scheier (1998).

The HVCS identifies seven interacting drive categories, each functioning as a sub-controller: (1) **Acquisition** --- resource seeking and competitive advantage, productive under constraint but degenerating into extraction when loss risk is removed; (2) **Validation-seeking** --- desire for reciprocal attention and social approval, introducing external selection pressure; (3) **Status maintenance** --- reputation and identity coherence, functioning as a meta-regulator translating private excess into public consequence; (4) **Comparative signaling** --- social comparison and benchmarking, reorienting attention by importing others' outcomes; (5) **Boundary enforcement** --- deterrence and constraint violation response, costly but stabilizing; (6) **Short-horizon gratification** --- immediate comfort with delayed cost signals; and (7) **Energy conservation** --- a damping mechanism preventing runaway escalation, adaptive as a brake but potentially a trap state.

The critical insight is that these drives engage in mutual regulation through cross-constraint. Short-horizon gratification, when producing visible consequences, activates status maintenance and validation-seeking as correctives. Acquisition drives overwork until energy conservation intervenes. The system achieves dynamic equilibrium through interaction of competing forces, formally analogous to Ashby's (1956) self-regulating dynamics. The inter-regulation matrix formalizes how each drive constrains others: gluttony checked by pride, lust disciplined by acquisition requirements, wrath damped by reputational cost.

Each drive corresponds to a selection-shaped strategy adaptive under ancestral conditions: small groups, face-to-face accountability, scarce resources, and repeated interactions. Modernity alters these boundary conditions --- resources become abundant, validation becomes parasocial, reputation propagates anonymously at global scale --- causing ancestral heuristics to misfire because corrective feedback has been severed.

### 2.3.5 Feedback Interruption as Root Cause

The HVCS identifies six failure modes from feedback interruption, each mapping to a Styx design requirement:

First, *acquisition without loss risk* --- when competition is removed, acquisition produces extraction. Styx ensures every participant has genuine financial exposure. Second, *status without reputational decay* --- when identity is anonymous and memory ephemeral, status inflates without correction. Styx provides persistent, costly-to-build, easy-to-lose integrity scores. Third, *gratification without cost visibility* --- when engineered inputs bypass satiety and pharmaceutical interventions mask signals, gratification no longer self-limits. Styx makes behavioral defection immediately costly. Fourth, *validation without reciprocity* --- when approval requires no investment, selection pressure disappears. Styx requires genuine behavioral output as the condition for contract completion. Fifth, *energy conservation without comparison pressure* --- when infinite entertainment fills rest periods, the brake becomes terminal. Styx's social comparison features counteract stagnation. Sixth, *suppression without consequence routing* --- when drives are denied rather than channeled, energy leaks into pathology. Styx channels drives toward compliance rather than attempting to suppress them.

These failure modes constitute the cybernetic argument for Styx's architecture: the platform is designed as a feedback restoration system reconnecting the consequence pathway between behavioral output and personal cost. This connection to RQ3 is elaborated in Chapter 3, where the model's predictions are formalized and mapped to specific architectural decisions.

---

## 2.4 Financial Incentives in Behavioral Interventions

The cybernetic analysis established that effective behavioral regulation requires closed feedback loops with timely, costly consequences. This section reviews the empirical evidence on financial incentives as a specific implementation of that principle, spanning contingency management, deposit contracts, and the crowding-out question.

### 2.4.1 Contingency Management in Substance Use

Volpp et al. (2009) conducted a landmark RCT with 878 employees, testing financial incentives for smoking cessation. The incentive group ($750 package, biochemically verified) achieved 14.7% cessation at 12 months versus 5.0% in controls --- nearly tripling long-term quit rates. The effect persisted 6 months after incentives ended (9.4% vs. 3.6%), suggesting that financial incentives can catalyze behavioral change outlasting the incentive period. Crucially, Volpp used positive incentives (rewards), while Styx uses negative incentives (penalties). Prospect theory predicts loss-framed incentives should be approximately $\lambda \approx 2$ times more motivationally powerful than reward-framed incentives of equivalent magnitude.

Stitzer and Petry (2018) reviewed three decades of contingency management evidence, reporting effect sizes of $d = 0.46$ to $0.58$ across substance types despite CM remaining drastically underutilized (~10% of treatment programs). Barriers include institutional stigma, incentive funding costs, and implementation complexity. Styx addresses each: user self-funding eliminates cost barriers; peer-audit verification reduces clinical complexity; voluntary commitment device framing avoids the "bribery" perception.

Mantzari et al. (2015) found financial incentives most effective for discrete, verifiable behaviors (treatment attendance $g = 0.49$; medication adherence $g = 0.95$) and less consistent for continuous behaviors (diet, exercise). This differential efficacy suggests that Styx oath categories involving discrete, verifiable actions (gym check-ins, class attendance) should respond more strongly to staking than continuous, subjective categories. The Fury consensus layer extends financial incentive reach to subjective domains, but efficacy should be expected to vary across oath categories.

### 2.4.2 The Crowding-Out Problem

The most significant theoretical challenge is the crowding-out hypothesis: extrinsic financial rewards may undermine intrinsic motivation. Gneezy and Rustichini (2000) found that introducing a fine for late daycare pickups approximately doubled tardiness --- the fine transformed a social obligation into a purchasable option. However, their companion experiment found that no payment outperformed small payment ($0.10), but larger payment ($3.00) outperformed both. Their conclusion: "Pay Enough or Don't Pay at All." The problem is not financial incentives per se but incentives too small to motivate yet large enough to shift the normative frame.

Deci, Koestner, and Ryan (1999) found a modest undermining effect ($d = -0.24$) of tangible, contingent, expected rewards on intrinsic motivation, most pronounced for controlling, task-contingent rewards. Bowles and Polania-Reyes (2012) argued that the relationship depends on informational and framing characteristics: incentives signaling distrust crowd out motivation, while freely chosen, self-imposed incentives can complement it. This distinction maps directly onto the difference between Styx (voluntary, self-imposed deposit contracts) and externally imposed fines.

The literature thus supports Styx's design: stakes are large enough to be motivationally significant (well above the Gneezy-Rustichini threshold), and incentives are self-imposed and framed as tools for self-improvement rather than external punishment, preserving the autonomy that prevents crowding-out.

### 2.4.3 Deposit Contracts

Gine, Karlan, and Zinman (2010) studied the CARES commitment savings account for smoking cessation in the Philippines, where participants deposited their own money over six months and forfeited it upon failed urine testing. The study found a 30% increase in cessation rates --- a mechanism structurally identical to Styx's core: user-funded deposits, objective verification, and forfeiture upon failure.

Royer, Stehr, and Sydnor (2015) found that deposit contracts significantly increased gym attendance during the contract period, but the effect attenuated substantially afterward. This raises a fundamental question: does the platform produce genuine habit formation or merely financially motivated compliance that decays when pressure is released? The Lally et al. (2010) evidence suggests contracts of sufficient duration (66+ days) can catalyze genuine automaticity, but the Royer et al. finding underscores the importance of contract duration design and post-contract engagement.

Kaur, Kremer, and Mullainathan (2015) demonstrated that workers voluntarily accepted commitment contracts penalizing below-target output and subsequently increased productivity, confirming that demand for commitment devices extends to professional domains --- consistent with Styx's Professional Stream oaths. Demand was highest among workers who self-identified as having self-control problems, confirming Laibson's (1997) prediction about sophisticated present-biased agents.

Halpern et al. (2019) found deposit contracts potentially more effective than pure rewards but suffering from low uptake (10--30% vs. 80%+ for rewards). Present bias makes depositing one's own money aversive. Styx addresses uptake through the $5.00 onboarding bonus (endowed progress), social features (non-financial participation value), and graduated tiers (small initial stakes).

### 2.4.4 The Styx Calibration

The evidence supports two conclusions. First, financial incentives are effective for behavior change, with the strongest effects for deposit contracts where the user's own money is at risk --- consistent with prospect-theoretic loss aversion. Second, effectiveness is moderated by magnitude (stakes must be large enough), framing (self-imposed, not controlling), and duration (longer periods produce more durable effects).

Styx's calibration integrates these constraints. The coefficient $\lambda = 1.955$ ensures that a stake of $S$ dollars produces a perceived loss of $1.955S$, anchoring the penalty-weighted utility function. The tiered system ensures stakes exceed the Gneezy and Rustichini motivational threshold. The Aegis Protocol's caps and downscaling prevent financial harm. Voluntary participation preserves the autonomy required to avoid crowding-out. Daily check-ins exploit myopic loss aversion. The tier system functions as graduated exposure analogous to SMarT (Benartzi & Thaler, 2004): users begin with micro-stakes and escalate as they build competence and confidence.

The connection to RQ1 is direct. Operationalizing loss aversion requires not merely "using financial stakes" but a multi-parameter calibration integrating the prospect-theoretic coefficient, mental accounting effects, myopic loss aversion, the magnitude effect, and autonomy preservation. Chapter 3 formalizes this calibration as a penalty-weighted utility function with provable properties.

The literature reviewed in Sections 2.1 through 2.4 establishes the behavioral-economic, habit-formation, cybernetic, and financial-incentive foundations for the Styx system. The next four sections extend the review to mechanism design, verification, platform economics, and legal-regulatory domains required to address RQ2 through RQ5.
