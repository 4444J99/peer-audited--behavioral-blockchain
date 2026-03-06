# Technical Spec: The Fury Router

**Status:** Draft | **Version:** 1.0.0 | **Date:** March 6, 2026
**Area:** Backend / Fury Network
**Parry Target:** stickK (Friendly Collusion), Forfeit (Centralized Bottleneck)

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
*Generated per SOP Stage IV | Styx Architecture*
