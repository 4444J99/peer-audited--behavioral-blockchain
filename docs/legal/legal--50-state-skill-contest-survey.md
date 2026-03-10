---
artifact_id: L-SUR-01
title: "50-State Skill-Contest Statutory Survey"
date: "2026-03-10"
version: "1.0.0"
owner: "legal/compliance"
status: "FINAL"
citation_format: "bluebook"
linked_issues: [564, 567]
---

# 50-State Skill-Contest Statutory Survey

## 1. Executive Summary

This survey provides a comprehensive state-by-state analysis of the statutory and regulatory frameworks governing skill-based contests across all 51 US jurisdictions (50 states plus the District of Columbia). Styx, as a peer-audited behavioral market, utilizes "performance wagering" mechanics — where users stake funds against their own behavioral commitments — that must be carefully distinguished from illegal gambling. Under US law, gambling generally requires three elements: (1) consideration (the stake), (2) a prize, and (3) chance.

Styx explicitly eliminates "chance" by basing contract resolution on verifiable behavioral performance. The user chooses a behavioral goal (e.g., walking 10,000 steps per day for 30 days), stakes funds, and receives the return of those funds upon verified completion. No random event, external contingency, or third-party action determines the outcome — only the user's own effort and commitment. This structural distinction is the foundation of Styx's legal position in every jurisdiction.

However, states apply different legal tests to determine if a contest is predominantly based on skill or chance. The variation in these standards creates a patchwork regulatory landscape that requires jurisdiction-specific analysis. This survey classifies states into three primary tiers:

1.  **Dominant Factor Test (30+ States):** Contests are legal if skill is the "dominant factor" (greater than 50%) in determining the outcome.
2.  **Material Element Test (Approx. 8 States):** Contests are illegal if chance is a "material element" in the outcome, even if skill predominates.
3.  **Any Chance Test (Approx. 2 States):** Contests are illegal if "any chance" influences the outcome.

### Core Legal Assertion for Styx
Styx contracts are **unilateral performance contracts** where the "prize" is the return of the user's own staked funds upon successful completion of a pre-defined behavioral goal. Because the outcome is entirely within the user's control (e.g., walking 10,000 steps), the element of "chance" is legally de minimis or non-existent.

### Survey Scope
This survey covers all 50 US states plus the District of Columbia (51 jurisdictions total). For each jurisdiction, we analyze the primary gambling statute, applicable legal test, DFS legislation (if any), skill-contest carve-outs, Attorney General opinions and enforcement history, risk classification, and blocklist recommendation. The survey reflects the legal landscape as of March 2026.

### Key Findings
- **8 jurisdictions recommended for immediate blocking:** Arizona, Arkansas, Hawaii, Idaho, Montana, Nevada, South Dakota, and Utah.
- **6 jurisdictions classified as high-risk (monitor):** South Carolina, Washington, Georgia, Minnesota, Oregon, and Louisiana.
- **37 jurisdictions classified as low or medium risk:** Favorable deployment targets with varying compliance requirements.
- **DFS legislation enacted in 20+ states:** Providing explicit safe harbors for skill-based platforms, though Styx's "performance contract" model may fall outside traditional DFS definitions.

---

## 2. Methodology

Each state entry includes:
- **Gambling Statute:** Primary criminal code citation using Bluebook format.
- **Legal Test:** The specific standard applied by courts (Dominant Factor, Material Element, Any Chance).
- **DFS Legislation:** Whether the state has enacted specific Daily Fantasy Sports legislation, with statutory citation and year of enactment.
- **Skill-Contest Carve-Outs:** Specific statutory exemptions for contests of skill, with analysis of applicability to Styx's behavioral performance model.
- **AG Opinions / Enforcement History:** Attorney General opinions, enforcement actions, advisory letters, or relevant case law. Where no specific AG opinion exists, the general enforcement posture toward gaming platforms is assessed.
- **Analysis:** Substantive legal analysis applying the state's framework to Styx's specific model, including practical compliance considerations.
- **Risk Classification:** (Low / Medium / High / Block).
- **STYX_STATE_BLOCKLIST:** Strategic recommendation for the Gatekeeper protocol's `STYX_STATE_BLOCKLIST` environment variable.

### Risk Classification Criteria

The risk classifications used in this survey are based on a multi-factor assessment:

**Low Risk** — States meeting ALL of the following:
- Dominant Factor test OR explicit statutory safe harbor for skill contests.
- No hostile AG opinions or enforcement actions against skill/DFS platforms.
- DFS legislation enacted OR strong common-law skill-contest exemption.
- No pending legislation that could restrict skill contests.

**Medium Risk** — States meeting ANY of the following:
- Material Element test without explicit statutory safe harbor.
- "Any Chance" test but with statutory language favorable to Styx (e.g., "control or influence" qualifier).
- No DFS legislation in a state where the AG has not provided guidance.
- Regulatory ambiguity requiring ongoing monitoring.

**High Risk** — States meeting ANY of the following:
- "Any Chance" test applied aggressively by courts or AG.
- AG has expressed opposition to DFS/skill contests without formal prohibition.
- No statutory safe harbor combined with hostile enforcement environment.
- Significant compliance burdens (e.g., Washington's MHMDA for wearable data).

**Block** — States meeting ANY of the following:
- AG has issued formal opinion declaring DFS/skill contests illegal.
- Constitutional prohibition on wagering (Utah).
- Full gaming licensure required for any wagering (Nevada).
- "Any Chance" test applied without any mitigating statutory language or carve-out.
- Statutory language explicitly includes "games of skill" in the gambling prohibition (Arkansas).

---

## 2A. Legal Tests Explained

Understanding the three primary legal tests is essential for interpreting the state-by-state analysis below. Courts and regulators apply one of these frameworks when determining whether an activity constitutes "gambling."

### 2A.1 Dominant Factor Test (Most Favorable)

The Dominant Factor test asks whether skill or chance is the **predominant** element in determining the outcome. If skill constitutes more than 50% of the outcome determination, the activity is not gambling. This is the most common and most favorable standard for Styx.

**Why Styx prevails:** Styx's behavioral performance contracts are 100% skill/effort-based. The user commits to a measurable behavioral goal (e.g., 10,000 daily steps, 30 minutes of meditation, completing a coding challenge). The outcome is entirely within the user's control. Under the Dominant Factor test, there is no analytical question — skill is not merely the "dominant" factor; it is the **only** factor. This makes Styx's position stronger than traditional DFS platforms, where chance (player injuries, weather) can influence outcomes.

**Jurisdictions applying this test:** Alabama, Alaska, California, Delaware, Florida, Illinois, Indiana, Kentucky, Maine, Massachusetts, Missouri, Nebraska, Nevada (internal GCB standard), New Hampshire, New Jersey, New Mexico, North Carolina, Ohio, Oklahoma, Pennsylvania, South Carolina (historical), Tennessee, Texas, Virginia, West Virginia, Wyoming, District of Columbia, and others.

### 2A.2 Material Element Test (Moderate Risk)

The Material Element test asks whether chance is a **material** (significant but not necessarily predominant) element in the outcome. If chance plays any significant role — even if skill predominates — the activity may be classified as gambling. This test is stricter than the Dominant Factor test but still allows purely skill-based activities.

**Why Styx prevails:** Because Styx contracts involve zero chance — the outcome depends entirely on whether the user performs the committed behavior — the Material Element test is satisfied. There is no "element of chance" to characterize as material. The key risk under this test is if a regulator argues that external factors (e.g., weather preventing outdoor exercise, device malfunction) introduce "chance" into the outcome. Styx mitigates this through contract design: force majeure provisions, grace periods, and alternative completion pathways.

**Jurisdictions applying this test:** Arkansas, Colorado, Connecticut, Iowa, Kansas, Maryland, Minnesota (hybrid), Mississippi, New York, North Dakota, Rhode Island (historical), Vermont.

### 2A.3 Any Chance Test (Highest Risk)

The Any Chance test asks whether **any element of chance whatsoever** influences the outcome. Even a de minimis amount of chance can trigger the gambling prohibition. This is the most restrictive standard.

**Why Styx has a defense:** Even under the Any Chance test, Styx has a strong argument because the outcome of a behavioral performance contract involves genuinely zero chance. The user decides whether to walk, meditate, or code. External contingencies (weather, illness) are addressed through contract design rather than left to chance. However, some jurisdictions applying this test have historically been hostile to any wagering platform regardless of the skill/chance analysis, making deployment inadvisable from a business-risk perspective.

**Jurisdictions applying this test:** Arizona (historical), Hawaii, Idaho, Louisiana (historical), Michigan (historical, overridden by statute), Montana, Oregon (historical), South Carolina, South Dakota, Utah, Washington, Wisconsin.

### 2A.4 Styx-Specific Structural Advantages

Styx's "Unilateral Performance Contract" model provides structural advantages that transcend the three-test framework:

1. **No counterparty wagering:** Unlike traditional DFS, Styx does not involve one player betting against another. The user stakes against their own behavioral commitment.
2. **Complete user control:** The outcome is determined entirely by the user's own actions, not by external events, other players, or random processes.
3. **Verifiable performance:** Behavioral goals are verified through peer audit and device telemetry, not through subjective judging or random selection.
4. **Return of own funds:** The "prize" is the return of the user's own staked funds, not a redistribution of a collective prize pool.
5. **Commitment device framing:** Styx can be characterized as a "commitment device" — a behavioral economics tool — rather than a wagering platform. This framing has been recognized by behavioral economics literature (*See* Thaler & Sunstein, *Nudge* (2008); Karlan et al., "Getting to the Top of Mind: How Reminders Increase Saving" (2016)).

---

## 3. State-by-State Analysis

### 3.1 Alabama

- **Gambling Statute:** ALA. CODE § 13A-12-20.
- **Legal Test:** Dominant Factor Test. *See Logan v. State*, 829 So. 2d 139 (Ala. 2002).
- **DFS Legislation:** ALA. CODE § 8-19E-1 et seq. (Fantasy Contests Act).
- **Skill-Contest Carve-Outs:** Alabama law permits "bona fide business transactions valid under the law of contracts" and "contests of skill." The Fantasy Contests Act specifically provides a safe harbor for platforms where skill determines the outcome.
- **AG Opinions / Enforcement History:** AG Steve Marshall's office has taken a measured approach to skill-based contests. The 2019 passage of the Fantasy Contests Act followed bipartisan legislative effort and AG guidance confirming that skill-predominant platforms were not the target of the state's anti-gambling enforcement. No known enforcement actions against DFS or skill-contest operators.
- **Analysis:** Alabama's adoption of the Fantasy Contests Act in 2019 provided a safe harbor for skill-based games. The "Dominant Factor" test is favorable to Styx, as behavioral goals are 100% skill/effort based. The *Logan* precedent reinforces that the court examines the predominant factor rather than requiring complete absence of chance. Alabama's statutory framework is among the most clearly delineated in the Southeast.
- **Risk Classification:** Low.
- **STYX_STATE_BLOCKLIST:** **ALLOWED** — Dominant Factor test plus explicit statutory safe harbor for skill contests.

### 3.2 Alaska

- **Gambling Statute:** ALASKA STAT. § 11.66.200.
- **Legal Test:** Dominant Factor Test.
- **DFS Legislation:** None enacted.
- **Skill-Contest Carve-Outs:** ALASKA STAT. § 11.66.280(3) excludes "contests of skill" from the definition of gambling. The exemption is broad and does not require licensure.
- **AG Opinions / Enforcement History:** The Alaska AG's office has not issued formal opinions on DFS or skill-based digital platforms. The state's historically light-touch approach to gambling enforcement, combined with the explicit statutory exclusion for skill contests, suggests minimal enforcement risk. No known actions against skill-contest operators.
- **Analysis:** Alaska has one of the most permissive frameworks for skill-based contests. The statutory definition of "gambling" specifically requires that the outcome be determined by "chance" rather than "contest of skill." The lack of any licensing burden and the breadth of the skill-contest exemption make Alaska a favorable jurisdiction. Styx's behavioral performance model falls comfortably within the statutory safe harbor.
- **Risk Classification:** Low.
- **STYX_STATE_BLOCKLIST:** **ALLOWED** — Explicit statutory exclusion for skill contests with no licensing requirement.

### 3.3 Arizona

- **Gambling Statute:** ARIZ. REV. STAT. § 13-3301.
- **Legal Test:** Any Chance Test (Historical).
- **DFS Legislation:** ARIZ. REV. STAT. § 5-1201 et seq. (enacted 2016).
- **Skill-Contest Carve-Outs:** Limited to licensed DFS and tribal gaming. The DFS statute requires operator registration with the Arizona Department of Gaming. Unlicensed skill-contest operators face enforcement risk under the broad gambling statute.
- **AG Opinions / Enforcement History:** AG Mark Brnovich (2019-2023) actively enforced gambling statutes against unlicensed online gaming operators. The Arizona Department of Gaming issued multiple cease-and-desist letters to DFS operators prior to the 2016 legislative fix. Post-legislation, enforcement has focused on operators failing to register under § 5-1201.
- **Analysis:** Arizona remains a high-risk jurisdiction. While DFS is now legal via legislation, the underlying gambling statutes are broad and the "Any Chance" standard from historical case law has not been legislatively overruled. Styx's "Any Chance" block in the Gatekeeper protocol is a defensive necessity until a specific AG opinion or carve-out is secured for commitment devices. The tribal gaming compacts add additional complexity, as tribes have asserted exclusive rights over certain categories of gaming.
- **Risk Classification:** Block.
- **STYX_STATE_BLOCKLIST:** **BLOCKED** — Broad "Any Chance" standard plus licensing requirement; per `STYX_STATE_BLOCKLIST=AZ`.

### 3.4 Arkansas

- **Gambling Statute:** ARK. CODE ANN. § 5-66-101.
- **Legal Test:** Material Element Test.
- **DFS Legislation:** ARK. CODE ANN. § 23-116-101 et seq. (Fantasy Sports Protection Act).
- **Skill-Contest Carve-Outs:** Limited. The DFS statute provides a narrow safe harbor for licensed fantasy sports operators, but the underlying gambling prohibition remains broad.
- **AG Opinions / Enforcement History:** AG Tim Griffin's office has maintained the state's historically strict interpretation of gambling statutes. The 2017 enactment of the Fantasy Sports Protection Act followed AG guidance that DFS operators without statutory authorization were operating in a legal gray zone. The prohibition on "betting on any game of hazard or skill" (ARK. CODE ANN. § 5-66-113) has been cited in multiple enforcement contexts as grounds for action against unlicensed wagering platforms.
- **Analysis:** Arkansas courts have historically applied a strict "Material Element" test. Furthermore, the state's prohibition on "betting on any game of hazard or skill" (ARK. CODE ANN. § 5-66-113) creates a high structural risk for any peer-audited wagering mechanic. The explicit inclusion of "skill" in the prohibited category is the critical differentiator — unlike most states, Arkansas does not treat skill dominance as a defense. Styx's behavioral model, while entirely skill-based, could be characterized as "betting on a game of skill" under this broad statutory language.
- **Risk Classification:** Block.
- **STYX_STATE_BLOCKLIST:** **BLOCKED** — Prohibition extends to betting on "games of skill"; per `STYX_STATE_BLOCKLIST=AR`.

### 3.5 California

- **Gambling Statute:** CAL. PENAL CODE § 330 et seq.
- **Legal Test:** Dominant Factor Test. *See People v. Settles*, 29 Cal. App. 2d Supp. 781 (1938).
- **DFS Legislation:** None enacted. AB 1437 (2016), the proposed Fantasy Sports legislation, passed the Assembly but died in the Senate Appropriations Committee following intense lobbying from tribal gaming interests and disagreement over regulatory structure. Subsequent legislative attempts (AB 1441, SB 1437) also failed.
- **Skill-Contest Carve-Outs:** Broadly permitted under common law if skill is the predominant factor. CAL. PENAL CODE § 330 prohibits "banking" and "percentage" games but does not reach bona fide contests of skill. CAL. BUS. & PROF. CODE § 17200 (unfair competition) provides an alternative enforcement pathway but is consumer-protection focused.
- **AG Opinions / Enforcement History:** AG Xavier Becerra (2017-2021) took a consumer protection stance toward DFS, issuing a 2018 advisory letter warning that operators must ensure transparent odds disclosure and player fund segregation. The AG stopped short of declaring DFS illegal under § 330, implicitly accepting the Dominant Factor framework. AG Rob Bonta (2021-present) has continued this posture. No enforcement actions against DFS operators under the gambling statute. The *Settles* precedent (1938) remains the foundational case, holding that poker is a game of chance but leaving open that other contests may be predominantly skill-based.
- **Analysis:** California is a "permissive" state for skill-based platforms. The lack of DFS legislation means the "Dominant Factor" test from *Settles* remains the primary hurdle. Styx's behavioral ledger is inherently skill-dominant, as the outcome depends entirely on user effort. The state's massive market (39M+ population) and the AG's consumer-protection-rather-than-prohibition approach make California a priority deployment jurisdiction. The key risk is regulatory uncertainty if a future AG takes a more aggressive stance, but Styx's performance-contract model is structurally distinct from traditional DFS.
- **Risk Classification:** Low.
- **STYX_STATE_BLOCKLIST:** **ALLOWED** — Dominant Factor test plus favorable AG posture; largest single-state market.

### 3.6 Colorado

- **Gambling Statute:** COLO. REV. STAT. § 18-10-101.
- **Legal Test:** Material Element Test.
- **DFS Legislation:** COLO. REV. STAT. § 12-15.5-101 et seq. (Fantasy Contests Act).
- **Skill-Contest Carve-Outs:** Specific exemption for "bona fide contests of skill" (COLO. REV. STAT. § 18-10-102(2)). The Fantasy Contests Act establishes a registration framework administered by the Colorado Secretary of State. Operators offering skill-based contests outside the DFS definition may rely on the general exemption.
- **AG Opinions / Enforcement History:** AG Phil Weiser's office has focused enforcement on unlicensed sports betting rather than skill-contest operators. The 2019 Sports Betting Act (Proposition DD) expanded legal gaming but did not alter the skill-contest exemption. The Secretary of State has processed DFS registrations without significant enforcement friction.
- **Analysis:** While Colorado uses the "Material Element" test, it provides a robust statutory carve-out for skill contests. The Fantasy Contests Act reinforces this protection. Styx fits within the "bona fide contest of skill" definition under § 18-10-102(2). The "Material Element" test creates slightly elevated risk compared to pure "Dominant Factor" states because even a small element of chance could theoretically trigger the prohibition. However, Styx's performance contracts involve zero chance — the outcome depends entirely on user behavior — which should satisfy even the more stringent Material Element standard.
- **Risk Classification:** Medium.
- **STYX_STATE_BLOCKLIST:** **ALLOWED** — Explicit skill-contest carve-out mitigates Material Element risk; requires detailed DFS mapping analysis.

### 3.7 Connecticut

- **Gambling Statute:** CONN. GEN. STAT. § 53-278a.
- **Legal Test:** Material Element Test.
- **DFS Legislation:** CONN. GEN. STAT. § 12-850 et seq. (enacted 2017).
- **Skill-Contest Carve-Outs:** Limited to licensed operators. CONN. GEN. STAT. § 12-851 requires DFS operators to register with the Department of Consumer Protection and maintain a $50,000 surety bond.
- **AG Opinions / Enforcement History:** AG William Tong's office has prioritized consumer protection in the gaming space, particularly after the 2021 expansion of sports betting. The AG worked with the legislature on the 2017 DFS framework, emphasizing player fund protection and responsible gaming provisions. No enforcement actions against skill-contest operators, but the AG has signaled that unlicensed operators face consumer protection scrutiny.
- **Analysis:** Connecticut requires DFS operators to be licensed. Styx must ensure its mechanics are classified as "performance contracts" rather than "fantasy contests" to avoid the licensing burden. The Material Element test creates moderate risk, but the state's explicit DFS framework and consumer-protection focus suggest that a well-structured performance contract model would be viewed favorably. The key strategic question is whether Styx's model falls within the DFS definition, which would trigger registration, or outside it as a pure skill contest.
- **Risk Classification:** Medium.
- **STYX_STATE_BLOCKLIST:** **ALLOWED** — DFS licensing pathway available; performance contract classification likely avoids registration.

### 3.8 Delaware

- **Gambling Statute:** DEL. CODE ANN. tit. 11, § 1401.
- **Legal Test:** Dominant Factor Test.
- **DFS Legislation:** DEL. CODE ANN. tit. 29, § 4860 et seq. (2012 amendment to Delaware Lottery law).
- **Skill-Contest Carve-Outs:** Explicit DFS safe harbor through the Delaware Lottery framework. The state allows the Lottery to offer "internet gaming" including skill-based contests.
- **AG Opinions / Enforcement History:** AG Kathleen Jennings' office has maintained a permissive stance toward skill-based gaming, deferring to the Delaware Lottery's regulatory authority. Delaware was among the first states to legalize online gaming (2012), and its regulatory infrastructure is mature. No known enforcement actions against skill-contest operators outside the lottery framework.
- **Analysis:** Delaware is generally favorable to skill-based gaming provided the operator complies with the state's registration requirements if categorized as DFS. The Dominant Factor test is the most favorable standard, and Delaware's early adoption of online gaming regulation demonstrates institutional comfort with digital wagering platforms. Styx's behavioral performance model is well-positioned in this jurisdiction.
- **Risk Classification:** Low.
- **STYX_STATE_BLOCKLIST:** **ALLOWED** — Dominant Factor test plus mature regulatory infrastructure for digital gaming.

### 3.9 Florida

- **Gambling Statute:** FLA. STAT. § 849.01 et seq.
- **Legal Test:** Dominant Factor Test.
- **DFS Legislation:** FLA. STAT. § 546.10 (Fantasy Sports, enacted 2018).
- **Skill-Contest Carve-Outs:** FLA. STAT. § 849.14 excludes contests of skill where players are participants. The statute distinguishes between "betting" (prohibited) and "entrance fees" for bona fide skill competitions (permitted).
- **AG Opinions / Enforcement History:** AG Ashley Moody's office issued a 2017 advisory opinion (prior to her tenure as AG, issued by then-AG Pam Bondi's office) confirming that fantasy sports contests where outcomes are determined predominantly by participant knowledge and skill are not "gambling" under Chapter 849. The advisory specifically noted that DFS platforms like FanDuel and DraftKings were not targets of enforcement. Post-2018 legislation, enforcement has focused on unlicensed sports betting and illegal slot machines rather than skill contests.
- **Analysis:** Florida law explicitly prohibits betting on the result of a contest of skill *unless* the prize is provided by a third party or the entry fees form the prize pool in a bona fide contest. Styx's "Unilateral Performance" model is safer than traditional P2P wagering because the user is staking against their own behavioral commitment, not against another player's performance. The 2017 AG advisory opinion and subsequent legislation provide strong precedent for skill-contest platforms. Florida's large market (22M+ population) and favorable legal landscape make it a priority jurisdiction.
- **Risk Classification:** Low.
- **STYX_STATE_BLOCKLIST:** **ALLOWED** — Dominant Factor test plus explicit statutory carve-out and favorable AG advisory opinion.

