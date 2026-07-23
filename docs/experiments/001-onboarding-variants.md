# Experiment 001: Onboarding Flow Variants

## Hypothesis

Guided onboarding with a default contract template increases 7-day contract completion rate versus a blank-start onboarding.

## Variants

| Variant | Description |
|---------|-------------|
| **Control (A)** | Current onboarding — OnboardingWizard with empty contract creation flow |
| **Treatment (B)** | Guided — onboarding suggests a default "No Contact for 7 Days" template, pre-filled with sensible defaults (stake: $39, check-in: daily) |
| **Treatment (C)** | Guided + video — same as B with a 90-second explainer video embedded in step 2 |

## Metrics

| Metric | Definition | Target |
|--------|-----------|--------|
| Primary | 7-day contract completion rate | +15% relative (B vs A, C vs A) |
| Secondary | Day-7 retention (user active at day 7) | +10% relative |
| Guardrail | Contract creation abandonment rate | No increase >5% |
| Guardrail | Average stake amount | No decrease >10% |

## Assignment

- Hashing-based deterministic assignment from user_id at registration
- 33% per variant, auto-balanced on registration (register → assign variant → store in user record)
- Variant stored in `user.experiments` JSONB column as `{"001": "A|B|C"}`

## Duration

- Minimum: 2 weeks after reaching 90 users per variant (270 total)
- Maximum: 4 weeks
- Early stop: if any variant reaches p < 0.05 on primary metric with sequential testing correction

## Statistical Rules

- Significance threshold: p < 0.05 (two-tailed)
- Minimum detectable effect: 10% relative improvement
- Correction: Benjamini-Hochberg for multiple comparisons (3 variants → 3 comparisons)
- Evaluation: Bayesian logistic regression on completion outcome, variant as fixed effect

## Guardrail Monitoring

- **Auto-halt** if any guardrail metric breached for 3 consecutive days
- **Notification** to #experiments Slack channel on all metric movements >5%
- **Archive** 30 days after launch with final report in `docs/experiments/001-report.md`

## Pre-registration Checklist

- [x] Hypothesis documented
- [x] Variants defined
- [x] Metrics and targets specified
- [ ] Variant assignment code deployed (user.experiments JSONB)
- [ ] OnboardingWizard accepts `experimentVariant` prop
- [ ] Treatment B template created
- [ ] Treatment C video uploaded and embedded
- [ ] Guardrail monitoring configured
- [ ] Statistical analysis script ready
- [ ] Experiment flag added to bootstrap API response
