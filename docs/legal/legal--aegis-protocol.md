---
artifact_id: L-AP-01
title: "Styx Legal Compliance Guardrails — The Aegis Protocol"
date: "2026-03-09"
version: "0.2.0-draft"
owner: "agent/research-support"
approval_status: "draft"
citation_format: "bluebook"
source_documents:
  - "docs/legal/legal--performance-wagering.md"
  - "docs/legal/legal--compliance-guardrails.md"
  - "docs/research/research--bounty-shame-protocol-safety-legality.md"
  - "docs/legal/regulatory-risk-register.md"
linked_issues: []
---

# Styx Legal Compliance Guardrails — The Aegis Protocol

## 1. Purpose and Scope

The Aegis Protocol defines the non-negotiable compliance guardrails that maintain Styx's legal classification as a skill-based behavioral commitment system rather than a gambling, lottery, or wagering product. These guardrails are structural — they are embedded in the product architecture, not merely stated in terms of service.

Every guardrail in this document serves a dual function: (1) it protects users from harm, and (2) it provides a concrete legal defense against classification as illegal gambling under the three-element test (prize, consideration, chance) applied across United States jurisdictions. *See* 31 U.S.C. § 5362(1)(E)(ix) (2006) (excluding from the definition of "bet or wager" certain games of skill where the outcome is substantially based on the skill of the participants).

> **Implementation status cross-reference:** For the claim-to-control mapping of each guardrail (Implemented / Partial / Planned / Research), see `docs/planning/planning--implementation-status.md`.

---

## 2. Skill-Based Contest Classification

### 2.1 Legal Basis

Styx operates as a **skill-based deposit contract**, not a gambling platform. The legal theory rests on eliminating the "chance" element from the three-element gambling test recognized across nearly all United States jurisdictions. *See* Braslow Legal, *A Legal Guide to Skill Gaming* (2020) (surveying the three-element test across jurisdictions).

Under the Dominant Factor Test — the most widely adopted standard — an activity is a legal game of skill if the outcome is determined more than 50% by the participant's skill, knowledge, strategy, and effort rather than by chance. *See White v. Cuomo*, 38 N.Y.3d 311, 319 (2022) (adopting the dominant factor test as the constitutional standard for judging games of chance under the New York State Constitution); *Dew-Becker v. Wu*, 2020 IL 124472, ¶ 38 (holding that head-to-head contests where skill determines the victor do not constitute gambling under Illinois law).

### 2.2 Product Design Requirements

For the skill-based classification to hold, the following product design constraints are mandatory:

1. **No random number generation (RNG)** in outcome determination. Styx does not use dice, card draws, slot mechanics, or any chance-based allocation.
2. **No house-set odds.** Styx does not set odds or probability spreads. The platform collects a flat service fee, not a vigorish.
3. **No random prize allocation.** All prize distribution follows deterministic, published rules based on verified behavioral performance.
4. **Behavioral input metrics.** Success is measured by logged user actions (steps walked, workouts completed, meals logged) rather than outcome-only metrics susceptible to chance interpretation.
5. **Transparent scoring algorithms.** All scoring rules are published in the user-facing Terms of Service and available for audit.
6. **Cryptographic verification.** All goal completions must be verified through the platform's verification pipeline (photo proof, wearable sync, or peer attestation) before any payout is authorized.

### 2.3 Jurisdictional Classification

| Legal Test | Standard | Styx Risk Level | Basis |
|---|---|---|---|
| **Dominant Factor Test** | Skill must outweigh chance (>50%) | Low | User controls diet, exercise, and behavioral compliance. *White v. Cuomo*, 38 N.Y.3d at 319. |
| **Material Element Test** | Chance cannot play a material role | Low | Minor chance elements (illness, metabolic variance) are not material to multi-week behavioral goals. |
| **Any Chance Test** | Any chance element = gambling | Elevated | Theoretical chance of sudden illness; mitigated by geofencing states that apply this test. |

