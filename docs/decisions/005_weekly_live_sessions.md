# ADR 005: Weekly Live Sessions — In-App Scheduling vs External Operational Cadence

## Status
Accepted

## Context
As part of our customer success and community engagement efforts, we host weekly live sessions. We need to decide how users will discover, schedule, and join these sessions. 
The two main options are:
1. **In-app scheduling:** Build custom calendar views, RSVP logic, timezone conversions, and reminder notifications directly into the Styx application.
2. **External operational cadence:** Use existing external tools (e.g., Google Calendar, Calendly, Zoom, Luma, or Slack) to manage the operational cadence of these live sessions, providing simple links from within the application or via email.

Building scheduling and calendar management from scratch is notoriously complex due to timezone handling, sync issues with personal calendars, and reminder deliverability. However, having it in-app keeps the user within our ecosystem.

## Decision
We will use an **external operational cadence** for weekly live sessions instead of building in-app scheduling.

We will rely on standard external tools (e.g., Luma, Calendly, or Google Calendar) to handle event registration, calendar invites, timezone management, and reminder emails. Where necessary, the Styx app will simply link out to the external registration page or provide the Zoom/Meet link directly.

## Consequences

**Positive:**
- Significant engineering time saved by not building complex scheduling, RSVP, and timezone logic.
- Users receive standard calendar invites (.ics) that integrate seamlessly with their preferred calendar clients (Google Calendar, Outlook, Apple Calendar).
- External tools already provide robust, reliable reminder notifications.
- The team can focus core engineering efforts on the unique value propositions of the Styx platform.

**Negative:**
- Users must briefly leave the Styx application to register for or add the event to their calendar.
- Analytics and tracking require integrating data from the external tool back into our systems (e.g., via webhooks) if we want to tie attendance to in-app user behaviour.
- Less customization over the scheduling UI compared to a fully native integration.

## Alternatives Considered
- **In-app scheduling built from scratch:** Rejected due to high development and maintenance costs (timezones, ICS generation, reminder emails).
- **Embedded external widgets:** Considered as a middle ground. We may revisit embedding an external widget (like Calendly) in the future if dropping users out of the app becomes an issue, but for now, simple external links are sufficient.
