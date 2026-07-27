# Support Channel Setup -- Email, Discord, FAQ, & Escalation
> Issue: #371
> Phase: Pre-Private Beta

## Overview

Styx operates in a sensitive domain: real money, behavior change, and peer review. Support must be responsive, empathetic, and technically capable. This doc covers email support infrastructure (Zendesk/Intercom), Discord server setup, FAQ/knowledge base structure, SLA targets, and escalation paths.

## Email Support

### Tool Choice: Intercom (Recommended)

| Criteria | Intercom | Zendesk | Free Tier Status |
|----------|----------|---------|------------------|
| In-app chat | Yes | Yes (add-on) | Both offer free trials |
| Email ticketing | Yes | Yes | Intercom: 10 conversations/mo free |
| Knowledge base | Yes | Yes | Zendesk: Suite Team $55/agent/mo |
| Bot/automation | Yes (Fin AI) | Yes | Intercom Essential: $39/mo |
| Integration (API) | Yes | Yes | Both good |
| Startup pricing | 90% off first year | 50% off first year | Apply for startup programs |

**Recommendation:** Intercom for beta (free / startup plan). Migrate to Zendesk only if ticket volume exceeds 500/mo post-launch.

### Alternative for Bootstrap: Open-Source Stack

| Tool | Cost | Purpose |
|------|------|---------|
| Zammad (self-hosted on Render) | $7/mo (Render Starter) | Ticketing system |
| Crisp (free tier) | $0 | In-app chat (up to 2 operators) |
| Discord (free) | $0 | Community support |

### Support Email Aliases

| Alias | Purpose | Forwarded To |
|-------|---------|--------------|
| `support@styx.app` | General support | Intercom inbox (default) |
| `billing@styx.app` | Payment / escrow questions | Intercom + founders |
| `security@styx.app` | Security concerns | Founders only |
| `abuse@styx.app` | Report abuse / policy violation | Founders only |
| `press@styx.app` | Media inquiries | Non-technical founder |
| `practitioners@styx.app` | Practitioner-specific support | Intercom + practitioner lead |
| `fury@styx.app` | Fury auditor support | Intercom |

### Ticket Lifecycle

```
1. User submits via email or in-app chat
2. Intercom auto-replies: "We got your message. Typical response time: [SLA]"
3. Bot categorizes: billing / technical / account / abuse / other
4. Assignee auto-assigned (or manual for complex issues)
5. Response sent (within SLA)
6. User marks as resolved (or auto-close after 72h of no reply)
7. Satisfaction survey sent
8. Ticket tagged for analytics
```

### Ticket Categories & Routing

| Category | Priority | Assignee | First Response SLA |
|----------|----------|----------|-------------------|
| Account access (login, reset) | High | Founders | < 2 hours |
| Payment / escrow issue | Critical | Technical founder | < 1 hour |
| Contract dispute | High | Both founders | < 2 hours |
| Bug report | Varies | Technical founder | < 4 hours |
| Feature request | Low | Product manager (when hired) | < 24 hours |
| Abuse / policy violation | Critical | Both founders | < 1 hour |
| General question | Medium | Support (when hired) | < 4 hours |
| Fury audit question | Medium | Support (when hired) | < 4 hours |

### Canned Responses (Templates)

Create response templates for common issues:

| Issue | Template ID |
|-------|-------------|
| How to create a contract | `t_create_contract` |
| Proof was rejected | `t_proof_rejected` |
| Refund request | `t_refund_request` |
| What is Fury | `t_fury_explained` |
| Is this gambling | `t_not_gambling` |
| Password reset | `t_password_reset` |
| Payment failed | `t_payment_failed` |
| Change stake amount | `t_change_stake` |
| Become a Fury auditor | `t_become_fury` |
| Practitioner setup | `t_practitioner_setup` |

## Discord Server Setup

### Server Structure

```
Styx Community (Public)
+-- #welcome -- Rules, roles, getting started
+-- #announcements -- Product updates, maintenance, events (mod only)
+-- #general -- General discussion (no support requests)
|
+-- -- BETA SUPPORT --
+-- #getting-help -- Support requests (public, searchable)
+-- #bugs -- Bug reports (structured format pinned)
+-- #feature-requests -- Upvotable feature ideas (threaded)
|
+-- -- PRODUCT --
+-- #contract-showcase -- "I completed my contract!" sharing
+-- #tips-and-tricks -- How to use Styx effectively
+-- #fury-auditors -- Fury-specific chat (role-restricted)
+-- #practitioners -- Practitioner-only chat (role-restricted)
|
+-- -- COMMUNITY --
+-- #off-topic -- Non-Styx chat
+-- #success-stories -- Behavior change wins (moderated)
+-- #goals -- Share your Styx goals
|
+-- -- STAFF -- (mod only)
    +-- #mod-log -- Moderation actions
    +-- #internal -- Staff discussion
    +-- #escalations -- Support escalations
```