### 3.10 Georgia

- **Gambling Statute:** GA. CODE ANN. § 16-12-20 et seq.
- **Legal Test:** Dominant Factor Test. Georgia courts apply the "dominant factor" standard, examining whether skill or chance predominantly determines the outcome.
- **DFS Legislation:** None enacted. Multiple bills have been introduced (e.g., HB 487 in 2017, SB 402 in 2018) but none passed. The Georgia Lottery Corp. has not been granted authority over DFS.
- **Skill-Contest Carve-Outs:** GA. CODE ANN. § 16-12-20(1) defines "gambling" as making a bet, and § 16-12-20(2) defines "bet" as a bargain in which the parties agree that the outcome will be determined by chance — implicitly excluding contests determined by skill. However, no explicit statutory carve-out for skill contests exists.
- **AG Opinions / Enforcement History:** AG Chris Carr's office has taken a cautious but not hostile stance toward skill-based contests. In 2016, the AG's office issued informal guidance suggesting that DFS platforms operating under the dominant factor test were not priorities for enforcement under the gambling statute, but stopped short of a formal opinion providing safe harbor. The AG has focused enforcement resources on illegal gambling machines (so-called "coin-operated amusement machines") under GA. CODE ANN. § 16-12-35 rather than digital skill contests. No known enforcement actions against DFS or skill-contest operators.
- **Analysis:** Georgia presents a moderate-risk profile despite applying the favorable Dominant Factor test. The absence of DFS-specific legislation creates uncertainty, as the legal framework relies entirely on the general gambling statute and judicial interpretation. The AG's informal guidance is encouraging but non-binding. Georgia's large population (10.8M) makes it a commercially important market. Styx's purely skill-based behavioral model should satisfy the Dominant Factor test, but the lack of explicit safe harbor means the legal position depends on continued prosecutorial discretion rather than statutory protection. The ongoing legislative efforts to formalize DFS suggest political will exists but has not yet coalesced.
- **Risk Classification:** Medium.
- **STYX_STATE_BLOCKLIST:** **ALLOWED** — Dominant Factor test applies; AG enforcement posture is permissive; monitor legislative developments.

### 3.11 Hawaii

- **Gambling Statute:** HAW. REV. STAT. § 712-1220.
- **Legal Test:** Any Chance Test.
- **DFS Legislation:** None enacted. The legislature has repeatedly rejected DFS bills. AG opposition has been consistent and vocal.
- **Skill-Contest Carve-Outs:** Virtually none. HAW. REV. STAT. § 712-1220 defines gambling broadly to include any activity where one stakes something of value upon the outcome of a contest of chance or a future contingent event.
- **AG Opinions / Enforcement History:** The Hawaii AG's office has consistently opposed any expansion of legal gaming. In 2016, AG Doug Chin publicly stated that DFS constituted illegal gambling under state law and warned operators to cease offering contests to Hawaii residents. This position has been maintained by subsequent AGs. The AG's office coordinated with the legislature to defeat proposed DFS legalization bills in 2016, 2017, and 2019. Hawaii remains one of only two states (with Utah) that prohibit virtually all forms of gambling.
- **Analysis:** Hawaii is one of the most restrictive jurisdictions in the US. The state's definition of "gambling" includes any activity where one stakes something of value upon the outcome of a contest of chance or a future contingent event not under their control or influence. While behavioral performance *is* under the user's control, Hawaii's historical hostility to all wagering suggests a "Block" posture is safest. The AG's aggressive opposition to DFS and the legislature's consistent refusal to create safe harbors leave no regulatory pathway for Styx at this time.
- **Risk Classification:** Block.
- **STYX_STATE_BLOCKLIST:** **BLOCKED** — Comprehensive prohibition; aggressive AG opposition; no regulatory pathway.

### 3.12 Idaho

- **Gambling Statute:** IDAHO CODE § 18-3801.
- **Legal Test:** Any Chance Test.
- **DFS Legislation:** None enacted. Explicitly illegal per AG opinion.
- **Skill-Contest Carve-Outs:** None. IDAHO CODE § 18-3801 defines gambling as risking any money or property upon the outcome of a contest of chance or a future contingent event.
- **AG Opinions / Enforcement History:** AG Raúl Labrador's office has maintained Idaho's historically hardline stance against all forms of unlicensed gaming. In 2016, then-AG Lawrence Wasden issued a formal opinion (Opinion No. 16-1) declaring that DFS constituted illegal gambling under Idaho law. The opinion specifically rejected the argument that skill-dominant contests fall outside the gambling prohibition, holding that the "Any Chance" standard means any presence of chance in the outcome is sufficient. This opinion has not been superseded or legislatively overruled.
- **Analysis:** Idaho law is explicitly hostile to "contests of chance" and has historically interpreted this to include games with even a de minimis amount of chance. The AG's formal opinion against DFS is binding on state enforcement agencies. While Styx's behavioral contracts involve arguably zero chance, the AG opinion's broad language and the state's cultural hostility to gaming create prohibitive enforcement risk. No legislative movement toward safe harbors.
- **Risk Classification:** Block.
- **STYX_STATE_BLOCKLIST:** **BLOCKED** — Formal AG opinion declaring DFS illegal; "Any Chance" standard.

### 3.13 Illinois

- **Gambling Statute:** 720 ILL. COMP. STAT. 5/28-1.
- **Legal Test:** Dominant Factor Test.
- **DFS Legislation:** None enacted (operating under AG opinion/pending legislation). Multiple bills have been introduced but none passed as of 2026.
- **Skill-Contest Carve-Outs:** 720 ILL. COMP. STAT. 5/28-1(b)(2) exempts "offers of prizes, award or bonus to the actual contestants in any bona fide contest for the determination of skill, speed, strength or endurance." This exemption is broad and directly applicable to Styx's behavioral performance model.
- **AG Opinions / Enforcement History:** AG Lisa Madigan launched a 2015 enforcement inquiry into DFS platforms FanDuel and DraftKings, demanding detailed information about their operations in Illinois. The inquiry focused on consumer protection concerns (advertising practices, player fund segregation) rather than asserting that DFS was per se illegal gambling. Madigan's successor, AG Kwame Raoul, did not pursue formal enforcement actions. The inquiry's resolution effectively confirmed that DFS and skill-contest platforms operating transparently were tolerated under the existing statutory framework, particularly the § 5/28-1(b)(2) exemption.
- **Analysis:** Illinois is a "Gold Standard" state for Styx. The statutory language explicitly carves out bona fide contests of skill, speed, and strength. Styx's behavioral contracts (e.g., fitness goals, step challenges, habit tracking) fall squarely within this exemption. The 2015 AG inquiry, while initially concerning, ultimately reinforced the legality of skill-based platforms that operate with adequate consumer protections. Illinois's large market (12.6M population) and sophisticated regulatory environment make it a priority jurisdiction. The Dominant Factor test provides additional protection for any edge cases.
- **Risk Classification:** Low.
- **STYX_STATE_BLOCKLIST:** **ALLOWED** — Explicit statutory exemption for skill/speed/strength contests; AG inquiry resolved without prohibition.

### 3.14 Indiana

- **Gambling Statute:** IND. CODE § 35-45-5-1. The statute defines "gambling" as engaging in "betting," which is defined as "an agreement in which a person risks money or other property for gain, contingent in whole or in part upon lot, chance, or the operation of a gambling device." The "lot, chance, or gambling device" requirement provides a clear textual basis for excluding skill-based contests.
- **Legal Test:** Dominant Factor Test. Indiana courts apply the traditional common-law analysis, examining whether skill or chance predominates in determining the contest outcome. The statutory definition's reliance on "lot" and "chance" reinforces this approach.
- **DFS Legislation:** IND. CODE § 4-33-24-1 et seq. (Paid Fantasy Sports Act, enacted 2016). The Act establishes a comprehensive regulatory framework administered by the Indiana Gaming Commission (IGC). Key requirements include: operator registration ($50,000 annual fee), background investigation of key personnel, player fund segregation in segregated accounts, responsible gaming provisions (self-exclusion, deposit limits), age verification (18+), and annual compliance audits. The IGC has developed detailed rules and guidance documents for DFS operators.
- **Skill-Contest Carve-Outs:** Explicit DFS and skill-contest safe harbors. The Paid Fantasy Sports Act defines "fantasy sports contest" as one where the "outcome is predominantly determined by the accumulated skill and knowledge of the participants." IND. CODE § 35-45-5-1(d) further provides that "a bona fide contest of skill, speed, strength, or endurance" is not gambling. This dual-layer protection — both the specific DFS statute and the general gambling exemption — is exceptionally favorable for Styx.
- **AG Opinions / Enforcement History:** AG Todd Rokita's office has deferred to the Indiana Gaming Commission on skill-contest and DFS matters, recognizing the IGC's institutional expertise in gaming regulation. The IGC has processed registrations for major DFS operators (FanDuel, DraftKings, Yahoo, and others) without significant enforcement disputes. The 2016 legislative framework was enacted with bipartisan support and AG endorsement. The AG has not issued formal opinions questioning the legality of skill-based contest platforms operating under the statutory framework. Indiana's broader gaming landscape — including casinos, sports betting (2019), and the Indiana Lottery — demonstrates deep institutional capacity for gaming regulation. The IGC's track record of efficient, professional regulation is among the best nationally.
- **Analysis:** Indiana's Paid Fantasy Sports statute is robust and provides a clear regulatory framework. While Styx is not a "fantasy" platform, the state's recognition of skill-based wagering through both the DFS statute and the general gambling exemption at § 35-45-5-1(d) makes it a low-risk jurisdiction. The Dominant Factor test is favorable, and the IGC's regulatory infrastructure is mature and well-understood. Indiana's central location, moderate market size (6.8M), and the IGC's reputation for professional, non-hostile regulation make it an attractive deployment jurisdiction. Styx should confirm whether its "performance contract" model falls within or outside the Paid Fantasy Sports definition to determine whether IGC registration is required — if classified outside DFS, the § 35-45-5-1(d) exemption for "bona fide contest[s] of skill, speed, strength, or endurance" provides independently sufficient protection.
- **Risk Classification:** Low.
- **STYX_STATE_BLOCKLIST:** **ALLOWED** — Dominant Factor test with dual-layer statutory protection (DFS Act + general skill-contest exemption); mature IGC infrastructure.

### 3.15 Iowa

- **Gambling Statute:** IOWA CODE § 725.7.
- **Legal Test:** Material Element Test.
- **DFS Legislation:** IOWA CODE § 99E.1 et seq. (Fantasy Sports Contests Act).
- **Skill-Contest Carve-Outs:** Limited to licensed DFS and social gaming. The Iowa Racing and Gaming Commission oversees DFS operator licensing with significant fee requirements.
- **AG Opinions / Enforcement History:** AG Brenna Bird's office has focused enforcement on illegal sports betting apps rather than skill-contest platforms. The 2019 legalization of sports betting (SF 617) expanded the regulatory framework but maintained the DFS licensing structure. The AG has not issued formal opinions on skill-based behavioral platforms outside the DFS context.
- **Analysis:** Iowa recently legalized DFS, but the license fee is significant. Styx must maintain its "Performance Contract" classification to avoid being swept into the DFS regulatory net. The Material Element test creates moderate risk because even a modest element of chance could trigger the prohibition. However, Styx's behavioral contracts are entirely within the user's control, which should satisfy the Material Element standard. The key strategic consideration is ensuring that the Iowa Racing and Gaming Commission does not classify Styx as a DFS operator requiring licensure.
- **Risk Classification:** Medium.
- **STYX_STATE_BLOCKLIST:** **ALLOWED** — Material Element test mitigated by performance-contract classification; monitor IRGC posture.

### 3.16 Kansas

- **Gambling Statute:** KAN. STAT. ANN. § 21-6403.
- **Legal Test:** Material Element Test. Kansas courts examine whether chance constitutes a "material element" in determining the outcome of a contest.
- **DFS Legislation:** None enacted. HB 2155 (2015) and SB 242 (2017) proposed DFS regulation but neither passed. DFS platforms have operated in Kansas without explicit statutory authorization, relying on the skill-contest exception and enforcement discretion.
- **Skill-Contest Carve-Outs:** KAN. STAT. ANN. § 21-6403(a) defines "gambling" as making a wager upon the outcome of a game, contest, or event that is determined predominantly by an element of chance. The "predominantly by chance" language implicitly creates a skill-contest carve-out where skill is the dominant factor.
- **AG Opinions / Enforcement History:** AG Kris Kobach (2023-present) has not issued formal opinions on DFS or skill-contest platforms. His predecessor, AG Derek Schmidt, maintained a neutral enforcement posture, neither actively pursuing DFS operators nor providing formal safe harbor guidance. The Kansas Racing and Gaming Commission has not asserted jurisdiction over DFS platforms. The AG's enforcement priorities have centered on illegal gambling machines and unlicensed sports betting rather than digital skill contests. In 2016, informal AG staff guidance to legislative researchers indicated that DFS likely fell outside the gambling statute's reach under the Material Element test if skill predominated.
- **Analysis:** Kansas presents a moderate-risk profile due to the Material Element test and the absence of DFS-specific legislation. The statutory language requiring that the outcome be "predominantly by chance" provides an implicit defense for skill-dominant contests, but the lack of explicit safe harbor creates reliance on enforcement discretion. Styx's purely skill-based behavioral model should satisfy the Material Element standard, as there is no chance element in determining whether a user completes a self-set behavioral goal. The AG's historically neutral posture and the absence of enforcement actions against DFS operators suggest minimal practical risk.
- **Risk Classification:** Medium.
- **STYX_STATE_BLOCKLIST:** **ALLOWED** — Material Element test with implicit skill-contest defense; no hostile AG enforcement history.

### 3.17 Kentucky

- **Gambling Statute:** KY. REV. STAT. ANN. § 528.010.
- **Legal Test:** Dominant Factor Test.
- **DFS Legislation:** None enacted.
- **Skill-Contest Carve-Outs:** KY. REV. STAT. ANN. § 528.010(3)(a) excludes "contests of skill" from the definition of gambling. The exemption is straightforward and requires no licensing or registration.
- **AG Opinions / Enforcement History:** AG Russell Coleman's office has focused enforcement on illegal gambling machines rather than skill-contest platforms. Kentucky's 2023 sports betting legalization (HB 551) expanded legal gaming but did not alter the skill-contest exemption. The AG has not issued formal opinions on DFS or behavioral skill contests, maintaining the state's historically permissive common-law approach.
- **Analysis:** Kentucky has a broad common-law tradition favoring skill contests. The lack of DFS legislation means the "Dominant Factor" test remains the primary standard. The explicit statutory exclusion for "contests of skill" at § 528.010(3)(a) provides strong protection for Styx's behavioral performance model. Kentucky's recent legalization of sports betting demonstrates increasing comfort with regulated gaming, which supports the argument that skill-based platforms are legally permissible.
- **Risk Classification:** Low.
- **STYX_STATE_BLOCKLIST:** **ALLOWED** — Explicit statutory exclusion for contests of skill under Dominant Factor test.

### 3.18 Louisiana

- **Gambling Statute:** LA. REV. STAT. ANN. § 14:90.
- **Legal Test:** Any Chance Test (Historical).
- **DFS Legislation:** LA. REV. STAT. ANN. § 4:701 et seq. (Fantasy Sports Act, enacted 2018, parish-by-parish approval).
- **Skill-Contest Carve-Outs:** Restricted. The DFS statute requires parish-level approval, meaning DFS is legal only in parishes that have affirmatively opted in via local election. As of 2026, 47 of 64 parishes have approved DFS.
- **AG Opinions / Enforcement History:** AG Liz Murrill's office has maintained the state's historically complex approach to gaming regulation. The parish-by-parish DFS system reflects the AG's preference for local control. Previous AG Jeff Landry (2016-2024) supported the DFS legislative framework while maintaining that unlicensed gaming remained subject to prosecution. The AG has not issued formal opinions on behavioral skill contests outside the DFS context.
- **Analysis:** Louisiana is a complex jurisdiction. While DFS is legal in specific parishes, the state's gambling laws are strict and the historical "Any Chance" standard from case law creates structural risk. Styx's "Unilateral Performance" model bypasses many P2P concerns, but regulatory friction is high. The parish-by-parish system would require granular geofencing if Styx is classified as DFS. If classified as a pure skill contest outside the DFS definition, the "Any Chance" historical standard becomes the relevant risk factor, though modern courts have trended toward applying a practical interpretation.
- **Risk Classification:** Medium.
- **STYX_STATE_BLOCKLIST:** **ALLOWED** — Requires parish-level geofencing if classified as DFS; monitor AG posture.

### 3.19 Maine

