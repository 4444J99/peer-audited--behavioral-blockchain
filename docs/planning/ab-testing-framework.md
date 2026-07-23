# A/B Testing Framework

## 1. Hypothesis Definition

Every experiment starts with a structured hypothesis:

```yaml
hypothesis:
  title: "<short label>"
  driver: "<metric we expect to move>"
  prediction: "<directional prediction with effect size>"
  mechanism: "<why we think this change will produce the effect>"
  risk: "<what could go wrong / negative side effects>"
  owner: "<who runs the analysis>"
```

**Template:**

> We believe that **[change to UX / messaging / flow]** will improve **[primary metric]** by **[expected effect size]** for **[target user segment]** because **[mechanism / rationale]**. We will know this is true when **[statistical test]** shows **[significance threshold]** with a sample of **[minimum sample size]** users over **[duration]** .

**Example — onboarding identity oath variants:**

> We believe that replacing the generic checkbox oath with a typed-response identity oath will improve 7-day contract completion rate by 5 percentage points for new consumer users because the typed oath increases cognitive commitment (self-signaling effect). We will know this is true when a two-proportion z-test shows p < 0.05 at 80% power with a sample of 1,500 users per variant over 2 weeks.

### Hypothesis Components

| Component | Definition | Example |
|-----------|------------|---------|
| Independent variable | What you change | Oath format (checkbox vs. typed) |
| Dependent variable | What you measure | 7-day contract completion rate |
| Target segment | Who is affected | New consumer users |
| Effect size | How much change | +5pp completion rate |
| Mechanism | Why it works | Self-signaling / cognitive commitment |
| Risk | What could backfire | Increased onboarding friction → drop-off |

---

## 2. Experiment Design

### Variant Assignment

Styx uses consistent hashing for deterministic user-variant assignment:

```typescript
function assignVariant(userId: string, experimentKey: string, variants: string[]): string {
  const hash = createHash('sha256')
    .update(`${experimentKey}:${userId}`)
    .digest();
  const index = hash.readUInt32BE(0) % variants.length;
  return variants[index];
}
```

Each user sees the same variant on every session. Assign on first exposure and cache in the session / feature-flag payload.

### Sample Size Calculation

Use the Normal approximation for proportions:

```python
import math

def min_sample_size(effect_size: float, alpha=0.05, power=0.80) -> int:
    z_alpha = 1.96   # two-tailed
    z_beta  = 0.84   # one-tailed (80% power)
    return math.ceil(2 * ((z_alpha + z_beta) / effect_size) ** 2)
```

| Effect size (pp) | Users per variant |
|-----------------|-------------------|
| 1 pp            | ~15,700           |
| 2 pp            | ~3,900            |
| 5 pp            | ~630              |
| 10 pp           | ~160              |

### Duration Rules

Minimum duration = `max(required_sample_days, 7 calendar days)` to capture day-of-week effects.

Stop the experiment when either:
- Minimum sample size AND minimum duration are both reached, OR
- 4 weeks have passed (cap), OR
- A guardrail metric triggers a halt (see §4)

### Metrics Hierarchy

```
Primary (single, pre-registered)
  └─ The one metric the hypothesis targets

Secondary (3-5, pre-registered)
  ├─ Related engagement metrics
  ├─ Quality metrics
  └─ Downstream conversion metrics

Guardrail (non-negotiable floor)
  ├─ Core UX: session duration, error rate
  ├─ Revenue: ARPU, refund rate
  ├─ Trust: support ticket rate, report rate
  └─ Safety: abuse report rate
```

### Feature Flag Integration

Experiments in Styx use a layered flag system:

1. **Global flags** (`STYX_FEATURE_*` env vars, set at deploy time) — control rollout per environment
2. **User-level flags** (returned in `/mobile/bootstrap` featureFlags payload) — control per-user experience
3. **Experiment flags** (computed server-side via hashing, returned as `experiments` map) — A/B variant assignments

The bootstrap response includes an `experiments` map:

```typescript
interface StyxFeatureFlags {
  // ... existing flags ...
  experiments: Record<string, string>; // experimentKey → variantId
}
```

The mobile client uses this map to render the correct variant without additional network calls.

---

## 3. Statistical Analysis

### Primary Analysis

- **Proportion metrics** (completion rate, retention): two-proportion z-test
- **Continuous metrics** (session duration, stake amount): Welch's t-test
- **Count metrics** (contracts per user): Mann-Whitney U test

### Significance Thresholds

| Measure | Threshold | When |
|---------|-----------|------|
| Statistical significance | p < 0.05 | Declare a winner |
| Practical significance | effect > 1 pp or > 5% relative | Minimum viable effect |
| Bayesian probability | P(variant > control) > 0.95 | Sequential analysis |
| FDR correction | Benjamini-Hochberg | When testing >5 secondary metrics |

