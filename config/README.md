# Styx Configuration Manifest (Ironclad)

## 1. Module Definition
This directory contains the **Environment Contracts** and **Feature Flags** for the entire Styx ecosystem. It defines *how* the application behaves in different realities (Dev, Stage, Prod).

## 2. Usage Protocol
- **DO NOT** hardcode secrets. Use `.env` files.
- **DO** use `config.ts` loaders to validate env vars on startup (fail fast).

## 3. Environment Variable Contract (`.env.example`)

### Core Infrastructure
- `DATABASE_URL`: `postgresql://user:pass@host:5432/styx_db` (Must support connection pooling)
- `REDIS_URL`: `redis://host:6379` (For BullMQ)
- `R2_BUCKET_URL`: Cloudflare R2 endpoint.

### Gatekeepers
- `STRIPE_SECRET_KEY`: `sk_test_...` (Use Restricted Keys!)
- `STRIPE_WEBHOOK_SECRET`: `whsec_...`
- `PLAID_CLIENT_ID`: Client ID.
- `PLAID_SECRET`: Secret.

### The Aegis Protocol (Legal)
- `MIN_BMI_THRESHOLD`: `18.5` (Immutable float)
- `MAX_WEEKLY_LOSS_PCT`: `0.02` (2% cap)
- `ENABLE_GEOFENCING`: `true/false` (Master switch)

### Feature Flags
- `ENABLE_FURY_ROUTER`: `true` (Activates peer review)
- `ENABLE_HONEYPOTS`: `true` (Injects fake proofs)

## 4. Error Handling
- If a required ENV is missing on startup -> **CRASH IMMEDIATELY**.
- Use `zod` or `joi` schema validation in the app bootstrap.

## 5. Testing
- `npm run test:config` -> Verifies that the `.env` loader correctly parses valid/invalid inputs.