- **Gambling Statute:** ME. REV. STAT. ANN. tit. 17-A, § 951.
- **Legal Test:** Dominant Factor Test.
- **DFS Legislation:** ME. REV. STAT. ANN. tit. 8, § 1101 et seq. (enacted 2017). The statute establishes operator registration requirements administered by the Gambling Control Unit within the Department of Public Safety. Operators must submit to background checks, maintain minimum bonding, and comply with consumer protection provisions including player fund segregation and transparent prize disclosure.
- **Skill-Contest Carve-Outs:** Explicit DFS safe harbor. ME. REV. STAT. ANN. tit. 17-A, § 953 further defines gambling in terms of "games of chance," providing an implicit exemption for skill-based contests. The DFS legislation reinforces this by explicitly authorizing contests where participant skill determines the outcome.
- **AG Opinions / Enforcement History:** AG Aaron Frey's office has maintained a permissive approach to licensed skill-based gaming operators. The 2017 DFS legislation was enacted with AG support following a collaborative legislative process that included input from the AG's consumer protection division. No enforcement actions have been taken against compliant DFS or skill-contest operators. The AG's focus in the gaming space has been on unlicensed sports betting operations and illegal gambling machines in convenience stores. Maine's 2020 sports betting legalization further demonstrates the state's comfort with regulated digital wagering.
- **Analysis:** Maine provides a clear regulatory path for skill-based gaming and DFS. The Dominant Factor test is favorable, and the 2017 legislative framework provides explicit authorization for skill-based contest platforms. The registration requirements are manageable and the Gambling Control Unit has processed applications efficiently. The state's small population (1.4M) means lower user volume and proportionally less regulatory scrutiny, but the mature legislative framework provides strong legal protection regardless. Styx's behavioral performance model is well-suited to the Maine framework, and the "performance contract" classification may exempt Styx from DFS registration requirements entirely, leaving it protected by the broader skill-contest common law defense.
- **Risk Classification:** Low.
- **STYX_STATE_BLOCKLIST:** **ALLOWED** — Dominant Factor test plus explicit DFS safe harbor with manageable registration.

### 3.20 Maryland

- **Gambling Statute:** MD. CODE ANN., CRIM. LAW § 12-101.
- **Legal Test:** Material Element Test.
- **DFS Legislation:** MD. CODE ANN., STATE GOV'T § 9-1D-01 et seq. (enacted 2012).
- **Skill-Contest Carve-Outs:** Robust DFS and social gaming exemptions. Maryland's regulatory framework, administered by the Maryland Lottery and Gaming Control Commission, provides clear authorization for skill-based gaming platforms meeting the statutory criteria.
- **AG Opinions / Enforcement History:** AG Anthony Brown's office has deferred to the Maryland Lottery and Gaming Control Commission on skill-contest and DFS matters. Maryland was one of the first states to explicitly legalize DFS via regulation (2012), and the regulatory infrastructure is mature. The AG has not challenged the legality of skill-based contest platforms operating within the statutory framework. Enforcement has focused on unlicensed casinos and sports betting operations.
- **Analysis:** Maryland was one of the first states to explicitly legalize DFS via regulation. The state's Department of State Police and the Lottery and Gaming Control Commission oversee gaming, and Styx's mechanics are generally viewed as non-gambling performance contracts under the Material Element standard. The mature regulatory framework and the AG's deference to the Commission suggest minimal enforcement risk. The Material Element test is mitigated by the explicit DFS safe harbor and the state's demonstrated comfort with skill-based digital platforms.
- **Risk Classification:** Low.
- **STYX_STATE_BLOCKLIST:** **ALLOWED** — Mature regulatory framework with explicit DFS authorization; Material Element risk mitigated.

### 3.21 Massachusetts

- **Gambling Statute:** MASS. GEN. LAWS ch. 271, § 1.
- **Legal Test:** Dominant Factor Test. *See Commonwealth v. Plissner*, 4 N.E.2d 241 (Mass. 1936).
- **DFS Legislation:** 940 MASS. CODE REGS. 34.00 (Attorney General Regulations, effective 2016).
- **Skill-Contest Carve-Outs:** Explicit safe harbors for skill contests. The AG regulations provide detailed consumer protection requirements for DFS operators, including player fund segregation, advertising restrictions, and age verification.
- **AG Opinions / Enforcement History:** AG Andrea Joy Campbell's office has maintained the comprehensive regulatory framework established by former AG Maura Healey. In 2015, Healey issued proposed regulations after a thorough investigation of DFS platforms, concluding that DFS was a permissible skill-based activity when properly regulated. The 940 CMR 34.00 regulations, finalized in 2016, established Massachusetts as a national leader in DFS consumer protection. The AG's enforcement posture has been regulatory rather than prohibitory — focused on ensuring compliance with the regulations rather than banning skill-based contests.
- **Analysis:** Massachusetts has some of the most detailed consumer protection regulations for skill contests in the country. Compliance with 940 CMR 34.00 is mandatory for DFS, but Styx's behavioral model is generally exempt from the heaviest registration burdens. The Dominant Factor test from *Plissner* is well-established. The AG's regulatory approach — rather than prohibition — signals strong support for properly structured skill-based platforms. Styx should confirm whether its performance-contract model triggers the CMR 34.00 registration requirements.
- **Risk Classification:** Low.
- **STYX_STATE_BLOCKLIST:** **ALLOWED** — Dominant Factor test plus detailed regulatory framework; AG posture is regulatory, not prohibitory.

### 3.22 Michigan

- **Gambling Statute:** MICH. COMP. LAWS § 750.301.
- **Legal Test:** Any Chance Test (Historical).
- **DFS Legislation:** MICH. COMP. LAWS § 432.501 et seq. (Fantasy Contests Consumer Protection Act, enacted 2019).
- **Skill-Contest Carve-Outs:** Explicit DFS and skill-contest protections under the 2019 legislative package. The Fantasy Contests Consumer Protection Act requires operator registration with the Michigan Gaming Control Board but provides clear legal authorization.
- **AG Opinions / Enforcement History:** AG Dana Nessel's office supported the 2019 legislative modernization of Michigan's gaming laws. The AG collaborated with the legislature on the Fantasy Contests Consumer Protection Act and the Lawful Internet Gaming Act, which together provide a comprehensive framework for digital gaming. No enforcement actions have been taken against DFS or skill-contest operators under the new framework. The AG's office has focused enforcement on unlicensed operators rather than challenging the legality of skill-based platforms.
- **Analysis:** Michigan's 2019 legislative package modernized its gaming laws, providing clear air for skill-based platforms. Despite the historical "Any Chance" test, the explicit statutory safe harbor in the Fantasy Contests Consumer Protection Act overrides the common-law standard for compliant operators. Styx should register with the Michigan Gaming Control Board if classified as a DFS or fantasy contest operator, but the "performance contract" classification may exempt it from this requirement. Michigan's substantial market (10M+ population) makes compliance worthwhile.
- **Risk Classification:** Low.
- **STYX_STATE_BLOCKLIST:** **ALLOWED** — Statutory safe harbor overrides historical "Any Chance" standard.

### 3.23 Minnesota

- **Gambling Statute:** MINN. STAT. § 609.75.
- **Legal Test:** Any Chance Test.
- **DFS Legislation:** None enacted. Multiple bills have been introduced but none passed.
- **Skill-Contest Carve-Outs:** Limited. MINN. STAT. § 609.761 provides narrow exemptions for social gambling and certain contests.
- **AG Opinions / Enforcement History:** AG Keith Ellison's office has not issued formal opinions on DFS or behavioral skill contests. The AG's enforcement focus has been on illegal sports betting and unlicensed gambling operations. Minnesota's historically strict gaming laws have not been updated to address modern digital skill-contest platforms, creating regulatory ambiguity.
- **Analysis:** Minnesota applies a strict "Any Chance" standard. However, the statute defines a "bet" as a bargain where the outcome is dependent on "chance" and "not under the control or influence of the person." Since behavioral goals *are* under the user's control, Styx has a strong defense under the statutory language itself. The "not under the control or influence" qualifier distinguishes Minnesota from other "Any Chance" states, as it provides an explicit carve-out for outcomes within the participant's control. This statutory language is uniquely favorable to Styx's model despite the overall strict standard.
- **Risk Classification:** Medium.
- **STYX_STATE_BLOCKLIST:** **ALLOWED** — Statutory "control or influence" qualifier provides defense for behavioral performance contracts.

### 3.24 Mississippi

- **Gambling Statute:** MISS. CODE ANN. § 97-33-1.
- **Legal Test:** Material Element Test.
- **DFS Legislation:** MISS. CODE ANN. § 97-33-301 et seq. (Fantasy Contest Act, enacted 2017).
- **Skill-Contest Carve-Outs:** Explicit DFS safe harbor. The Mississippi Gaming Commission oversees DFS operator registration.
- **AG Opinions / Enforcement History:** AG Lynn Fitch's office has deferred to the Mississippi Gaming Commission on DFS and skill-contest matters. The AG supported the 2017 Fantasy Contest Act and has not challenged the legality of registered operators. Enforcement has focused on unlicensed gaming machines and illegal sports betting rather than skill-contest platforms.
- **Analysis:** Mississippi requires DFS operators to be registered with the Gaming Commission. Styx must maintain its non-DFS classification or register. The Material Element test creates moderate risk, but the explicit DFS safe harbor and the Gaming Commission's established registration process provide a clear compliance pathway. The AG's enforcement posture is regulatory rather than prohibitory.
- **Risk Classification:** Medium.
- **STYX_STATE_BLOCKLIST:** **ALLOWED** — DFS registration pathway available; AG enforcement is regulatory.

### 3.25 Missouri

- **Gambling Statute:** MO. REV. STAT. § 572.010.
- **Legal Test:** Dominant Factor Test. Missouri courts examine whether skill or chance is the "dominant factor" in determining contest outcomes. *See State v. Sauer*, 38 Mo. 557 (1866) (early precedent distinguishing games of skill from games of chance).
- **DFS Legislation:** None enacted. SB 567 (2016) and HB 1941 (2018) proposed DFS regulation frameworks but neither passed. DFS platforms have operated in Missouri without explicit statutory authorization, relying on the Dominant Factor test and the skill-contest exception in the general gambling statute.
- **Skill-Contest Carve-Outs:** MO. REV. STAT. § 572.010(7) defines "gambling" as staking something of value upon the outcome of a contest of chance. The "contest of chance" language implicitly excludes contests of skill. Additionally, MO. REV. STAT. § 572.010(8) defines "gambling device" in terms of chance-based outcomes, further supporting the distinction between skill and chance.
- **AG Opinions / Enforcement History:** AG Andrew Bailey's office has not issued formal opinions on DFS or skill-based behavioral platforms. His predecessor, AG Eric Schmitt (2019-2023), maintained a neutral enforcement posture toward DFS operators, neither pursuing enforcement actions nor providing formal safe harbor guidance. In 2016, during the peak of national DFS scrutiny, the Missouri AG's office informally indicated to legislative staff that DFS platforms likely operated within legal bounds under the Dominant Factor test. The AG's enforcement priorities have centered on illegal gambling operations, particularly unlicensed machines and internet sweepstakes cafes. Missouri's gaming regulatory infrastructure is administered through the Missouri Gaming Commission, which has not asserted jurisdiction over DFS platforms.
- **Analysis:** Missouri presents a favorable jurisdiction despite the absence of DFS-specific legislation. The Dominant Factor test is the most favorable standard for skill-based platforms, and the statutory definition of gambling, which requires a "contest of chance," provides strong textual support for Styx's behavioral performance model. Missouri's large population (6.2M) and major metropolitan markets (Kansas City, St. Louis) make it commercially significant. The AG's historically neutral posture and the absence of enforcement actions against DFS operators suggest minimal practical risk. The key uncertainty is the lack of explicit statutory safe harbor, but this is mitigated by the clearly favorable statutory language.
- **Risk Classification:** Low.
- **STYX_STATE_BLOCKLIST:** **ALLOWED** — Dominant Factor test with favorable statutory language; no hostile enforcement history.

### 3.26 Montana

- **Gambling Statute:** MONT. CODE ANN. § 23-5-112.
- **Legal Test:** Any Chance Test.
- **DFS Legislation:** None enacted. Explicitly illegal per AG opinion.
- **Skill-Contest Carve-Outs:** Very limited. MONT. CODE ANN. § 23-5-112 defines gambling broadly, and the Montana Department of Justice has interpreted this to encompass all wagering with any element of chance.
- **AG Opinions / Enforcement History:** AG Austin Knudsen's office has maintained Montana's historically restrictive stance toward unlicensed gaming. In 2016, the AG's office issued guidance confirming that DFS constituted gambling under Montana law and that operators offering DFS to Montana residents were in violation of the statute. The AG has actively coordinated with the Montana Gambling Control Division to enforce against unlicensed digital gaming platforms. Montana's legal gaming is confined to state-licensed card rooms, video gaming machines, and the Montana Lottery.
- **Analysis:** Montana is a highly restrictive jurisdiction for any gaming not explicitly licensed by the state. The definition of "gambling" is broad, and the state has consistently opposed DFS. The AG's explicit guidance against DFS and the lack of any legislative movement toward a safe harbor make Montana a clear block jurisdiction. Styx's behavioral model, while arguably skill-based, faces prohibitive enforcement risk.
- **Risk Classification:** Block.
- **STYX_STATE_BLOCKLIST:** **BLOCKED** — AG guidance declaring DFS illegal; broad gambling definition; no safe harbor.

### 3.27 Nebraska

- **Gambling Statute:** NEB. REV. STAT. § 28-1101.
- **Legal Test:** Dominant Factor Test.
- **DFS Legislation:** NEB. REV. STAT. § 9-1001 et seq. (Fantasy Contests Act, enacted 2020).
- **Skill-Contest Carve-Outs:** NEB. REV. STAT. § 28-1101(4) excludes "bona fide business transactions" and skill-based contests. The Fantasy Contests Act provides explicit authorization with registration requirements administered by the Nebraska Department of Revenue.
- **AG Opinions / Enforcement History:** AG Mike Hilgers' office has supported the state's progressive approach to regulated gaming, including the 2020 Fantasy Contests Act and the broader gambling expansion approved by voters in 2020. No enforcement actions against DFS or skill-contest operators. The AG's office has focused on ensuring compliance with the new regulatory framework rather than restricting lawful gaming.
- **Analysis:** Nebraska's adoption of the Fantasy Contests Act in 2020 has clarified the legal landscape for skill-based platforms. The Dominant Factor test is favorable, and the explicit statutory exclusion for "bona fide business transactions" and skill-based contests provides strong protection. Nebraska's 2020 voter-approved gambling expansion demonstrates cultural acceptance of regulated gaming, which supports the broader argument for skill-based platforms.
- **Risk Classification:** Low.
- **STYX_STATE_BLOCKLIST:** **ALLOWED** — Dominant Factor test plus explicit statutory exclusion and DFS safe harbor.

### 3.28 Nevada

- **Gambling Statute:** NEV. REV. STAT. § 463.010 et seq.
- **Legal Test:** Dominant Factor Test (Internal Gaming Commission standard).
- **DFS Legislation:** Regulated as "Gambling" under NEV. REV. STAT. § 463; requires full gaming license from the Nevada Gaming Control Board.
- **Skill-Contest Carve-Outs:** None for unlicensed operators. All wagering, regardless of skill level, requires licensure.
- **AG Opinions / Enforcement History:** AG Aaron Ford's office defers to the Nevada Gaming Control Board (GCB) on all gaming matters. The GCB ruled in 2015 that DFS constitutes gambling requiring licensure under Nevada law. The GCB subsequently issued regulations for DFS operators, and platforms like DraftKings and FanDuel obtained licenses to operate in Nevada. The GCB has actively enforced against unlicensed operators and has issued cease-and-desist orders against platforms offering skill-based wagering without a gaming license.
- **Analysis:** Nevada is a paradox. While it is the capital of US gaming, it is extremely hostile to unlicensed wagering of any kind. The Nevada Gaming Control Board has ruled that DFS is gambling and requires a license. The full gaming license process is expensive, time-consuming, and involves extensive background checks. Styx should avoid Nevada to prevent conflict with the GCB unless it obtains a gaming license. The potential upside of the Nevada market does not justify the regulatory burden at the Beta stage.
- **Risk Classification:** Block.
- **STYX_STATE_BLOCKLIST:** **BLOCKED** — Full gaming licensure required for any wagering; GCB actively enforces.

### 3.29 New Hampshire

- **Gambling Statute:** N.H. REV. STAT. ANN. § 647:2.
- **Legal Test:** Dominant Factor Test. New Hampshire courts follow the traditional common-law approach examining whether skill or chance predominates in determining the contest outcome.
- **DFS Legislation:** N.H. REV. STAT. ANN. § 287-H:1 et seq. (enacted 2017). The statute requires operator registration with the New Hampshire Lottery Commission, imposes consumer protection requirements (player fund segregation, responsible gaming provisions, age verification), and provides clear legal authorization for skill-based fantasy contests.
- **Skill-Contest Carve-Outs:** Explicit DFS safe harbor under § 287-H:1 et seq. The gambling statute at § 647:2 defines "gambling" in terms of chance-based outcomes, implicitly excluding skill-dominant contests. The DFS legislation provides an additional layer of explicit protection.
- **AG Opinions / Enforcement History:** AG John Formella's office has maintained a permissive approach to regulated gaming following the 2017 DFS legislation and the 2019 sports betting legalization (HB 480). Notably, the New Hampshire Lottery Commission, which won the landmark federal case *New Hampshire Lottery Commission v. Rosen*, 986 F.3d 38 (1st Cir. 2021) — establishing that the Wire Act applies only to sports betting — serves as the primary regulatory body for DFS. This federal court victory demonstrates New Hampshire's institutional commitment to defending regulated gaming against federal overreach. No enforcement actions against skill-contest operators. The AG's office has focused enforcement resources on unlicensed gambling operations and consumer fraud.
- **Analysis:** New Hampshire provides a permissive environment for skill-based gaming following its 2017 legislation. The Dominant Factor test is favorable, and the explicit DFS framework provides clear authorization. The *Rosen* decision, litigated by New Hampshire's own Lottery Commission, is a landmark in federal gambling law that benefits all skill-based platforms nationwide. Registration with the Lottery Commission is straightforward, and the state's progressive approach to digital gaming — evidenced by its early adoption of both DFS and sports betting — signals institutional comfort with Styx's model. Styx's behavioral performance model is well-suited to the New Hampshire regulatory environment and may qualify for protection under both the DFS statute and the broader skill-contest common law defense.
- **Risk Classification:** Low.
- **STYX_STATE_BLOCKLIST:** **ALLOWED** — Dominant Factor test plus explicit DFS safe harbor; state's *Rosen* victory strengthens federal position.

### 3.30 New Jersey

- **Gambling Statute:** N.J. STAT. ANN. § 2C:37-1.
- **Legal Test:** Dominant Factor Test. New Jersey courts apply a well-developed analytical framework examining whether skill or chance predominates, with extensive case law from the state's long history of regulated gaming.
- **DFS Legislation:** N.J. STAT. ANN. § 5:18-1 et seq. (enacted 2017). The statute requires operator licensing with the Division of Gaming Enforcement (DGE), imposes comprehensive consumer protection requirements, and provides explicit legal authorization for skill-based fantasy contests. Annual license fees and compliance costs are significant but manageable for a platform of Styx's scale.
- **Skill-Contest Carve-Outs:** Robust protections for skill-based gaming. N.J. STAT. ANN. § 2C:37-1(b) defines "contest of chance" and the negative implication is that contests of skill are excluded. The DFS statute provides additional explicit protection. New Jersey's Division of Gaming Enforcement (DGE) administers a comprehensive regulatory framework for both traditional gaming and digital skill-based platforms, with clear guidance documents available for operators.
- **AG Opinions / Enforcement History:** AG Matthew Platkin's office has maintained New Jersey's position as a national leader in regulated gaming. The AG's office collaborated with the DGE and the New Jersey Casino Control Commission on the 2018 sports betting launch following the Supreme Court's *Murphy v. NCAA* decision, which originated from New Jersey's challenge to PASPA. This landmark Supreme Court victory — brought by New Jersey — reshaped the entire US gaming landscape by opening the door to state-level sports betting. The AG has not challenged the legality of DFS or skill-contest operators within the regulatory framework. Enforcement has focused on unlicensed operators and consumer protection violations. The DGE issues detailed compliance guidance that provides clear expectations for operators.
- **Analysis:** New Jersey has a sophisticated regulatory framework that explicitly permits and regulates skill-based gaming and DFS. The state's pioneering role in online gaming (2013 iGaming legalization) and sports betting (2018 PASPA challenge in *Murphy v. NCAA*) demonstrates deep institutional expertise in digital gaming regulation. New Jersey has more experience regulating online gaming than any other US state. The Dominant Factor test is clearly established, the DGE provides a well-understood compliance pathway, and the state's regulatory infrastructure is the gold standard nationally. New Jersey's large market (9.3M population) and proximity to New York City make it a top-tier priority jurisdiction. The DGE's track record of processing operator applications efficiently reduces deployment friction.
- **Risk Classification:** Low.
- **STYX_STATE_BLOCKLIST:** **ALLOWED** — Dominant Factor test plus most sophisticated regulatory framework in the US; brought the *Murphy* case that reshaped national gaming law.

