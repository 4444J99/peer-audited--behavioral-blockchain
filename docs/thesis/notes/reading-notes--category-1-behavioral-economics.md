# Reading Notes: Category 1 — Behavioral Economics & Decision Science

> **Dissertation sections:** §2.1, §5.1, §5.5
> **Research questions:** RQ1 (loss aversion operationalization), RQ5 (legal classification)
> **Sources:** 13 entries (syllabus Cat. 1)
> **Date:** 2026-03-04

---

## 1.1 Seminal Theory

### Kahneman & Tversky (1979) — Prospect Theory

**Key findings:**
- People evaluate outcomes relative to a reference point, not absolute wealth
- The value function is concave for gains, convex for losses, and steeper for losses than gains
- Loss aversion coefficient empirically measured at λ ≈ 2.0 (later refined to 1.955 in Tversky & Kahneman 1992)
- Probability weighting: overweight small probabilities, underweight moderate-to-high probabilities

**Styx application:**
- The entire staking mechanism is built on this asymmetry: users perceive the potential loss of their stake ~2× more painfully than they would value an equivalent reward
- λ = 1.955 is the calibration constant in `behavioral-logic.ts:LOSS_AVERSION_COEFFICIENT`
- Reference point = the moment of staking (mental accounting creates a new "vault" account)

**Dissertation use:**
- §2.1 foundational framing: prospect theory as the theoretical basis for commitment devices
- §3.3 formal definition of the penalty-weighted utility function
- §5.1 comparison with DietBet/Beeminder which use simpler linear incentive models

### Tversky & Kahneman (1992) — Cumulative Prospect Theory

**Key findings:**
- Extended PT to uncertain prospects with multiple outcomes
- Fourfold pattern of risk attitudes: risk-seeking for low-probability losses, risk-averse for high-probability gains
- Refined λ to 2.25 in experimental settings (Styx uses 1.955 as a conservative calibration)

**Styx application:**
- Tiered staking exploits the fourfold pattern: micro-stakes users are in a different risk quadrant than whale-vault users
- The onboarding $5 bonus (endowed-progress effect) creates a "house money" frame that shifts the reference point

### Kahneman (2011) — Thinking, Fast and Slow

**Key findings:**
- System 1 (fast, automatic) vs. System 2 (slow, deliberative) processing
- Loss aversion as System 1 default — automatic emotional response to potential losses
- Endowment effect: people value what they already "own" (including committed stakes)

**Styx application:**
- Contract creation requires System 2 deliberation (the "Grill-Me" AI feature forces reflective processing)
- Daily check-ins exploit System 1 fear-of-loss automaticity
- The 7-day cool-off period after failure prevents System 1 "revenge staking"

### Ariely (2008) — Predictably Irrational

**Key findings:**
- Zero price effect: free things are disproportionately attractive
- Relativity in pricing: options are evaluated relative to each other, not absolutely
- Social vs. market norms: introducing money changes the frame

**Styx application:**
- The $5 onboarding bonus exploits the zero-price effect (free money anchors participation)
- Tiered pricing creates relativity anchors ($20 feels small next to $100 option)
- Critical tension: financial stakes invoke market norms, but Fury community requires social norms — the design must balance both

### Thaler & Sunstein (2008) — Nudge

**Key findings:**
- Choice architecture: the way options are presented affects decisions
- Libertarian paternalism: design defaults that help without restricting choice
- NUDGES: iNcentives, Understand mappings, Defaults, Give feedback, Expect error, Structure complex choices

**Styx application:**
- Styx IS a choice architecture — voluntary opt-in, but the frame (financial stakes) shapes behavior
- Default contract templates serve as nudge defaults
- Grace days = "expect error" design principle
- The linguistic cloaker (vault/commitment terminology) is itself a framing nudge

---

## 1.2 Mental Accounting & Framing

### Thaler (1999) — Mental Accounting Matters

**Key findings:**
- People segregate money into mental accounts (violating fungibility)
- Opening/closing accounts has distinct emotional signatures
- Transaction utility: the deal itself generates pleasure/pain independent of consumption

**Styx application:**
- Users treat "Styx vault money" as psychologically different from bank balance — the stake occupies its own mental account
- Forfeiture = forced closure of a mental account → disproportionate pain
- The endowed-progress $5 bonus creates a mental account that users are loss-averse about

### Benartzi & Thaler (1995) — Myopic Loss Aversion

**Key findings:**
- Combination of loss aversion + frequent evaluation = myopic loss aversion
- More frequent evaluation increases experienced loss aversion
- The equity premium puzzle explained by investors checking portfolios too often

