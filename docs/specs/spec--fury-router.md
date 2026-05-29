# Technical Spec: The Fury Router

**Status:** Draft | **Version:** 2.0.0 | **Date:** March 6, 2026
**Area:** Backend / Fury Network
**Parry Target:** stickK (Friendly Collusion), Forfeit (Centralized Bottleneck)
**Governing Standard:** `meta-organvm/METADOC--research-standards.md` (Stage IV)

---

## 1. Objective
To build a decentralized, anonymous, and financially incentivized audit distribution engine. The Fury Router assigns "Truth Claims" to peer auditors who earn bounties for validating breaches.

---

## 2. Core Requirements
*   **Anonymity:** Neither the Committer nor the Auditor shall know the other's identity.
*   **Incentive Alignment:** Auditors earn 20% of the slashed stake. Dishonest auditors are "Slashed" from their own security deposit.
*   **Adversarial Matching:** The router should prioritize matching auditors with no social or historical link to the committer (Anti-collusion).
*   **Scalability:** Uses BullMQ/Redis to handle high-volume audit requests.

---

## 3. Data Model (Logic)
```typescript
interface FuryAuditTask {
  id: string;
  contractId: string;
  artifactUrl: string; // Cloudflare R2 path to Digital Exhaust
  bountyAmount: number;
  status: 'PENDING' | 'ASSIGNED' | 'VALIDATED' | 'DISPUTED' | 'SETTLED';
  assignedAuditorId?: string;
  evidenceType: 'TEXT_LOG' | 'CALL_LOG' | 'GPS_COORDINATE' | 'IMAGE';
}
```

---

## 4. The Workflow
1.  **Trigger:** A "Digital Exhaust" scan detects a potential breach.
2.  **Creation:** System creates a `FuryAuditTask`.
3.  **Assignment:** The Router picks 1 primary auditor based on "Audit Reputation."
4.  **Verification:** Auditor reviews the artifact and submits a "Breach Confirmed" or "False Alarm" verdict.
5.  **Consensus (Optional):** For high-stakes contracts ($1000+), the Router requires a 2-of-3 consensus from three independent auditors.
6.  **Settle:** The `LedgerService` executes the slash based on the verdict.

---

## 5. Anti-Collusion Guards
*   **Honeypot Injection:** The Router periodically injects "Fake" tasks with known outcomes. If an auditor fails a honeypot, their reputation is nuked.
*   **Geographic Jitter:** Auditors cannot be assigned tasks originating from their own city (based on IP/GPS).

---

## 6. Verification & Acceptance Criteria

Per Gold Path Stage IV — defining exactly how truth is confirmed for this module.

### 6.1 Functional Acceptance Criteria
| ID | Criterion | Verification Method |
|----|-----------|-------------------|
| FR-1 | Audit task creation completes within 500ms of breach detection | Load test: 1000 concurrent breach events; measure p99 latency |
| FR-2 | Assigned auditor receives task notification within 5 seconds | Integration test: create task, assert auditor notification timestamp |
| FR-3 | Auditor identity is cryptographically separated from committer identity | Security audit: attempt to derive committer ID from auditor's task payload |
| FR-4 | Honeypot tasks are indistinguishable from real tasks to auditors | Blind test: present 50 tasks (10 honeypots) to auditors; measure detection rate |
| FR-5 | 2-of-3 consensus is enforced for contracts exceeding $1000 threshold | Integration test: submit high-stake breach; verify 3 auditors assigned and 2-of-3 required |
| FR-6 | Geographic jitter prevents same-city assignment | Unit test: generate 1000 assignments with known geolocations; assert zero same-city matches |
| FR-7 | Dishonest auditor (fails honeypot) is slashed within 1 block/transaction | Integration test: auditor fails honeypot; verify deposit slash and reputation reset |

### 6.2 Non-Functional Requirements
| ID | Criterion | Target | Verification Method |
|----|-----------|--------|-------------------|
| NF-1 | Throughput | 10,000 audit tasks/hour | Load test with BullMQ worker pool |
| NF-2 | Availability | 99.9% uptime | 30-day soak test with chaos injection |
| NF-3 | Audit Trail | Every task state transition is immutably logged | Query audit log after full task lifecycle; verify completeness |
| NF-4 | Data Retention | Task artifacts retained for 90 days post-settlement | Lifecycle test: verify R2 object expiration policy |

### 6.3 Test Strategy
*   **Unit Tests:** Router assignment logic, anti-collusion filters, honeypot generation, bounty calculation.
*   **Integration Tests:** Full task lifecycle (creation → assignment → verdict → settlement) against staging Redis + BullMQ.
*   **Load Tests:** Simulate 10,000 concurrent breach events; measure throughput, latency, and queue depth.
*   **Security Tests:** Attempt identity correlation attacks, honeypot detection, and geographic jitter bypass.
*   **Soak Test:** 30-day continuous operation under production-like load; monitor for memory leaks, queue drift, and auditor reputation score inflation/deflation.

---

## 7. Backcasting (Omega to Present)

Per METADOC Section 4.C — working backward from the desired future state.

### Omega State (36+ months): Fully Decentralized Adversarial Truth Network
*   Fury Router operates as a standalone protocol with its own token economics.
*   Auditor pool exceeds 10,000 active participants across 50+ countries.
*   Multi-chain settlement (Ethereum L2, Solana, Polygon).
*   Open API: any commitment platform can submit audit tasks to the Fury Network.
*   Self-governing: auditor reputation, honeypot frequency, and bounty rates are set by DAO vote.

### 18-Month Milestone: Protocol Extraction
*   Fury Router extracted from Styx monolith into a standalone service with a public API.
*   Auditor onboarding is self-service (deposit stake, pass calibration quiz).
*   On-chain settlement via a single L2 (likely Base or Arbitrum for cost efficiency).
*   Auditor pool: 500+ active participants.
*   First external client integration (partner commitment platform submits tasks to Fury).
*   Honeypot system validated with 6+ months of production data.

### 12-Month Milestone: Production Adversarial Network
*   Fury Router handles all Styx audit tasks in production.
*   2-of-3 consensus operational for high-stakes contracts.
*   Auditor reputation system calibrated from 6 months of data.
*   Geographic jitter and anti-collusion guards validated at scale.
*   Bounty economics proven sustainable (auditor retention > 70% month-over-month).
*   Audit turnaround time: median < 2 hours, p99 < 24 hours.

### 6-Month Milestone: Beta Audit Network
*   Fury Router deployed to staging with a closed beta auditor pool (50-100 participants).
*   BullMQ/Redis infrastructure load-tested at 10x projected volume.
*   Honeypot injection system operational; calibrating false-positive/negative rates.
*   Basic on-chain settlement via escrow contract (testnet → mainnet).
*   Integration with Digital Exhaust Intake service for artifact delivery.

### Present Sprint: Foundation
*   Define `FuryAuditTask` data model and state machine.
*   Implement BullMQ worker with assignment logic (reputation-weighted random).
*   Build honeypot generation service with known-outcome task factory.
*   Implement geographic jitter filter using MaxMind GeoIP2.
*   Write unit and integration test suites per Section 6.3.
*   Deploy to staging environment with synthetic audit tasks.

---
*Generated per METADOC Stage IV (Backcasting) & Gold Path SOP | Styx Architecture | v2.0.0*