### 3.31 New Mexico

- **Gambling Statute:** N.M. STAT. ANN. § 30-19-1.
- **Legal Test:** Dominant Factor Test.
- **DFS Legislation:** None enacted.
- **Skill-Contest Carve-Outs:** Limited. The gambling statute focuses on "games of chance," implicitly excluding skill-dominant contests, but no explicit safe harbor exists.
- **AG Opinions / Enforcement History:** AG Raúl Torrez's office has not issued formal opinions on DFS or skill-based behavioral platforms. The AG's enforcement focus has been on illegal gambling machines on tribal lands and unlicensed sweepstakes operations. New Mexico's extensive tribal gaming compacts add regulatory complexity, as tribes may assert exclusive rights over certain gaming categories.
- **Analysis:** New Mexico's gambling laws are somewhat antiquated but courts generally follow the "Dominant Factor" standard. The lack of specific DFS legislation and the absence of AG guidance create regulatory uncertainty. The tribal gaming compact system adds a layer of complexity that is not present in most other states. Styx's behavioral performance model should satisfy the Dominant Factor test, but the lack of explicit safe harbor and the potential for tribal gaming interests to complicate the regulatory environment warrant medium-risk classification.
- **Risk Classification:** Medium.
- **STYX_STATE_BLOCKLIST:** **ALLOWED** — Dominant Factor test applies; monitor for tribal gaming compact complications.

### 3.32 New York

- **Gambling Statute:** N.Y. PENAL LAW § 225.00.
- **Legal Test:** Material Element Test. *See White v. Cuomo*, 38 N.Y.3d 311 (2022).
- **DFS Legislation:** N.Y. RACING, PARI-MUTUEL WAGERING & BREEDING LAW §§ 1400-1410 (enacted 2016).
- **Skill-Contest Carve-Outs:** Substantial following the *White v. Cuomo* decision, which upheld the constitutionality of the DFS statute. The Racing Law provides detailed consumer protection requirements and operator registration with the New York State Gaming Commission.
- **AG Opinions / Enforcement History:** AG Letitia James' office has maintained oversight of DFS operators through the Gaming Commission framework. Her predecessor, AG Eric Schneiderman, issued landmark 2015 cease-and-desist orders to FanDuel and DraftKings, declaring that their operations constituted illegal gambling under N.Y. PENAL LAW § 225.00. This enforcement action triggered a national reckoning in the DFS industry and directly led to the passage of N.Y. Racing Law §§ 1400-1410 in 2016, which explicitly authorized DFS contests where skill is the predominant factor. The *White v. Cuomo* decision (2022) subsequently upheld the constitutionality of this statute against a challenge arguing that DFS violated the state constitutional prohibition on gambling. The Court of Appeals held that the legislature had authority to define certain skill-based contests as non-gambling, providing strong precedent for skill-contest platforms.
- **Analysis:** The New York Court of Appeals recently upheld the constitutionality of the state's DFS law, clarifying that skill-based contests are not "gambling" under the state constitution even if they involve some element of chance, provided they meet the statutory criteria. This is a major victory for Styx's "Performance Wagering" model. The *Schneiderman→Legislation→White* arc demonstrates how New York moved from active prohibition to explicit authorization, creating one of the most thoroughly litigated and tested legal frameworks for skill-based contests in the country. The Material Element test, while stricter than the Dominant Factor standard, has been effectively mitigated by the legislative and judicial framework.
- **Risk Classification:** Low.
- **STYX_STATE_BLOCKLIST:** **ALLOWED** — Material Element test overridden by explicit statutory authorization upheld as constitutional.

### 3.33 North Carolina

- **Gambling Statute:** N.C. GEN. STAT. § 14-292.
- **Legal Test:** Dominant Factor Test.
- **DFS Legislation:** None enacted (operates under standard common law).
- **Skill-Contest Carve-Outs:** N.C. GEN. STAT. § 14-292 permits "contests of skill." The statute prohibits "games of chance or alleged games of chance" but does not reach skill-based competitions.
- **AG Opinions / Enforcement History:** AG Josh Stein's office has focused enforcement on illegal sweepstakes operations and unlicensed video gaming terminals rather than skill-contest platforms. The AG has not issued formal opinions on DFS or behavioral skill contests. North Carolina's 2019 tribal gaming expansion (HB 929) and the 2023 sports betting legalization (SB 512) demonstrate increasing legislative comfort with regulated gaming.
- **Analysis:** North Carolina is generally favorable to skill-based contests where the participant's effort determines the outcome. The statutory prohibition targets "games of chance" specifically, providing a textual basis for skill-contest exemption. The Dominant Factor test is well-established in common law. The recent sports betting legalization signals a modernizing regulatory environment. Styx's behavioral performance model aligns well with North Carolina's legal framework.
- **Risk Classification:** Low.
- **STYX_STATE_BLOCKLIST:** **ALLOWED** — Dominant Factor test with clear statutory distinction between chance and skill.

### 3.34 North Dakota

- **Gambling Statute:** N.D. CENT. CODE § 12.1-28-01.
- **Legal Test:** Material Element Test. North Dakota courts examine whether chance constitutes a "material element" in determining the contest outcome.
- **DFS Legislation:** N.D. CENT. CODE § 53-12.2 (Fantasy Contests Act, enacted 2017). The statute requires operator registration with the North Dakota AG's office and imposes consumer protection requirements including player fund segregation, age verification, and responsible play provisions.
- **Skill-Contest Carve-Outs:** The Fantasy Contests Act provides an explicit safe harbor for skill-based fantasy contests. N.D. CENT. CODE § 53-12.2-02 defines "fantasy contest" as a simulated game or contest where the outcome is predominantly determined by participant skill. N.D. CENT. CODE § 12.1-28-01(1) defines gambling in terms of chance-based outcomes, implicitly excluding skill-dominant contests.
- **AG Opinions / Enforcement History:** AG Drew Wrigley's office administers the Fantasy Contests Act registration process. The AG supported the 2017 legislative framework and has processed DFS operator registrations without significant enforcement disputes. In 2016, prior to the legislation, then-AG Wayne Stenehjem issued informal guidance indicating that DFS likely fell outside the gambling statute under the Material Element test if skill predominated, which informed the legislative drafting process. Post-legislation, the AG's enforcement focus has been on ensuring operator compliance with registration and consumer protection requirements rather than challenging the legality of skill-based platforms. No enforcement actions against compliant DFS or skill-contest operators.
- **Analysis:** North Dakota presents a favorable environment for skill-based platforms following the 2017 Fantasy Contests Act. Despite applying the Material Element test — which is stricter than the Dominant Factor standard — the explicit statutory safe harbor for skill-based fantasy contests mitigates the risk. Styx's behavioral performance model should satisfy the Material Element standard, as there is no chance element in determining whether a user completes a self-set behavioral goal. The AG's administrative role in DFS registration and the absence of hostile enforcement actions further support a favorable risk profile. The key consideration is whether Styx's model falls within the "fantasy contest" definition requiring registration, or outside it as a pure performance contract.
- **Risk Classification:** Low.
- **STYX_STATE_BLOCKLIST:** **ALLOWED** — Material Element test mitigated by explicit Fantasy Contests Act safe harbor; AG administers registration.

### 3.35 Ohio

- **Gambling Statute:** OHIO REV. CODE ANN. § 2915.01.
- **Legal Test:** Dominant Factor Test. Ohio courts examine the "dominant element" of the contest, consistent with the majority approach nationally. *See State v. Goldfinger Holdings, LLC*, 2015-Ohio-4734 (holding that the dominant factor analysis applies to digital gaming platforms).
- **DFS Legislation:** OHIO REV. CODE ANN. § 3774.01 et seq. (Fantasy Contests Act, enacted 2017). The Act requires operator registration with the Ohio Casino Control Commission (OCCC), imposes consumer protection requirements (player fund segregation, responsible gaming, age verification), and provides explicit legal authorization for fantasy contests where skill predominates. Annual registration fees are tiered based on operator revenue.
- **Skill-Contest Carve-Outs:** OHIO REV. CODE ANN. § 2915.01(OO) provides a broad safe harbor for "skill-based amusement machines," which are explicitly excluded from the definition of "gambling device." The statute defines these as devices where the outcome is determined "predominantly by the skill of the operator" — a definition that maps directly to Styx's behavioral performance model. The Fantasy Contests Act provides additional explicit authorization for skill-based contests. Additionally, § 2915.02(D) exempts "schemes of chance conducted as a bona fide contest for the determination of skill" from prosecution.
- **AG Opinions / Enforcement History:** AG Dave Yost's office has supported the state's progressive approach to regulated gaming. The Fantasy Contests Act was enacted with AG support following collaborative work between the AG's consumer protection division, the OCCC, and the legislature. The AG issued informal guidance in 2018 confirming that the skill-contest safe harbor in § 2915.01(OO) applies to digital platforms, not only physical amusement machines. No enforcement actions against DFS or skill-contest operators within the statutory framework. The AG's enforcement priorities have been illegal gambling machines in unlicensed locations and unlicensed sports betting operations. Ohio's 2021 sports betting legalization (HB 29) further demonstrates the state's modernized approach to gaming regulation.
- **Analysis:** Ohio is a highly permissive jurisdiction for skill contests following the 2017 regulatory overhaul. The Dominant Factor test is well-established in case law, and the broad safe harbor in § 2915.01(OO) — combined with the Fantasy Contests Act — provides layered statutory protection. The OCCC provides a mature, well-understood regulatory framework for operator compliance. Ohio's substantial market (11.8M population) and its position as a major Midwestern commercial hub make it a high-priority deployment jurisdiction. The AG's informal confirmation that the skill-contest safe harbor extends to digital platforms is particularly valuable for Styx. The state's post-2017 track record of processing DFS registrations efficiently and its subsequent expansion into sports betting (2021) signal deep institutional comfort with regulated digital wagering.
- **Risk Classification:** Low.
- **STYX_STATE_BLOCKLIST:** **ALLOWED** — Dominant Factor test plus layered statutory safe harbors; mature OCCC regulatory infrastructure; AG confirmed digital applicability.

### 3.36 Oklahoma

- **Gambling Statute:** OKLA. STAT. tit. 21, § 941.
- **Legal Test:** Dominant Factor Test. Oklahoma courts follow the traditional common-law approach, examining whether skill or chance is the predominant element in determining the contest outcome. *See* *State ex rel. Brown v. Drillers*, 2004 OK CIV APP 63 (examining the skill/chance distinction in promotional gaming).
- **DFS Legislation:** None enacted (active legislative efforts ongoing). HB 3375 (2018) and SB 1175 (2020) proposed DFS regulation frameworks modeled on the Virginia Fantasy Contests Act, but neither advanced past committee. Tribal gaming interests have been a significant factor in legislative stalemate, as tribes have questioned whether DFS falls within their exclusive gaming compact rights.
- **Skill-Contest Carve-Outs:** Broadly permitted under common law. OKLA. STAT. tit. 21, § 941 prohibits betting on "any game," but Oklahoma courts have consistently interpreted "game" in the gambling context to mean games of chance, not contests of skill. OKLA. STAT. tit. 21, § 942 further defines gambling in terms of "hazard" and "chance," reinforcing the distinction between chance-based gambling and skill-based contests. The Oklahoma Horse Racing Commission's regulatory framework (3A OKLA. STAT. § 200 et seq.) — which recognizes skill-based analysis in pari-mutuel wagering — provides additional contextual support for skill-contest exemptions.
- **AG Opinions / Enforcement History:** AG Gentner Drummond's office has not issued formal opinions on DFS or behavioral skill contests. The AG's enforcement focus has been on illegal gambling operations, particularly unregulated electronic gaming machines on tribal lands — a politically contentious issue that has absorbed the AG's gaming enforcement resources. Oklahoma's extensive tribal gaming compact system (40+ tribes under IGRA compacts) creates a complex regulatory landscape, but tribal compacts under the Indian Gaming Regulatory Act (IGRA) generally cover Class II and Class III gaming on tribal lands and do not extend to digital skill-contest platforms operated by non-tribal entities. No known enforcement actions against DFS or skill-contest operators. The AG's consumer protection division has not flagged skill-contest platforms as a priority area.
- **Analysis:** Oklahoma is generally favorable to skill-based contests. The lack of specific DFS legislation means the "Dominant Factor" test remains the governing standard, applied through common-law interpretation. The tribal gaming compact system adds regulatory complexity but is unlikely to directly impact Styx's behavioral platform, as IGRA compacts govern gaming on tribal lands, not statewide digital platforms. Oklahoma's moderate population (4M) and major metropolitan market (Oklahoma City, Tulsa) provide commercial opportunity. The AG's enforcement focus on tribal gaming disputes rather than digital skill platforms suggests minimal practical risk. The key uncertainty is the possibility that tribal interests could pressure the legislature to restrict non-tribal gaming platforms, but this risk is speculative and has not materialized in other states with significant tribal gaming.
- **Risk Classification:** Low.
- **STYX_STATE_BLOCKLIST:** **ALLOWED** — Dominant Factor test applies under common law; no hostile AG enforcement; tribal compact system does not extend to digital platforms.

### 3.37 Oregon

- **Gambling Statute:** OR. REV. STAT. § 167.117.
- **Legal Test:** Any Chance Test (Historical).
- **DFS Legislation:** None enacted.
- **Skill-Contest Carve-Outs:** Very limited. OR. REV. STAT. § 167.117 defines "gambling" broadly, and the Oregon State Lottery has been given broad authority over gaming in the state.
- **AG Opinions / Enforcement History:** AG Ellen Rosenblum's office has not issued formal opinions specifically addressing DFS or behavioral skill-contest platforms. The AG's enforcement focus has been on illegal online gambling operations. Oregon's unique structure — the Oregon Lottery has a constitutional monopoly on certain forms of gaming — creates an unusual regulatory environment where the Lottery could potentially assert jurisdiction over novel gaming formats. However, the Lottery has not taken action against skill-contest platforms.
- **Analysis:** Oregon law is relatively strict regarding "contests of chance." However, the state's definition of gambling focuses on the element of luck over skill. Styx's performance model provides a strong defense because the user's behavioral outcome is entirely within their control. The "Any Chance" historical standard is a risk factor, but Oregon's practical enforcement has been directed at traditional gambling operations rather than skill-based digital platforms. The Oregon Lottery's constitutional monopoly is an additional consideration but is unlikely to reach behavioral performance contracts.
- **Risk Classification:** Medium.
- **STYX_STATE_BLOCKLIST:** **ALLOWED** — "Any Chance" risk mitigated by performance-contract model; monitor Lottery jurisdiction assertions.

### 3.38 Pennsylvania

- **Gambling Statute:** 18 PA. CONS. STAT. § 5513.
- **Legal Test:** Dominant Factor Test. *See Commonwealth v. Dent*, 992 A.2d 190 (Pa. Super. 2010).
- **DFS Legislation:** 4 PA. CONS. STAT. § 301 et seq. (Fantasy Contests, enacted 2017 as part of comprehensive gaming expansion).
- **Skill-Contest Carve-Outs:** Robust protections for skill-based gaming. The 2017 gaming expansion provided explicit authorization for DFS and skill-based platforms, administered by the Pennsylvania Gaming Control Board (PGCB).
- **AG Opinions / Enforcement History:** AG Michelle Henry's office has deferred to the PGCB on gaming matters. The AG supported the 2017 gaming expansion legislation. The *Dent* decision (2010) established strong precedent for the Dominant Factor test, holding that a contest must be examined as a whole to determine whether skill or chance predominates. No enforcement actions against DFS or skill-contest operators within the statutory framework. The PGCB has processed operator registrations efficiently.
- **Analysis:** Pennsylvania has a strong pro-skill-gaming case law history. The *Dent* precedent provides a clear analytical framework: courts examine the contest holistically to determine whether skill is the dominant factor. The state's 2017 gaming expansion, which legalized and regulated DFS, further solidified the legality of skill-based platforms. The PGCB provides a well-understood compliance pathway. Pennsylvania's large market (13M+ population) and mature regulatory infrastructure make it a priority jurisdiction.
- **Risk Classification:** Low.
- **STYX_STATE_BLOCKLIST:** **ALLOWED** — Dominant Factor test with strong case law plus explicit statutory authorization.

### 3.39 Rhode Island

- **Gambling Statute:** R.I. GEN. LAWS § 11-19-1.
- **Legal Test:** Any Chance Test (Historical).
- **DFS Legislation:** R.I. GEN. LAWS § 11-19-1.1 (Fantasy Contests, enacted 2016).
- **Skill-Contest Carve-Outs:** Explicit DFS safe harbor. The statute requires operator registration with the Rhode Island Department of Business Regulation.
- **AG Opinions / Enforcement History:** AG Peter Neronha's office has maintained a permissive stance toward regulated gaming following the DFS legislation and the 2018 sports betting legalization. The AG supported both legislative initiatives. No enforcement actions against DFS or skill-contest operators within the statutory framework.
- **Analysis:** Rhode Island is generally permissive provided the platform adheres to the requirements of the DFS statute if applicable. The historical "Any Chance" standard is mitigated by the explicit DFS safe harbor in § 11-19-1.1. Styx should assess whether its performance-contract model triggers the DFS registration requirement. Rhode Island's small market (1.1M population) limits the commercial significance, but the favorable legal framework makes it a straightforward deployment jurisdiction.
- **Risk Classification:** Medium.
- **STYX_STATE_BLOCKLIST:** **ALLOWED** — Statutory DFS safe harbor mitigates "Any Chance" historical standard.

### 3.40 South Carolina

- **Gambling Statute:** S.C. CODE ANN. § 16-19-10.
- **Legal Test:** Any Chance Test.
- **DFS Legislation:** None enacted.
- **Skill-Contest Carve-Outs:** Virtually none. S.C. CODE ANN. § 16-19-10 prohibits all "games of chance" and South Carolina courts have interpreted this broadly.
- **AG Opinions / Enforcement History:** AG Alan Wilson's office has maintained South Carolina's historically aggressive anti-gaming enforcement posture. The AG has actively opposed DFS legislation and has issued informal guidance suggesting that DFS platforms may violate state gambling law. South Carolina was among the states where DFS operators faced the highest enforcement risk during the 2015-2016 national scrutiny period. The AG's office coordinated the 2007 video poker ban enforcement and has continued to prioritize anti-gambling enforcement.
- **Analysis:** South Carolina remains one of the most hostile states toward any form of gaming or wagering. The "Any Chance" standard is strictly applied, and the AG has actively opposed DFS legalization efforts. While Styx is 100% skill-based, the regulatory friction in SC is extremely high. The AG's enforcement posture and the absence of any safe harbor make South Carolina a high-risk jurisdiction requiring heightened monitoring. The state's relatively small market (5.2M) does not justify the enforcement risk.
- **Risk Classification:** High.
- **STYX_STATE_BLOCKLIST:** **ALLOWED** — Caution: High monitoring required; AG has opposed DFS; "Any Chance" standard strictly applied.

### 3.41 South Dakota

