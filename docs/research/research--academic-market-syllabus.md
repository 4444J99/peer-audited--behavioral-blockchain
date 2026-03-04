# Styx Academic & Market Research Syllabus

> **Project:** Styx -- Peer-Audited Behavioral Market
> **Compiled:** 2026-03-04
> **Purpose:** Comprehensive reading list for the theoretical, empirical, legal, and technical foundations underpinning Styx's design -- organized by domain, annotated for project relevance.

---

## Existing Reference Library

The following five books are already in the project's physical/digital library and have dedicated reference notes in `docs/research/reference-library/`. They are **not repeated** in the syllabus below but serve as prerequisites.

| # | Author | Title | Year |
|---|--------|-------|------|
| 1 | Steven Pressfield | *The War of Art* | 2002 |
| 2 | James Clear | *Atomic Habits* | 2018 |
| 3 | Judson Brewer | *The Craving Mind* | 2017 |
| 4 | BJ Fogg | *Tiny Habits* | 2019 |
| 5 | Wendy Wood | *Good Habits, Bad Habits* | 2019 |

---

## Category 1: Behavioral Economics & Decision Science

Foundational theory for Styx's core mechanism -- why humans systematically deviate from rational choice, and how loss aversion, mental accounting, and present bias shape commitment behavior.

### 1.1 Seminal Theory

| # | Title | Author(s) | Year | Type | Annotation |
|---|-------|-----------|------|------|------------|
| 1 | "Prospect Theory: An Analysis of Decision under Risk" | Daniel Kahneman & Amos Tversky | 1979 | Paper (*Econometrica*, 47(2), 263--291) | The foundational paper that established loss aversion as a fundamental feature of human decision-making. Styx's entire economic architecture (lambda=1.955, asymmetric penalties) derives from this model. |
| 2 | "Advances in Prospect Theory: Cumulative Representation of Uncertainty" | Amos Tversky & Daniel Kahneman | 1992 | Paper (*Journal of Risk and Uncertainty*, 5(4), 297--323) | Extended prospect theory to handle uncertain prospects with multiple outcomes. The fourfold pattern of risk attitudes it identifies (risk-seeking for low-probability losses) is critical for designing Styx's staking tiers and penalty schedules. |
| 3 | *Thinking, Fast and Slow* | Daniel Kahneman | 2011 | Book (Farrar, Straus and Giroux) | Comprehensive synthesis of dual-process theory, loss aversion, the endowment effect, and cognitive biases. Provides the conceptual vocabulary for understanding why users will engage with Styx's commitment mechanics. |
| 4 | *Predictably Irrational: The Hidden Forces That Shape Our Decisions* | Dan Ariely | 2008 | Book (HarperCollins) | Accessible survey of systematic decision biases including the "zero price effect" and relativity in pricing. Directly informs Styx's pricing psychology, onboarding incentives, and the $5 endowed-progress bonus. |
| 5 | *Nudge: Improving Decisions About Health, Wealth, and Happiness* | Richard H. Thaler & Cass R. Sunstein | 2008 | Book (Yale University Press) | Formalized choice architecture and libertarian paternalism. Styx is fundamentally a choice architecture -- users opt into financial stakes voluntarily, and the system's defaults, frames, and feedback loops are all nudges. |

### 1.2 Mental Accounting & Framing

| # | Title | Author(s) | Year | Type | Annotation |
|---|-------|-----------|------|------|------------|
| 6 | "Mental Accounting Matters" | Richard H. Thaler | 1999 | Paper (*Journal of Behavioral Decision Making*, 12(3), 183--206) | Defines how people create separate mental accounts for different financial activities, violating fungibility. Directly explains why users treat "Styx vault money" as psychologically different from pocket money -- and why that separation strengthens commitment. |
| 7 | "Myopic Loss Aversion and the Equity Premium Puzzle" | Shlomo Benartzi & Richard H. Thaler | 1995 | Paper (*Quarterly Journal of Economics*, 110(1), 73--92) | Introduced myopic loss aversion -- the combination of loss aversion and frequent evaluation. Explains why Styx's daily check-in cadence amplifies the psychological sting of potential forfeiture. |
| 8 | "Save More Tomorrow: Using Behavioral Economics to Increase Employee Saving" | Shlomo Benartzi & Richard H. Thaler | 2004 | Paper (*Journal of Political Economy*, 112(S1), S164--S187) | Demonstrated that pre-commitment to future behavior changes (allocating future raises to savings) achieves 78% opt-in and 3.5% to 11.6% savings increases. The SMarT program is the closest precedent to Styx's pre-commitment staking model. |

### 1.3 Present Bias & Time Inconsistency

