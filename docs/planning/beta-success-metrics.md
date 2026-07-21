# Beta Success Metrics

## North Star Metric

**Active contracts per weekly cohort user** — number of contracts that reach their term (not lapsed, not forfeited) per user who joined that week, measured at day 30.

Rationale: captures onboarding success, sustained engagement, and successful completion in one number.

---

## Primary Metrics (Beta Exit Criteria)

| Metric | Target | Measurement | Data Source |
|--------|--------|-------------|-------------|
| 7-day contract completion rate | ≥ 50% | % of contracts reaching term within 7 days | `contracts` table, `status = completed`, `duration <= 7d` |
| 7-day retention (D7) | ≥ 40% | % of new users who still have ≥1 active contract 7 days after registration | Event log: first registration → active contract at D7 |
| 28-day retention (D28) | ≥ 20% | % of new users who still have ≥1 active contract 28 days after registration | Event log |
| NPS (Day 14 survey) | ≥ 30 | "How likely are you to recommend Styx to a friend?" (0-10), sent 14 days after first contract | Survey system (migration 034) |
| Onboarding completion rate | ≥ 70% | % of registered users who create their first contract within 24h | Event log: registration → first contract creation |
| Proof submission rate | ≥ 80% | % of required daily proofs that are submitted on time | `attestations` table |
| Stake recovery rate | ≥ 60% | % of forfeited stakes that are re-staked within 7 days | Ledger events |
| Support ticket rate | < 5% | % of active users submitting ≥1 support ticket per week | Support system |

---

## Guardrail Metrics (Floor, Not Target)

| Metric | Floor | Action if Breached |
|--------|-------|-------------------|
| Daily active users (DAU) | > 50% of cohort | Investigate engagement drop within 24h |
| Error rate (p95 API latency) | < 2s | Escalate to engineering immediately |
| Refund / dispute rate | < 2% of stakes | Pause real-money flow if exceeded |
| Account deletion rate | < 5% per month | Review churn triggers |
| Negative NPS comments | < 20% of all comments | Flag for product review |

---

## Tracking

Metrics are computed weekly from the event log and posted to:

```
docs/ops/beta-dashboard/
```

Each weekly report includes: current value vs. target, trend direction (↑↓→), and a 2-sentence commentary on any metric that moved more than 10% relative.

---

## FAQ

**Q: Why 7-day contracts as the base unit?**
Beta test-money contracts are 7 days. Completion rate on the shortest unit is the earliest signal of product-market fit.

**Q: Are these targets aggressive or conservative?**
Conservative. A consumer accountability app with motivated (self-selected) users should complete well above 50%. These are minimum bars for beta-exit, not aspirational goals.

**Q: What if we miss a target?**
Beta exit is an AND gate across all primary metrics. Missing one means: fix the root cause, extend beta, re-test. The board is binary — all green or stay.