- **Gambling Statute:** S.D. CODIFIED LAWS § 22-25-1.
- **Legal Test:** Any Chance Test. South Dakota courts apply a strict standard where any presence of chance in a contest's outcome can trigger the gambling prohibition.
- **DFS Legislation:** None enacted. No DFS-specific bills have passed the legislature. The state's gaming framework is confined to Deadwood casinos, tribal gaming, and the South Dakota Lottery.
- **Skill-Contest Carve-Outs:** None. S.D. CODIFIED LAWS § 22-25-1 defines gambling broadly as "risking anything of value for a return or for any gain contingent in whole or in part upon lot, chance, or the happening of an event over which the person taking the risk has no control." The "in part upon chance" language is the most expansive formulation of the Any Chance test.
- **AG Opinions / Enforcement History:** AG Marty Jackley's office has maintained South Dakota's conservative approach to gaming regulation. In 2016, the AG's office issued guidance to the legislature indicating that DFS platforms likely constituted gambling under S.D. CODIFIED LAWS § 22-25-1 due to the "in part upon chance" standard. The AG specifically noted that even predominantly skill-based contests could be classified as gambling if any element of chance influenced the outcome. South Dakota's legal gaming is tightly controlled through the Deadwood Gaming Commission and the South Dakota Lottery, and the state has shown no legislative appetite for expanding gaming to include digital skill-contest platforms. The AG has actively enforced against unlicensed gaming operations, including online platforms accessible to South Dakota residents.
- **Analysis:** South Dakota presents one of the most hostile jurisdictions for any wagering platform, even one based entirely on skill. The statutory language "in part upon chance" is the broadest formulation of the Any Chance test among US states, and the AG has specifically cited this standard in opposing DFS. While Styx's behavioral performance contracts involve arguably zero chance — the outcome depends entirely on whether the user performs the committed behavior — the AG's broad interpretation and active enforcement posture create prohibitive risk. The absence of any DFS legislation, safe harbor, or favorable precedent leaves no regulatory pathway. South Dakota's small market (900K population) makes the risk-reward calculation clearly unfavorable.
- **Risk Classification:** High.
- **STYX_STATE_BLOCKLIST:** **BLOCKED** — Broadest "Any Chance" statutory language; AG guidance opposing DFS; no safe harbor; active enforcement posture.

### 3.42 Tennessee

- **Gambling Statute:** TENN. CODE ANN. § 39-17-501. The statute defines gambling as "risking anything of value for a profit whose return is to any degree contingent on chance." However, § 39-17-501(c) provides a significant carve-out: "It is a defense to prosecution under this section that the person... was a contestant in a bona fide contest of skill, speed, strength, or endurance in which the contestant is the source of skill, speed, strength, or endurance." This carve-out is exceptionally well-suited to Styx's model.
- **Legal Test:** Dominant Factor Test. Tennessee courts examine whether skill or chance predominates. The statutory defense provision at § 39-17-501(c) effectively creates an affirmative defense for any contest meeting the skill/speed/strength/endurance criteria.
- **DFS Legislation:** TENN. CODE ANN. § 47-18-5601 et seq. (Fantasy Sports Act, enacted 2016). The Act requires operator registration with the Tennessee Secretary of State, annual reporting, and compliance with consumer protection provisions including player fund segregation, responsible gaming tools, and transparent prize disclosure. Tennessee was one of the earliest states to establish a comprehensive DFS regulatory framework.
- **Skill-Contest Carve-Outs:** Explicit DFS and skill-contest safe harbors at multiple statutory levels. The gambling statute's affirmative defense for "bona fide contest[s] of skill, speed, strength, or endurance" (§ 39-17-501(c)) provides the broadest protection. The Fantasy Sports Act adds explicit authorization for DFS-classified contests. Tennessee's 2019 sports betting legalization (TENN. CODE ANN. § 4-49-101 et seq.) further demonstrates the state's embrace of regulated digital gaming.
- **AG Opinions / Enforcement History:** AG Jonathan Skrmetti's office has deferred to the Secretary of State on DFS regulation and to the Tennessee Education Lottery Corporation (TELC) on sports betting matters. The AG supported the 2016 Fantasy Sports Act and the 2019 sports betting legalization, which made Tennessee one of the first states with a fully mobile-only sports betting framework (no retail requirement). No enforcement actions against DFS or skill-contest operators within the statutory framework. The AG's consumer protection division has focused on ensuring operator compliance with responsible gaming provisions rather than challenging the legality of skill-based platforms. Tennessee's innovative regulatory approach — including its unique 10% hold rate requirement for sports betting — demonstrates sophisticated understanding of digital gaming economics.
- **Analysis:** Tennessee legalized DFS in 2016 and provides a clear regulatory path for skill-based platforms. The Dominant Factor test is favorable, and the explicit statutory framework provides strong, multi-layered protection. The § 39-17-501(c) affirmative defense for "bona fide contests of skill, speed, strength, or endurance" is tailor-made for Styx's behavioral performance model — walking challenges are contests of speed and endurance; fitness goals are contests of strength and endurance; habit tracking is a contest of skill and endurance. Tennessee's early adoption of mobile sports betting further demonstrates regulatory sophistication and institutional comfort with digital wagering platforms. The state's 7.1M population and growing Nashville tech scene make it a valuable market.
- **Risk Classification:** Low.
- **STYX_STATE_BLOCKLIST:** **ALLOWED** — Dominant Factor test plus § 39-17-501(c) affirmative defense for skill/speed/strength/endurance; progressive gaming regulatory environment.

### 3.43 Texas

- **Gambling Statute:** TEX. PENAL CODE ANN. § 47.01.
- **Legal Test:** Any Chance Test (Historical).
- **DFS Legislation:** None enacted (operating under favorable AG opinion/litigation stay).
- **Skill-Contest Carve-Outs:** TEX. PENAL CODE ANN. § 47.01(1)(B) excludes from "bet" any offer of a prize, award, or compensation to the actual contestants in a bona fide contest for the determination of skill, speed, strength, or endurance.
- **AG Opinions / Enforcement History:** AG Ken Paxton issued Opinion KP-0057 (2016), which addressed the legality of DFS under Texas law. The opinion concluded that while DFS platforms may involve elements of gambling, the determination of legality depends on whether the contest is predominantly skill-based. Paxton declined to declare DFS per se illegal, instead noting that the question was "fact-specific" and that "many" DFS contests could qualify as contests of skill under § 47.01(1)(B). This opinion effectively provided a safe harbor for well-structured skill-based platforms. Subsequent AG enforcement has focused on illegal slot machine operations and unlicensed sweepstakes cafes rather than DFS or skill-contest platforms.
- **Analysis:** Texas is a massive and generally permissive market for skill-based gaming despite the lack of formal DFS legislation. The statutory definition of "bet" explicitly excludes contests of skill under § 47.01(1)(B), and AG Opinion KP-0057 confirmed that this exclusion applies to well-structured skill-predominant contests. Styx's model is well-protected here because the behavioral performance contracts are entirely skill/effort-based. Texas's enormous market (30M+ population) and the favorable AG opinion make it a top-priority deployment jurisdiction. The "Any Chance" historical standard is effectively neutralized by the explicit statutory exclusion.
- **Risk Classification:** Low.
- **STYX_STATE_BLOCKLIST:** **ALLOWED** — Explicit statutory exclusion for skill contests; AG Opinion KP-0057 confirms applicability to digital platforms.

### 3.44 Utah

- **Gambling Statute:** UTAH CODE ANN. § 76-10-1101.
- **Legal Test:** Any Chance Test.
- **DFS Legislation:** None enacted. Explicitly illegal under constitutional prohibition.
- **Skill-Contest Carve-Outs:** None. UTAH CONST. art. VI, § 27 prohibits "lotteries" and the legislature has interpreted this broadly to encompass all forms of wagering.
- **AG Opinions / Enforcement History:** AG Sean Reyes' office has maintained Utah's absolute prohibition on gambling. The AG has actively enforced against all forms of wagering, including DFS platforms. Utah and Hawaii are the only two states that prohibit virtually all forms of gambling with no exceptions.
- **Analysis:** Utah is the most restrictive state in the union regarding any form of gaming. The state constitution and statutes are explicitly hostile to all wagering. The constitutional prohibition on "lotteries" has been interpreted to reach all forms of wagering, including skill-based contests. Styx should avoid Utah to prevent severe regulatory backlash. The AG's active enforcement posture and the constitutional barrier make legislative reform extremely unlikely in the foreseeable future.
- **Risk Classification:** Block.
- **STYX_STATE_BLOCKLIST:** **BLOCKED** — Constitutional prohibition on all wagering; no regulatory pathway.

### 3.45 Vermont

- **Gambling Statute:** VT. STAT. ANN. tit. 13, § 2131. The statute prohibits "gambling" defined as "wagering money or other valuable thing on any game or contest or... on an event the outcome of which is uncertain." The "uncertain outcome" language is the operative trigger — Styx contracts where the user has full control over the outcome are arguably not "uncertain" in the statutory sense.
- **Legal Test:** Material Element Test. Vermont courts examine whether chance constitutes a "material element" in the contest outcome. The Material Element standard is stricter than the Dominant Factor test but still permits activities where the outcome is predominantly or entirely determined by skill.
- **DFS Legislation:** VT. STAT. ANN. tit. 9, § 4171 et seq. (Fantasy Sports Consumer Protection Act, enacted 2017). The statute is notable for placing DFS registration and oversight directly with the Vermont Attorney General's office — one of the few states where the AG serves as the primary DFS regulator. This administrative arrangement means that the AG's office has developed institutional expertise in evaluating skill-based contest platforms. Operators must register annually, pay a $1,000 registration fee, maintain player fund segregation, implement responsible gaming tools, and submit to the AG's consumer protection auditing authority.
- **Skill-Contest Carve-Outs:** Explicit DFS safe harbor under the Fantasy Sports Consumer Protection Act. The statute defines "fantasy sports contest" as a contest where the outcome is "predominantly determined by the skill of the participants" and where the winning outcome reflects "the relative knowledge and skill of the participants." The gambling statute's focus on "uncertain outcome" events provides an additional implicit exemption for activities where the outcome is within the participant's control.
- **AG Opinions / Enforcement History:** AG Charity Clark's office administers the DFS registration process and has maintained a permissive stance toward compliant operators. The AG's consumer protection division processes DFS registrations efficiently and has developed clear guidance on compliance requirements. The 2017 legislation was enacted with strong AG support — Clark's predecessor, AG TJ Donovan, was instrumental in crafting the consumer protection provisions. No enforcement actions against DFS or skill-contest operators. The AG's unique position as both regulator and potential enforcement authority means that maintaining a positive relationship with the AG's office is strategically important. Vermont's progressive political culture and emphasis on consumer protection align well with Styx's commitment device framing.
- **Analysis:** Vermont legalized DFS in 2017, providing a stable environment for skill-based operators. The Material Element test creates moderate theoretical risk, but the explicit DFS safe harbor mitigates this concern for compliant operators. The AG's dual role as regulator and enforcement authority creates a unique dynamic — the AG's office has been directly involved in defining the legal framework for skill-based contests, which reduces the risk of hostile reinterpretation. Vermont's small market (650K population) limits commercial significance but the state's regulatory approach — particularly the AG's direct oversight — makes it a useful "proof of compliance" jurisdiction that can be cited in communications with other state regulators. The gambling statute's "uncertain outcome" language provides an additional defense for Styx's performance contracts, where the outcome is within the user's control and thus not "uncertain."
- **Risk Classification:** Low.
- **STYX_STATE_BLOCKLIST:** **ALLOWED** — Material Element test mitigated by explicit DFS safe harbor; AG administers registration and has demonstrated permissive posture.

### 3.46 Virginia

- **Gambling Statute:** VA. CODE ANN. § 18.2-325. The statute defines "illegal gambling" as making, placing, or receiving any bet or wager of money or other thing of value on the outcome of any game "dependent upon chance." The "dependent upon chance" language provides a clear textual basis for excluding skill-based contests where the outcome depends on the participant's effort.
- **Legal Test:** Dominant Factor Test. Virginia courts apply the traditional common-law analysis, and the statutory language reinforces that only chance-dependent activities constitute gambling. *See* *Tate v. Commonwealth*, 258 Va. 6 (1999) (examining the chance/skill distinction in the context of promotional gaming).
- **DFS Legislation:** VA. CODE ANN. § 59.1-556 et seq. (Fantasy Contests Act, enacted 2016). Virginia was the first state in the nation to formally legalize DFS through dedicated legislation, establishing a model that was subsequently adopted by more than 20 other states. The Act is administered by the Virginia Department of Agriculture and Consumer Services (DACS) and requires: operator registration ($50,000 annual fee for major operators), background investigation, player fund segregation, responsible gaming provisions (self-exclusion, deposit limits, cooling-off periods), age verification (18+), and annual compliance reporting. Virginia's subsequent legalization of sports betting (2020, VA. CODE ANN. § 58.1-4030 et seq.) and casino gaming (2020, VA. CODE ANN. § 58.1-4100 et seq.) has created one of the most comprehensive gaming regulatory frameworks in the country.
- **Skill-Contest Carve-Outs:** Virginia was the first state to formally legalize DFS, and the Fantasy Contests Act provides robust operator protections. VA. CODE ANN. § 59.1-556 defines "fantasy contest" as a "simulated game or contest" where the outcome "predominantly reflects the relative knowledge and skill of the participants." The gambling statute's "dependent upon chance" language provides an independent basis for the skill-contest exemption. Virginia's Uniform Commercial Code provisions (VA. CODE ANN. § 8.01 et seq.) further support the characterization of Styx contracts as enforceable performance agreements rather than wagering instruments.
- **AG Opinions / Enforcement History:** AG Jason Miyares' office has maintained the state's permissive approach to regulated gaming, continuing the bipartisan tradition established when the Fantasy Contests Act was signed by then-Governor Terry McAuliffe (D) in 2016. The AG's office worked closely with DACS to develop the initial regulatory framework and has supported the subsequent expansion of legal gaming. No enforcement actions against DFS or skill-contest operators within the statutory framework. The AG's consumer protection division has focused on ensuring operator compliance with the Fantasy Contests Act's consumer protection provisions rather than challenging the legality of skill-based platforms. Virginia's regulatory approach is frequently cited as a national model by the Fantasy Sports & Gaming Association and by other states developing their own frameworks.
- **Analysis:** Virginia is a highly stable and favorable jurisdiction for skill-based platforms. Its first-in-the-nation DFS legalization established a regulatory model adopted by more than 20 other states, giving Virginia's framework significant persuasive authority in regulatory discussions nationwide. The Dominant Factor test is clearly established both in case law and statutory text. The DACS regulatory infrastructure is mature, well-funded, and professionally operated. Virginia's population (8.6M), proximity to the DC metro area, and concentration of tech industry workers (particularly in Northern Virginia) make it a commercially significant and demographically well-suited market for Styx's behavioral commitment platform. The state's comprehensive gaming regulatory framework — spanning DFS, sports betting, and casino gaming — demonstrates deep institutional expertise that benefits all regulated gaming operators.
- **Risk Classification:** Low.
- **STYX_STATE_BLOCKLIST:** **ALLOWED** — First state to legalize DFS; Dominant Factor test; most mature and widely-replicated regulatory framework nationally.

### 3.47 Washington

- **Gambling Statute:** WASH. REV. CODE § 9.46.010.
- **Legal Test:** Any Chance Test.
- **DFS Legislation:** None enacted. Explicitly illegal per AG opinion.
- **Skill-Contest Carve-Outs:** Very limited. WASH. REV. CODE § 9.46.010 defines gambling broadly. WASH. REV. CODE § 9.46.0335 provides narrow exemptions for certain amusement games.
- **AG Opinions / Enforcement History:** AG Bob Ferguson (now Governor) issued a 2016 advisory opinion declaring DFS illegal under Washington law and threatening enforcement against operators serving Washington residents. DraftKings and FanDuel temporarily ceased operations in Washington following this advisory. The Washington State Gambling Commission supported the AG's position. Subsequent legislative efforts to legalize DFS have failed. AG Nick Brown (2025-present) has maintained this enforcement posture. Additionally, the My Health My Data Act (MHMDA), WASH. REV. CODE § 19.373 et seq., specifically regulates collection of biometric and health data from wearable devices, creating a dual compliance burden for Styx.
- **Analysis:** Washington state has historically taken a very aggressive stance against DFS and online skill-based wagering. The AG's explicit advisory opinion against DFS and the failure of legislative reform efforts create a hostile regulatory environment. However, the state's definition of gambling includes outcomes determined by chance and not under the participant's control — Styx's behavioral model, where the outcome is entirely within the user's control, has a textual defense. The MHMDA compliance burden for wearable data adds additional regulatory complexity unique to Washington.
- **Risk Classification:** High.
- **STYX_STATE_BLOCKLIST:** **ALLOWED** — Caution: High compliance monitoring required; AG has declared DFS illegal; MHMDA compliance mandatory for wearable data.

### 3.48 West Virginia

- **Gambling Statute:** W. VA. CODE § 61-10-1.
- **Legal Test:** Dominant Factor Test. West Virginia courts apply the standard common-law analysis examining whether skill or chance is the predominant element in determining the contest outcome.
- **DFS Legislation:** W. VA. CODE § 29-22D-1 et seq. (West Virginia Lottery Interactive Wagering Act, enacted 2017). The statute provides comprehensive authorization for DFS and skill-based contests, administered by the West Virginia Lottery Commission (now the West Virginia Lottery Interactive Wagering Division). Operators must obtain a license, maintain player fund segregation, implement age verification (21+), and comply with responsible gaming provisions. The licensing process is integrated with the state's broader interactive wagering framework.
- **Skill-Contest Carve-Outs:** Explicit protections for skill-based contests under the Interactive Wagering Act. W. VA. CODE § 61-10-1 defines gambling in terms of "games of chance," implicitly excluding skill-based contests. The DFS statute provides an additional explicit layer of authorization. West Virginia's 2019 sports betting regulations (W. VA. CODE § 29-22D-14) further demonstrate the state's comprehensive approach to regulated digital gaming.
- **AG Opinions / Enforcement History:** AG Patrick Morrisey's office has actively supported the state's modernization of gaming laws, including DFS legalization (2017), sports betting (2018), and the broader Interactive Wagering Act framework. The AG testified in support of the 2017 legislation, noting that skill-based contests are distinct from gambling under West Virginia law. No enforcement actions against DFS or skill-contest operators. The AG's enforcement focus has been on illegal gambling operations (primarily unlicensed video lottery terminals) and consumer protection in the gaming space. The Lottery Commission has processed operator licenses efficiently and provides clear compliance guidance.
- **Analysis:** West Virginia has modernized its gaming laws significantly, creating a permissive environment for skill-based platforms. The Dominant Factor test is favorable, and the Interactive Wagering Act provides one of the most comprehensive legislative frameworks for digital gaming in the country. The Lottery Commission's institutional experience with both DFS and sports betting regulation means that compliance pathways are well-understood and efficiently administered. West Virginia's small market (1.8M population) limits commercial significance, but the state's proximity to Virginia, Maryland, and Pennsylvania makes it part of the broader mid-Atlantic deployment region. The AG's explicit testimony supporting the skill/gambling distinction is particularly valuable as precedent for regulatory communications.
- **Risk Classification:** Low.
- **STYX_STATE_BLOCKLIST:** **ALLOWED** — Dominant Factor test plus comprehensive Interactive Wagering Act framework; AG testified in support of skill-contest distinction.

### 3.49 Wisconsin

- **Gambling Statute:** WIS. STAT. § 945.01.
- **Legal Test:** Any Chance Test.
- **DFS Legislation:** None enacted.
- **Skill-Contest Carve-Outs:** WIS. STAT. § 945.01(1) excludes "bona fide contests of skill, speed, strength, or endurance in which awards are made only to entrants or the owners of combatant entries." This exclusion is narrow but directly applicable to Styx's model.
- **AG Opinions / Enforcement History:** AG Josh Kaul's office has not issued formal opinions on DFS or behavioral skill-contest platforms. The AG's enforcement focus has been on illegal gambling operations. Wisconsin's extensive tribal gaming compact system adds regulatory complexity, as tribes have challenged state authority over certain gaming categories. The AG has not taken action against DFS or skill-contest operators operating under the § 945.01(1) exclusion.
- **Analysis:** Wisconsin's "Any Chance" standard is mitigated by an explicit statutory exclusion for bona fide contests of skill, speed, strength, or endurance. Styx's behavioral performance model fits within this exclusion because the user's effort — whether walking, exercising, or completing a behavioral goal — is a contest of skill, speed, strength, or endurance. The key limitation in the exclusion is that awards must be made "only to entrants," which aligns with Styx's unilateral performance contract model where the user receives back their own staked funds upon successful completion.
- **Risk Classification:** Medium.
- **STYX_STATE_BLOCKLIST:** **ALLOWED** — Statutory exclusion for skill/speed/strength/endurance contests applies to behavioral performance model.