**Geofencing requirement:** States applying the Any Chance Test (historically Arizona, Arkansas) must be excluded from the platform's operational territory via `STYX_STATE_BLOCKLIST` enforcement at the API layer. *See* `docs/legal/legal--cross-jurisdictional-consent-matrix.md` § 8 (state blocklist implementation). The launch-state rationale set is tracked in `docs/legal/appendices/appendix-d--state-blocklist-justification-table.md`.

---

## 3. Medical Guardrails

### 3.1 Age Requirement — 18+

**Rule:** No user under the age of 18 may create an account or participate in any commitment contract involving financial stakes.

**Legal basis:** Participants must be legally capable of entering into a binding contract. *See* Restatement (Second) of Contracts § 14 (1981) (stating that minors lack capacity to incur contractual duties). Both DietBet and HealthyWage mandate 18+ participation. *See* DietBet, *Weight Loss Challenge Rules*, https://www.dietbet.com/kickstarter/rules (last visited Mar. 9, 2026); HealthyWage, *Official Rules*, https://www.healthywage.com/rules/official-rules/ (last visited Mar. 9, 2026).

Recent state legislation underscores regulatory hostility toward youth involvement in weight-related commercial incentives. *See* N.Y. Gen. Bus. Law § 391-oo (restricting sale of weight-loss supplements to minors); *see also* Epstein Becker Green, *Second Circuit Affirms Denial of Preliminary Injunction in Challenge to N.Y. Law* (2026) (upholding the statute against First Amendment challenge).

**Implementation tiers:**
- **TestFlight/Beta:** Self-declared age gate at onboarding (date-of-birth entry). [Status: Planned]
- **Public Launch:** Stripe Identity age verification for all users initiating financial commitments. [Status: Research]
- **High-Stakes (>$100):** Government ID verification via Stripe Identity or equivalent KYC provider. [Status: Research]

**Contract-language companion:** `docs/legal/appendices/appendix-b--terms-of-service-aegis-markup.md`.

### 3.2 BMI Floor — 18.5 Minimum

**Rule:** No user with a Body Mass Index below 18.5 at the time of enrollment may participate in any weight-loss commitment contract. No goal may be set that would result in a projected ending BMI below 18.5.

**Legal basis:** A BMI of 18.5 is the World Health Organization's threshold for underweight classification. Permitting underweight users to participate in financially incentivized weight-loss programs creates liability for facilitating eating disorders and invites enforcement actions from state attorneys general and the FTC. *See* FTC, *Voluntary Guidelines for Providers of Weight Loss Products or Services* (1999) (establishing disclosure and safety standards for weight-loss programs).

**Implementation:**
- Height and starting weight are captured at enrollment.
- The system computes BMI and rejects enrollment if BMI < 18.5.
- Goal-setting algorithms reject any target weight that would produce a projected ending BMI < 18.5.
- Mid-challenge weigh-ins that show BMI falling below 18.5 trigger automatic contract suspension with full refund.

### 3.3 Velocity Cap — Maximum 2% Body Weight Per Week

**Rule:** Any verified weight change exceeding 2% of total body weight per week results in automatic disqualification or weight adjustment.

**Medical basis:** The National Institutes of Health generally defines safe weight loss as one to two pounds per week, or approximately 1% of body weight per week. The 2% threshold provides a safety margin while preventing starvation, purging, severe dehydration, and other medically dangerous tactics.

**Precedent:** HealthyWage enforces a strict 2% per-week maximum and automatically adjusts ending weights upward when this threshold is exceeded. *See* HealthyWage, *Official Rules*, https://www.healthywage.com/rules/official-rules/ (last visited Mar. 9, 2026). DietBet caps maximum weight loss at 12% of initial body weight for four-week challenges. *See* DietBet, *Weight Loss Challenge Rules*, https://www.dietbet.com/kickstarter/rules (last visited Mar. 9, 2026).

