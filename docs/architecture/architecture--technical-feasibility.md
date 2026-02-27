# Technical Architecture & Feasibility

## Core Systems
1. **Ledger**: PostgreSQL Double-Entry Accounting.
2. **Media**: Cloudflare R2 (Zero Egress) + FFmpeg + pHash.
3. **Routing**: BullMQ (Redis) for Peer Review distribution.

## Biometric Integration strategy
- **iOS**: Use `HKMetadataKeyWasUserEntered` to reject manual data.
- **Android**: Use Health Connect `recordingMethod` metadata to reject manual data.

## Scalability
- **Real-Time**: Redis Sorted Sets for leaderboards.
- **Concurrency**: Node.js event loop for high I/O throughput.
