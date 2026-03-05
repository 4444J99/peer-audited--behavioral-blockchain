# Reading Notes: Category 2 — Habit Formation & Behavior Change

> **Dissertation sections:** §2.2, §5.3
> **Research questions:** RQ1 (sustained adherence conditions), RQ3 (HVCS as design framework)
> **Sources:** 10 entries (syllabus Cat. 2) + 5 reference library books
> **Date:** 2026-03-04

---

## Automaticity & Timeline

### Lally et al. (2010) — How Are Habits Formed

**Key findings:**
- Median 66 days to automaticity (range 18–254 days)
- Missing a single day did NOT significantly affect habit formation
- Simpler behaviors (drinking water) formed faster than complex ones (exercise)
- Plateau model: automaticity increases asymptotically, not linearly

**Styx application:**
- Contract durations should span at least 66 days for full habit formation
- Grace days (2/month) are evidence-based: single misses don't derail formation
- Aegis minimum 7-day duration is a floor for disrupting existing patterns, not forming new ones
- Longer contracts (30–90 days) should be the recommended default

**Dissertation use:**
- §2.2 evidence base for contract duration design
- §5.3 comparison with Habitica/Duolingo streaks (which lack the 66-day research basis)

---

## Motivation Theory

### Ryan & Deci (2000) — Self-Determination Theory

**Key findings:**
- Three innate psychological needs: autonomy, competence, relatedness
- Intrinsic motivation requires all three to be satisfied
- External rewards can undermine intrinsic motivation (when autonomy is compromised)
- Internalization spectrum: external → introjected → identified → integrated regulation

**Styx application:**
- **Autonomy:** Voluntary opt-in preserves autonomy; user chooses stake level, oath category, duration
- **Competence:** Integrity score progression + tier advancement satisfies competence need
- **Relatedness:** Fury community, Tavern social features, accountability partners satisfy relatedness
- Critical design tension: financial stakes are extrinsic → risk of crowding out intrinsic motivation
- Styx aims for "identified regulation" (user personally values the behavior) rather than "external regulation" (doing it only for the money)

### Deci & Ryan (1985) — Intrinsic Motivation and Self-Determination

**Key findings:**
- Cognitive evaluation theory: events affecting perceived competence and self-determination affect intrinsic motivation
- Controlling events undermine motivation; informational events enhance it
- The "Why" matters: same reward framed as controlling ("you must") vs. informational ("here's how you're doing") produces different outcomes

**Styx application:**
- Fury feedback should be informational, not controlling
- The "ELI5" feature should frame performance data as growth information, not punishment
- UI copy throughout should use autonomous language ("you chose" vs. "you must")

### Baumeister, Vohs & Tice (2007) — Strength Model of Self-Control

**Key findings:**
- Self-control depletes a limited resource (ego depletion)
- Glucose appears to partially restore depleted self-control
- Practice may increase self-control capacity over time

**Styx application:**
- Peak-depletion moments (evening, stress, weekends) = highest failure risk
- Aegis volatility multiplier (1.5× on weekend nights) is grounded in depletion theory
- Grace days serve as depletion recovery mechanisms
- 7-day cool-off after failure allows ego depletion recovery

---

## Behavior Change Frameworks

### Prochaska & DiClemente (1983) — Stages of Change

**Key findings:**
- Five stages: precontemplation, contemplation, preparation, action, maintenance
- People cycle through stages non-linearly (relapse is normal)
- Different interventions are effective at different stages

**Styx application:**
- Marketing targets contemplation/preparation stages
- Contract creation = action stage transition
- Post-contract maintenance requires different support (lower stakes, community, intrinsic transfer)
- The HVCS model aligns: each stage maps to different "drive regulation" states

### Gollwitzer (1999) — Implementation Intentions

**Key findings:**
- "If-then" plans dramatically increase goal attainment (d = 0.65)
- Effective even for "hard" goals that simple goal intentions fail to achieve
- Creates automatic initiation of intended behavior upon encountering the specified cue

**Styx application:**
- Contract creation process IS a formalized implementation intention
- "If it's 6am, then I go to the gym and submit photo proof" is the exact if-then structure
- The oath category + verification method + deadline creates the full implementation intention

### Michie et al. (2011) — Behaviour Change Wheel / COM-B

**Key findings:**
- COM-B: Behavior requires Capability (physical/psychological), Opportunity (physical/social), Motivation (reflective/automatic)
- 9 intervention functions mapped to COM-B components
- 7 policy categories that enable interventions

**Styx mapping:**
| COM-B Component | Styx Feature |
|----------------|-------------|
| Physical capability | HealthKit/fitness tracking |
| Psychological capability | "Grill-Me" AI reflection |
| Physical opportunity | Mobile app access, proof submission |
| Social opportunity | Fury community, Tavern, accountability partners |
| Reflective motivation | Financial stakes (loss aversion) |
| Automatic motivation | Daily check-in habit loop, streak mechanics |

### Milkman et al. (2021) — Megastudies

**Key findings:**
- Tested 54 interventions on 61,293 gym members simultaneously
- Top performer: microrewards for returning after a missed workout (+27% visits)
- Social referrals and gamification had smaller effects
- Key insight: combinations of interventions may be more effective than any single one

**Styx application:**
- Validates the multi-mechanism approach: Styx combines financial stakes + social verification + AI coaching + gamification
- The "return after failure" finding supports grace day design and re-engagement nudges
- Megastudy methodology could inform future Styx RCT design (§5.7)

---

## Reference Library Synthesis

### Clear (2018) — Atomic Habits
- Four laws: make it obvious (implementation intention), attractive (loss aversion frame), easy (grace days reduce friction), satisfying (integrity score progression)
- Habit stacking applicable to proof submission routines

### Fogg (2019) — Tiny Habits
- Behavior = Motivation × Ability × Prompt (B = MAP)
- Styx provides all three: motivation (stakes), ability (mobile app), prompt (notifications)
- "Celebration" after tiny wins → Styx's proof acceptance feedback loop

### Wood (2019) — Good Habits, Bad Habits
- Habit formation requires stable context cues
- Disruption of context cues breaks habits (moving, travel)
- Styx's GPS-based and time-based verification methods anchor to context cues

### Pressfield (2002) — The War of Art
- "Resistance" as personified force opposing creative/growth work
- Styx as external accountability structure to overcome Resistance
- Relevant to Creative Stream oaths (writing, art, music, making)

### Brewer (2017) — The Craving Mind
- Habit loop: trigger → behavior → reward
- Mindfulness disrupts automaticity
- Styx's daily attestation creates a mindfulness intervention point

---

## Gaps Identified

1. **No source on habit transfer** (from extrinsic to intrinsic motivation post-contract). Need literature on what happens after financial commitment devices are removed.
2. **Limited evidence on digital commitment device retention** beyond 90 days. Styx's long-term value proposition needs stronger empirical grounding.
3. **COM-B analysis is descriptive** — need evidence on which COM-B combinations are most effective for the specific behavior types in Styx's oath taxonomy.
