# Issue Owner Matrix (2026-03-09)

This matrix translates the highest-value GitHub issues into owner, lane, and board placement. It is intentionally biased toward founder and partner operations rather than pure engineering execution.

## How To Use This Matrix

- `Partner` means the business-side partner should actively drive the next move.
- `Shared` means the partner should co-own follow-up with engineering, legal, or release ops.
- `Monitor` means it matters, but it is not primarily her task.

## Beta Gate: April 30, 2026

| Issue | Repo linkage | Lane | Primary owner | Partner role | Next action | Board view |
|---|---|---|---|---|---|---|
| [#132](https://github.com/organvm-iii-ergon/peer-audited--behavioral-blockchain/issues/132) KYC / identity verification integration | `TKT-P0-003`, `F-AEGIS-05` | `Partner` | `H:LC` + `H:BD` | drive | shortlist vendor, confirm DPA, confirm jurisdiction and retention constraints | `01 Exec / Partner Command`, `03 Blocked Handoffs`, `02 Beta Gate` |
| [#133](https://github.com/organvm-iii-ergon/peer-audited--behavioral-blockchain/issues/133) production settlement processor | `TKT-P0-001`, `F-INFRA-01` | `Partner` | `H:LC` + `H:BD` | drive | start processor/merchant application, validate category framing, review terms | `01 Exec / Partner Command`, `03 Blocked Handoffs`, `02 Beta Gate` |
| [#136](https://github.com/organvm-iii-ergon/peer-audited--behavioral-blockchain/issues/136) whitepaper + counsel sign-off | `F-LEGAL-05` | `Partner` | `H:LC` | drive | convert legal research into counsel-ready memo and schedule sign-off | `01 Exec / Partner Command`, `03 Blocked Handoffs`, `02 Beta Gate` |
| [#141](https://github.com/organvm-iii-ergon/peer-audited--behavioral-blockchain/issues/141) App Store Connect + TestFlight provisioning | `Beta ops` | `Shared` | `H:RO` + `H:FO` | support / unblock | confirm account ownership, app enrollment, and provisioning control | `01 Exec / Partner Command`, `02 Beta Gate` |
| [#146](https://github.com/organvm-iii-ergon/peer-audited--behavioral-blockchain/issues/146) App Store UGC moderation policy | `F-LEGAL-09` | `Shared` | `H:LC` + `H:RO` | co-drive | assemble moderation policy and submission package | `01 Exec / Partner Command`, `03 Blocked Handoffs`, `02 Beta Gate` |
| [#123](https://github.com/organvm-iii-ergon/peer-audited--behavioral-blockchain/issues/123) native camera module | `TKT-P0-002`, `F-MOBILE-01` | `Monitor` | `H:MN` | monitor | verify native contractor path exists and track risk | `02 Beta Gate`, `04 Engineering Delivery` |
| [#134](https://github.com/organvm-iii-ergon/peer-audited--behavioral-blockchain/issues/134) native mobile blockers | `TKT-P0-002`, `TKT-P1-007` | `Monitor` | `H:MN` | monitor | track mobile-native timeline against Beta/Gamma | `02 Beta Gate`, `04 Engineering Delivery` |

## Gamma Gate: June 30, 2026

| Issue | Repo linkage | Lane | Primary owner | Partner role | Next action | Board view |
|---|---|---|---|---|---|---|
| [#126](https://github.com/organvm-iii-ergon/peer-audited--behavioral-blockchain/issues/126) Fitbit/WHOOP API integration | `F-VERIFY-04` | `Partner` | `H:BD` | drive | open partnership/API access conversations now, before May | `01 Exec / Partner Command`, `03 Blocked Handoffs` |
| [#148](https://github.com/organvm-iii-ergon/peer-audited--behavioral-blockchain/issues/148) consent matrix counsel review | `F-LEGAL-10` | `Partner` | `H:LC` | drive | queue with outside counsel after state matrix work begins | `01 Exec / Partner Command`, `03 Blocked Handoffs` |
| [#124](https://github.com/organvm-iii-ergon/peer-audited--behavioral-blockchain/issues/124) HealthKit bridge | `TKT-P1-007`, `F-VERIFY-02` | `Monitor` | `H:MN` | monitor | track native delivery readiness | `04 Engineering Delivery` |
| [#125](https://github.com/organvm-iii-ergon/peer-audited--behavioral-blockchain/issues/125) Health Connect bridge | `F-VERIFY-03` | `Monitor` | `H:MN` | monitor | decide whether Android is contracted or deferred | `04 Engineering Delivery` |

## Omega / Later Business Pipeline

| Issue | Repo linkage | Lane | Primary owner | Partner role | Next action | Board view |
|---|---|---|---|---|---|---|
| [#129](https://github.com/organvm-iii-ergon/peer-audited--behavioral-blockchain/issues/129) Plaid Link integration | `F-WEB-05` | `Partner` | `H:BD` | queue | prepare banking/vendor research, not Beta work | `06 Later Pipeline` |
| [#137](https://github.com/organvm-iii-ergon/peer-audited--behavioral-blockchain/issues/137) prize indemnity insurance | `F-LEGAL-07` | `Partner` | `H:LC` | queue | document insurance requirements and broker options | `06 Later Pipeline` |
| [#139](https://github.com/organvm-iii-ergon/peer-audited--behavioral-blockchain/issues/139) hardware partnership program | `F-INFRA-10` | `Partner` | `H:BD` | queue | identify strategic hardware partners after Beta | `06 Later Pipeline` |
| [#140](https://github.com/organvm-iii-ergon/peer-audited--behavioral-blockchain/issues/140) insurance partnership | `F-B2B-09` | `Partner` | `H:BD` | queue | define post-Beta channel thesis first | `06 Later Pipeline` |
| [#147](https://github.com/organvm-iii-ergon/peer-audited--behavioral-blockchain/issues/147) stablecoin pathway | `F-LEGAL-11` | `Partner` | `H:LC` + `H:BD` | queue | keep as later strategy, not current launch path | `06 Later Pipeline` |
| [#138](https://github.com/organvm-iii-ergon/peer-audited--behavioral-blockchain/issues/138) web shop routing + Apple notice compliance | `F-INFRA-09` | `Shared` | `H:LC` + `H:RO` | queue | revisit only once App Store and payment base path are stable | `06 Later Pipeline` |

## Phase Epics That Should Stay Visible

| Issue | Role in board |
|---|---|
| [#555](https://github.com/organvm-iii-ergon/peer-audited--behavioral-blockchain/issues/555) Phase Beta epic | top-level milestone anchor |
| [#556](https://github.com/organvm-iii-ergon/peer-audited--behavioral-blockchain/issues/556) Phase Gamma epic | next gate anchor |
| [#557](https://github.com/organvm-iii-ergon/peer-audited--behavioral-blockchain/issues/557) Phase Delta epic | later roadmap anchor |
| [#558](https://github.com/organvm-iii-ergon/peer-audited--behavioral-blockchain/issues/558) Phase Omega epic | long-range anchor |

## Board Rules Derived From This Matrix

- Every open issue in the active board should have one lane: `Partner`, `Shared`, `Engineering`, or `Archive`.
- Every blocked handoff should map to a named owner role, not just a milestone.
- Partner-facing views should default to Beta and Gamma blockers first, then hide later pipeline items unless explicitly requested.