**Formula:**
```
max_weekly_loss = starting_weight × 0.02
adjusted_weight = max(verified_weight, starting_weight - (max_weekly_loss × weeks_elapsed))
```

If `verified_weight < adjusted_weight`, the system substitutes `adjusted_weight` for all payout calculations.

**Prohibited behaviors** (declared in Terms of Service, trigger disqualification):
- Binging, purging, or self-induced vomiting
- Extreme fasting (>72 hours without caloric intake)
- Deliberate dehydration or unusual water loading before weigh-ins
- Use of laxatives, diuretics, or appetite suppressants not prescribed by a physician
- Surgical interventions (liposuction, bariatric surgery) during the challenge period

### 3.4 Pregnancy Exclusion

**Rule:** Pregnant users may not participate in weight-loss commitment contracts. Users who become pregnant during an active contract receive an immediate suspension with full refund and no penalty.

**Medical basis:** Intentional caloric restriction during pregnancy poses developmental risks to the fetus. Weight loss from giving birth does not count toward challenge goals.

**Precedent:** *See* HealthyWage, *Official Rules* (requiring pregnancy suspension without financial penalty); DietBet, *Weight Loss Challenge Rules* (same).

---

## 4. Financial Compliance — FBO Architecture

### 4.1 Zero Custody and Agent of the Payee Principles

**Rule:** Styx never holds, possesses, or takes legal title to user funds in corporate bank accounts. All user-staked capital is held in segregated "For Benefit Of" (FBO) accounts at a federally chartered banking institution via Stripe Connect.

**Legal basis:** This architecture relies on a multi-layered regulatory safe harbor:

1.  **Bank-Centric Custody:** Because chartered banks are exempt from Money Transmitter Licensing (MTL) requirements, holding funds in an FBO account under the bank's regulatory umbrella ensures that legal custody remains with an exempt entity. The OCC has expressly endorsed bank-fintech custody partnerships: Interpretive Letter #1170 (Feb. 2020) confirms that national banks may partner with fintech companies for payment processing; Interpretive Letter #1174 (Oct. 2020) affirms that national banks may hold deposits on behalf of fintech platforms in FBO arrangements; and the OCC Conditional Approval Letter (Jan. 2021) establishes a payment charter framework recognizing non-traditional payment models. Together, these authorities confirm that Styx's bank-partnership FBO structure is squarely within the federally sanctioned regulatory model. *See also* CSBS, *Model Money Transmission Modernization Act* (2021) (excluding "the provision of payment processing services through a bank" from the definition of "money transmission" — approximately 30 states have adopted or are considering legislation based on this model).
2.  **Federal (FinCEN) Exemptions:** Styx operates as a payment processor and escrow agent whose transmission of funds is "necessary and integral" to the underlying behavioral verification service. *See* FinCEN Administrative Rulings FIN-2014-R004 (Mar. 11, 2014) and FIN-2019-G001 (May 9, 2019). 
3.  **Agent of the Payee (AOTP):** In most US jurisdictions (e.g., CA, NY, TX), a person who accepts currency as an agent of the payee is not a money transmitter. Styx acts as the agent for the redistribution pool; thus, receipt of funds by Styx (or its partner bank) legally satisfies the payor’s obligation. *See, e.g.*, Cal. Fin. Code § 2010(l); N.Y. Banking Law § 641(1); *see also* FinCEN Administrative Ruling FIN-2014-R007 (May 14, 2014).
4.  **Fiduciary Escrow Status:** Styx’s automated verification logic acts as the "conditions precedent" for fund release, establishing a fiduciary duty of strict compliance consistent with neutral escrow agents. *Cf. Heller v. Cen-Tex Savings & Loan Ass’n*, 410 S.W.2d 267 (Tex. Civ. App. 1966).

Failure to implement this structuring would require Styx to obtain MTLs in all fifty states and register as a Money Services Business (MSB) with FinCEN — a multi-year, multi-million-dollar compliance burden. *See* 31 C.F.R. § 1022.380.

