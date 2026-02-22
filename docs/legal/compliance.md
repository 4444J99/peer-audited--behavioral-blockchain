# Styx Legal Compliance Guardrails (The Aegis Protocol)

## 1. Skill-Based Contest Definition
Styx operates as a **Skill-Based Contest**, not a gambling platform.
- **No Chance**: Outcomes must be determined >50% by user skill/effort.
- **Verification**: All wins must be cryptographically verified.

## 2. Medical Guardrails
- **Age**: 18+ strict enforcement (KYC).
- **BMI Floor**: No users with BMI < 18.5 may participate.
- **Velocity Cap**: Weight loss > 2% bodyweight/week flags for auto-disqualification to prevent starvation/purging.

## 3. Financial Compliance (FBO)
- **Zero Custody**: Styx never holds user funds in corporate accounts.
- **FBO Accounts**: Funds are routed to "For Benefit Of" escrow via Stripe Connect.
- **Ledger**: PostgreSQL double-entry ledger is the source of truth for all liabilities.
