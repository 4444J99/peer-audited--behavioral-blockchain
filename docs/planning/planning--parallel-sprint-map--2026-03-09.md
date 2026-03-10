# Parallel Sprint Map (2026-03-09)

This document groups the active launch work into short sprints with multiple parallel strike lanes. The point is to make the workload legible and executable under time pressure, not to model every issue in the repository.

## Operating Rules

- Sprint length: 2 weeks for active execution
- Parallel lanes per sprint: 4 to 5 max
- Rule: each lane must have a clear boundary, one coordinating owner, and explicit exit criteria
- Rule: if a task has no owner and no exit criteria, it is not in the sprint
- Rule: Beta-gate work outranks later feature work, even if the later work is already ticketed

## Sprint Stack

| Sprint | Dates | Objective |
|---|---|---|
| `S1 - Beta Core Assault` | 2026-03-09 to 2026-03-20 | lock money rails, KYC rails, jurisdiction rails, and native/app-store blockers into explicit execution lanes |
| `S2 - Beta Gate Lock` | 2026-03-23 to 2026-04-03 | convert core work into readiness gates, safety controls, dogfood ops, and launch-admin surfaces |
| `S3 - External Beta Prep` | 2026-04-06 to 2026-04-17 | harden onboarding, recovery UX, proof UX, and trust-network interfaces for broader testing |
| `S4 - Gamma Shadow Queue` | 2026-04-20 to 2026-05-01 | queue the next-wave Gamma blockers so May starts with no ambiguity |
| `Later` | after 2026-05-01 | everything not needed for the immediate Beta/Gamma push |

## S1 - Beta Core Assault

Objective:

- make real-money settlement, KYC, jurisdiction control, and native proof capture concrete enough that Beta is not blocked by ambiguity

### Blitzkrieg A: Money Rails

- scope: settlement and reconciliation path
- issues:
  - `#169`
  - `#395`
  - `#396`
  - `#397`
  - `#398`
  - `#399`
  - `#400`
- owner mix: `AI` + `H:LC` + `H:BD`
- exit criteria:
  - deterministic preview/execute/reconcile path exists
  - custody review packet is ready for counsel
  - settlement tests cover the critical ledger path

### Blitzkrieg B: KYC and Identity

- scope: runtime KYC enforcement and stake-tier logic
- issues:
  - `#167`
  - `#386`
  - `#387`
  - `#388`
  - `#389`
  - `#390`
  - `#132`
  - `#133`
- owner mix: `AI` + `H:LC` + `H:BD`
- exit criteria:
  - KYC gate is wired at the right contract thresholds
  - provider path is selected or narrowed to final choice
  - legal review requirements are explicit, not implied

### Blitzkrieg C: Jurisdiction and Forfeit Controls

- scope: geofence fail-closed plus disposition rules
- issues:
  - `#278`
  - `#279`
  - `#401`
  - `#402`
  - `#403`
  - `#404`
  - `#405`
  - `#406`
  - `#407`
  - `#408`
  - `#409`
  - `#410`
- owner mix: `AI` + `H:LC`
- exit criteria:
  - unresolved jurisdiction fails closed
  - refund/capture state mapping is explicit per jurisdiction mode
  - legal sign-off item is isolated as a single unblocker, not scattered across tickets

### Blitzkrieg D: Native Capture and Distribution

- scope: native camera, app distribution, and App Store-facing blockers
- issues:
  - `#168`
  - `#391`
  - `#392`
  - `#393`
  - `#394`
  - `#123`
  - `#134`
  - `#141`
  - `#146`
  - `#365`
  - `#366`
  - `#367`
  - `#379`
  - `#380`
- owner mix: `H:MN` + `H:RO` + `H:LC` + `H:FO`
- exit criteria:
  - native camera delivery path is staffed and tracked
  - Apple account ownership is settled
  - moderation/policy package is in motion for App Store review

## S2 - Beta Gate Lock

Objective:

- turn the core rails into something the founders can actually gate and dogfood

### Blitzkrieg A: Safety and Responsible Use

- scope: self-exclusion and crisis guardrails
- issues:
  - `#411`
  - `#412`
  - `#413`
  - `#414`
  - `#472`
  - `#473`
  - `#474`
- owner mix: `AI` + `H:LC`
- exit criteria:
  - self-exclusion path is enforceable
  - crisis intervention path is visible and logged
  - safety controls are no longer just policy text

### Blitzkrieg B: Beta Readiness and Ops Gates