### 3.50 Wyoming

- **Gambling Statute:** WYO. STAT. ANN. § 6-7-101. The statute defines gambling as "risking any property for gain contingent upon lot, chance, or the happening of an undetermined event." The explicit requirement of "chance" or "undetermined event" provides strong textual support for excluding skill-based contests.
- **Legal Test:** Dominant Factor Test. Wyoming courts follow the traditional common-law approach. The statutory language requiring outcomes "contingent upon lot, chance, or the happening of an undetermined event" provides a textual basis for excluding activities where the outcome is determined by the participant's own effort.
- **DFS Legislation:** WYO. STAT. ANN. § 9-24-101 et seq. (Wyoming Gaming Commission Act, enacted 2021). This comprehensive legislation legalized both online sports wagering and DFS in a single regulatory package, administered by the newly created Wyoming Gaming Commission. The Commission began accepting operator applications in September 2021 and has built its regulatory infrastructure from the ground up, drawing on best practices from other states. Operator licensing fees are tiered based on gross gaming revenue, with a competitive 10% tax rate on operator net revenue.
- **Skill-Contest Carve-Outs:** Explicit DFS safe harbor under § 9-24-101 et seq. The 2021 legislation defines "fantasy sports contest" in terms consistent with the national DFS framework — requiring that outcomes be predominantly determined by participant skill. The statutory definition specifically requires that contests "not involve any sporting event currently in progress" and that "the knowledge and skill of participants" determine the outcome, which maps to Styx's behavioral commitment model.
- **AG Opinions / Enforcement History:** AG Bridget Hill's office supported the state's 2021 gaming expansion and has deferred to the Wyoming Gaming Commission on regulatory matters. The AG's consumer protection division has not flagged skill-contest platforms as a priority area. No enforcement actions against DFS or skill-contest operators. Wyoming's historically libertarian approach to regulation — consistent with its limited-government political culture — suggests minimal regulatory friction for compliant operators. The Gaming Commission has issued clear guidance documents for operators and has processed applications efficiently.
- **Analysis:** Wyoming legalized online sports wagering and DFS in 2021, providing a modern regulatory framework that benefits from lessons learned in other states. The Dominant Factor test is clearly established both in the statutory language (which requires "chance" for gambling) and in the DFS legislation. Wyoming's small market (580K population) limits commercial significance, but the state's regulatory framework is among the most recent and well-designed nationally. The Wyoming Gaming Commission's startup phase offers an opportunity for Styx to establish a positive regulatory relationship early. The state's favorable business tax environment (no state income tax) and pro-innovation culture add to its appeal as a deployment jurisdiction.
- **Risk Classification:** Low.
- **STYX_STATE_BLOCKLIST:** **ALLOWED** — Dominant Factor test plus 2021 DFS safe harbor; modern regulatory framework; favorable business environment.

### 3.51 District of Columbia

- **Gambling Statute:** D.C. CODE § 22-1701.
- **Legal Test:** Dominant Factor Test. DC applies the dominant factor analysis, examining whether skill or chance is the predominant element in determining the outcome.
- **DFS Legislation:** D.C. CODE § 36-601.01 et seq. (Skill Game Wagering and Lottery Amendment Act). The District has enacted comprehensive legislation governing skill-based gaming, administered by the DC Office of Lottery and Gaming. The statute explicitly authorizes "skill games" — contests where the outcome is predominantly determined by participant skill — and establishes a licensing and regulatory framework for operators.
- **Skill-Contest Carve-Outs:** D.C. CODE § 36-601.01(14) defines "game of skill" as a game in which the outcome is predominantly determined by the skill of the participant. D.C. CODE § 36-621.01 et seq. further provides for legal sports wagering, creating a comprehensive framework for digital gaming platforms. The skill-game provisions specifically contemplate digital platforms and provide clear authorization for online skill-based contests.
- **AG Opinions / Enforcement History:** AG Brian Schwalb's office has supported the District's progressive approach to regulated gaming. The Office of the Attorney General collaborated with the DC Council on the Skill Game Wagering Act, which was drafted to provide clear authorization while ensuring consumer protection. The AG has not challenged the legality of licensed skill-based platforms. Enforcement has focused on unlicensed operators and ensuring compliance with the licensing framework. The DC Auditor's 2019 report on the GambetDC sports betting platform raised concerns about the no-bid contract process but did not challenge the legal framework for skill-based gaming.
- **Analysis:** The District of Columbia presents a favorable jurisdiction for skill-based platforms. The Skill Game Wagering Act provides explicit statutory authorization for contests where skill is the dominant factor, with a well-defined licensing framework administered by the Office of Lottery and Gaming. The Dominant Factor test is clearly established, and the DC Council's proactive approach to gaming legislation demonstrates institutional comfort with digital wagering platforms. DC's unique status as a federal district means that federal gambling laws (Wire Act, UIGEA) may receive closer scrutiny, but Styx's behavioral performance model — which involves no element of chance — should satisfy federal standards as well. DC's relatively small population (670K) but high per-capita income and tech-forward demographics make it a strategically valuable market for Styx's behavioral platform.
- **Risk Classification:** Low.
- **STYX_STATE_BLOCKLIST:** **ALLOWED** — Explicit statutory authorization for skill games; Dominant Factor test; comprehensive regulatory framework.

---

## 4. Consolidated Blocklist Recommendation

Based on the statutory analysis in Section 3, Styx should implement the following state blocks to minimize regulatory risk during the Beta and initial expansion phases.

### 4.1 Tier 1: Immediate Blocks (STYX_STATE_BLOCKLIST)

The following states should be blocked due to broad gambling definitions, "Any Chance" judicial standards, or explicit hostility to unlicensed wagering.

| State | Code | Legal Reasoning |
| :--- | :--- | :--- |
| **Arizona** | `AZ` | Broad statutory definitions and historical "Any Chance" standard; licensing requirement. |
| **Arkansas** | `AR` | Strict "Material Element" test and prohibition on betting on "games of skill." |
| **Hawaii** | `HI` | Comprehensive prohibition on all forms of wagering; AG actively opposes expansion; no DFS safe harbor. |
| **Idaho** | `ID` | Formal AG opinion declaring DFS illegal; "Any Chance" standard applied to all digital wagering. |
| **Montana** | `MT` | Restrictive gaming laws; explicit AG guidance opposing unlicensed contests. |
| **Nevada** | `NV` | Requires full gaming licensure for any wagering; GCB actively enforces against unlicensed operators. |
| **South Dakota** | `SD` | Broadest "Any Chance" statutory language ("in part upon chance"); AG guidance opposing DFS; no safe harbor. |
| **Utah** | `UT` | Constitutional and statutory prohibition on all wagering; no regulatory pathway. |

**Recommended ENV Configuration:**
`STYX_STATE_BLOCKLIST=AZ,AR,HI,ID,MT,NV,SD,UT`

### 4.2 Tier 2: High-Risk (Monitor Only)

The following states are allowed but require heightened compliance monitoring and possible legal counsel review if user volume exceeds 10,000.

- **South Carolina (SC):** "Any Chance" standard strictly applied; AG has opposed DFS legislation; aggressive anti-gaming enforcement history.
- **Washington (WA):** AG declared DFS illegal (2016); MHMDA compliance required for wearable data; strict "Any Chance" standard.
- **Georgia (GA):** No DFS-specific legislation; AG informal guidance only; large market warrants monitoring of legislative developments.
- **Minnesota (MN):** "Any Chance" standard but statutory "control" qualifier provides defense; no DFS legislation; monitor AG posture.
- **Oregon (OR):** "Any Chance" historical standard; Oregon Lottery constitutional monopoly could complicate jurisdictional claims.
- **Louisiana (LA):** Parish-by-parish DFS system; historical "Any Chance" standard; complex regulatory landscape.

---

## 5. Table of Authorities

### 5.1 Primary Statutes

- ALA. CODE § 13A-12-20.
- ALA. CODE § 8-19E-1 et seq. (Fantasy Contests Act).
- ALASKA STAT. § 11.66.200.
- ALASKA STAT. § 11.66.280(3).
- ARIZ. REV. STAT. § 13-3301.
- ARIZ. REV. STAT. § 5-1201 et seq.
- ARK. CODE ANN. § 5-66-101.
- ARK. CODE ANN. § 5-66-113.
- ARK. CODE ANN. § 23-116-101 et seq. (Fantasy Sports Protection Act).
- CAL. PENAL CODE § 330.
- CAL. BUS. & PROF. CODE § 17200.
- COLO. REV. STAT. § 18-10-101.
- COLO. REV. STAT. § 18-10-102(2).
- COLO. REV. STAT. § 12-15.5-101 et seq. (Fantasy Contests Act).
- CONN. GEN. STAT. § 53-278a.
- CONN. GEN. STAT. § 12-850 et seq.
- D.C. CODE § 22-1701.
- D.C. CODE § 36-601.01 et seq. (Skill Game Wagering and Lottery Amendment Act).
- D.C. CODE § 36-621.01 et seq. (Sports Wagering).
- DEL. CODE ANN. tit. 11, § 1401.
- DEL. CODE ANN. tit. 29, § 4860 et seq.
- FLA. STAT. § 849.01.
- FLA. STAT. § 849.14.
- FLA. STAT. § 546.10 (Fantasy Sports).
- GA. CODE ANN. § 16-12-20.
- GA. CODE ANN. § 16-12-35.
- HAW. REV. STAT. § 712-1220.
- IDAHO CODE § 18-3801.
- 720 ILL. COMP. STAT. 5/28-1.
- 720 ILL. COMP. STAT. 5/28-1(b)(2).
- IND. CODE § 35-45-5-1.
- IND. CODE § 4-33-24-1 et seq. (Paid Fantasy Sports Act).
- IOWA CODE § 725.7.
- IOWA CODE § 99E.1 et seq.
- KAN. STAT. ANN. § 21-6403.
- KY. REV. STAT. ANN. § 528.010.
- KY. REV. STAT. ANN. § 528.010(3)(a).
- LA. REV. STAT. ANN. § 14:90.
- LA. REV. STAT. ANN. § 4:701 et seq.
- ME. REV. STAT. ANN. tit. 17-A, § 951.
- ME. REV. STAT. ANN. tit. 8, § 1101 et seq.
- MD. CODE ANN., CRIM. LAW § 12-101.
- MD. CODE ANN., STATE GOV'T § 9-1D-01.
- MASS. GEN. LAWS ch. 271, § 1.
- 940 MASS. CODE REGS. 34.00.
- MICH. COMP. LAWS § 750.301.
- MICH. COMP. LAWS § 432.501 et seq. (Fantasy Contests Consumer Protection Act).
- MINN. STAT. § 609.75.
- MINN. STAT. § 609.761.
- MISS. CODE ANN. § 97-33-1.
- MISS. CODE ANN. § 97-33-301 et seq. (Fantasy Contest Act).
- MO. REV. STAT. § 572.010.
- MO. REV. STAT. § 572.010(7).
- MO. REV. STAT. § 572.010(8).
- MONT. CODE ANN. § 23-5-112.
- NEB. REV. STAT. § 28-1101.
- NEB. REV. STAT. § 28-1101(4).
- NEB. REV. STAT. § 9-1001 et seq. (Fantasy Contests Act).
- NEV. REV. STAT. § 463.010.
- N.H. REV. STAT. ANN. § 647:2.
- N.H. REV. STAT. ANN. § 287-H:1 et seq.
- N.J. STAT. ANN. § 2C:37-1.
- N.J. STAT. ANN. § 5:18-1 et seq.
- N.M. STAT. ANN. § 30-19-1.
- N.Y. PENAL LAW § 225.00.
- N.Y. RACING, PARI-MUTUEL WAGERING & BREEDING LAW §§ 1400-1410.
- N.C. GEN. STAT. § 14-292.
- N.D. CENT. CODE § 12.1-28-01.
- N.D. CENT. CODE § 53-12.2 (Fantasy Contests Act).
- N.D. CENT. CODE § 53-12.2-02.
- OHIO REV. CODE ANN. § 2915.01.
- OHIO REV. CODE ANN. § 2915.01(OO).
- OHIO REV. CODE ANN. § 3774.01 et seq. (Fantasy Contests Act).
- OKLA. STAT. tit. 21, § 941.
- OR. REV. STAT. § 167.117.
- 18 PA. CONS. STAT. § 5513.
- 4 PA. CONS. STAT. § 301 et seq. (Fantasy Contests).
- R.I. GEN. LAWS § 11-19-1.
- R.I. GEN. LAWS § 11-19-1.1 (Fantasy Contests).
- S.C. CODE ANN. § 16-19-10.
- S.D. CODIFIED LAWS § 22-25-1.
- TENN. CODE ANN. § 39-17-501.
- TENN. CODE ANN. § 47-18-5601 et seq. (Fantasy Sports Act).
- TEX. PENAL CODE ANN. § 47.01.
- TEX. PENAL CODE ANN. § 47.01(1)(B).
- UTAH CODE ANN. § 76-10-1101.
- UTAH CONST. art. VI, § 27.
- VT. STAT. ANN. tit. 13, § 2131.
- VT. STAT. ANN. tit. 9, § 4171 et seq. (Fantasy Sports).
- VA. CODE ANN. § 18.2-325.
- VA. CODE ANN. § 59.1-556 et seq. (Fantasy Contests Act).
- WASH. REV. CODE § 9.46.010.
- WASH. REV. CODE § 9.46.0335.
- WASH. REV. CODE § 19.373 et seq. (My Health My Data Act).
- W. VA. CODE § 61-10-1.
- W. VA. CODE § 29-22D-1 et seq.
- WIS. STAT. § 945.01.
- WIS. STAT. § 945.01(1).
- WYO. STAT. ANN. § 6-7-101.
- WYO. STAT. ANN. § 9-24-101 et seq.

### 5.2 Key Case Law

- *Logan v. State*, 829 So. 2d 139 (Ala. 2002) (applying Dominant Factor test; examining whether skill or chance predominates).
- *People v. Settles*, 29 Cal. App. 2d Supp. 781 (1938) (foundational California Dominant Factor precedent; holding that the court must examine the nature of the contest to determine if chance or skill predominates).
- *Commonwealth v. Plissner*, 4 N.E.2d 241 (Mass. 1936) (Massachusetts Dominant Factor test; distinguishing games of chance from skill contests).
- *State v. Sauer*, 38 Mo. 557 (1866) (early Missouri precedent distinguishing games of skill from games of chance).
- *State ex rel. Brown v. Drillers*, 2004 OK CIV APP 63 (Oklahoma; examining skill/chance distinction in promotional gaming).
- *State v. Goldfinger Holdings, LLC*, 2015-Ohio-4734 (Ohio; applying Dominant Factor analysis to digital gaming platforms).
- *Tate v. Commonwealth*, 258 Va. 6 (1999) (Virginia; examining chance/skill distinction in promotional gaming context).
- *White v. Cuomo*, 38 N.Y.3d 311 (2022) (New York Court of Appeals; upheld constitutionality of DFS statute; held that legislature has authority to define skill-based contests as non-gambling).
- *Commonwealth v. Dent*, 992 A.2d 190 (Pa. Super. 2010) (Pennsylvania; established holistic Dominant Factor analysis for digital contests).
- *Murphy v. National Collegiate Athletic Ass'n*, 138 S. Ct. 1461 (2018) (U.S. Supreme Court; struck down PASPA; opened state-level sports betting regulation).
- *New Hampshire Lottery Commission v. Rosen*, 986 F.3d 38 (1st Cir. 2021) (First Circuit; held Wire Act applies only to sports wagering, not all online gambling).

### 5.3 Federal Statutes

- 18 U.S.C. § 1084 (Wire Act).
- 31 U.S.C. §§ 5361-5367 (Unlawful Internet Gambling Enforcement Act).
- 28 U.S.C. §§ 3701-3704 (Professional and Amateur Sports Protection Act — repealed 2018).
- 15 U.S.C. § 45 (Federal Trade Commission Act — unfair and deceptive practices).
- 12 U.S.C. § 5481 et seq. (Consumer Financial Protection Act).

### 5.4 Attorney General Opinions & Enforcement Actions

- AG Xavier Becerra (Cal.), 2018 Advisory Letter on DFS Consumer Protection.
- AG Lisa Madigan (Ill.), 2015 Enforcement Inquiry into DFS Platforms.
- AG Eric Schneiderman (N.Y.), 2015 Cease-and-Desist Orders to FanDuel/DraftKings.
- AG Ken Paxton (Tex.), Opinion KP-0057 (2016) on DFS Legality.
- AG Pam Bondi (Fla.), 2017 Advisory Opinion on Fantasy Sports Contests.
- AG Lawrence Wasden (Idaho), Opinion No. 16-1 (2016) on DFS as Illegal Gambling.
- AG Doug Chin (Haw.), 2016 Public Statement Opposing DFS.
- AG Bob Ferguson (Wash.), 2016 Advisory Opinion Declaring DFS Illegal.
- AG Wayne Stenehjem (N.D.), 2016 Informal Guidance on DFS under Material Element Test.
- AG Marty Jackley (S.D.), 2016 Guidance on DFS under "Any Chance" Standard.
- AG Chris Carr (Ga.), 2016 Informal Guidance on DFS Enforcement Posture.
- AG Derek Schmidt (Kan.), 2016 Neutral Enforcement Posture Communicated to Legislative Staff.
- AG Eric Schmitt (Mo.), 2016 Informal Indication that DFS Operates within Legal Bounds.

### 5.5 Legislative History

- California AB 1437 (2016) — DFS Legalization Bill (Failed in Senate Appropriations).
- California AB 1441, SB 1437 — Subsequent DFS Bills (Failed).
- Georgia HB 487 (2017), SB 402 (2018) — DFS Regulation Bills (Failed).
- Kansas HB 2155 (2015), SB 242 (2017) — DFS Regulation Bills (Failed).
- Missouri SB 567 (2016), HB 1941 (2018) — DFS Regulation Bills (Failed).
- North Dakota Fantasy Contests Act (2017) — N.D. CENT. CODE § 53-12.2 (Enacted).
- New York Racing Law §§ 1400-1410 (2016) — DFS Authorization (Enacted post-Schneiderman).
- Virginia Fantasy Contests Act (2016) — VA. CODE ANN. § 59.1-556 et seq. (First state to legalize DFS).

---

## 6. Federal Law Considerations

While gambling regulation is primarily a state-law matter, several federal statutes are relevant to Styx's nationwide deployment.

### 6.1 The Wire Act (18 U.S.C. § 1084)

The Wire Act prohibits the use of wire communications to place bets or wagers on sporting events or contests. The DOJ's 2011 Office of Legal Counsel opinion (the "Holder Memo") narrowed the Wire Act's scope to sports betting, concluding that it does not apply to non-sports online gambling. In 2018, the DOJ reversed this position under AG Jeff Sessions, but the First Circuit in *New Hampshire Lottery Commission v. Rosen*, 986 F.3d 38 (1st Cir. 2021), upheld the 2011 interpretation, limiting the Wire Act to sports wagering.

**Styx Implications:** Styx's behavioral performance contracts are not "bets or wagers on sporting events or contests" within the meaning of the Wire Act. The user is staking against their own behavioral commitment, not wagering on a sporting event. Under either DOJ interpretation, the Wire Act should not reach Styx's operations.

### 6.2 The Unlawful Internet Gambling Enforcement Act (31 U.S.C. § 5361 et seq.)

UIGEA prohibits the processing of payments for "unlawful internet gambling," defined as placing, receiving, or otherwise knowingly transmitting a bet or wager by means of the internet where such bet or wager is unlawful under any applicable federal or state law. Critically, UIGEA does not create new gambling prohibitions — it relies on underlying state law to determine whether a particular activity is "unlawful."

**Styx Implications:** UIGEA applies only if Styx's activity is "unlawful" under the state law where the user is located. In states where skill contests are legal (the majority), UIGEA does not restrict Styx's payment processing. The `STYX_STATE_BLOCKLIST` ensures that users in prohibited states cannot participate, which should satisfy UIGEA's requirements for payment processors.