### Discord Roles

| Role | Color | Permissions | Assignment |
|------|-------|------------|------------|
| `@admin` | Red | Full admin | Founders |
| `@moderator` | Orange | Moderate channels, mute/kick | Trusted community members |
| `@fury-auditor` | Purple | Access fury-auditors channel | Verified auditors |
| `@practitioner` | Green | Access practitioners channel | Verified practitioners |
| `@beta-tester` | Blue | Colored name, priority support | Beta participants |
| `@helper` | Yellow | Access to help channel moderation | Active community helpers |
| `@member` | Default | Standard access | All users |

### Moderation Guidelines

| Violation | Action (First) | Action (Repeat) |
|-----------|---------------|-----------------|
| Spam / self-promotion | Warning + delete | 24h mute -> ban |
| Harassment | Warning + delete | 7d mute -> ban |
| Gambling accusations (bad faith) | Redirect to FAQ | 24h mute |
| Sharing private contract details | Warning + ask to delete | 24h mute |
| NSFW content | Immediate delete + 7d mute | Ban |
| Impersonation | Immediate ban | -- |
| Doxxing | Immediate ban | -- |

### Discord Moderation Bot

| Bot | Purpose | Configuration |
|-----|---------|---------------|
| MEE6 | Auto-mod, leveling, welcome messages | Set up filter rules |
| Carl-bot | Moderation commands, reaction roles | Set up reaction roles for Fury/Practitioner |
| YAGPDB | Automated moderation, logging | Set up mod-log channel |
| Dyno | Custom commands, auto-responses | Create !styx, !faq commands |

### Auto-Response Commands

| Command | Response |
|---------|----------|
| `!styx` | Brief description + link to website |
| `!faq` | Link to FAQ/knowledge base |
| `!rules` | Link to server rules |
| `!gambling` | "Styx is not gambling. Outcome is controlled by user behavior, not chance. FAQ: [link]" |
| `!roles` | Available roles + how to get them |
| `!support` | "For support requests, please open a ticket in #getting-help or email support@styx.app" |

## FAQ / Knowledge Base

### Hosting

| Option | Cost | Pros | Cons |
|--------|------|------|------|
| Intercom Articles | Included w/ Intercom | Integrated with tickets | Limited customization |
| Notion (public page) | Free | Easy to edit, version history | Not integrated with support flow |
| Helpjuice | $120/mo | Powerful search, analytics | Expensive for beta |
| Custom (Next.js page) | Hosting cost only | Full control, branded | Engineering time |

**Recommendation:** Start with a public Notion page for beta. Migrate to Intercom Articles when Intercom is adopted.

### FAQ Structure

```
Styx FAQ
+-- Getting Started
|   +-- What is Styx?
|   +-- How do I create an account?
|   +-- How do I create my first contract?
|   +-- What payment methods are accepted?
|
+-- Contracts & Stakes
|   +-- How does the escrow work?
|   +-- What happens if I fail my contract?
|   +-- Can I change my stake amount?
|   +-- What are the contract types?
|   +-- What is the minimum/maximum contract amount?
|
+-- Proof & Audit
|   +-- What counts as valid proof?
|   +-- How does the Fury audit work?
|   +-- What if my proof is rejected?
|   +-- How long does the audit take?
|   +-- Can I appeal a verdict?
|
+-- Money & Payments
|   +-- Is Styx gambling?
|   +-- How do I get my money back?
|   +-- What are the platform fees?
|   +-- How do refunds work?
|   +-- What is the FBO escrow account?
|
+-- Practitioners
|   +-- How do I set up a practitioner account?
|   +-- How do I invite my clients?
|   +-- What data can I see about my clients?
|   +-- Is Styx HIPAA compliant?
|   +-- What are the pricing tiers?
|
+-- Privacy & Security
|   +-- What data does Styx collect?
|   +-- How is my data stored?
|   +-- Can I delete my account?
|   +-- What is the Aegis Protocol?
|   +-- How does the linguistic cloaker work?
|
+-- Technical Support
|   +-- Supported browsers and devices
|   +-- App not loading / errors
|   +-- Payment not going through
|   +-- Notification issues
|   +-- How to contact support
```

