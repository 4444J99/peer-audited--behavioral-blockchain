# Enterprise Sales Readiness Gate (November 2026)

Every item must pass before we actively sell to enterprise customers.

## Security & Compliance

- [ ] **SOC 2 Type I audit initiated** — auditor engaged, evidence collection underway. Enterprise customers ask "are you SOC 2 compliant?" — we need a documented answer. Verify: engagement letter or documented roadmap with timeline. Owner: H:LC
- [ ] **Security questionnaire pre-filled** — answers to the 50 most common enterprise security questions available as a PDF. Verify: doc exists in docs/enterprise/. Owner: H:LC
- [ ] **SLA/SOW template finalized** — uptime guarantee, support response times, data processing terms. Verify: reviewed by counsel. Owner: H:LC
- [ ] **Vendor security review packet compiled** — SOC 2 reports, penetration test summary, data flow diagram, infrastructure diagram, subprocessor list. Verify: packet sent to first prospect. Owner: H:LC + H:ENG
- [ ] **HIPAA BAA ready to sign** — for healthcare enterprise customers. Verify: BAA template reviewed by counsel. Template drafted at [`../legal/hipaa-baa-template-DRAFT.md`](../legal/hipaa-baa-template-DRAFT.md); **counsel review has not happened**, and its §0 lists nine technical prerequisites that are not met — including that the schema has no PHI classification at all. Owner: H:LC

## Product & Infrastructure

- [ ] **Enterprise demo environment active** — sandboxed Render instance with sample data, accessible without real signup. Verify: prospect can complete walkthrough unassisted. Owner: H:ENG
- [ ] **Multi-location / multi-practitioner admin UI functional** — centralized billing, role-based permissions, cross-location analytics. Verify: test accounts set up. Owner: H:ENG
- [ ] **SAML 2.0 SSO functional** — identity provider integration tested (Okta, Azure AD, Google Workspace). Verify: login flow end-to-end with test IdP. Owner: H:ENG
- [ ] **Data export (CSV/JSON) functional** — enterprise data lake export, webhook notifications for contract events. Verify: export downloaded, webhook received. Owner: H:ENG
- [ ] **Usage-based billing metering implemented** — per-seat or per-client tracking, invoice generation. Verify: test invoice generated. Owner: H:ENG
- [ ] **Custom contract templates for enterprise** — ability to create, save, and share org-wide templates. Verify: template CRUD tested. Owner: H:ENG

## Sales & Marketing

- [ ] **Enterprise pricing finalized** — Starter $49/mo (5 clients), Growth $149/mo (25), Scale $349/mo (75), Enterprise $999+/mo. Verify: pricing page or proposal template. Owner: H:FO
- [ ] **Outreach sequences tested** — 5-touch, 21-day cold email/LinkedIn sequence for ICP targets. Verify: 10+ prospects contacted, response rate measured. Owner: H:BD
- [ ] **Case studies / social proof assets** — 3+ case studies from beta pilot practitioners. Verify: written, approved by subjects. Owner: H:GRO
- [ ] **Security whitepaper published** — encryption, access control, infrastructure architecture, audit logging. Written at [`../enterprise/security-whitepaper.md`](../enterprise/security-whitepaper.md); every control names its implementing file and unimplemented controls are listed separately in its §12. Remaining: publish it on the website or into the prospect packet. Verify: available on website or upon request. Owner: H:ENG
- [ ] **Pilot pipeline active** — 3+ enterprise prospects in active evaluation. Verify: CRM pipeline report. Owner: H:BD
- [ ] **Referral partner program documented** — commission structure, onboarding process, partner portal. Verify: partner agreement template. Owner: H:BD

## Pass Criteria

All checkboxes checked = gate passed. Any open item blocks active enterprise sales.
