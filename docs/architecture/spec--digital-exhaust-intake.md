# Technical Spec: Digital Exhaust Intake

**Status:** Draft | **Version:** 2.0.0 | **Date:** March 6, 2026
**Area:** Mobile / API
**Parry Target:** Beeminder (Fragile APIs), Habitica (Honor System)
**Governing Standard:** `meta-organvm/METADOC--research-standards.md` (Stage IV)

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

## 6. Verification & Acceptance Criteria

Per Gold Path Stage IV — defining exactly how truth is confirmed for this module.

### 6.1 Functional Acceptance Criteria
| ID | Criterion | Verification Method |
|----|-----------|-------------------|
| FR-1 | Outbound text to a TargetID is detected within 60 seconds of transmission | Device test: send SMS to blocked number; measure detection latency |
| FR-2 | Outbound call to a TargetID is detected within 60 seconds of call initiation | Device test: initiate call to blocked number; measure detection latency |
| FR-3 | App-open event for a blocked app is detected within 30 seconds | Device test: open blocked app; measure detection latency |
| FR-4 | ZKP verifies breach occurred without revealing message content | Cryptographic test: verify proof with public inputs; attempt to extract private inputs |
| FR-5 | Integrity Heartbeat fires every 15 minutes (+/- 2 min jitter) | Soak test: monitor heartbeat arrivals over 72 hours; verify cadence and jitter bounds |
| FR-6 | Heartbeat failure (app removed/disabled) triggers alert within 30 minutes | Device test: uninstall app; verify server-side alert timestamp |
| FR-7 | Artifact hash is deterministic and tamper-evident | Unit test: hash identical inputs twice; verify identical output. Modify one byte; verify different output. |
| FR-8 | Device integrity token rejects rooted/jailbroken devices | Device test: attempt submission from rooted Android; verify rejection. Repeat for jailbroken iOS. |

### 6.2 Non-Functional Requirements
| ID | Criterion | Target | Verification Method |
|----|-----------|--------|-------------------|
| NF-1 | Battery Impact | < 3% daily battery overhead | 7-day device soak test with battery monitoring |
| NF-2 | Data Transmission | < 1KB per artifact submission | Measure payload sizes across 1000 submissions |
| NF-3 | ZKP Generation Time | < 5 seconds on mid-range device (A15/Snapdragon 8 Gen 1) | Benchmark on reference devices |
| NF-4 | Privacy Compliance | Zero PII transmitted to server | Network traffic audit: capture all outbound packets; verify no plaintext PII |
| NF-5 | Availability | Heartbeat service 99.95% uptime | 30-day soak test |

### 6.3 Test Strategy
*   **Unit Tests:** Hash functions, ZKP generation/verification, metadata schema validation, heartbeat timer logic.
*   **Device Tests (iOS):** `DeviceActivity` detection for texts, calls, app-open events on iOS 17+ devices. Screen Time API fallback verification on iOS 16.
*   **Device Tests (Android):** `AccessibilityService` event capture, `Telephony` log access, VPN DNS sinkhole detection on Android 13+.
*   **Integration Tests:** Full artifact flow: device extraction → hash → ZKP → submission → server-side verification → Fury Router handoff.
*   **Privacy Audit:** Independent security review of all outbound data transmissions to verify zero content leakage.
*   **Soak Tests:** 30-day continuous monitoring on 5 reference devices (2 iOS, 3 Android) measuring battery impact, detection accuracy, heartbeat reliability, and false positive/negative rates.

---

## 7. Backcasting (Omega to Present)

Per METADOC Section 4.C — working backward from the desired future state.

### Omega State (36+ months): Universal Behavioral Proof Layer
*   Digital Exhaust SDK available as an open-source library for any behavioral commitment platform.
*   ZKP verification is on-chain (proof submitted to smart contract, verified by network validators).
*   Support for 10+ behavioral event types beyond texts/calls (location, biometrics, financial transactions).
*   Federated device integrity: cross-device attestation (phone + watch + desktop form a trust quorum).
*   Privacy certification: SOC 2 Type II + GDPR Article 25 (Data Protection by Design) certified.

### 18-Month Milestone: ZKP Production & SDK Extraction
*   ZKP generation operational on production devices (iOS + Android).
*   Digital Exhaust SDK extracted from Styx app into a standalone library.
*   On-chain proof verification via L2 smart contract.
*   Support for 5 event types: OUTBOUND_TEXT, OUTBOUND_CALL, APP_OPEN, GPS_PROXIMITY, SCREEN_TIME.
*   First external integration partner using the SDK.
*   Battery impact validated at < 3% across 6 months of production data.

### 12-Month Milestone: Production Privacy-First Monitoring
*   Full artifact pipeline operational in production (extraction → hash → submit → verify).
*   Integrity Heartbeat running reliably across iOS 17+ and Android 13+.
*   Device integrity token validation (rooted/jailbroken device rejection) in production.
*   ZKP generation on-device using optimized circuits (Groth16 or PLONK).
*   False positive rate < 0.1% across 10,000+ monitored contracts.
*   Privacy audit completed by independent security firm.

### 6-Month Milestone: Beta Monitoring Pipeline
*   Local-only extraction working on iOS (`DeviceActivity`) and Android (`AccessibilityService`).
*   Metadata hashing and submission pipeline operational in closed beta.
*   Integrity Heartbeat implemented with 15-minute cadence.
*   ZKP proof-of-concept: working circuit for "outbound text to TargetID occurred" without revealing content.
*   Battery impact benchmarked on 5 reference devices.
*   Integration with Fury Router for artifact delivery.

### Present Sprint: Foundation
*   Define `DigitalExhaustArtifact` schema and validation logic.
*   Implement iOS `DeviceActivity` monitor for outbound text/call detection.
*   Implement Android `AccessibilityService` monitor for UI events.
*   Build metadata hashing pipeline (SHA-256, deterministic).
*   Implement Integrity Heartbeat timer with server-side monitoring.
*   Write unit and device test suites per Section 6.3.
*   Deploy `ExhaustIntakeService` to staging with mock artifact submissions.

---
*Generated per METADOC Stage IV (Backcasting) & Gold Path SOP | Styx Architecture | v2.0.0*
