# Styx API Specification (OpenAPI 3.0)

## Endpoints

### Auth
- `POST /auth/register`: Create user + Stripe Customer.
- `POST /auth/login`: Issue JWT.

### Contracts (Bets)
- `POST /contracts`: Create a new deposit contract.
- `GET /contracts/:id`: Get status and progress.
- `POST /contracts/:id/proof`: Upload proof media (pHash verified).

### Fury Audit
- `GET /rats/queue`: Fetch pending audit tasks.
- `POST /rats/audit/:id`: Submit Pass/Fail verdict.

### Ledger
- `GET /ledger/balance`: Get current FBO balance.
- `GET /ledger/history`: Get transaction history.