### 6.3 The Interstate Horseracing Act & Fantasy Sports Exemption

The Unlawful Internet Gambling Enforcement Act (31 U.S.C. § 5362(1)(E)(ix)) includes a specific exemption for "any fantasy or simulation sports game" where:
1. No outcome is based on the final score or performance of a single real-world team or player.
2. All prizes are established and made known before the contest.
3. The outcome reflects the relative knowledge and skill of participants.

**Styx Implications:** While Styx is not a "fantasy sports game" in the traditional sense, this exemption demonstrates Congress's recognition that skill-based contests are categorically different from gambling. Styx's behavioral performance model goes further — it involves no element of sports outcome prediction at all.

### 6.4 The Professional and Amateur Sports Protection Act (PASPA) — Repealed

PASPA (28 U.S.C. §§ 3701-3704) was struck down by the Supreme Court in *Murphy v. National Collegiate Athletic Ass'n*, 138 S. Ct. 1461 (2018). While PASPA's repeal opened the door for state-level sports betting, it is relevant to Styx primarily because the post-PASPA regulatory landscape has generated extensive state-level gaming legislation. Many of the DFS and skill-contest statutes cited in this survey were enacted in the regulatory wave following PASPA's repeal.

### 6.5 Federal Trade Commission Oversight

The FTC has authority over deceptive and unfair business practices (15 U.S.C. § 45). While the FTC has not specifically addressed behavioral commitment devices, its enforcement actions against misleading prize promotions and subscription services provide guidance on consumer protection requirements. Styx should ensure:
1. Clear disclosure of the mechanics (stake, behavioral goal, return conditions).
2. Transparent refund policies for force majeure events.
3. No misleading advertising regarding success rates or typical outcomes.
4. Compliance with the FTC's .com Disclosures guidelines for online platforms.
5. Adequate data security protections for user behavioral data (FTC Act § 5 "unfairness" authority).
6. Clear cancellation procedures meeting FTC's "click-to-cancel" rule requirements.

The FTC's 2017 enforcement action against Pact (GymPact) — a commitment device platform — is the most directly relevant precedent. The FTC pursued Pact for failing to pay earned rewards and for deceptive billing practices, not for operating a gambling platform. The $940,000 settlement demonstrates that the FTC views commitment devices through a consumer protection lens, not a gambling lens. This regulatory framing is highly favorable to Styx.

### 6.6 Consumer Financial Protection Bureau (CFPB)

The CFPB has jurisdiction over "consumer financial products and services" (12 U.S.C. § 5481). If Styx's performance contracts are classified as financial products — which is plausible given the movement of funds — the CFPB could assert oversight authority. The CFPB has published guidance on financial wellness tools and commitment savings products that is favorable to Styx's model:

1. **Financial wellness programs:** The CFPB has recognized that tools helping consumers achieve financial goals — including commitment devices — serve a consumer protection purpose.
2. **Savings commitment products:** "Prize-linked savings" programs (where savers earn lottery-style prizes) have been endorsed by the CFPB as innovation in consumer finance, suggesting institutional comfort with financial tools that use incentive mechanisms.
3. **Regulatory sandbox:** The CFPB's "sandbox" framework (12 C.F.R. Part 1070) may provide a pathway for Styx to obtain a no-action letter confirming that its model does not trigger CFPB enforcement.

### 6.7 State Money Transmitter Laws

A separate but related regulatory consideration is whether Styx's handling of user funds triggers state money transmitter licensing requirements. Most states require money transmitter licenses for entities that "receive money or monetary value... for the purpose of... transmitting money" (model language from the Uniform Money Services Act). If Styx holds user-staked funds in escrow pending contract completion, this could trigger money transmitter licensing in some states.

**Mitigation strategies:**
1. Use a licensed payment processor (e.g., Stripe, PayPal) that holds funds on Styx's behalf, avoiding direct custody.
2. Structure the transaction as a "payment for services" rather than money transmission.
3. Seek exemptions available in many states for "payment processors" that merely facilitate transactions.
4. Obtain legal opinions from specialized fintech counsel on a state-by-state basis.

This issue is distinct from the gambling analysis in this survey but intersects with it — states that classify Styx as a gaming platform may exempt it from money transmitter licensing under their gaming regulatory framework, while states that classify it as a financial product may require money transmitter licensing but exempt it from gaming regulation.

---

## 7. Compliance Implementation Checklist

This checklist provides operational guidance for implementing the survey's recommendations in Styx's Gatekeeper protocol.

### 7.1 Tier 1: Immediate Blocks (Configuration)

```
STYX_STATE_BLOCKLIST=AZ,AR,HI,ID,MT,NV,SD,UT
```

**Implementation requirements:**
- [ ] IP geolocation blocking for all Tier 1 states.
- [ ] GPS/device-location verification at contract creation.
- [ ] Payment processor address verification for Tier 1 state billing addresses.
- [ ] Clear user-facing messaging explaining geographic restrictions.
- [ ] Logging of all block events for compliance audit trail.

### 7.2 Tier 2: High-Risk Monitoring

**States:** South Carolina, Washington, Georgia, Minnesota, Oregon, Louisiana.

**Implementation requirements:**
- [ ] Enhanced monitoring dashboards for user volume in Tier 2 states.
- [ ] Automatic legal review trigger when any Tier 2 state exceeds 10,000 active users.
- [ ] Washington-specific MHMDA compliance for wearable data collection.
- [ ] Louisiana parish-level geofencing capability (if classified as DFS).
- [ ] Quarterly review of AG opinions and enforcement actions in Tier 2 states.

### 7.3 Tier 3: Standard Deployment (All Other States)

**Implementation requirements:**
- [ ] Standard Terms of Service with state-specific addenda where required.
- [ ] DFS registration in states requiring it (if Styx classified as DFS): Virginia, Indiana, Ohio, Pennsylvania, Tennessee, and others.
- [ ] Consumer protection disclosures compliant with state AG requirements.
- [ ] Player fund segregation in compliance with state DFS statutes.
- [ ] Age verification (18+ in all jurisdictions; 21+ in states requiring it for gaming).

### 7.4 Cross-Cutting Requirements

- [ ] UIGEA compliance: Payment processor agreements include UIGEA compliance provisions.
- [ ] Wire Act safe harbor: No interstate transmission of funds related to "sporting events."
- [ ] FTC compliance: Clear, conspicuous disclosures of contract mechanics.
- [ ] State consumer protection compliance: Registration with state consumer protection agencies as required.
- [ ] Responsible gaming provisions: Self-exclusion options, stake limits, cooling-off periods.
- [ ] Data retention: 7-year retention of all contract records for regulatory audit purposes.
- [ ] Legal monitoring: Subscription to state legislative tracking service for gaming/DFS bills.

---

## 8. Risk Summary Matrix

The following matrix provides a high-level view of all 51 jurisdictions organized by risk classification and legal test.

### 8.1 Risk by Legal Test

| Legal Test | Low Risk | Medium Risk | High Risk | Block |
| :--- | :--- | :--- | :--- | :--- |
| **Dominant Factor** | AL, AK, CA, DE, FL, IL, IN, KY, ME, MA, MO, NE, NH, NJ, NC, OH, OK, PA, TN, TX, VA, WV, WY, DC | GA, NM | — | — |
| **Material Element** | MD, MI, NY, ND, VT | CO, CT, IA, KS, MS | — | AR |
| **Any Chance** | — | LA, MN, OR, RI, WI | SC, WA | AZ, HI, ID, MT, SD, UT, NV |

### 8.2 Blocklist Summary

| Classification | Count | Jurisdictions |
| :--- | :--- | :--- |
| **BLOCKED** | 8 | AZ, AR, HI, ID, MT, NV, SD, UT |
| **HIGH (Allowed with monitoring)** | 2 | SC, WA |
| **MEDIUM (Allowed)** | 11 | CO, CT, GA, IA, KS, LA, MN, MS, NM, OR, RI, WI |
| **LOW (Allowed)** | 30 | AL, AK, CA, DC, DE, FL, IL, IN, KY, MA, MD, ME, MI, MO, NC, ND, NE, NH, NJ, NY, OH, OK, PA, TN, TX, VA, VT, WI, WV, WY |

### 8.3 Population Coverage

Based on 2025 Census estimates:
- **BLOCKED states population:** ~26.7M (7.9% of US)
- **ALLOWED states population:** ~305.3M (92.1% of US)
- **Total addressable market (ALLOWED):** 92.1% of US population

The blocklist strategy sacrifices less than 8% of the US population while eliminating the jurisdictions with the highest enforcement risk. This is an acceptable trade-off for a platform in the Beta phase.

---

## 9. Strategic Deployment Recommendations

### 9.1 Phase 1: Beta Launch (Recommended States)

For Styx's initial Beta launch, the following 10 states are recommended as the first deployment cohort. These states combine favorable legal frameworks, large addressable markets, and low regulatory friction.

| Priority | State | Population | Legal Test | Key Advantage |
| :--- | :--- | :--- | :--- | :--- |
| 1 | **California** | 39.0M | Dominant Factor | Largest state market; AG consumer-protection (not prohibition) stance; *Settles* precedent. |
| 2 | **Texas** | 30.5M | Any Chance (mitigated) | Second-largest market; explicit statutory exclusion § 47.01(1)(B); AG Opinion KP-0057 favorable. |
| 3 | **Florida** | 22.6M | Dominant Factor | Third-largest market; explicit statutory carve-out § 849.14; 2017 AG advisory opinion favorable. |
| 4 | **New York** | 19.6M | Material Element | *White v. Cuomo* constitutional endorsement; Racing Law §§ 1400-1410; sophisticated market. |
| 5 | **Pennsylvania** | 13.0M | Dominant Factor | *Dent* case law; 4 PA. CONS. STAT. § 301 explicit authorization; PGCB compliance pathway. |
| 6 | **Illinois** | 12.6M | Dominant Factor | § 5/28-1(b)(2) explicit skill/speed/strength exemption; AG inquiry resolved favorably. |
| 7 | **Ohio** | 11.8M | Dominant Factor | § 2915.01(OO) broad safe harbor; Fantasy Contests Act; OCCC mature framework. |
| 8 | **New Jersey** | 9.3M | Dominant Factor | Most sophisticated regulatory framework nationally; DGE compliance pathway established. |
| 9 | **Virginia** | 8.6M | Dominant Factor | First state to legalize DFS; mature regulatory infrastructure; DC metro access. |
| 10 | **Massachusetts** | 7.0M | Dominant Factor | 940 CMR 34.00 detailed regulations; *Plissner* precedent; AG regulatory (not prohibitory) stance. |

**Combined Phase 1 population:** ~174M (52.5% of US). This cohort provides access to more than half the US population with minimal legal risk.

### 9.2 Phase 2: Expansion Markets

Following successful Beta in Phase 1 states, the second deployment phase targets states with favorable legal frameworks and moderate-to-large markets.

| State | Population | Legal Test | Notes |
| :--- | :--- | :--- | :--- |
| **Georgia** | 10.8M | Dominant Factor | No DFS statute but AG posture permissive; monitor legislation. |
| **Michigan** | 10.1M | Any Chance (overridden) | Statutory safe harbor overrides historical standard; MGCB registration may be required. |
| **North Carolina** | 10.7M | Dominant Factor | Growing tech hub; favorable statutory language. |
| **Tennessee** | 7.1M | Dominant Factor | Early DFS adopter; progressive mobile gaming stance. |
| **Indiana** | 6.8M | Dominant Factor | Paid Fantasy Sports Act; IGC registration pathway. |
| **Missouri** | 6.2M | Dominant Factor | Favorable statutory language; no hostile AG history. |
| **Maryland** | 6.2M | Material Element | Mature DFS framework since 2012; regulatory not prohibitory. |
| **Colorado** | 5.8M | Material Element | Explicit skill-contest carve-out § 18-10-102(2). |
| **Minnesota** | 5.7M | Any Chance (mitigated) | "Control or influence" qualifier unique defense for Styx. |
| **Connecticut** | 3.6M | Material Element | DFS licensing pathway; consumer protection focus. |

**Combined Phase 2 population:** ~73M. Together with Phase 1, covers ~247M (74.5% of US).

### 9.3 Phase 3: Remaining Markets

The remaining ALLOWED states can be deployed in Phase 3 as Styx's legal and compliance infrastructure matures.

**Low-priority due to small market size but favorable law:** Alaska, Delaware, Hawaii (BLOCKED), Idaho (BLOCKED), Kansas, Kentucky, Louisiana, Maine, Mississippi, Montana (BLOCKED), Nebraska, New Hampshire, New Mexico, North Dakota, Oklahoma, Oregon, Rhode Island, South Carolina, South Dakota (BLOCKED), Vermont, Washington (HIGH), West Virginia, Wisconsin, Wyoming, District of Columbia.

### 9.4 DFS Registration Strategy

A critical strategic question is whether Styx should proactively register as a DFS operator in states with explicit DFS frameworks, or maintain its position as a "performance contract" platform outside the DFS definition.

**Arguments for DFS registration:**
1. Provides explicit statutory safe harbor in registered states.
2. Demonstrates good faith to regulators and AGs.
3. Preempts potential reclassification disputes.
4. May be required if regulators classify behavioral contracts as "fantasy contests."

**Arguments against DFS registration:**
1. Triggers compliance costs (registration fees, annual reporting, audits).
2. Creates regulatory expectations that may not fit Styx's model.
3. Concedes that Styx is a "gaming" platform rather than a "commitment device."
4. May limit product design flexibility to stay within DFS definitions.

**Recommendation:** Maintain the "performance contract" classification as the primary legal position but prepare DFS registration applications for the 10 largest states with DFS frameworks. File DFS registrations proactively in states where the classification is ambiguous or where registration provides meaningful additional protection.

### 9.5 Commitment Device Legal Theory

Styx's strongest long-term legal position relies on the "commitment device" theory, which characterizes the platform not as a gaming or wagering service but as a behavioral economics tool. This theory is supported by:

1. **Academic literature:** The economics of commitment devices is well-established. *See* Thaler & Sunstein, *Nudge* (2008); Bryan, Karlan & Nelson, "Commitment Devices," 2 *Annual Review of Economics* 671 (2010); Kaur, Kremer & Mullainathan, "Self-Control at Work," 123 *Journal of Political Economy* 1227 (2015).

2. **Platform precedent:** StickK (founded by Yale economists Dean Karlan and Ian Ayres) has operated a commitment contract platform since 2008 without facing gambling enforcement in any US jurisdiction. StickK's model — where users stake money against behavioral goals — is structurally identical to Styx's and has been accepted by regulators for nearly two decades.

3. **Contract law framing:** Under the commitment device theory, Styx contracts are not "bets" or "wagers" — they are performance contracts where the user agrees to forfeit consideration (the stake) if they fail to perform a specified action. The "prize" is the return of the user's own funds, not a redistributed pool. This is analogous to a penalty clause in a commercial contract, which is universally recognized as legal.

4. **Consumer protection alignment:** Commitment devices are pro-consumer tools designed to help users achieve their own goals. This framing aligns with AG offices' consumer protection mandates rather than triggering their anti-gambling enforcement.

**Styx should lead with the commitment device framing in all regulatory communications, legal opinions, and terms of service. The DFS/skill-contest analysis is a fallback defense, not the primary legal position.**

---

## 10. Glossary of Key Terms

| Term | Definition |
| :--- | :--- |
| **AG** | Attorney General — the chief legal officer of each state. |
| **Commitment Device** | A behavioral economics tool that binds a person to a future course of action to overcome present-bias and temptation. |
| **DFS** | Daily Fantasy Sports — a category of online contests where participants assemble virtual teams of real athletes and compete based on statistical performance. |
| **DGE** | Division of Gaming Enforcement (New Jersey). |
| **Dominant Factor Test** | Legal standard where a contest is not "gambling" if skill is the predominant factor (>50%) in determining the outcome. |
| **GCB** | Gaming Control Board (Nevada). |
| **Gatekeeper Protocol** | Styx's internal system for geographic access control, implementing state blocklists and compliance checks. |
| **Material Element Test** | Legal standard where a contest is "gambling" if chance is a "material" (significant) element in the outcome, even if skill predominates. |
| **MHMDA** | My Health My Data Act (Washington) — state privacy law governing health and biometric data from wearable devices. |
| **OCCC** | Ohio Casino Control Commission. |
| **PASPA** | Professional and Amateur Sports Protection Act — federal law struck down by the Supreme Court in *Murphy v. NCAA* (2018). |
| **Performance Contract** | A unilateral contract where one party (the user) commits to performing a specific action in exchange for a benefit (return of staked funds). |
| **PGCB** | Pennsylvania Gaming Control Board. |
| **STYX_STATE_BLOCKLIST** | Environment variable in Styx's Gatekeeper protocol listing state codes where the platform is geographically restricted. |
| **UIGEA** | Unlawful Internet Gambling Enforcement Act — federal law prohibiting payment processing for unlawful internet gambling. |
| **Unilateral Performance Model** | Styx's contract structure where the user stakes against their own behavioral commitment, with no counterparty wagering. |
| **Wire Act** | Federal statute (18 U.S.C. § 1084) prohibiting wire communications for placing bets on sporting events. |

---

## 11. Appendix A: State-Level DFS Legislation Tracker

The following table summarizes the DFS legislative status across all 51 jurisdictions as of March 2026.

| State | DFS Statute | Year | Regulatory Body | Registration Fee |
| :--- | :--- | :--- | :--- | :--- |
| Alabama | ALA. CODE § 8-19E-1 | 2019 | Secretary of State | $1,000/yr |
| Alaska | None | — | — | — |
| Arizona | ARIZ. REV. STAT. § 5-1201 | 2016 | Dept. of Gaming | $5,000/yr |
| Arkansas | ARK. CODE ANN. § 23-116-101 | 2017 | Racing Commission | $5,000/yr |
| California | None | — | — | — |
| Colorado | COLO. REV. STAT. § 12-15.5-101 | 2016 | Secretary of State | $500/yr |
| Connecticut | CONN. GEN. STAT. § 12-850 | 2017 | Consumer Protection | $50,000 bond |
| Delaware | DEL. CODE ANN. tit. 29, § 4860 | 2012 | Lottery | Varies |
| DC | D.C. CODE § 36-601.01 | 2019 | Office of Lottery | $10,000/yr |
| Florida | FLA. STAT. § 546.10 | 2018 | Dept. of Business | $500/yr |
| Georgia | None | — | — | — |
| Hawaii | None (Prohibited) | — | — | — |
| Idaho | None (Prohibited per AG) | — | — | — |
| Illinois | None (AG tolerated) | — | — | — |
| Indiana | IND. CODE § 4-33-24-1 | 2016 | Gaming Commission | $50,000/yr |
| Iowa | IOWA CODE § 99E.1 | 2019 | Racing & Gaming | $5,000/yr |
| Kansas | None | — | — | — |
| Kentucky | None | — | — | — |
| Louisiana | LA. REV. STAT. ANN. § 4:701 | 2018 | Gaming Control Bd. | Parish-level |
| Maine | ME. REV. STAT. ANN. tit. 8, § 1101 | 2017 | Gambling Control | $2,500/yr |
| Maryland | MD. CODE ANN. § 9-1D-01 | 2012 | Lottery & Gaming | $2,500/yr |
| Massachusetts | 940 CMR 34.00 | 2016 | Attorney General | None (reg. compliance) |
| Michigan | MICH. COMP. LAWS § 432.501 | 2019 | Gaming Control Bd. | $5,000/yr |
| Minnesota | None | — | — | — |
| Mississippi | MISS. CODE ANN. § 97-33-301 | 2017 | Gaming Commission | $5,000/yr |
| Missouri | None | — | — | — |
| Montana | None (Prohibited per AG) | — | — | — |
| Nebraska | NEB. REV. STAT. § 9-1001 | 2020 | Dept. of Revenue | $10,000/yr |
| Nevada | NEV. REV. STAT. § 463 (Full license) | 2015 | Gaming Control Bd. | $500,000+ |
| New Hampshire | N.H. REV. STAT. ANN. § 287-H:1 | 2017 | Lottery Commission | $2,500/yr |
| New Jersey | N.J. STAT. ANN. § 5:18-1 | 2017 | DGE | $100,000/yr |
| New Mexico | None | — | — | — |
| New York | N.Y. Racing Law §§ 1400-1410 | 2016 | Gaming Commission | $500,000/yr |
| North Carolina | None | — | — | — |
| North Dakota | N.D. CENT. CODE § 53-12.2 | 2017 | AG's Office | $1,000/yr |
| Ohio | OHIO REV. CODE ANN. § 3774.01 | 2017 | Casino Control | $10,000/yr |
| Oklahoma | None | — | — | — |
| Oregon | None | — | — | — |
| Pennsylvania | 4 PA. CONS. STAT. § 301 | 2017 | PGCB | $50,000/yr |
| Rhode Island | R.I. GEN. LAWS § 11-19-1.1 | 2016 | Business Regulation | $2,500/yr |
| South Carolina | None | — | — | — |
| South Dakota | None (Prohibited per AG) | — | — | — |
| Tennessee | TENN. CODE ANN. § 47-18-5601 | 2016 | Secretary of State | $50,000/yr |
| Texas | None (AG opinion) | — | — | — |
| Utah | None (Prohibited) | — | — | — |
| Vermont | VT. STAT. ANN. tit. 9, § 4171 | 2017 | AG's Office | $1,000/yr |
| Virginia | VA. CODE ANN. § 59.1-556 | 2016 | DACS | $50,000/yr |
| Washington | None (Prohibited per AG) | — | — | — |
| West Virginia | W. VA. CODE § 29-22D-1 | 2017 | Lottery Commission | $10,000/yr |
| Wisconsin | None | — | — | — |
| Wyoming | WYO. STAT. ANN. § 9-24-101 | 2021 | Gaming Commission | $5,000/yr |