### Essential FAQ Entries (First 10)

1. **What is Styx?** A peer-audited accountability platform where you stake real money on your goals. Complete your goal, get your money back. Fail, and the money is forfeit. Peer reviewers ("Furies") verify your proof so you can't cheat.

2. **Is Styx gambling?** No. Gambling involves random chance. In Styx, the outcome is 100% controlled by your behavior. You decide the goal, you do the work, you submit the proof. This is a commitment device, not a bet.

3. **How does the escrow work?** Your stake is held in a Stripe FBO (For Benefit Of) account -- a separate bank account outside Styx's operating funds. When you complete your contract and auditors verify your proof, the full stake is returned to you.

4. **What happens if I fail my contract?** Your stake is forfeited. It does not go to Styx -- it goes to the other side of the contract (the counterparty or, in some cases, another Fury bounty pool). Styx only keeps the platform fee.

5. **How does the Fury audit work?** When you submit proof, it's assigned to 3 anonymous auditors (Furies). They independently review your proof against the contract terms. If 2+ agree it's valid, you pass. Furies earn bounties for correct verdicts and lose stakes for incorrect ones.

6. **What counts as valid proof?** It depends on your contract type. Photo, video, screenshot, file upload, or wearable data. Each contract specifies the required proof format. Must be timestamped and verifiable.

7. **How do I get my money back?** Complete your contract according to the terms, submit valid proof, pass the Fury audit. Funds are released from escrow back to your payment method, typically within 24-48 hours after audit completion.

8. **Can I delete my account?** Yes. Go to Settings > Delete Account. This will cancel all active contracts (stakes returned if no failure occurred), close your account, and delete your personal data. Ledger entries are retained for audit compliance but are disassociated from your identity.

9. **What data does Styx collect?** Email, name, payment method, and contract details (goal, proof files, audit results). We do NOT store health data. Practitioners see only aggregate completion statistics, not individual proof content.

10. **What is the Aegis Protocol?** A set of health guardrails that prevent dangerous contracts: BMI floor (18.5), 2% weekly loss velocity cap, weekend multipliers for vulnerability windows. No contract can violate these parameters.

## SLA Targets

### Beta Phase (Private + Public Beta)

| Channel | Hours | Response Time | Resolution Time |
|---------|-------|---------------|-----------------|
| Email (general) | Mon-Fri 9am-9pm ET | < 4 hours | < 24 hours |
| Email (billing) | Mon-Fri 9am-9pm ET | < 2 hours | < 12 hours |
| Email (security) | 24/7 | < 1 hour | < 4 hours |
| Discord (public) | Mon-Fri 9am-9pm ET | < 2 hours | < 12 hours |
| Discord (DM founders) | 24/7 (emergency only) | < 30 min | < 2 hours |
| In-app chat | Mon-Fri 9am-9pm ET | < 2 hours | < 12 hours |
| Bug fix (P0) | 24/7 | Immediate | < 4 hours |
| Bug fix (P1) | Next business day | < 4 hours | < 24 hours |

### Launch Phase

| Channel | Hours | Response Time | Resolution Time |
|---------|-------|---------------|-----------------|
| Email (general) | 7am-11pm ET daily | < 2 hours | < 12 hours |
| Email (billing) | 7am-11pm ET daily | < 1 hour | < 6 hours |
| Email (security) | 24/7 | < 30 min | < 2 hours |
| Discord (public) | 7am-11pm ET daily | < 1 hour | < 8 hours |
| In-app chat | 7am-11pm ET daily | < 1 hour | < 8 hours |
| Bug fix (P0) | 24/7 | < 30 min | < 2 hours |
| Bug fix (P1) | 12 hours | < 2 hours | < 12 hours |

### SLA Exclusions

- Beta phase: no SLA on weekends (founder availability)
- Feature requests: no resolution SLA (tracked in backlog)
- Known bugs with published workaround: no fix SLA
- Third-party outages (Stripe, Render, Cloudflare): no Styx SLA

## Escalation Paths

### Escalation Levels

| Level | Who | Authority | When |
|-------|-----|-----------|------|
| L0 | Automated (bot/FAQ) | Respond with canned answer | Common questions, password reset |
| L1 | Support (when hired) | Answer questions, escalate bugs | Most tickets |
| L2 | Founders (both) | Refund decisions, account changes, bug fixes | Payment issues, disputes, P0 bugs |
| L3 | Technical founder | Code changes, infrastructure, Stripe issues | System bugs, data issues, Stripe problems |

