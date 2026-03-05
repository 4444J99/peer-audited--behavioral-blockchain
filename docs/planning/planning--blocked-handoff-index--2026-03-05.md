# Blocked Handoff Index (2026-03-05)

Canonical register of tasks requiring external human intervention (native engineering, legal/commercial approvals, procurement, or cryptographic specialization).

## Milestones
- `Blocked Handoff - Beta Gate (2026-04-30)`
- `Blocked Handoff - Gamma Gate (2026-06-30)`
- `Blocked Handoff - Delta Gate (2026-09-30)`
- `Blocked Handoff - Omega/Phase2+ (2026-12-31)`

## Owner Role Labels
- `owner:mobile-native`
- `owner:legal-compliance`
- `owner:business-development`
- `owner:release-ops`
- `owner:backend-platform`
- `owner:cryptography`

## Handoff Matrix
| Feature / Ticket | Issue | Milestone | Owner Role(s) | Human Interference Type |
|---|---|---|---|---|
| F-MOBILE-01 Native Camera Module | [#123](https://github.com/organvm-iii-ergon/peer-audited--behavioral-blockchain/issues/123) | Beta Gate | mobile-native | Native iOS/Android implementation |
| F-VERIFY-02 HealthKit Bridge (iOS) | [#124](https://github.com/organvm-iii-ergon/peer-audited--behavioral-blockchain/issues/124) | Gamma Gate | mobile-native | Native iOS + Apple policy compliance |
| F-VERIFY-03 Health Connect Bridge (Android) | [#125](https://github.com/organvm-iii-ergon/peer-audited--behavioral-blockchain/issues/125) | Gamma Gate | mobile-native | Native Android implementation |
| F-VERIFY-04 Fitbit/WHOOP Integration | [#126](https://github.com/organvm-iii-ergon/peer-audited--behavioral-blockchain/issues/126) | Gamma Gate | business-development | Third-party developer approval |
| F-MOBILE-03 Remote Push Setup | [#127](https://github.com/organvm-iii-ergon/peer-audited--behavioral-blockchain/issues/127) | Delta Gate | mobile-native, release-ops | APNs/FCM console and certificate setup |
| F-MOBILE-04 Biometric Lock | [#128](https://github.com/organvm-iii-ergon/peer-audited--behavioral-blockchain/issues/128) | Omega/Phase2+ | mobile-native | Native biometric SDK integration |
| F-WEB-05 Plaid Link | [#129](https://github.com/organvm-iii-ergon/peer-audited--behavioral-blockchain/issues/129) | Omega/Phase2+ | business-development | Plaid business verification and keys |
| F-MARKET-03 EVM Escrow | [#130](https://github.com/organvm-iii-ergon/peer-audited--behavioral-blockchain/issues/130) | Omega/Phase2+ | cryptography | Solidity/security-audit specialization |
| F-MARKET-04 ZKP Milestone Verification | [#131](https://github.com/organvm-iii-ergon/peer-audited--behavioral-blockchain/issues/131) | Omega/Phase2+ | cryptography | ZK proving-engine specialization |
| F-AEGIS-05 KYC Integration | [#132](https://github.com/organvm-iii-ergon/peer-audited--behavioral-blockchain/issues/132) | Beta Gate | legal-compliance | KYC provider contract + compliance onboarding |
| F-INFRA-01 High-Risk Merchant Account | [#133](https://github.com/organvm-iii-ergon/peer-audited--behavioral-blockchain/issues/133) | Beta Gate | business-development, legal-compliance | Financial/legal negotiation |
| TKT-P0-002/TKT-P1-007 consolidated native blockers | [#134](https://github.com/organvm-iii-ergon/peer-audited--behavioral-blockchain/issues/134) | Beta Gate | mobile-native | Native bridge execution coordination |
| TKT-P1-013/TKT-P1-018/TKT-P1-006 delta blockers | [#135](https://github.com/organvm-iii-ergon/peer-audited--behavioral-blockchain/issues/135) | Delta Gate | backend-platform, release-ops | Video worker + native dashboard + push ops |
| F-LEGAL-05 Skill-Contest Whitepaper | [#136](https://github.com/organvm-iii-ergon/peer-audited--behavioral-blockchain/issues/136) | Beta Gate | legal-compliance | Counsel-authored legal artifact |
| F-LEGAL-07 Prize Indemnity Insurance | [#137](https://github.com/organvm-iii-ergon/peer-audited--behavioral-blockchain/issues/137) | Omega/Phase2+ | legal-compliance | Insurance procurement |
| F-INFRA-09 Web Shop Routing + Apple Notice | [#138](https://github.com/organvm-iii-ergon/peer-audited--behavioral-blockchain/issues/138) | Omega/Phase2+ | legal-compliance, release-ops | Legal review + app-store policy operations |
| F-INFRA-10 Hardware Partnerships | [#139](https://github.com/organvm-iii-ergon/peer-audited--behavioral-blockchain/issues/139) | Omega/Phase2+ | business-development | External partnership negotiation |
| F-B2B-09 Insurance Cross-Pollination | [#140](https://github.com/organvm-iii-ergon/peer-audited--behavioral-blockchain/issues/140) | Omega/Phase2+ | business-development | Insurer commercial/contractual alignment |
| Beta Ops: App Store Connect + TestFlight | [#141](https://github.com/organvm-iii-ergon/peer-audited--behavioral-blockchain/issues/141) | Beta Gate | mobile-native, release-ops | Apple distribution operations |
| F-VERIFY-09 C2PA + TSA | [#142](https://github.com/organvm-iii-ergon/peer-audited--behavioral-blockchain/issues/142) | Omega/Phase2+ | cryptography | Provenance/TSA procurement and policy |
| F-VERIFY-11 Continuous App Attestation | [#143](https://github.com/organvm-iii-ergon/peer-audited--behavioral-blockchain/issues/143) | Omega/Phase2+ | mobile-native | Third-party SDK procurement + security policy |
| F-VERIFY-14 ZK Privacy Layer | [#144](https://github.com/organvm-iii-ergon/peer-audited--behavioral-blockchain/issues/144) | Omega/Phase2+ | cryptography | ZK architecture + specialized engineering |

## Operational Conventions
- Each blocked issue is assigned to `@4444J99` as coordination owner until a domain owner is delegated.
- Owner-role labels define who must take lead for next action.
- Milestones map blockers to roadmap gates; unresolved blockers at gate date imply launch risk.