- scope: automated readiness contract, CI gates, monitoring, and dogfood ops
- issues:
  - `#369`
  - `#370`
  - `#371`
  - `#490`
  - `#491`
  - `#492`
  - `#523`
  - `#524`
  - `#525`
  - `#526`
  - `#527`
  - `#528`
  - `#529`
  - `#530`
- owner mix: `AI` + `H:RO` + `H:FO`
- exit criteria:
  - dogfood environment is operable
  - readiness gate reports blocking status correctly
  - monitoring/alerting and notification copy are not undefined

### Blitzkrieg C: Waitlist, Notifications, and Top-of-Funnel Plumbing

- scope: waitlist queue, referral path, notifications, early capture
- issues:
  - `#466`
  - `#467`
  - `#468`
  - `#499`
  - `#500`
  - `#501`
  - `#502`
  - `#503`
  - `#504`
  - `#505`
  - `#506`
  - `#507`
- owner mix: `AI` + `H:RO` + `GRO`
- exit criteria:
  - waitlist and notification systems support controlled cohort fill
  - referral and email capture primitives exist for early acquisition
  - this lane does not block Beta if S1 is still red

### Blitzkrieg D: Enterprise/B2B Beta Surfaces

- scope: org auth, billing, dashboard, and scope management
- issues:
  - `#546`
  - `#547`
  - `#548`
  - `#552`
  - `#553`
  - `#554`
- owner mix: `AI` + `B2B`
- exit criteria:
  - org authorization model exists
  - billing and dashboard surfaces can support early practitioner pilots
  - lane remains secondary to S1 if resources tighten

## S3 - External Beta Prep

Objective:

- harden the user-facing surfaces that determine whether broader testing teaches anything useful

### Blitzkrieg A: Recovery UX and Downscale Mechanics

- scope: lockdowns, multipliers, progress, downscale UX
- issues:
  - `#448`
  - `#449`
  - `#450`
  - `#451`
  - `#452`
  - `#453`
  - `#457`
  - `#458`
  - `#459`
- owner mix: `AI`
- exit criteria:
  - recovery difficulty is explicit and timed
  - downscale/progress UX reduces all-or-nothing failure

### Blitzkrieg B: Identity and Onboarding Path

- scope: survey system, emotional tracking, oath creation, onboarding identity
- issues:
  - `#460`
  - `#461`
  - `#462`
  - `#493`
  - `#494`
  - `#495`
  - `#496`
  - `#497`
  - `#498`
- owner mix: `AI` + `PRD`
- exit criteria:
  - first-time user flow becomes measurable
  - survey and emotional data are captured coherently

### Blitzkrieg C: Proof and Audit UX

- scope: proof processing, redaction, masked audit displays
- issues:
  - `#478`
  - `#479`
  - `#480`
  - `#481`
  - `#482`
  - `#483`
- owner mix: `AI`
- exit criteria:
  - proof upload state is understandable to testers
  - audit masking is visible and reviewable

### Blitzkrieg D: Trust Network Enforcement

- scope: collusion detection and slashing framework
- issues:
  - `#484`
  - `#485`
  - `#486`
  - `#487`
  - `#488`
  - `#489`
- owner mix: `AI` + `H:LC`
- exit criteria:
  - collusion clusters are visible to admins
  - enforcement model exists with rollback-safe tests

## S4 - Gamma Shadow Queue

Objective:

- prevent May from becoming a planning month instead of a shipping month

### Blitzkrieg A: Wearable and Native Shadow Queue

- scope: native health bridge and device data vendor path
- issues:
  - `#124`
  - `#125`
  - `#126`
  - `#148`
  - `#475`
  - `#476`
  - `#477`
  - `#381`
- owner mix: `H:MN` + `H:BD` + `H:LC`
- exit criteria:
  - wearable/vendor/legal blockers are queued with clear owners
  - no native health item enters May still ownerless

### Blitzkrieg B: External Beta Operations

- scope: external cohort launch and feedback synthesis
- issues:
  - `#372`
  - `#373`
  - `#374`
  - `#382`
- owner mix: `H:FO` + `H:RO` + `GRO`
- exit criteria:
  - external beta cohort plan exists
  - support and synthesis path is defined before scale increases

## What Should Not Enter The Active Sprint Stack Yet

- long-range Omega pipeline work not needed for Beta or Gamma
- archival audit/session/cache items
- work that has no realistic owner in the next 30 days

## Sprint Governance Rule

When a sprint slips, do not add more lanes. Collapse scope inside the lane and preserve the lane boundaries. The failure mode here is not too little planning; it is too many simultaneous priorities pretending to be one sprint.
