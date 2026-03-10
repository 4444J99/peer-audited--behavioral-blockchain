# Legal Artifact Production Plan (2026-03-09)

This plan turns "do the legal whitepapers and legal brief" into concrete deliverables, source material, and sequencing.

## Legal Artifacts To Produce

### 1. Skill-Based Contest Whitepaper

Purpose:

- Establish the core legal theory that Styx is a skill-based behavioral commitment system rather than a chance-based gambling product.

Primary output:

- Whitepaper in PDF and Markdown.
- Counsel approval memo.
- Version identifier and date.

Primary sources:

- [legal--performance-wagering.md](/Users/4jp/Workspace/organvm-iii-ergon/peer-audited--behavioral-blockchain/docs/legal/legal--performance-wagering.md)
- [legal--aegis-protocol.md](/Users/4jp/Workspace/organvm-iii-ergon/peer-audited--behavioral-blockchain/docs/legal/legal--aegis-protocol.md)
- [legal--gatekeeper-compliance.md](/Users/4jp/Workspace/organvm-iii-ergon/peer-audited--behavioral-blockchain/docs/legal/legal--gatekeeper-compliance.md)
- [research--prediction-markets-regulation-finance.md](/Users/4jp/Workspace/organvm-iii-ergon/peer-audited--behavioral-blockchain/docs/research/research--prediction-markets-regulation-finance.md)
- [planning--phase1-private-beta-scope.md](/Users/4jp/Workspace/organvm-iii-ergon/peer-audited--behavioral-blockchain/docs/planning/planning--phase1-private-beta-scope.md)

Main questions:

- What exact legal framing applies to the current `Test-Money Pilot` beta?
- What changes once the product moves to real-money settlement?
- Which jurisdictions need explicit caveats or exclusion?
- Which product terms must remain fixed for the theory to hold?

### 2. App Store UGC Moderation Packet

Purpose:

- Satisfy Apple-facing moderation and safety expectations for user-submitted proof content.

Primary output:

- Moderation policy.
- Report / escalation / removal flow.
- App Review notes and screenshots.
- Sign-off record.

Primary sources:

- [research--bounty-shame-protocol-safety-legality.md](/Users/4jp/Workspace/organvm-iii-ergon/peer-audited--behavioral-blockchain/docs/research/research--bounty-shame-protocol-safety-legality.md)
- [research--app-verification-tech-privacy-law.md](/Users/4jp/Workspace/organvm-iii-ergon/peer-audited--behavioral-blockchain/docs/research/research--app-verification-tech-privacy-law.md)
- GitHub [#63](https://github.com/organvm-iii-ergon/peer-audited--behavioral-blockchain/issues/63)
- GitHub [#146](https://github.com/organvm-iii-ergon/peer-audited--behavioral-blockchain/issues/146)

Main questions:

- What is the minimum moderation package required for external TestFlight/App Review?
- What belongs in the later public App Store launch package instead?
- How do the in-app UX, policy text, and App Review notes stay consistent?

### 3. Cross-Jurisdictional Consent Matrix

Purpose:

- Define privacy and consent constraints by verification method and jurisdiction.

Primary output:

- Counsel-reviewed jurisdiction matrix.
- Implementation memo for engineering.

Primary sources:

- [research--app-verification-tech-privacy-law.md](/Users/4jp/Workspace/organvm-iii-ergon/peer-audited--behavioral-blockchain/docs/research/research--app-verification-tech-privacy-law.md)
- [research--bounty-shame-protocol-safety-legality.md](/Users/4jp/Workspace/organvm-iii-ergon/peer-audited--behavioral-blockchain/docs/research/research--bounty-shame-protocol-safety-legality.md)
- GitHub [#67](https://github.com/organvm-iii-ergon/peer-audited--behavioral-blockchain/issues/67)
- GitHub [#148](https://github.com/organvm-iii-ergon/peer-audited--behavioral-blockchain/issues/148)

Main questions:

- Which verification methods are allowed where?
- What consent language is required?
- What retention/deletion rules apply?
- What fallback behavior is required when a method is not allowed?

### 4. Real-Money Activation Legal Brief

Purpose:

- Prepare the legal and commercial package for any future move from test-money to real-money.

Primary output:

- Counsel-facing legal brief.
- Merchant/processor submission support memo.
- Open-risk register.

Primary sources:

- [legal--gatekeeper-compliance.md](/Users/4jp/Workspace/organvm-iii-ergon/peer-audited--behavioral-blockchain/docs/legal/legal--gatekeeper-compliance.md)
- [legal--performance-wagering.md](/Users/4jp/Workspace/organvm-iii-ergon/peer-audited--behavioral-blockchain/docs/legal/legal--performance-wagering.md)
- [legal--aegis-protocol.md](/Users/4jp/Workspace/organvm-iii-ergon/peer-audited--behavioral-blockchain/docs/legal/legal--aegis-protocol.md)
- GitHub [#132](https://github.com/organvm-iii-ergon/peer-audited--behavioral-blockchain/issues/132)
- GitHub [#133](https://github.com/organvm-iii-ergon/peer-audited--behavioral-blockchain/issues/133)

Main questions:

- What exactly changes when the product becomes real-money instead of test-money?
- What custody/FBO theory and processor framing are supportable?
- Is KYC required for all monetary users or only above threshold tiers?
- What disclosures and jurisdiction rules become mandatory at activation?

## Recommended Production Sequence

1. App Store UGC moderation minimum packet.
2. Apple/TestFlight ops packet evidence.
3. Skill-based contest whitepaper.
4. Cross-jurisdictional consent matrix.
5. Real-money activation legal brief.

This order matches the current scope reality better than the board’s current blocker labels.

## Owner Split

`Jessica / Partner business side`

- retain counsel
- schedule review cadence
- manage outreach, signatures, and artifact storage
- keep issue state tied to actual deliverables

`Outside counsel`

- review and mark legal positions
- identify jurisdiction caveats
- approve or reject proposed framing

`Agent / research support`

- assemble source corpus
- prepare first-draft memos
- normalize citations and issue linkage
- convert counsel comments into updated draft structure

## Artifact Discipline

Every legal artifact should have:

- title
- date
- version
- owner
- approval status
- source document list
- linked GitHub issue(s)

Without that metadata, the legal work will drift back into informal notes.
