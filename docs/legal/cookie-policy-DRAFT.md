---
generated: true
department: LEG
artifact_id: L17
governing_sop: "SOP--legal-documentation.md"
phase: hardening
product: styx
date: "2026-08-15"
---

# Cookie and Local Storage Policy (Draft)

**STYX -- THE BLOCKCHAIN OF TRUTH**

_Last updated: 2026-08-15_
_Effective date: [TBD -- prior to beta launch]_

> **DRAFT — NOT COUNSEL-REVIEWED.**
> This is an internal draft authored from the platform's own implementation. It has **not** been
> reviewed by qualified legal counsel and is **not** a legally binding instrument. Outside counsel
> has not been retained (issue **#315**). Do not publish it at `styx.app/cookies` until counsel has
> reviewed it and until the enumeration below has been re-derived against the shipping build.

Named by the phase gate at `docs/checklists/phase-gate-public-process.md` §2 → Legal Documents:
*"Cookie Policy and consent banner implemented (CCPA compliance for US users)."* This document is
the policy half. **The consent banner is not implemented** — see §6.

**Why this is a separate document.** `docs/legal/privacy-policy.md` contains no cookie section — the
word does not appear in it — so there was nothing to extend. When the Privacy Policy goes to counsel,
this document should be reviewed alongside it, and counsel may prefer to fold it in as a section
rather than publish it separately.

---

## 1. What This Covers

This policy describes the cookies and browser storage the Styx web application uses. It covers two
mechanisms:

- **Cookies** — small values the server sets in your browser and the browser sends back with each
  request.
- **Local storage** — values the application stores in your browser and reads back locally. Local
  storage is **never transmitted to our servers**, but it is disclosed here because it is your
  device and you are entitled to know what is on it.

## 2. Cookies We Set

The web application sets exactly **three** cookies. All three are strictly necessary to operate an
authenticated session. **There are none other.**

| Name | Purpose | Readable by scripts | Lifetime |
|---|---|---|---|
| `styx_auth_token` | Your session access token. Identifies you to the API on each request. | No (`httpOnly`) | 15 minutes |
| `styx_refresh_token` | Renews your session without making you log in again. | No (`httpOnly`) | 7 days |
| `styx_csrf_token` | Cross-site request forgery protection. The application reads it and echoes it back on write requests so we can confirm the request came from our own pages. | **Yes** — deliberately | 15 minutes |

All three are set with the `Secure` attribute in production (transmitted only over HTTPS) and
`SameSite=Lax` (not sent on cross-site requests from other websites).

`styx_csrf_token` is script-readable by design. That is the "double-submit" CSRF pattern: the value
is derived cryptographically from your session token, so an attacker who can guess or fabricate a
cookie value cannot produce one that validates against your session. Its readability is a property
of the defence, not a weakness in it.

All three cookies are cleared when you log out.

## 3. Cookies We Do Not Set

We state these explicitly because their absence is the point:

- **No advertising cookies.** None. We run no advertising and no ad networks.
- **No third-party tracking cookies.** No Google Analytics, no Meta Pixel, no advertising SDK, no
  cross-site tracker.
- **No analytics cookies.** Product analytics, where collected, are collected server-side, not by a
  browser tag.
- **No cookies that identify you across other websites.**

Consequently there is **no sale or sharing of personal information** through cookies within the
meaning of the CCPA/CPRA, and no "Do Not Sell or Share My Personal Information" cookie mechanism to
offer, because there is nothing to opt out of.

## 4. Local Storage

The web application stores the following in your browser's local storage. These values stay on your
device.

| Key | Purpose | Category |
|---|---|---|
| `styx_email_notifs`, `styx_push_notifs` | Your notification preferences as shown in Settings | Preference |
| `styx_cloak_enabled` | Whether the privacy cloak display mode is on | Preference |
| `styx-chat-messages` | Your in-app assistant conversation, so it survives a page reload | Functional |
| `styx.snapshot.persona` | Which surface persona the demo view is showing | Functional |
| `styx.guidedTour.audience`, `styx.guidedTour.open` | Guided-tour state, so the tour does not restart on every page | Functional |
| `styx.guidedTour.sessionId`, `styx.guidedTour.name` | A random per-session identifier for guided-tour feedback | Functional |
| `styx.guidedTour.telemetry` | Set to `off` to disable guided-tour telemetry | **Opt-out control** |

Clearing your browser's site data removes all of these. Doing so logs you out and resets these
preferences; it does not delete anything from your account.

## 5. Your Choices

- **Blocking cookies.** You may block or delete cookies in your browser. Blocking
  `styx_auth_token` or `styx_refresh_token` will prevent you from staying logged in — they are
  strictly necessary, so there is no functional version of the site without them. Blocking
  `styx_csrf_token` will cause write requests to be rejected.
- **Guided-tour telemetry.** Set `styx.guidedTour.telemetry` to `off` (the tour's own settings
  control does this) and no tour telemetry is sent.
- **Everything else.** Because we set no advertising, analytics, or third-party cookies, there is
  no further consent to grant or withdraw. If that ever changes, this policy changes first, and a
  consent mechanism ships with it.

## 6. Consent Banner — Not Yet Implemented

> **INTERNAL NOTE — remove before publication, but do not remove the underlying gap.**
>
> The phase gate names *"Cookie Policy and consent banner implemented"*. **No consent banner exists
> in the web application** — a search of `src/web` finds no consent component of any kind.
>
> The substantive question for counsel is whether one is required *given the enumeration above*.
> Strictly-necessary cookies do not require opt-in consent under CCPA/CPRA, and there are no
> advertising, analytics, or third-party cookies to consent to. On the facts as implemented today,
> the honest position is that a banner may be unnecessary and a **link to this policy in the site
> footer** may be sufficient.
>
> That is an argument, not a determination. Counsel must decide. Two conditions would flip it
> immediately: (a) adding any analytics or advertising tag, or (b) serving the EU/UK, where the
> ePrivacy Directive's consent requirement is broader than CCPA's. The Platform is US-only today
> (non-US traffic is hard-blocked by the geofence), which is why (b) does not currently bite.
>
> Whichever way counsel decides, the footer link is required either way and is not yet present.

## 7. Changes

We will update this policy when the cookies or storage keys we use change, and update the date at
the top. Material changes will be notified in the application.

## 8. Contact

Questions about this policy: [contact address TBD — see `docs/legal/privacy-policy.md` for the
canonical contact block once it is finalized].

---

## Drafting Notes (internal — remove before publication)

| Item | Status |
|---|---|
| Outside counsel retained | **No** — issue #315 |
| Consent banner implemented | **No** — §6 |
| Footer link to this policy | **Not present** |
| Published at `styx.app/cookies` | **No** |
| Enumeration re-derived against shipping build | **Required before publication** — the tables in §2 and §4 are exhaustive as of 2026-08-15 and go stale the moment a cookie or storage key is added |

**Source of every entry in this draft:**
`src/api/src/modules/auth/auth.controller.ts` (§2 — the three cookies, their flags and lifetimes),
`src/web/services/api-client.ts` (§2 — the double-submit CSRF pattern),
`src/web/app/settings/page.tsx`, `src/web/components/chat/ChatInterface.tsx`,
`src/web/components/guided-tour/GuidedTour.tsx`, `src/web/lib/guided-tour/feedback.ts`,
`src/web/services/snapshot.ts` (§4 — the local storage keys).
A search for advertising, analytics, and third-party tags across `src/web` returned nothing, which
is the basis for §3. **Re-run that search before publishing** — §3 is the strongest claim in this
document and the easiest to invalidate by adding one script tag.