### Stopping Rules

- **Do not** peek at results before the minimum duration
- **Do not** stop early because results look "significant" (peeking inflates false positives)
- **Do** stop immediately if any guardrail metric crosses the alarm threshold (see §4)
- **Do** run a Bayesian sequential analysis if sample sizes are uncertain

### Decision Framework

```yaml
significant & practically significant:
  action: Ship the winner
  output: PR to promote variant to default

significant but NOT practically significant:
  action: Consider ship if zero cost, otherwise discard
  output: Decision memo

NOT significant but practically significant effect size:
  action: Increase sample size or accept inconclusive
  output: Either extend experiment or document as inconclusive

NOT significant & NOT practically significant:
  action: Discard
  output: Archive with null result
```

---

## 4. Safety & Guardrails

Every experiment must define guardrail metrics before launch. If any guardrail moves beyond its threshold, the experiment is halted immediately.

| Guardrail | Threshold | Action |
|-----------|-----------|--------|
| Error rate | > 2× baseline for 24h | Halt and roll back |
| Support tickets | > 3× baseline | Halt and investigate |
| Session duration (p50) | < 0.5× baseline | Halt — UX regression |
| Refund / dispute rate | > 2× baseline | Halt until reviewed |
| Account deletion rate | > 1.5× baseline | Halt immediately |

### Rollback Protocol

1. Set experiment variant to control (100%) in the feature flag system
2. Deploy a revert if code change was required
3. Monitor guardrail metrics for 24h post-rollback
4. Document the incident in the experiment log

---

## 5. Experiment Lifecycle

```
DRAFT → REVIEW → LAUNCH → RUNNING → ANALYZING → CLOSED
  │                     │         │           │
  └─ Hypothesis         │         ├─ HALTED   ├─ SHIP WINNER
     + design           │         │  (guard-   ├─ DOCUMENT NULL
     + pre-registration │         │   rail)    └─ ARCHIVE
                        │         └─ EXTENDED
                        │            (under-
                        │             powered)
                        └─ Re-check guardrails
                           every 24h during run
```

### Checklist for Each Phase

**DRAFT:**
- [ ] Hypothesis written and reviewed
- [ ] Primary metric defined and instrumented
- [ ] Sample size calculated
- [ ] Guardrail metrics defined
- [ ] Experiment duration set

**REVIEW:**
- [ ] Engineering review: implementation correct
- [ ] Product review: hypothesis worth testing
- [ ] Safety review: guardrails adequate
- [ ] Pre-registration on experiment log

**LAUNCH:**
- [ ] Variant code deployed
- [ ] Experiment flag activated
- [ ] Monitoring dashboard live

**RUNNING:**
- [ ] Guardrail check daily
- [ ] Log exposure counts

**ANALYZING:**
- [ ] Primary analysis run
- [ ] Secondary analyses run
- [ ] Practical significance assessed
- [ ] Decision made

**CLOSED:**
- [ ] Winner shipped or null result documented
- [ ] Experiment archived in experiment log

---

## 6. Experiment Log

Every experiment gets an entry in `docs/experiments/`:

```yaml
id: EXP-001
title: "Onboarding identity oath variant"
hypothesis: "Typed-response oath improves 7-day completion rate by 5pp"
owner: "product"
status: DRAFT
dates:
  proposed: 2026-07-01
  launched: null
  completed: null
variants:
  control: "Checkbox oath (current)"
  treatment: "Typed-response oath"
metrics:
  primary: "7-day contract completion rate"
  secondary:
    - "Onboarding drop-off rate"
    - "14-day retention"
    - "Referral rate"
  guardrails:
    - "Error rate"
    - "Support tickets"
results:
  sample_size: null
  effect: null
  p_value: null
  decision: null
```

---

## 7. Implementation Guide

### Server Side

Add experiment flags to the bootstrap response in `src/api/src/modules/beta/beta.controller.ts`:

```typescript
function assignExperiments(userId: string): Record<string, string> {
  return {
    'onboarding-oath': assignVariant(userId, 'onboarding-oath', ['checkbox', 'typed']),
  };
}
```

### Client Side

The mobile client receives `featureFlags.experiments` in the bootstrap payload and renders the corresponding variant:

```typescript
const variant = featureFlags.experiments['onboarding-oath'];
switch (variant) {
  case 'typed':
    return <TypedOathScreen />;
  case 'checkbox':
  default:
    return <CheckboxOathScreen />;
}
```

### Event Tracking

Instrument the primary and secondary metrics via the existing event log system (`src/api/database/migrations/026_event_log_index.sql`). Log experiment exposures as `experiment.exposed` events with `{ experimentKey, variant, userId }`.