**Supporting diagram:** `docs/legal/appendices/appendix-a--fbo-architecture-diagram.md`.

### 4.2 FBO Reconciliation

- **Deposit flow:** User → Stripe Connect payment intent → FBO account at partner bank. Styx's application server receives a webhook confirmation but never touches the funds.
- **Payout flow:** Upon verified goal completion, Styx issues a transfer instruction to Stripe Connect. Stripe executes the payout from the FBO account directly to the user's linked payout method.
- **Service fee:** Styx collects a flat platform fee (not a percentage of winnings) via Stripe's fee-splitting mechanism at the point of deposit. The fee is booked as earned revenue upon collection.
- **Ledger integrity:** A PostgreSQL double-entry ledger records every deposit, fee, hold, release, and payout as debits and credits. The ledger is the internal source of truth for all financial liabilities.

### 4.3 Audit Trail Requirements

- All fund movements must have corresponding ledger entries with timestamps, user IDs, and transaction references.
- Monthly reconciliation between the Stripe Connect balance report and the internal ledger is mandatory.
- Discrepancies exceeding $1.00 must be investigated and resolved within 48 hours.
- Reconciliation reports are retained for 7 years per IRS record-keeping requirements. *See* 26 C.F.R. § 1.6001-1 (general record-keeping requirement).

---

## 5. Compliance Testing Framework

Each guardrail must be verifiable through automated or manual testing:

| Guardrail | Test Method | Pass Criteria | Frequency |
|---|---|---|---|
| Skill-based classification | Architecture review | No RNG, no house odds, no random prize allocation in codebase | Per release |
| Age gate | Automated test | Users declaring age <18 cannot create accounts | Per release |
| BMI floor | Automated test | Enrollment rejected when computed BMI < 18.5 | Per release |
| Velocity cap | Automated test | Weigh-in exceeding 2%/week triggers adjustment or disqualification | Per release |
| Pregnancy exclusion | Manual test | Suspension flow returns full refund, no penalty | Quarterly |
| FBO zero-custody | Stripe dashboard audit | No user funds in corporate Stripe account | Monthly |
| Ledger reconciliation | Automated script | Stripe balance matches internal ledger ± $1.00 | Monthly |
| State geofencing | Automated test | API rejects requests from blocked state IP ranges | Per release |

---

## 6. Risk Register Cross-References

| Aegis Guardrail | Risk Register Entry | Mitigation Status |
|---|---|---|
| Skill-based classification | R-01: Gambling Classification | Active — see `legal--skill-based-contest-whitepaper.md` |
| Medical guardrails | R-05: User Health Liability | Active — velocity cap + BMI floor |
| FBO architecture | R-02: Money Transmitter Classification | Active — Stripe Connect FBO |
| Age verification | R-04: Minor Participation | Planned — Stripe Identity integration |
| State geofencing | R-09: Cross-Jurisdictional Consent | Active — see `legal--cross-jurisdictional-consent-matrix.md` |

---

## 7. Document History

| Version | Date | Author | Changes |
|---|---|---|---|
| 0.1.0 | 2026-02-24 | agent/research-support | Initial stub (3 sections) |
| 0.2.0-draft | 2026-03-09 | agent/research-support | Full rewrite with Bluebook citations, compliance testing framework, risk register cross-references |
| 0.3.0-draft | 2026-03-10 | agent/research-support | Expanded Table of Authorities; added HHS-OIG clinical safety precedent |
| 0.4.0-draft | 2026-03-10 | agent/financial-reg | Strengthened FBO legal basis (§4.1); added AOTP and fiduciary escrow analysis; integrated FinCEN rulings |
| 0.5.0-draft | 2026-03-10 | agent/financial-reg | Added OCC interpretive letters and CSBS model act to §4.1 bank-centric custody; synced FIN-2013-G001 and Tex. Fin. Code § 151.003(9) into ToA |
| 0.6.0-draft | 2026-03-09 | agent/research-support | Added 3 cases to ToA (*FanDuel v. AG*, *Langone v. Kaiser*, *State v. Rosenthal*) per whitepaper #562 sync |