### Escalation Flow

```
User submits ticket
    |
    v
L0: Bot triages -- match FAQ?
    |-- YES: Auto-respond with FAQ link. If user confirms resolved, close.
    |-- NO: Route to L1/L2.
    |
    v
L1/L2: First response within SLA
    |
    +-- Can resolve? -> Respond, resolve, close.
    |
    +-- Needs L3? -> Tag for technical founder, note urgency.
    |    |
    |    v
    |    L3: Acknowledge within 1 hour (P0) or 4 hours (P1+).
    |    -> Resolve, document, close.
    |
    +-- Needs human gate? -> Elevate to "needs_human" task in task tracker.
                              Notify both founders.
```

### When to Escalate

| Situation | Escalate To | Urgency |
|-----------|-------------|---------|
| Dispute / refund request > $200 | Both founders | High |
| Stripe error / payment system down | Technical founder | Critical |
| User expresses self-harm or crisis | Immediate resources (988) + pause contract | Emergency |
| Legal / regulatory question | Both founders + legal counsel | High |
| Data breach suspicion | Both founders | Critical |
| Press / media inquiry | Non-technical founder | Medium |
| Abuse / policy violation | Both founders | High |
| Repeated bug reports (same issue) | Technical founder + product backlog | Medium |

### Emergency Contact

| Situation | Contact | Method |
|-----------|---------|--------|
| Server down | Technical founder | Phone (SMS gateway) |
| Stripe outage | Technical founder | Phone |
| Security incident | Both founders | Phone + Signal |
| User crisis | 988 Suicide & Crisis Lifeline | Phone (not Styx) |

## Support Tools & Infrastructure

| Tool | Purpose | Cost (Beta) |
|------|---------|-------------|
| Crisp (free tier) | In-app chat | $0 |
| Discord | Community support | $0 |
| Notion (public) | Knowledge base / FAQ | $0 |
| Google Forms | Bug report intake (structured) | $0 |
| Linear/GitHub Issues | Bug tracking | $0 |
| Sentry | Error monitoring (triggers support tickets) | $0 (free tier) |
| PostHog | Product analytics (identify friction) | $0 (free tier) |

## Support Metrics & Reporting

| Metric | Tool | Frequency | Target |
|--------|------|-----------|--------|
| First response time | Intercom/Crisp | Weekly | < SLA for all channels |
| Resolution time | Intercom/Crisp | Weekly | < 24h for 90% of tickets |
| CSAT (satisfaction) | Post-resolution survey | Weekly | > 4.0 / 5.0 |
| Ticket volume | Intercom/Crisp | Daily | Trending |
| Common issues (top 5) | Tag analysis | Weekly | Reduced week-over-week |
| Bug report count | Linear/GitHub | Daily | Decreasing |
| Self-service rate | FAQ analytics | Monthly | > 40% of inquiries |
| Escalation rate | Ticket tags | Weekly | < 10% of tickets |
| Discord engagement | Discord analytics | Weekly | Growing |
| Escrow-related tickets | Stripe + ticket tags | Daily | < 2/week |

## Support Team Scaling

| Phase | Team Size | Who | Tools |
|-------|-----------|-----|-------|
| Private beta (wk 1-8) | 2 (both founders) | Both founders split support | Discord + Crisp + Notion |
| Public beta (wk 9-20) | 2 + 1 part-time | Founders + first support hire | Intercom + Discord |
| Launch (wk 21+) | 3 + 1 support engineer | Dedicated support lead + engineer | Intercom + Zendesk (if needed) |

## On-Call Rotation

### Beta Phase (Founders)

| Day | Primary | Secondary |
|-----|---------|-----------|
| Monday | Technical founder | Non-technical founder |
| Tuesday | Technical founder | Non-technical founder |
| Wednesday | Non-technical founder | Technical founder |
| Thursday | Non-technical founder | Technical founder |
| Friday | Both | -- |
| Saturday | Technical founder (on-call) | -- |
| Sunday | Non-technical founder (on-call) | -- |

### Incident Response

For P0/Critical issues (see docs/operations/incident-response.md):
- Alert via Slack + SMS (Twilio)
- Primary responds within 15 min
- If no response in 15 min, secondary is paged
- Status page updated within 30 min