| # | Title | Author(s) | Year | Type | Annotation |
|---|-------|-----------|------|------|------------|
| 9 | "Golden Eggs and Hyperbolic Discounting" | David Laibson | 1997 | Paper (*Quarterly Journal of Economics*, 112(2), 443--478) | Introduced the beta-delta quasi-hyperbolic discounting model to economics. Formalizes why people set ambitious goals (future self) but fail to follow through (present self) -- the core problem Styx solves. |
| 10 | "Doing It Now or Later" | Ted O'Donoghue & Matthew Rabin | 1999 | Paper (*American Economic Review*, 89(1), 103--124) | Analyzed how present-biased agents procrastinate and how naive vs. sophisticated agents differ in self-awareness. Informs Styx's tiered approach: naive users need stronger commitment devices (higher stakes), while sophisticated users self-select into appropriate tiers. |
| 11 | "Anomalies in Intertemporal Choice: Evidence and an Interpretation" | George Loewenstein & Drazen Prelec | 1992 | Paper (*Quarterly Journal of Economics*, 107(2), 573--597) | Catalogued systematic anomalies in how people discount future outcomes -- including the magnitude effect and gain-loss asymmetry. The gain-loss asymmetry validates Styx's design: losses (forfeited stakes) motivate more powerfully than equivalent gains (rewards). |

### 1.4 Commitment Devices

| # | Title | Author(s) | Year | Type | Annotation |
|---|-------|-----------|------|------|------------|
| 12 | "Commitment Devices" | Gharad Bryan, Dean Karlan & Scott Nelson | 2010 | Paper (*Annual Review of Economics*, 2, 671--698) | The definitive academic review of commitment devices -- hard vs. soft, demand evidence, and behavioral effects. This is the single most directly relevant academic survey for Styx's entire product category. |
| 13 | "Pay Enough or Don't Pay at All" | Uri Gneezy & Aldo Rustichini | 2000 | Paper (*Quarterly Journal of Economics*, 115(3), 791--810) | Demonstrated that small financial incentives can crowd out intrinsic motivation, but sufficiently large incentives improve performance. Validates Styx's tiered staking design: micro-stakes may be counterproductive; meaningful amounts are necessary. |

---

## Category 2: Habit Formation & Behavior Change

Academic evidence base for the behavioral science that Styx operationalizes -- how habits form, what sustains them, and what frameworks predict behavior change success.

| # | Title | Author(s) | Year | Type | Annotation |
|---|-------|-----------|------|------|------------|
| 1 | "How Are Habits Formed: Modelling Habit Formation in the Real World" | Phillippa Lally, Cornelia H.M. van Jaarsveld, Henry W.W. Potts & Jane Wardle | 2010 | Paper (*European Journal of Social Psychology*, 40(6), 998--1009) | Empirically established that habit automaticity takes a median of 66 days (range 18--254). Directly informs Styx's contract durations, grace-day allocations, and the rationale for sustained engagement beyond the common "21-day" myth. |
| 2 | "Self-Determination Theory and the Facilitation of Intrinsic Motivation, Social Development, and Well-Being" | Richard M. Ryan & Edward L. Deci | 2000 | Paper (*American Psychologist*, 55(1), 68--78) | Identifies autonomy, competence, and relatedness as innate psychological needs for sustained motivation. Styx must balance extrinsic financial pressure with these intrinsic drivers -- the Fury community satisfies relatedness, tier progression satisfies competence, and voluntary opt-in preserves autonomy. |
| 3 | *Intrinsic Motivation and Self-Determination in Human Behavior* | Edward L. Deci & Richard M. Ryan | 1985 | Book (Springer) | The full theoretical foundation for SDT. Essential reading for understanding the tension between Styx's extrinsic incentive structure and intrinsic motivation preservation -- and how to design the platform so they complement rather than undermine each other. |
| 4 | "Stages and Processes of Self-Change of Smoking: Toward an Integrative Model of Change" | James O. Prochaska & Carlo C. DiClemente | 1983 | Paper (*Journal of Consulting and Clinical Psychology*, 51(3), 390--395) | Introduced the Transtheoretical Model (precontemplation through maintenance). Styx's onboarding flow should map to these stages: marketing targets contemplation/preparation, contract creation is the action stage, and the maintenance phase requires different support than initiation. |
| 5 | "The Transtheoretical Model of Health Behavior Change" | James O. Prochaska & Wayne F. Velicer | 1997 | Paper (*American Journal of Health Promotion*, 12(1), 38--48) | Expanded the Stages of Change model with decisional balance and self-efficacy constructs. Provides a framework for Styx's user segmentation and personalized nudging based on where users are in their change journey. |
| 6 | "Implementation Intentions: Strong Effects of Simple Plans" | Peter M. Gollwitzer | 1999 | Paper (*American Psychologist*, 54(7), 493--503) | Demonstrated that "if-then" planning dramatically increases goal attainment. Styx's contract creation process (specifying exact behaviors, times, and proof requirements) is effectively a formalized implementation intention -- this paper provides the theoretical justification. |
| 7 | "The Behaviour Change Wheel: A New Method for Characterising and Designing Behaviour Change Interventions" | Susan Michie, Maartje M. van Stralen & Robert West | 2011 | Paper (*Implementation Science*, 6, 42) | Introduced the COM-B model (Capability, Opportunity, Motivation -> Behaviour) and the Behaviour Change Wheel framework. Provides a systematic taxonomy for analyzing which behavior change techniques Styx employs and identifying gaps in its intervention design. |
| 8 | *Motivational Interviewing: Helping People Change and Grow* (4th ed.) | William R. Miller & Stephen Rollnick | 2023 | Book (Guilford Press) | The clinical gold standard for facilitating behavior change conversations. The MI spirit (partnership, acceptance, compassion, evocation) should inform Styx's AI-driven "Grill-Me" and "ELI5" features and the tone of all user-facing communications. |
| 9 | "The Strength Model of Self-Control" | Roy F. Baumeister, Kathleen D. Vohs & Dianne M. Tice | 2007 | Paper (*Current Directions in Psychological Science*, 16(6), 351--355) | Proposes that self-control operates like a muscle that can be depleted. Explains why Styx users may fail at peak-depletion moments and supports the design of grace days, cool-off periods, and the Aegis protocol's velocity caps. |
| 10 | "Megastudies Improve the Impact of Applied Behavioural Science" | Katherine L. Milkman, John Beshears et al. | 2021 | Paper (*Nature*, 600, 478--483) | Tested 54 behavioral interventions simultaneously on 61,293 gym members. The top performer (microrewards for returning after a missed workout) increased visits 27%. Validates Styx's approach of combining multiple intervention types and provides evidence for specific feature designs like re-engagement nudges. |