---

## Table of Authorities

### Cases

- *Dew-Becker v. Wu*, 2020 IL 124472 (Ill. 2020)
- *FanDuel, Inc. v. Attorney General*, No. 16-1079 (Mass. Super. Ct. 2016)
- *Heller v. Cen-Tex Savings & Loan Ass’n*, 410 S.W.2d 267 (Tex. Civ. App. 1966)
- *Humphrey v. Viacom, Inc.*, 2007 WL 1797648 (D.N.J. 2007)
- *Langone v. Kaiser*, 2016 WL 7104331 (N.D. Ill. 2016)
- *Las Vegas Hacienda, Inc. v. Gibson*, 359 P.2d 85 (Nev. 1961)
- *Morrow v. State*, 511 P.2d 127 (Alaska 1973)
- *Murphy v. NCAA*, 584 U.S. 453 (2018)
- *People v. World Interactive Gaming Corp.*, 714 N.Y.S.2d 844 (N.Y. Sup. Ct. 1999)
- *State v. Rosenthal*, 559 P.2d 830 (Nev. 1977)
- *White v. Cuomo*, 38 N.Y.3d 311 (N.Y. 2022)

### Statutes and Regulations

- 26 C.F.R. § 1.6001-1 (general record-keeping requirements)
- 31 C.F.R. § 1022.380 (FinCEN MSB registration)
- 31 U.S.C. §§ 5311-5330 (Bank Secrecy Act)
- 31 U.S.C. § 5362(1)(E)(ix) (UIGEA definition of "bet or wager")
- Cal. Fin. Code § 2010(l) (Agent of Payee exemption)
- N.Y. Banking Law § 641(1) (Agent of Payee exemption)
- N.Y. Gen. Bus. Law § 391-oo (weight-loss supplement restrictions for minors)
- Restatement (Second) of Contracts § 14 (1981)
- Tex. Fin. Code § 151.003(9) (Texas money transmitter exemption for agents of payee)

### Administrative Materials

- FinCEN Administrative Ruling FIN-2014-R004 (Mar. 11, 2014)
- FinCEN Administrative Ruling FIN-2014-R007 (May 14, 2014)
- FinCEN, *Application of FinCEN's Regulations to Persons Administering, Exchanging, or Using Virtual Currencies*, FIN-2013-G001 (Mar. 18, 2013)
- FinCEN, *Definition of Money Transmitter (Third-Party Payment Processors)*, FIN-2004-1 (Aug. 17, 2004)
- FinCEN Guidance FIN-2019-G001 (May 9, 2019)
- HHS-OIG Advisory Opinion No. 22-04 (Mar. 2022)
- OCC Conditional Approval Letter (Jan. 2021) (payment charter framework for non-bank payment companies)
- OCC Interpretive Letter #1170 (Feb. 2020) (bank-fintech partnership models for payment processing)
- OCC Interpretive Letter #1174 (Oct. 2020) (national banks may hold reserves and serve as FBO custodians for fintech platforms)
- SAMHSA, *Advisory: Contingency Management for the Treatment of Substance Use Disorders* (2025 update)

### Secondary Sources

- Braslow Legal, *A Legal Guide to Skill Gaming* (2020)
- Conference of State Bank Supervisors (CSBS), *Model Money Transmission Modernization Act* (2021)
- DietBet, *Weight Loss Challenge Rules*, https://www.dietbet.com/kickstarter/rules
- FTC, *Voluntary Guidelines for Providers of Weight Loss Products or Services* (1999)
- HealthyWage, *Official Rules*, https://www.healthywage.com/rules/official-rules/
- Modern Treasury, *How Do Money Transmission Laws Work?* (2024)
