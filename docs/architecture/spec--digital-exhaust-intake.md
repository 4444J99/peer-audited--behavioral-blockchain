# Technical Spec: Digital Exhaust Intake

**Status:** Draft | **Version:** 1.0.0 | **Date:** March 6, 2026
**Area:** Mobile / API
**Parry Target:** Beeminder (Fragile APIs), Habitica (Honor System)

---

## 1. Objective
To extract verifiable behavioral artifacts (Texts, Call Logs, App Events) from the user's device while maintaining maximum privacy via local processing and ZKPs.

---

## 2. Core Requirements
*   **Artifact Integrity:** Proof that the data comes from the system logs and has not been edited.
*   **Privacy-First:** Content of messages should never leave the device. Only **Metadata** (Recipient ID, Timestamp, Event Type) is transmitted.
*   **OS Resilience:** Support for iOS (Screen Time API fallback) and Android (Native log access).
*   **Cryptographic Pulse:** The device must send a regular "Integrity Heartbeat" to prove the monitoring app is still installed and active.

---

## 3. Data Extraction Flow (Local-Only)
1.  **Extraction:** Mobile app queries the OS for communication events involving `TargetIDs` (the blocked numbers).
2.  **Hashing:** The app hashes the specific event data (e.g., `hash(recipient + timestamp + "text_sent")`).
3.  **Proof Generation:** The app generates a **Zero-Knowledge Proof (ZKP)** that a breach occurred *without* revealing the message body.
4.  **Submission:** The ZKP and Metadata are sent to the `ExhaustIntakeService`.

---

## 4. Metadata Schema
```typescript
interface DigitalExhaustArtifact {
  userId: string;
  contractId: string;
  eventType: 'OUTBOUND_TEXT' | 'OUTBOUND_CALL' | 'APP_OPEN';
  targetIdHash: string; // SHA-256 of the blocked number
  timestamp: string; // ISO-8601
  deviceIntegrityToken: string; // Proof that device is not rooted/jailbroken
  zkProof?: string; // Optional ZKP string
}
```

---

## 5. OS Fallbacks
*   **iOS:** Use `DeviceActivity` to detect app usage if native log access is restricted.
*   **Android:** Use `AccessibilityService` (for UI events) and `Telephony` logs (for calls/texts).

---
*Generated per SOP Stage IV | Styx Architecture*