---

## Category 3: Addiction Science & Recovery

Clinical evidence base for Styx's recovery-track contracts, the Aegis health protocol, no-contact enforcement, and the regulatory positioning of financial-incentive-based behavior change.

### 3.1 Contingency Management & Financial Incentives

| # | Title | Author(s) | Year | Type | Annotation |
|---|-------|-----------|------|------|------------|
| 1 | "Contingency Management Treatment for Substance Use Disorders: How Far Has It Come, and Where Does It Need to Go?" | Maxine Stitzer & Nancy Petry | 2018 | Paper (*Psychology of Addictive Behaviors*, 32(3), 290--296) | Comprehensive review of CM's evidence base and implementation barriers. CM shows moderate effect sizes (d=0.46 to 0.58) but remains underutilized in clinical practice -- Styx's platform model could democratize access. |
| 2 | "Prize-Based Contingency Management for the Treatment of Substance Abusers: A Meta-Analysis" | David M. Benishek, Kimberly C. Kirby et al. | 2014 | Paper (*Addiction*, 109(9), 1426--1436) | Meta-analysis confirming CM's short-term efficacy varies by substance (cannabis d=0.81, cocaine d=0.62, opiates d=0.39). Informs which oath categories in Styx should expect higher vs. lower success rates. |
| 3 | "A Randomized, Controlled Trial of Financial Incentives for Smoking Cessation" | Kevin G. Volpp et al. | 2009 | Paper (*New England Journal of Medicine*, 360(7), 699--709) | Landmark RCT showing financial incentives nearly tripled smoking cessation rates (14.7% vs. 5.0% at 12 months). The strongest clinical validation that Styx's core mechanism -- financial stakes for behavior change -- produces real-world results. |
| 4 | "The Effectiveness of Financial Incentives for Health Behaviour Change: Systematic Review and Meta-Analysis" | Eleni Mantzari et al. | 2015 | Paper (*PLOS ONE*, 10(4), e90347) | Broad meta-analysis covering smoking, exercise, diet, and screening adherence. Financial incentives significantly increased treatment attendance (g=0.49) and medication adherence (g=0.95). Provides the evidence foundation for Styx's health-adjacent positioning. |

### 3.2 Relapse Prevention & Recovery Models

| # | Title | Author(s) | Year | Type | Annotation |
|---|-------|-----------|------|------|------------|
| 5 | *Relapse Prevention: Maintenance Strategies in the Treatment of Addictive Behaviors* (2nd ed.) | G. Alan Marlatt & Dennis M. Donovan (eds.) | 2005 | Book (Guilford Press) | The cognitive-behavioral model of relapse -- high-risk situations, coping skills, the abstinence violation effect. Essential for designing Styx's recovery-track contracts, grace-day logic, and the distinction between a lapse (missed check-in) and a relapse (contract failure). |
| 6 | "Relapse Prevention: An Overview of Marlatt's Cognitive-Behavioral Model" | Mary E. Larimer, Rebekka S. Palmer & G. Alan Marlatt | 1999 | Paper (*Alcohol Research & Health*, 23(2), 151--160) | Accessible overview of the RP framework including immediate determinants and covert antecedents of relapse. Informs Styx's notification timing, trigger-based check-ins, and the Aegis protocol's proactive intervention model. |

### 3.3 Digital Therapeutics & Technology-Assisted Treatment

| # | Title | Author(s) | Year | Type | Annotation |
|---|-------|-----------|------|------|------------|
| 7 | "FDA Regulations and Prescription Digital Therapeutics: Evolving with the Technologies They Regulate" | Megan Gannon et al. | 2023 | Paper (*Frontiers in Digital Health*, 5, 1086219) | Maps the FDA regulatory pathways (De Novo, 510(k)) for prescription digital therapeutics. Critical for understanding Styx's potential clinical trajectory and what level of clinical evidence would be needed to pursue a PDT classification. |
| 8 | "Mobile Apps to Reduce Tobacco, Alcohol, and Illicit Drug Use: Systematic Review of the First Decade" | Nikolaos Boumparis et al. | 2019 | Paper (*Journal of Medical Internet Research*, 21(11), e16170) | Only 6 of 20 reviewed apps showed significant substance-use reduction. Highlights the gap Styx could fill with its financial-stakes mechanism, which adds motivational power beyond standard app-based CBT modules. |
| 9 | "Changing Health Behaviors Using Financial Incentives: A Review from Behavioral Economics" | Scott D. Halpern, Benjamin French et al. | 2019 | Paper (*BMC Public Health*, 19, 1059) | Reviews the intersection of behavioral economics and health behavior change through financial mechanisms. Directly maps to Styx's hybrid model of contingency management principles applied via consumer technology. |

