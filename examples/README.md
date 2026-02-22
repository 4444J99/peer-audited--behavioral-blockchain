# Example: Validating a Fitness Goal

## Scenario
User commits to 10k steps/day for 7 days.

## Data Flow
1. **Mobile**: Pulls step count from HealthKit (Hardware only).
2. **API**: Verifies daily total > 10,000.
3. **Ledger**: If Success -> No Action. If Fail -> `ledger_entries` Debit User, Credit Pot.

## Code
See `examples/fitness-validation.ts` for logic.
