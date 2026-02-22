# Styx Development Tools (Ironclad)

## 1. Module Definition
This directory contains **Developer Experience (DX)** tools and simulators. These are used to "fake" the world for local development without needing real money or real bodies.

## 2. Tool Inventory

### `generate-fake-user.ts`
- **Purpose**: Creates a complete user profile (Auth + Stripe Customer ID + Ledger Account).
- **Output**: JSON object with user credentials.
- **API**: Calls `POST /auth/register` and direct DB insertion for Ledger.

### `simulate-healthkit.ts`
- **Purpose**: Floods the `health_metrics` endpoint with mock heart rate/step data.
- **Usage**: `ts-node tools/simulate-healthkit.ts --userId=123 --pattern=marathon`
- **Validation**: Must pass the `HKMetadataKeyWasUserEntered == NO` check (by mocking the metadata).

### `fury-load-test.ts`
- **Purpose**: Simulates 1000 concurrent "Fury Audits" to stress-test the Redis Queue.
- **Metric**: Measures latency from `Task Assigned` to `Verdict Recorded`.

## 3. Core Mandates
- **NEVER** run these tools against Production DB.
- Each tool must check `NODE_ENV != 'production'` before executing.

## 4. Testing
- These tools are their own tests. If they fail to generate data, the Dev environment is broken.