### 3.4 No-Contact & Protective Order Psychology

| # | Title | Author(s) | Year | Type | Annotation |
|---|-------|-----------|------|------|------------|
| 10 | "The Effectiveness of Protection Orders in Reducing Recidivism in Domestic Violence: A Systematic Review and Meta-Analysis" | Reinie Cordier, Donna Chung, Sarah Wilkes-Gillan & Renee Speyer | 2021 | Paper (*Trauma, Violence, & Abuse*, 22(4), 804--828) | Mixed evidence on protection order effectiveness (violation rates 7.1% to 81.3% across studies). Grounds Styx's no-contact contract feature in clinical reality and highlights why the financial-penalty mechanism may fill gaps that legal orders cannot. |
| 11 | "Protection Orders and Intimate Partner Violence: An 18-Month Study of 150 Black, Hispanic, and White Women" | Victoria L. Holt, Mary A. Kernic et al. | 2003 | Paper (*American Journal of Preventive Medicine*, 24(1), 16--21) | Found permanent protection orders were associated with 80% reduction in police-reported violence. Demonstrates that formal commitment structures (including Styx's no-contact contracts) can be effective, but that effectiveness varies significantly by demographic and context. |

---

## Category 4: Game Theory & Mechanism Design

Theoretical foundations for the Fury audit network -- incentive-compatible verification, anti-collusion, peer prediction, and reputation system design.

| # | Title | Author(s) | Year | Type | Annotation |
|---|-------|-----------|------|------|------------|
| 1 | *The Strategy of Conflict* | Thomas C. Schelling | 1960 | Book (Harvard University Press) | Introduced Schelling focal points -- natural coordination solutions that emerge without explicit communication. Relevant to how Fury auditors converge on verdicts: the system must create focal points (clear proof criteria) that honest auditors naturally coordinate around. |
| 2 | "Perspectives on Mechanism Design in Economic Theory" (Nobel Lecture) | Roger B. Myerson | 2007 | Paper (*American Economic Review*, 98(3), 586--603) | Nobel lecture explaining the revelation principle -- any outcome achievable by any mechanism can be achieved by an incentive-compatible one. Validates the theoretical possibility of Styx's Fury system: truthful auditing can be incentive-compatible with proper mechanism design. |
| 3 | "Algorithmic Mechanism Design" | Noam Nisan & Amir Ronen | 2001 | Paper (*Games and Economic Behavior*, 35(1-2), 166--196) | Launched the field of algorithmic mechanism design, combining computational constraints with incentive compatibility. The Fury Router's BullMQ-based proof assignment and consensus calculation is an applied algorithmic mechanism design problem. |
| 4 | "A Bayesian Truth Serum for Subjective Data" | Drazen Prelec | 2004 | Paper (*Science*, 306(5695), 462--466) | Introduced a scoring mechanism that incentivizes truthful reporting even when objective verification is impossible. Directly applicable to Fury verdicts on subjective proof types (e.g., photo evidence of gym attendance) where ground truth is inherently ambiguous. |
| 5 | "Peer Prediction without a Common Prior" | Jens Witkowski & David C. Parkes | 2012 | Paper (*Proceedings of EC'12*, ACM) | Extended peer prediction to settings without common priors, achieving strict incentive compatibility. Provides the theoretical basis for Fury consensus calculations where auditors may have heterogeneous beliefs about proof quality. |
| 6 | "Reputation Systems" | Paul Resnick, Ko Kuwabara, Richard Zeckhauser & Eric Friedman | 2000 | Paper (*Communications of the ACM*, 43(12), 45--48) | Foundational survey of online reputation mechanisms -- how they build trust among strangers and their design challenges. Directly informs Styx's Fury accuracy scoring, integrity score system, and the demotion/promotion mechanics for auditors. |
| 7 | "The Value of Reputation on eBay: A Controlled Experiment" | Paul Resnick, Richard Zeckhauser, John Swanson & Kate Lockwood | 2006 | Paper (*Experimental Economics*, 9(2), 79--101) | First controlled field experiment showing high-reputation sellers earn 8.1% price premiums. Validates that reputation scores have tangible economic value -- supporting Styx's design where higher integrity scores unlock higher staking tiers. |
| 8 | "Liberal Radicalism: A Flexible Design for Philanthropic Matching Funds" | Vitalik Buterin, Zoe Hitzig & E. Glen Weyl | 2018 | Paper (SSRN/arXiv 1809.06421) | Proposed quadratic funding for public goods -- the amount received equals the square of the sum of square roots of individual contributions. While Styx doesn't use quadratic funding directly, the anti-plutocracy principles inform the auditor bounty economy's resistance to whale manipulation. |
| 9 | *Radical Markets: Uprooting Capitalism and Democracy for a Just Society* | Eric A. Posner & E. Glen Weyl | 2018 | Book (Princeton University Press) | Proposes quadratic voting and other mechanism design innovations for democratic governance. The quadratic voting framework offers a model for future Styx governance features where the community votes on rule changes with diminishing marginal influence per token. |
| 10 | "Moving Beyond Coin Voting Governance" | Vitalik Buterin | 2021 | Blog post (vitalik.eth.limo) | Analyzes vulnerabilities in coin-based voting (bribery, collusion, plutocracy) and proposes alternatives including MACI (Minimal Anti-Collusion Infrastructure) using zkSNARKs. Directly relevant to preventing Fury auditor collusion and ensuring verdict integrity at scale. |

---

## Category 5: Platform Economics & Two-Sided Markets

Theory and evidence for Styx as a two-sided market connecting oath-takers and Fury auditors, including network effects, labor economics, and governance.

| # | Title | Author(s) | Year | Type | Annotation |
|---|-------|-----------|------|------|------------|
| 1 | "Platform Competition in Two-Sided Markets" | Jean-Charles Rochet & Jean Tirole | 2003 | Paper (*Journal of the European Economic Association*, 1(4), 990--1029) | Foundational model of two-sided platform pricing -- how to allocate fees between buyer-side and seller-side. Styx must solve this: oath-takers pay stakes, Fury auditors earn bounties, and the platform extracts its cut. Getting the price structure wrong kills network effects. |
| 2 | "Competition in Two-Sided Markets" | Mark Armstrong | 2006 | Paper (*RAND Journal of Economics*, 37(3), 668--691) | Extended Rochet-Tirole with three models including "competitive bottlenecks" where one side multi-homes. In Styx's case, oath-takers are single-homing (committed to one platform) while Fury auditors could multi-home -- making Styx a natural competitive bottleneck with monopoly power over access to its oath-takers. |
| 3 | *Platform Revolution: How Networked Markets Are Transforming the Economy* | Geoffrey G. Parker, Marshall W. Van Alstyne & Sangeet Paul Choudary | 2016 | Book (W.W. Norton) | Comprehensive guide to platform business models, network effects, and monetization strategies. Provides the strategic playbook for Styx's growth: solving the chicken-and-egg problem (who comes first, oath-takers or auditors?), managing interaction quality, and scaling governance. |
| 4 | *The Sharing Economy: The End of Employment and the Rise of Crowd-Based Capitalism* | Arun Sundararajan | 2016 | Book (MIT Press) | Analyzes the transition to crowd-based capitalism with case studies of Uber, Airbnb, and TaskRabbit. Fury auditors are gig workers in a behavioral verification marketplace -- this book's analysis of trust, regulation, and labor dynamics applies directly. |
| 5 | *Governing the Commons: The Evolution of Institutions for Collective Action* | Elinor Ostrom | 1990 | Book (Cambridge University Press) | Nobel Prize-winning analysis of how communities self-govern shared resources without centralized authority. Ostrom's eight design principles for enduring commons (clear boundaries, graduated sanctions, conflict resolution) map directly to Styx's integrity score system, tier structure, and dispute resolution mechanisms. |
| 6 | "The Platform Governance Triangle: Conceptualising the Informal Regulation of Online Content" | Robert Gorwa | 2019 | Paper (*Internet Policy Review*, 8(2)) | Framework for analyzing platform governance through state, firm, and civil society interactions. As Styx scales, its governance must balance platform rules, regulatory compliance, and community norms -- this framework helps structure that evolution. |
| 7 | "Algorithmic Content Moderation: Technical and Political Challenges in the Automation of Platform Governance" | Robert Gorwa, Reuben Binns & Christian Katzenbach | 2020 | Paper (*Big Data & Society*, 7(1)) | Examines the challenges of automating content moderation decisions. Directly relevant to Styx's automation of Fury verdict aggregation and the tension between algorithmic efficiency and human judgment in proof evaluation. |

---

## Category 6: Legal & Regulatory

Legal frameworks that determine whether Styx operates as a lawful commitment device, a regulated financial product, an illegal gambling operation, or a healthcare device.

### 6.1 Gambling & Wagering Law

| # | Title | Author(s) | Year | Type | Annotation |
|---|-------|-----------|------|------|------------|
| 1 | "The Legal Ambiguity of Daily Fantasy Sports: Skill, Chance, and the Case for the Predominant Purpose Test" | (NYU Moot Court Proceedings) | 2025 | Paper (NYU Proceedings) | Analysis of the "predominant purpose test" vs. "material element test" for distinguishing skill from chance. Styx's legal survival depends on demonstrating that behavioral outcomes are skill-dominated -- this paper maps the exact legal tests Styx must satisfy. |
| 2 | "Quadratic Voting: How Mechanism Design Can Radicalize Democracy" | Steven P. Lalley & E. Glen Weyl | 2018 | Paper (*AEA Papers and Proceedings*, 108, 33--37) | While primarily about voting reform, the paper's analysis of how mechanism design can create incentive-compatible systems under legal constraints informs Styx's regulatory strategy for structuring stakes as commitment devices rather than wagers. |
| 3 | *Unlawful Internet Gambling Enforcement Act (UIGEA) -- Legislative History and Analysis* | U.S. Congress | 2006 | Legislation (31 U.S.C. 5361--5367) | UIGEA's fantasy-sports carve-out (outcomes "determined predominantly by accumulated statistical results" reflecting "relative knowledge of participants") is the closest federal precedent for Styx. Understanding how DFS companies leveraged this exemption is essential for Styx's federal compliance strategy. |

### 6.2 Money Transmission & Fintech

| # | Title | Author(s) | Year | Type | Annotation |
|---|-------|-----------|------|------|------------|
| 4 | "Fintech Regulation: How to Achieve a Level Playing Field" | Johannes Ehrentraud, Denise Garcia Ocampo et al. | 2020 | Paper (BIS Financial Stability Institute Occasional Paper No. 17) | Comprehensive overview of global fintech regulatory approaches. Styx's escrow functionality (holding user stakes via Stripe FBO) may trigger money transmitter licensing in 49 states -- this paper maps the regulatory landscape. |
| 5 | "Fintech: Overview of Financial Regulators and Recent Policy Approaches" | Congressional Research Service | 2023 | Report (CRS Report R46333) | Maps the fragmented U.S. regulatory structure for fintech: SEC, CFPB, FinCEN, and 50 state regulators. Styx must navigate this maze for its escrow/payment functionality without triggering securities, money transmission, or consumer finance regulations. |

### 6.3 Health Data & Privacy

| # | Title | Author(s) | Year | Type | Annotation |
|---|-------|-----------|------|------|------------|
| 6 | "Health Information Privacy Laws in the Digital Age: HIPAA Doesn't Apply" | Nicol Turner Lee et al. | 2021 | Paper (*Annals of Internal Medicine*, 174(2), 229--230) | Demonstrates that most consumer health apps fall outside HIPAA's scope because they are not "covered entities." Styx collects behavioral health data (exercise logs, weight, recovery status) that is regulated differently than clinical data -- this gap is both an opportunity and a liability. |
| 7 | "A Comparative Study on HIPAA Technical Safeguards Assessment of Android mHealth Applications" | Mohammad Zarour et al. | 2022 | Paper (*Internet of Things*, 20, 100636) | Found that top mHealth apps fail HIPAA technical safeguards. Styx should proactively exceed these standards even if not legally required -- R2 zero-egress storage and signed-URL-only access are already aligned with this approach. |

### 6.4 Advertising & Testimonials

| # | Title | Author(s) | Year | Type | Annotation |
|---|-------|-----------|------|------|------------|
| 8 | "Guides Concerning the Use of Endorsements and Testimonials in Advertising" (Revised) | Federal Trade Commission | 2023 | Regulation (16 CFR Part 255) | Updated FTC rules: health testimonials require substantiation; "results not typical" disclaimers are insufficient; AI-generated endorsers are covered. Styx's success stories, Tavern social features, and any user testimonials must comply with these revised standards. |
| 9 | "Decoding FDA Labeling of Prescription Digital Therapeutics: A Cross-Sectional Regulatory Study" | Multiple authors | 2024 | Paper (*Digital Health*) | Analyzes how 13 FDA-cleared PDTs were labeled and classified. If Styx ever pursues clinical claims or insurance reimbursement, this study maps the precise regulatory pathway and labeling requirements. |

---

## Category 7: Digital Health & Wellness Technology

Market research, engagement benchmarks, and clinical evidence for the digital health ecosystem Styx operates within.

### 7.1 Market Intelligence

| # | Title | Author(s) | Year | Type | Annotation |
|---|-------|-----------|------|------|------------|
| 1 | "Digital Therapeutics Market Size, Share & Trends Analysis Report" | Grand View Research | 2024 | Report | DTx market valued at $7.67B in 2024, projected $32.5B by 2030 (27.8% CAGR). Styx sits at the intersection of consumer wellness and clinical DTx -- this report quantifies the addressable market for both trajectories. |
| 2 | *The Innovator's Prescription: A Disruptive Solution for Health Care* | Clayton M. Christensen, Jerome H. Grossman & Jason Hwang | 2009 | Book (McGraw-Hill) | Applies disruptive innovation theory to healthcare. Styx could follow the classic disruption pattern: start in a niche underserved by clinical systems (habit accountability) and expand into clinical territory as evidence accumulates. |

### 7.2 Engagement & Retention Evidence

| # | Title | Author(s) | Year | Type | Annotation |
|---|-------|-----------|------|------|------------|
| 3 | "Challenges in Participant Engagement and Retention Using Mobile Health Apps: Literature Review" | Jessica Y. Brewer et al. | 2022 | Paper (*Journal of Medical Internet Research*, 24(4), e35120) | 71% of app users disengage within 90 days; medical apps see only 34% 90-day retention. Styx's financial-stakes mechanism is designed precisely to beat these benchmarks -- users who have money on the line have a reason to keep opening the app. |
| 4 | "Dropout Rates in Clinical Trials of Smartphone Apps for Depressive Symptoms: A Systematic Review and Meta-Analysis" | Adam Linardon & Matthew Fuller-Tyszkiewicz | 2020 | Paper (*Journal of Affective Disorders*, 263, 413--419) | Nearly 50% dropout rate across depression app trials. Establishes the baseline Styx must outperform and highlights that gamification alone does not enhance retention -- financial stakes may be the missing ingredient. |
| 5 | "Effectiveness of Mobile Apps to Promote Health and Manage Disease: Systematic Review and Meta-analysis of Randomized Controlled Trials" | Suhyeon Byambasuren et al. | 2021 | Paper (*JMIR mHealth and uHealth*, 9(1), e21563) | Meta-analysis of app-based interventions showing positive but weak effects on health outcomes. Styx's combined approach (financial stakes + social verification + AI coaching) targets the specific weaknesses -- low engagement and insufficient motivation -- that limit standalone app efficacy. |

### 7.3 Clinical & Regulatory Pathways

| # | Title | Author(s) | Year | Type | Annotation |
|---|-------|-----------|------|------|------------|
| 6 | "The Impact of mHealth Interventions: Systematic Review of Systematic Reviews" | Miriam C.S. Marcolino et al. | 2018 | Paper (*JMIR mHealth and uHealth*, 6(1), e23) | Umbrella review finding mHealth effective for chronic disease management but limited by low methodological quality. If Styx builds clinical evidence, this review sets the standard for what constitutes rigorous mHealth efficacy data. |
| 7 | "Long-Term Participant Retention and Engagement Patterns in an App and Wearable-Based Multinational Remote Digital Depression Study" | Sonia Difrancesco et al. | 2023 | Paper (*npj Digital Medicine*, 6, 34) | Higher retention linked to "human-in-the-loop" strategies and monetary incentives. Validates Styx's hybrid model: Fury auditors provide the human element, and financial stakes provide the monetary incentive -- both proven retention boosters combined in one platform. |
| 8 | SAMHSA Advisory: "Contingency Management" | Substance Abuse and Mental Health Services Administration | 2023 | Report (PEP24-06-001) | Federal advisory recognizing contingency management as evidence-based practice for substance use disorders. Provides institutional legitimacy for Styx's financial-incentive approach and a pathway to clinical partnerships. |

---

## Category 8: Verification & Trust Systems

Technical foundations for proof verification, oracle design, content authenticity, and decentralized identity -- the infrastructure layer that makes Styx's Fury network technically feasible.

### 8.1 The Oracle Problem

| # | Title | Author(s) | Year | Type | Annotation |
|---|-------|-----------|------|------|------------|
| 1 | "Understanding the Blockchain Oracle Problem: A Call for Action" | Giulio Caldarelli & Joshua Ellul | 2021 | Paper (*Information*, 11(11), 509) | Systematic analysis of the oracle problem -- how to bridge on-chain and off-chain data with trust guarantees. Styx's Fury network IS an oracle system: it transforms subjective real-world behavioral evidence into trusted on-chain verdicts. |
| 2 | "Astraea: A Decentralized Blockchain Oracle" | John Adler, Ryan Berryhill, Andreas Veneris et al. | 2018 | Paper (*Proceedings of IEEE iThings'18*) | Proposed a decentralized oracle using reputation and game-theoretic incentives. Styx's Fury Router implements a similar architecture: distributed auditors with accuracy-weighted reputation determining consensus verdicts. |
| 3 | "The Oracle Problem and the Future of DeFi" | Bank for International Settlements | 2023 | Paper (BIS Bulletin No. 76) | Central bank perspective on oracle risks in decentralized finance. Reframes Styx's verification challenge in the context of systemic financial risk -- relevant for regulatory conversations about the platform's escrow integrity. |
| 4 | "Connect API with Blockchain: A Survey on Blockchain Oracle Implementation" | Mahdi Fahmideh et al. | 2023 | Paper (*ACM Computing Surveys*, 55(10), 1--39) | Comprehensive survey of oracle implementations, taxonomies, and design patterns. Provides a technical reference for evaluating and improving Styx's proof-routing architecture against the state of the art. |

### 8.2 Proof-of-Human & Sybil Resistance

| # | Title | Author(s) | Year | Type | Annotation |
|---|-------|-----------|------|------|------------|
| 5 | "Human Challenge Oracle: Designing AI-Resistant, Identity-Bound, Time-Limited Tasks for Sybil-Resistant Consensus" | (Multiple authors) | 2025 | Paper (arXiv 2601.03923) | Proposes AI-resistant tasks for proving unique humanness. As AI-generated proofs become more convincing, Styx's verification system must evolve -- this paper offers technical approaches for ensuring Fury auditors are real humans evaluating real behavioral evidence. |
| 6 | "A Survey on Decentralized Identifiers and Verifiable Credentials" | (Multiple authors) | 2024 | Paper (arXiv 2402.02455) | Surveys W3C DID and Verifiable Credentials standards. Styx's future identity layer could leverage DIDs for pseudonymous-but-verified user accounts and VCs for portable integrity scores across platforms. |

### 8.3 Content Authenticity & Provenance

| # | Title | Author(s) | Year | Type | Annotation |
|---|-------|-----------|------|------|------------|
| 7 | C2PA Technical Specification (v2.3) | Coalition for Content Provenance and Authenticity | 2024 | Standard (c2pa.org) | Open standard for certifying the origin and edit history of digital media. Styx's photo/video proof submissions could embed C2PA metadata to cryptographically attest capture-device provenance -- a hardware-level anti-spoofing mechanism that complements Styx's existing pHash and EXIF validation. |
| 8 | "Privacy, Identity and Trust in C2PA: A Technical Review and Analysis" | World Privacy Forum | 2024 | Report | Analyzes privacy implications of content provenance metadata. Styx must balance proof authenticity (C2PA metadata proves the photo is real) with user privacy (that metadata could reveal location, device, and identity). |

### 8.4 Decentralized Identity

| # | Title | Author(s) | Year | Type | Annotation |
|---|-------|-----------|------|------|------------|
| 9 | "DID and VC: Untangling Decentralized Identifiers and Verifiable Credentials for the Web of Trust" | Lukas Brunner & Gerd Kortuem | 2020 | Paper (*Proceedings of DLT'20*, ACM) | Presents DIDs and VCs as a self-sovereign, privacy-friendly alternative to centralized authentication. Styx could issue verifiable credentials for integrity scores, enabling users to prove their behavioral track record to third parties (employers, insurers, B2B partners) without revealing specific contract details. |
| 10 | "Self-Sovereign Identity in a Globalized World: Credentials-Based Identity Systems as a Driver for Economic Inclusion" | Fennie Wang & Primavera De Filippi | 2020 | Paper (*Frontiers in Blockchain*, 2, 28) | Examines SSI for economic inclusion. Styx's integrity score could become a portable "behavioral credit score" -- this paper explores the ethical and practical implications of such credential systems. |

---

## Reading Order Recommendations

For a reader new to this material, the following sequence provides the steepest learning curve:

### Phase 1: Core Theory (Weeks 1--4)
1. Kahneman & Tversky, "Prospect Theory" (1979)
2. Kahneman, *Thinking, Fast and Slow* (2011)
3. Thaler & Sunstein, *Nudge* (2008)
4. Bryan, Karlan & Nelson, "Commitment Devices" (2010)
5. Gneezy & Rustichini, "Pay Enough or Don't Pay at All" (2000)

### Phase 2: Behavior Science (Weeks 5--8)
6. Lally et al., "How Are Habits Formed" (2010)
7. Ryan & Deci, "Self-Determination Theory" (2000)
8. Gollwitzer, "Implementation Intentions" (1999)
9. Michie et al., "The Behaviour Change Wheel" (2011)
10. Milkman et al., "Megastudies" (2021)

### Phase 3: Clinical & Financial Incentives (Weeks 9--12)
11. Volpp et al., "Financial Incentives for Smoking Cessation" (2009)
12. Stitzer & Petry, "Contingency Management" (2018)
13. Marlatt & Donovan, *Relapse Prevention* (2005)
14. SAMHSA Advisory on CM (2023)

### Phase 4: Platform & Mechanism Design (Weeks 13--16)
15. Rochet & Tirole, "Platform Competition in Two-Sided Markets" (2003)
16. Ostrom, *Governing the Commons* (1990)
17. Prelec, "A Bayesian Truth Serum" (2004)
18. Resnick et al., "Reputation Systems" (2000)

### Phase 5: Legal & Technical (Weeks 17--20)
19. UIGEA Legislative Analysis (2006)
20. BIS Occasional Paper on Fintech Regulation (2020)
21. FTC Endorsement Guides (2023)
22. C2PA Technical Specification (2024)
23. BIS Bulletin on Oracle Problem (2023)

---

## Cross-Reference to Existing Research Documents

| Syllabus Category | Existing Research Doc(s) |
|-------------------|-------------------------|
| 1. Behavioral Economics | `research--behavioral-economics.md`, `research--behavioral-physics-manifesto.md` |
| 2. Habit Formation | `research--psychology-behavior.md`, `research--habit-application.md`, `research--behavior-change-app-design.md` |
| 3. Addiction & Recovery | `research--breakup-psychology-loss-aversion.md`, `research--digital-exhaust-no-contact-contracts.md`, `research--b2b-expansion-heartbreak-niche.md` |
| 4. Game Theory | `research--smart-contracts-behavioral-wagers.md`, `research--smart-contracts-behavioral-wagers-v2.md` |
| 5. Platform Economics | `research--market-analysis.md`, `research--market-analysis-v2.md`, `research--competitor-teardown.md` |
| 6. Legal & Regulatory | `legal--performance-wagering.md`, `legal--gatekeeper-compliance.md`, `research--prediction-markets-regulation-finance.md` |
| 7. Digital Health | `research--gamified-behavior-change-app-design.md`, `research--commitment-device-market-analysis.md` |
| 8. Verification & Trust | `architecture--truth-blockchain.md`, `research--app-verification-tech-privacy-law.md` |

---

*Total entries: 76 across 8 categories. Prioritize items marked as directly relevant to Styx's current implementation phase (Categories 1, 3, and 6 for regulatory positioning; Category 4 for Fury system design).*