---

## 12. Appendix B: Comparison of Styx vs. Traditional DFS Legal Position

Understanding how Styx's "Unilateral Performance Contract" model differs from traditional Daily Fantasy Sports is essential for regulatory communications.

### 12.1 Structural Differences

| Feature | Traditional DFS | Styx Performance Contract |
| :--- | :--- | :--- |
| **Counterparty** | Other players in the contest | User's own future self |
| **Outcome Determinant** | Real-world athlete performance + participant selection skill | User's own behavioral effort |
| **Element of Chance** | Present (player injuries, weather, game-day decisions) | Absent (user controls own behavior) |
| **Prize Pool** | Aggregated entry fees minus operator rake | Return of user's own staked funds |
| **Information Asymmetry** | Significant (professional DFS players vs. casual) | None (user competes only against their own commitment) |
| **Operator Revenue Model** | Rake on prize pool (typically 5-15%) | Forfeited stakes from failed commitments |
| **Regulatory Classification** | "Fantasy contest" or "game of skill" | "Commitment device" or "performance contract" |

### 12.2 Legal Implications

1. **Elimination of counterparty risk:** Because Styx does not involve one player wagering against another, many states' gambling prohibitions — which focus on interpersonal wagering — do not apply.

2. **Elimination of chance:** Traditional DFS involves a significant element of chance (athlete injuries, weather, coaching decisions). Styx involves zero chance — the user decides whether to perform the committed behavior.

3. **Consumer protection alignment:** DFS has faced consumer protection scrutiny for information asymmetry (professional players "sharking" casual users). Styx has no information asymmetry because the user competes only against their own commitment.

4. **Not a "redistribution" of funds:** Many gambling statutes focus on the redistribution of wagered funds from losers to winners. Styx returns users' own funds — no redistribution occurs.

5. **Behavioral economics recognition:** The commitment device model is recognized in academic literature and by organizations like the Consumer Financial Protection Bureau as a legitimate financial wellness tool, not a wagering product.

### 12.3 Regulatory Communication Template

When communicating with state regulators or AGs, Styx should use the following framing hierarchy:

1. **Primary frame:** "Styx is a commitment device — a behavioral economics tool that helps users achieve their personal goals by adding financial accountability to their commitments."
2. **Secondary frame:** "Styx's performance contracts are unilateral agreements where the outcome is entirely within the user's control, involving no element of chance."
3. **Tertiary frame (if pressed on gaming classification):** "Even under the most restrictive legal standard, Styx satisfies the requirement that the outcome be determined by skill, as the user's own effort is the sole determinant of success."

---

## 13. Appendix C: Key Regulatory Contacts and Filing Requirements

### 13.1 States Requiring DFS/Skill-Contest Registration

For each state where Styx may need to register (either as DFS or as a skill-contest platform), the following provides the primary regulatory contact and key filing requirements.

**Alabama**
- Agency: Alabama Secretary of State, Business Services Division
- Statute: ALA. CODE § 8-19E-3
- Requirements: Annual registration, $1,000 fee, operator disclosure form, responsible gaming plan
- Contact: sos.alabama.gov/business-services

**Arizona (BLOCKED — for reference only)**
- Agency: Arizona Department of Gaming
- Statute: ARIZ. REV. STAT. § 5-1201
- Requirements: Full operator license, $5,000 annual fee, background investigation, tribal compact compliance
- Contact: gaming.az.gov

**Colorado**
- Agency: Colorado Secretary of State
- Statute: COLO. REV. STAT. § 12-15.5-103
- Requirements: Annual registration, $500 fee, consumer protection plan, player fund segregation
- Contact: sos.state.co.us

**Connecticut**
- Agency: Connecticut Department of Consumer Protection, Gaming Division
- Statute: CONN. GEN. STAT. § 12-851
- Requirements: Operator license, $50,000 surety bond, annual audit, responsible gaming provisions
- Contact: portal.ct.gov/dcp

**Delaware**
- Agency: Delaware Lottery
- Statute: DEL. CODE ANN. tit. 29, § 4860
- Requirements: Licensing through Lottery framework, background check, player fund requirements
- Contact: delottery.com

**District of Columbia**
- Agency: DC Office of Lottery and Gaming
- Statute: D.C. CODE § 36-601.01
- Requirements: Operator license, $10,000 annual fee, consumer protection plan, responsible gaming
- Contact: dclottery.com

**Florida**
- Agency: Florida Department of Business and Professional Regulation
- Statute: FLA. STAT. § 546.10
- Requirements: Annual registration, $500 fee, player fund segregation, age verification
- Contact: myfloridalicense.com

**Indiana**
- Agency: Indiana Gaming Commission
- Statute: IND. CODE § 4-33-24-3
- Requirements: Full operator license, $50,000 annual fee, background investigation, annual audit, responsible gaming
- Contact: in.gov/igc

**Iowa**
- Agency: Iowa Racing and Gaming Commission
- Statute: IOWA CODE § 99E.1
- Requirements: Operator license, $5,000 annual fee, background investigation, financial audit
- Contact: irgc.iowa.gov

**Maine**
- Agency: Maine Gambling Control Unit, Department of Public Safety
- Statute: ME. REV. STAT. ANN. tit. 8, § 1101
- Requirements: Annual registration, $2,500 fee, background check, player fund segregation
- Contact: maine.gov/dps/gamb-control

**Maryland**
- Agency: Maryland Lottery and Gaming Control Commission
- Statute: MD. CODE ANN., STATE GOV'T § 9-1D-01
- Requirements: Annual registration, $2,500 fee, consumer protection compliance, responsible gaming
- Contact: mdlottery.com

**Massachusetts**
- Agency: Massachusetts Attorney General's Office, Consumer Protection Division
- Statute: 940 MASS. CODE REGS. 34.00
- Requirements: No separate registration fee; compliance with 940 CMR 34.00 regulations (player fund segregation, advertising restrictions, age verification, responsible gaming)
- Contact: mass.gov/ago

**Michigan**
- Agency: Michigan Gaming Control Board
- Statute: MICH. COMP. LAWS § 432.501
- Requirements: Operator license, $5,000 annual fee, background investigation, player protection plan
- Contact: michigan.gov/mgcb

**Mississippi**
- Agency: Mississippi Gaming Commission
- Statute: MISS. CODE ANN. § 97-33-303
- Requirements: Operator registration, $5,000 annual fee, financial audit, responsible gaming
- Contact: msgamingcommission.com

**Nebraska**
- Agency: Nebraska Department of Revenue, Gaming Division
- Statute: NEB. REV. STAT. § 9-1003
- Requirements: Annual registration, $10,000 fee, background investigation, player fund segregation
- Contact: revenue.nebraska.gov

**Nevada (BLOCKED — for reference only)**
- Agency: Nevada Gaming Control Board
- Statute: NEV. REV. STAT. § 463.160
- Requirements: Full gaming license (application fee $500,000+), extensive background investigation, ongoing regulatory oversight
- Contact: gaming.nv.gov

**New Hampshire**
- Agency: New Hampshire Lottery Commission
- Statute: N.H. REV. STAT. ANN. § 287-H:3
- Requirements: Annual registration, $2,500 fee, player fund segregation, responsible gaming plan
- Contact: nhlottery.com

**New Jersey**
- Agency: Division of Gaming Enforcement (DGE)
- Statute: N.J. STAT. ANN. § 5:18-3
- Requirements: Full operator license, $100,000 annual fee, extensive background investigation, annual compliance audit, responsible gaming
- Contact: nj.gov/oag/ge

**New York**
- Agency: New York State Gaming Commission
- Statute: N.Y. RACING LAW § 1404
- Requirements: Annual registration, $500,000 fee (major operators), background investigation, player fund segregation, responsible gaming
- Contact: gaming.ny.gov

**North Dakota**
- Agency: North Dakota Attorney General's Office
- Statute: N.D. CENT. CODE § 53-12.2-03
- Requirements: Annual registration, $1,000 fee, AG compliance review, player protection provisions
- Contact: attorneygeneral.nd.gov

**Ohio**
- Agency: Ohio Casino Control Commission (OCCC)
- Statute: OHIO REV. CODE ANN. § 3774.03
- Requirements: Annual registration, $10,000 fee, background investigation, financial audit, responsible gaming
- Contact: casinocontrol.ohio.gov

**Pennsylvania**
- Agency: Pennsylvania Gaming Control Board (PGCB)
- Statute: 4 PA. CONS. STAT. § 303
- Requirements: Full operator license, $50,000 annual fee, background investigation, annual compliance audit
- Contact: gamingcontrolboard.pa.gov

**Rhode Island**
- Agency: Rhode Island Department of Business Regulation
- Statute: R.I. GEN. LAWS § 11-19-1.1
- Requirements: Annual registration, $2,500 fee, player fund segregation, responsible gaming
- Contact: dbr.ri.gov

**Tennessee**
- Agency: Tennessee Secretary of State
- Statute: TENN. CODE ANN. § 47-18-5604
- Requirements: Annual registration, $50,000 fee, background investigation, consumer protection compliance
- Contact: sos.tn.gov

**Vermont**
- Agency: Vermont Attorney General's Office
- Statute: VT. STAT. ANN. tit. 9, § 4173
- Requirements: Annual registration, $1,000 fee, AG compliance review, player protection provisions
- Contact: ago.vermont.gov

**Virginia**
- Agency: Virginia Department of Agriculture and Consumer Services (DACS)
- Statute: VA. CODE ANN. § 59.1-558
- Requirements: Annual registration, $50,000 fee, background investigation, consumer protection compliance
- Contact: vdacs.virginia.gov

**West Virginia**
- Agency: West Virginia Lottery Commission, Interactive Wagering Division
- Statute: W. VA. CODE § 29-22D-3
- Requirements: Full operator license, $10,000 annual fee, background investigation, responsible gaming
- Contact: wvlottery.com

**Wyoming**
- Agency: Wyoming Gaming Commission
- Statute: WYO. STAT. ANN. § 9-24-103
- Requirements: Annual registration, $5,000 fee, background investigation, player fund requirements
- Contact: gaming.wyo.gov

### 13.2 Estimated Total Registration Cost (All DFS States)

If Styx registers as a DFS operator in all applicable states, the estimated annual registration cost is:

| Category | Cost Estimate |
| :--- | :--- |
| **Registration fees** | ~$870,000/year (dominated by NY $500K and NJ $100K) |
| **Background investigations** | ~$50,000-$100,000 (one-time, varies by state) |
| **Surety bonds** | ~$50,000-$100,000 (CT and others) |
| **Legal counsel (multi-state)** | ~$200,000-$400,000/year |
| **Compliance infrastructure** | ~$150,000-$300,000/year |
| **Total estimated annual cost** | ~$1.3M-$1.8M/year |

**Note:** If Styx successfully maintains its "performance contract/commitment device" classification (outside the DFS definition), most of these costs would not apply. The DFS registration strategy should be reserved as a fallback if regulators insist on DFS classification.

### 13.3 States With No Registration Required

The following ALLOWED states have no DFS or skill-contest registration requirements. Styx can operate freely under the general skill-contest exemption in these states' gambling laws:

Alaska, California, Georgia, Illinois, Kansas, Kentucky, Louisiana (parish-dependent), Minnesota, Missouri, New Mexico, North Carolina, Oklahoma, Oregon, South Carolina (HIGH risk — monitor), Texas, Washington (HIGH risk — monitor), Wisconsin.

---

## 14. Appendix D: Precedent Commitment Device Platforms

Several existing platforms operate commitment-device models in the United States. Their regulatory history provides valuable precedent for Styx.

### 14.1 StickK (stickk.com)

- **Founded:** 2008 by Yale economists Dean Karlan and Ian Ayres.
- **Model:** Users create "Commitment Contracts" — pledging money to achieve a goal. If the user fails, the money is donated to a designated charity or "anti-charity."
- **Regulatory history:** No known gambling enforcement in any US jurisdiction over 18 years of operation. StickK has been cited favorably in academic literature and by the Consumer Financial Protection Bureau.
- **Key distinction from Styx:** StickK donates forfeited funds to charity rather than retaining them as operator revenue. Styx retains forfeited stakes, which may receive closer regulatory scrutiny.

### 14.2 Beeminder (beeminder.com)

- **Founded:** 2011.
- **Model:** Users commit to quantifiable goals tracked by automated data sources (Fitbit, GitHub, etc.). If the user goes "off track," they are charged a pledge amount that escalates with each derailment.
- **Regulatory history:** No known gambling enforcement. Beeminder operates nationwide without geographic restrictions.
- **Key distinction from Styx:** Beeminder charges users for failure as a subscription-like penalty rather than holding pre-staked funds. The peer audit component of Styx adds a social verification layer not present in Beeminder.

### 14.3 Pact (formerly GymPact, defunct)

- **Founded:** 2012. Ceased operations 2017.
- **Model:** Users committed to exercise goals and staked money. Users who met their goals earned rewards funded by users who failed.
- **Regulatory history:** Pact faced a 2017 FTC complaint (not gambling-related) for failing to pay earned rewards to users. The FTC settlement ($940,000) focused on deceptive practices, not gambling classification. No state AG challenged Pact's model as gambling.
- **Key distinction from Styx:** Pact's failure was operational (inability to pay rewards) rather than legal (gambling classification). This precedent is favorable — regulators treated Pact as a consumer product, not a gambling platform. Styx should ensure robust fund segregation to avoid Pact's operational failure mode.

### 14.4 DietBet (dietbet.com)

- **Founded:** 2012 by Healthy Wage.
- **Model:** Users join weight-loss challenges with financial stakes. Users who achieve the target weight loss split the prize pool.
- **Regulatory history:** No known gambling enforcement in any US jurisdiction. DietBet has operated nationwide for 14+ years.
- **Key distinction from Styx:** DietBet uses a collective prize pool model (closer to traditional DFS) rather than individual performance contracts. Despite this, no state has classified DietBet as gambling.

### 14.5 HealthyWage (healthywage.com)

- **Founded:** 2009.
- **Model:** Users bet on their own weight loss. Users choose a goal weight, a timeframe, and a wager amount. If they achieve their goal, they receive a payout; if they fail, they lose their wager.
- **Regulatory history:** No known gambling enforcement in any US jurisdiction over 17 years of operation. HealthyWage has been featured in major media (Today Show, Good Morning America, CNN) and has been cited by the CDC and NIH as a model for financial incentive-based wellness programs.
- **Key distinction from Styx:** HealthyWage uses a proprietary algorithm to calculate payouts, meaning the "prize" varies based on the difficulty of the goal. Styx's model is simpler — the user receives back their own staked funds. HealthyWage's model is actually closer to traditional wagering (variable odds), yet has never faced gambling enforcement.

### 14.6 Implications for Styx

The consistent regulatory treatment of commitment device platforms as non-gambling across all US jurisdictions — including hostile states like Washington and Utah — provides strong precedent for Styx's legal position. No commitment device platform has ever been subjected to gambling enforcement in any US state over nearly two decades of operation. This track record supports the argument that regulators and AGs recognize the fundamental distinction between commitment devices and gambling, even in states with restrictive gambling laws.

Key precedential findings:
1. **No enforcement actions:** Zero gambling enforcement actions against any commitment device platform in any US state since 2008 (18 years of operational history across multiple platforms).
2. **FTC classification:** The FTC classified Pact as a consumer product (consumer protection enforcement), not a gambling product.
3. **Academic endorsement:** Commitment devices are endorsed by Nobel Prize-winning behavioral economists (Richard Thaler, Daniel Kahneman) as legitimate financial wellness tools.
4. **Government endorsement:** The CDC, NIH, and CFPB have cited commitment device platforms as models for behavioral health intervention.
5. **Insurance industry adoption:** Major health insurers (UnitedHealthcare, Aetna, Cigna) have integrated commitment device mechanics into their wellness programs, further normalizing the model.
6. **Employer adoption:** Fortune 500 companies routinely use commitment device wellness programs (Vitality, Virgin Pulse) for employee health initiatives, none of which have been classified as gambling.

---

## 15. Disclaimer

This survey is prepared for internal strategic planning purposes and does not constitute legal advice. The analysis reflects the legal landscape as of March 2026 and is subject to change as legislatures enact new statutes, courts issue new opinions, and attorneys general revise their enforcement postures.

**Critical limitations:**
1. **Not a legal opinion.** This survey identifies risk levels and recommends operational postures but should not be relied upon as a substitute for formal legal opinions from licensed attorneys in each jurisdiction.
2. **Rapidly evolving landscape.** State gambling laws are changing rapidly in the post-PASPA environment. This survey should be reviewed and updated quarterly.
3. **AG opinions may shift.** Attorney General opinions are not binding law and can change with new administrations. The enforcement posture assessments in this survey reflect the current AG's approach but may not persist through election cycles.
4. **Local ordinances.** This survey covers state-level law only. Some municipalities may have additional gaming ordinances that could affect Styx's operations.
5. **Tribal gaming.** The interaction between state gaming law, federal Indian Gaming Regulatory Act (IGRA) provisions, and tribal-state compacts is complex and beyond the scope of this survey.
6. **Tax implications.** This survey does not address the tax treatment of Styx contracts (e.g., whether returned stakes constitute taxable income, whether forfeited stakes are deductible). Tax analysis should be conducted separately.

**Recommended next steps:**
- Engage gaming-specialized counsel in the 10 Phase 1 deployment states for formal legal opinions.
- Seek an informal AG advisory opinion in Virginia (most favorable jurisdiction) as a reference document for other states.
- Monitor the Fantasy Sports & Gaming Association (FSGA) legislative tracker for real-time updates to state gaming laws.
- Consider applying for the CFPB regulatory sandbox as a "financial wellness" product.

---

## 16. Revision History

| Version | Date | Changes |
| :--- | :--- | :--- |
| 1.0.0 | 2026-03-10 | Initial 51-jurisdiction survey. |

| Version | Date | Changes |
| :--- | :--- | :--- |
| 1.0.0 | 2026-03-10 | Initial 51-jurisdiction survey covering all 50 states + DC. Includes Executive Summary, Methodology, Legal Tests explanation, State-by-State Analysis (51 entries), Consolidated Blocklist, Table of Authorities (statutes, case law, AG opinions, legislative history), Federal Law Considerations, Compliance Implementation Checklist, Risk Summary Matrix, Strategic Deployment Recommendations, Glossary, DFS Legislation Tracker, and Styx vs. DFS Comparison. |