**Styx application:**
- Daily check-in cadence is a deliberate design choice: more frequent evaluation amplifies the psychological sting
- This is a double-edged sword — too frequent evaluation could increase stress beyond therapeutic benefit
- Aegis velocity caps may partially mitigate this risk

### Benartzi & Thaler (2004) — Save More Tomorrow

**Key findings:**
- Pre-commitment to future behavior changes achieves 78% opt-in
- Savings rates increased from 3.5% to 11.6% over 28 months
- Key mechanism: commitment made in a "cold" state about future "hot" state behavior

**Styx application:**
- Contract creation (cold state) → daily compliance (hot state) mirrors the SMarT architecture
- The Styx implementation adds financial consequences that SMarT lacks
- Tiered escalation (start small, increase stakes) mirrors SMarT's gradual increase design

---

## 1.3 Present Bias & Time Inconsistency

### Laibson (1997) — Golden Eggs & Hyperbolic Discounting

**Key findings:**
- β-δ quasi-hyperbolic discounting model: U = u₀ + β Σ δᵗ uₜ
- β < 1 captures present bias (immediate gratification preference)
- Demand for commitment devices arises endogenously from self-aware present-biased agents

**Styx application:**
- Styx users ARE β-δ agents who recognize their own present bias and seek external commitment
- The platform's value proposition is precisely Laibson's commitment device demand
- Sophisticated users (who know their β) self-select appropriate stake levels; naive users (who overestimate their β) need Aegis protection

### O'Donoghue & Rabin (1999) — Doing It Now or Later

**Key findings:**
- Naive present-biased agents procrastinate more than sophisticated ones
- Naifs overestimate future self-control; sophisticates may over-commit
- Commitment devices help both types but through different channels

**Styx application:**
- Tiered staking implicitly segments naives (who might over-stake) from sophisticates (who calibrate correctly)
- Aegis guards against the naive over-staking pattern (failure downscaling, max stake cap)
- The "Grill-Me" AI feature aims to increase sophistication (self-awareness)

### Loewenstein & Prelec (1992) — Anomalies in Intertemporal Choice

**Key findings:**
- Gain-loss asymmetry in discounting: losses are discounted less steeply than gains
- Magnitude effect: large outcomes are discounted less than small ones
- Sequence effects: people prefer improving sequences over declining ones

**Styx application:**
- Gain-loss asymmetry validates that financial losses (forfeited stakes) motivate more powerfully than equivalent rewards
- Magnitude effect informs tier design: meaningful stakes ($100+) create qualitatively different commitment than micro-stakes ($5)

---

## 1.4 Commitment Devices

### Bryan, Karlan & Nelson (2010) — Commitment Devices

**Key findings:**
- Taxonomy: soft (psychological) vs. hard (financial/physical) commitment devices
- Evidence for demand: 28% of Filipino bank customers voluntarily chose commitment savings accounts
- Financial commitment devices show stronger effects than purely psychological ones
- Key design parameters: commitment stringency, stakes, monitoring, social visibility

**Styx application:**
- Styx is a hard commitment device (financial stakes)
- The Fury network provides monitoring; the Tavern provides social visibility
- This is THE central academic reference for positioning Styx within the commitment device literature

### Gneezy & Rustichini (2000) — Pay Enough or Don't Pay at All

**Key findings:**
- Small financial incentives ($0.10) REDUCED performance vs. no incentive
- Larger incentives ($3.00+) improved performance
- Hypothesis: small payments crowd out intrinsic motivation by shifting from social to market norms

**Styx application:**
- Direct theoretical justification for tiered staking with meaningful minimums
- Micro-stakes ($1-5) may be counterproductive — validates TIER_1_MICRO_STAKES as an entry point but not the optimal commitment level
- Supports the Aegis minimum duration (7 days): too-short contracts resemble "small" incentives

---

## Cross-Cutting Themes for Dissertation

1. **λ = 1.955 as design constant:** Grounded in Kahneman & Tversky (1979), refined by Tversky & Kahneman (1992), operationalized in Styx's penalty weighting
2. **Mental accounting separation:** Thaler (1999) explains why stakes feel psychologically "real" even though the money is fungible
3. **Pre-commitment architecture:** Laibson (1997) + Benartzi & Thaler (2004) + Bryan et al. (2010) form the theoretical chain: demand exists → pre-commitment works → financial commitment is strongest
4. **Crowding-out risk:** Gneezy & Rustichini (2000) warns that stakes must be meaningful — aligns with Aegis minimum thresholds
5. **Legal implications:** The prospect theory framework distinguishes Styx from gambling (no probability weighting on uncertain outcomes; the user controls the outcome through behavior)
