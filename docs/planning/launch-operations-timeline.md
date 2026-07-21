# Launch Operations Timeline (March–December 2026)

Cross-departmental milestones for taking Styx from internal prototype to public product.

## Milestones

### March 2026: Foundation
- [ ] **Apple Developer Account + TestFlight setup** (OPS, ENG — H:RO)
  - Register for Apple Developer Program ($99/yr)
  - Configure TestFlight for beta distribution
  - Without this, we cannot ship to iPhones
- [ ] **Hire/collaborate: First part-time support / CX person** (OPS — H:FO)
  - Customer experience lead for managing beta user communications
  - Coverage during US business hours at minimum

### April–May 2026: Internal Dogfood
- [ ] **Internal dogfood beta** (ENG, PRD — H:RO, H:PRD)
  - 5–10 trusted people using the system daily
  - Weekly syncs for bug reports and UX feedback
- [ ] **Beta feedback synthesis** (PRD — H:PRD)
  - Structured feedback collection form
  - Weekly feedback review meetings
  - Prioritized bug/feature backlog

### June–July 2026: External Beta — TestMoney
- [ ] **TestFlight external beta (50–100 users)** (OPS, ENG — H:RO)
  - Public TestFlight link shared with allowlist
  - Users join beta with test-money mode (no real funds)
- [ ] **Real-money pilot readiness** (OPS, FIN, LEG — H:FO, H:LC)
  - Stripe production keys configured
  - High-risk merchant account setup
  - Financial reconciliation process documented
  - Gate checklist: `docs/checklists/real-money-pilot-readiness.md`
- [ ] **Open beta expansion (500+ users)** (GRO — H:GRO)
  - Practitioner outreach campaign
  - SEO content published (4+ articles)
  - Landing pages live and converting

### August–September 2026: Beta Iteration
- [ ] **Beta operations — 500+ users** (OPS, CXS — H:RO, H:CXS)
  - Scaling infrastructure if needed
  - Support channel management
  - Churn signal monitoring and intervention
- [ ] **Mobile app hardens** (ENG — H:ENG)
  - Push notifications fully operational
  - APNs/FCM credential rotation process established
  - Crash rate < 0.1%

### October 2026: App Store Launch
- [ ] **App Store launch readiness** (OPS, LEG, PRD — H:RO, H:LC)
  - UGC moderation policy written (required for App Review)
  - Apple App Review submission package complete
  - Gate checklist: `docs/checklists/app-store-launch-readiness.md`
- [ ] **App Store submission** (OPS — H:RO)
  - Build uploaded via Xcode/Transporter
  - Review processing time: 1–7 days typical
  - Contingency plan: handle rejection and resubmit

### November–December 2026: General Availability
- [ ] **Enterprise sales readiness** (BD, ENG — H:BD, H:ENG)
  - SOC 2 audit underway
  - Enterprise demo environment live
  - SAML SSO functional
  - Gate checklist: `docs/checklists/enterprise-sales-readiness.md`
- [ ] **Public GA launch** (ALL — H:ALL)
  - Remove private beta labels
  - Public marketing campaign
  - Pricing page live
  - Self-serve signup flow activated

## Dependencies

| Milestone | Depends On |
|-----------|-----------|
| TestFlight external | Apple Developer Account + TestFlight setup (Mar) |
| Real-money pilot | TestFlight external + Stripe production |
| App Store launch | Open beta + Mobile app stable + Legal compliance |
| Enterprise sales | SOC 2 + SAML SSO + Enterprise demo env |
| Public GA | App Store approved + Support team ready + Marketing campaign |

## Key Owners

- H:FO — Finance & Operations
- H:RO — Release Ops
- H:LC — Legal & Compliance
- H:ENG — Engineering
- H:PRD — Product
- H:BD — Business Development
- H:GRO — Growth & Marketing
- H:CXS — Customer Success
- H:ALL — Everyone
