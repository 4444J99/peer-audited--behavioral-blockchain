/**
 * The guided-demo registry.
 *
 * One entry per route in src/web/app. Coverage is DATA, not code: adding a route
 * to the tour means adding an entry here, never touching the overlay engine.
 *
 * Copy rules, because five very different people read the same panel:
 *  - `summary` is for a non-technical reader. No jargon, no product-speak, one
 *    or two sentences. This is what a layperson and an investor both see first.
 *  - `detail` is the mechanism: what actually happens, and why it matters. Shown
 *    to every audience except `layperson`.
 *  - `label` is the truth boundary, and it is not decoration. `working` means the
 *    route works today against synthetic data; `beta` means test-money only;
 *    `future` means the route previews a direction that is not deployed.
 *    Never mark a route `working` to make a demo look better.
 *  - `steps` anchor tooltips to real elements. A step whose selector matches
 *    nothing is skipped silently at runtime -- the route still explains itself --
 *    so a UI change degrades the tour instead of breaking the demo.
 */

export type TruthLabel = "working" | "beta" | "future";

/** Which synthetic account the route needs. `none` means signed-out is fine. */
export type TourPersona = "none" | "river" | "moira" | "hr" | "alecto" | "sage";

export type TourStep = {
  /** CSS selector, or a text= prefix to match by visible text. */
  selector: string;
  title: string;
  body: string;
};

export type TourRoute = {
  path: string;
  title: string;
  chapter: string;
  persona: TourPersona;
  label: TruthLabel;
  summary: string;
  detail: string;
  steps?: TourStep[];
};

export const PERSONA_ACCOUNTS: Record<Exclude<TourPersona, "none">, string> = {
  river: "river@demo.styx.protocol",
  moira: "dr.moira@demo.styx.protocol",
  hr: "hr.lead@acheron.example",
  alecto: "alecto@demo.styx.protocol",
  sage: "sage@demo.styx.protocol",
};

export const TRUTH_LABEL_TEXT: Record<TruthLabel, string> = {
  working: "Working today",
  beta: "Test-money beta",
  future: "Future enterprise capability",
};

export const CHAPTERS = [
  "Start here",
  "Make a promise",
  "Prove it",
  "Hold the line",
  "The coach",
  "The employer",
  "Trust and limits",
] as const;

export const TOUR_ROUTES: TourRoute[] = [
  // ── Start here ────────────────────────────────────────────────────────────
  {
    path: "/tour",
    title: "The boundary, stated first",
    chapter: "Start here",
    persona: "none",
    label: "beta",
    summary:
      "Styx lets someone put their own money behind a promise, and keeps an honest record of whether they kept it. This page says up front what is real and what is not.",
    detail:
      "Every other page in this demo runs on synthetic accounts and test credits. The labels you see throughout the tour come from this page's own vocabulary, so nothing in the walkthrough can claim more than this page does.",
    steps: [
      {
        selector: "text=Test-money beta",
        title: "The truth label",
        body: "This badge appears on every chapter. Amber means test-money only. Green means the route genuinely works today. Blue means it is a preview of a direction, not a deployed product.",
      },
      {
        selector: "text=What is deliberately not being claimed",
        title: "What we are not claiming",
        body: "Read this out loud to an investor. Naming the limits is the reason the rest of the demo can be trusted.",
      },
    ],
  },
  {
    path: "/",
    title: "The front door",
    chapter: "Start here",
    persona: "none",
    label: "working",
    summary: "The public landing page — how Styx explains itself to someone arriving cold.",
    detail:
      "This is the marketing surface, not the product. It is included in the tour so you can see the promise a visitor is given before comparing it against what the signed-in routes actually do.",
  },
  {
    path: "/pitch",
    title: "The investor deck",
    chapter: "Start here",
    persona: "none",
    label: "working",
    summary: "The pitch narrative in slide form: the problem, the wedge, and the business model.",
    detail:
      "Historical figures and market claims on this surface are projections unless separately sourced. Treat it as the story, and the signed-in routes as the evidence.",
  },
  {
    path: "/circles",
    title: "The demo index",
    chapter: "Start here",
    persona: "none",
    label: "beta",
    summary: "A map of the synthetic demo data — every seeded scenario, and a link to the surface that shows it.",
    detail:
      "The seed builds five concentric circles: waitlist prospects, active contracts with day-accurate streaks, three auditors mid-review, a five-member accountability pod, and one enterprise. This page is the shortest route to any of them.",
  },
  {
    path: "/ask",
    title: "Ask Styx",
    chapter: "Start here",
    persona: "none",
    label: "future",
    summary: "A question box for stakeholders — ask how Styx works and get a plain answer.",
    detail:
      "Backed by a separate Cloudflare Worker. In this local demo the worker URL is not configured, so treat this route as a direction rather than a working feature.",
  },
  {
    path: "/help",
    title: "Help",
    chapter: "Start here",
    persona: "none",
    label: "working",
    summary: "Plain-language answers to the questions people actually ask before committing money.",
    detail: "Useful as a proxy for support load: everything here is a question the product has not yet made obvious.",
  },
  {
    path: "/login",
    title: "Sign in",
    chapter: "Start here",
    persona: "none",
    label: "working",
    summary: "The ordinary sign-in screen a real user would meet.",
    detail:
      "The guided tour never uses this form. It establishes sessions through the API directly so the shared synthetic password is never typed on screen or captured in a recording.",
  },
  {
    path: "/register",
    title: "Create an account",
    chapter: "Start here",
    persona: "none",
    label: "working",
    summary: "Sign-up, including the age confirmation and terms acceptance a money product needs.",
    detail:
      "Registration captures age confirmation, terms acceptance and an optional referral code. These are consent artifacts, not form fields — they are what makes a later stake defensible.",
  },
  {
    path: "/beta",
    title: "Private beta waitlist",
    chapter: "Start here",
    persona: "none",
    label: "beta",
    summary: "Where someone asks to be let in early.",
    detail:
      "The synthetic seed puts four prospects here across organic, creator, practitioner and referral channels — the four acquisition routes the go-to-market plan assumes.",
  },
  {
    path: "/beta/confirm",
    title: "Waitlist confirmation",
    chapter: "Start here",
    persona: "none",
    label: "beta",
    summary: "The confirmation step after joining the waitlist.",
    detail: "Confirms intent and assigns a cohort. The seeded cohort in this demo is cohort-2026-08.",
  },

  // ── Make a promise ────────────────────────────────────────────────────────
  {
    path: "/dashboard",
    title: "One person's commitment",
    chapter: "Make a promise",
    persona: "river",
    label: "working",
    summary:
      "River promised not to contact an ex. Real money is held while that promise is open, and this is what River sees every day.",
    detail:
      "The dashboard is the product's centre of gravity: money at risk, the current streak, today's pending check-in, and an append-only record of what was attested and when.",
    steps: [
      {
        selector: "text=CAPITAL AT RISK (TEST CREDITS)",
        title: "Money at risk",
        body: "This is the amount held against the promise. In this demo it is test credits and the ledger provider cannot move real money — that is enforced in code, not by policy.",
      },
      {
        selector: "text=TRUTH LOG",
        title: "The truth log",
        body: "Append-only. Entries are never edited or deleted, which is the whole point: the record has to be worth more than the story someone tells about themselves later.",
      },
      {
        selector: "text=MY CONTRACTS",
        title: "Open commitments",
        body: "Each contract carries its own stake, cadence and evidence rule. River's is a 21-day no-contact streak.",
      },
    ],
  },
  {
    path: "/contracts/new",
    title: "Making the promise",
    chapter: "Make a promise",
    persona: "river",
    label: "working",
    summary: "Where someone defines what they are promising, how much they are staking, and how it will be checked.",
    detail:
      "The three decisions that make a commitment enforceable: the behaviour, the amount at risk, and what counts as evidence. Get the evidence rule wrong and the whole record is worthless.",
  },
  {
    path: "/contracts/[id]",
    title: "Inside one contract",
    chapter: "Make a promise",
    persona: "river",
    label: "working",
    summary: "The full history of a single promise — every check-in, every stake movement.",
    detail:
      "Shows the double-entry ledger behind the contract: the hold when it opened, returns on kept days, forfeits on missed ones.",
  },
  {
    path: "/contracts/[id]/attest",
    title: "Today's check-in",
    chapter: "Make a promise",
    persona: "river",
    label: "working",
    summary: "The daily moment of truth: did you keep it?",
    detail:
      "Attestation is deliberately small and frequent. The seeded data includes a perfect streak, a missed-and-recovered streak and a wobbling one, because the product has to be honest about all three.",
  },
  {
    path: "/wallet",
    title: "The money",
    chapter: "Make a promise",
    persona: "river",
    label: "beta",
    summary: "Balance, holds, and what has been returned or forfeited.",
    detail:
      "Backed by a double-entry ledger with system escrow and revenue accounts. In this demo the provider is internal and marked as not moving real money.",
  },
  {
    path: "/realms",
    title: "Categories of promise",
    chapter: "Make a promise",
    persona: "river",
    label: "working",
    summary: "The different life areas someone can commit in.",
    detail: "Realms carry their own evidence rules and their own auditor expertise, which is what makes review credible.",
  },
  {
    path: "/realms/[slug]",
    title: "Inside a realm",
    chapter: "Make a promise",
    persona: "river",
    label: "working",
    summary: "One category in depth, with the commitments people make in it.",
    detail: "Auditors are matched to realms by recorded expertise rather than at random.",
  },
  {
    path: "/realms/[slug]/contracts/new",
    title: "Commit within a realm",
    chapter: "Make a promise",
    persona: "river",
    label: "working",
    summary: "Starting a promise pre-shaped by its category.",
    detail: "Pre-fills the evidence rule appropriate to the realm, which is the main defence against unverifiable promises.",
  },
  {
    path: "/tavern",
    title: "The commons",
    chapter: "Make a promise",
    persona: "river",
    label: "working",
    summary: "Where people going through the same thing can see they are not alone.",
    detail: "Retention in this category comes from company, not features. This is the surface that tests that claim.",
  },
  {
    path: "/referrals",
    title: "Bringing someone in",
    chapter: "Make a promise",
    persona: "river",
    label: "working",
    summary: "How an existing user invites the next one.",
    detail: "Referral is the cheapest of the four seeded acquisition channels and the one with the best retention.",
  },
  {
    path: "/profile",
    title: "Profile",
    chapter: "Make a promise",
    persona: "river",
    label: "working",
    summary: "Who the account belongs to, and what the record says about them.",
    detail: "The public-facing half of a person's record, distinct from the private truth log.",
  },
  {
    path: "/settings",
    title: "Settings",
    chapter: "Make a promise",
    persona: "river",
    label: "working",
    summary: "Notification, privacy and account controls.",
    detail: "Includes the controls that matter most in a behaviour product: what gets sent, when, and to whom.",
  },
  {
    path: "/kyc",
    title: "Identity verification",
    chapter: "Make a promise",
    persona: "sage",
    label: "beta",
    summary: "Confirming a real person is behind an account before money moves.",
    detail:
      "The seed deliberately spreads accounts across VERIFIED, PENDING and NOT_STARTED so you can see all three states. Sage is mid-verification.",
  },
  {
    path: "/do-not-text-your-ex-tonight",
    title: "The wedge",
    chapter: "Make a promise",
    persona: "none",
    label: "working",
    summary: "The single, specific, painful moment the product was built for.",
    detail:
      "This is the entry point that converts. Show it to an investor when they ask what the wedge is — it is one situation, named exactly, not a category.",
  },
  {
    path: "/recovery/how-commitment-contracts-work",
    title: "How this works",
    chapter: "Make a promise",
    persona: "none",
    label: "working",
    summary: "The mechanism explained for someone who has never heard of a commitment contract.",
    detail: "Loss aversion is the engine: people work substantially harder to avoid losing money than to gain it.",
  },
  {
    path: "/recovery/breakup-no-contact-guide",
    title: "No-contact guide",
    chapter: "Make a promise",
    persona: "none",
    label: "working",
    summary: "Practical help for the specific promise most people arrive wanting to make.",
    detail: "Doubles as the organic acquisition surface for the wedge.",
  },
  {
    path: "/recovery/accountability-app-for-relationships",
    title: "Accountability, relationships",
    chapter: "Make a promise",
    persona: "none",
    label: "working",
    summary: "The relationship-focused entry point.",
    detail: "One of four seeded acquisition channels; organic search is the cheapest.",
  },
  {
    path: "/recovery/couples-recovery-tools",
    title: "Couples tools",
    chapter: "Make a promise",
    persona: "none",
    label: "working",
    summary: "Commitments made by two people rather than one.",
    detail: "Extends the single-person contract to a mutual one, which changes who can attest.",
  },

  // ── Prove it ──────────────────────────────────────────────────────────────
  {
    path: "/fury",
    title: "The auditors",
    chapter: "Prove it",
    persona: "alecto",
    label: "working",
    summary:
      "When a claim needs checking, three independent people review it. They do not know each other's verdicts until all three are in.",
    detail:
      "This is the answer to 'what stops someone lying?'. The seeded review has three auditors — Alecto, Megaera and Tisiphone — with one review pending and one already resolved by consensus.",
    steps: [
      {
        selector: "text=Fury",
        title: "Three-way review",
        body: "Independent review is what makes the record worth more than self-reporting. Consensus is required, and auditors are matched to the realm by recorded expertise.",
      },
    ],
  },
  {
    path: "/whistleblower/[linkId]",
    title: "Someone else reports it",
    chapter: "Prove it",
    persona: "none",
    label: "working",
    summary: "A private link that lets a third party report that a promise was broken.",
    detail:
      "The uncomfortable but necessary case: self-report is not the only evidence path. The link is scoped and does not expose the reporter.",
  },
  {
    path: "/behavioral",
    title: "The behavioural toolkit",
    chapter: "Prove it",
    persona: "river",
    label: "working",
    summary: "The set of tools that measure whether someone is actually changing, rather than just paying.",
    detail:
      "Staking money is the mechanism; these are the measurements. Without them the product is a wager, and the difference matters to every audience in the room.",
  },
  {
    path: "/behavioral/assessment",
    title: "Where someone is starting from",
    chapter: "Prove it",
    persona: "river",
    label: "working",
    summary: "A baseline read on habits before any promise is made.",
    detail: "Without a baseline there is no way to claim improvement later. This is the measurement the outcome claims rest on.",
  },
  {
    path: "/behavioral/habit-strength",
    title: "Habit strength",
    chapter: "Prove it",
    persona: "river",
    label: "working",
    summary: "How established a behaviour has actually become.",
    detail: "Streak length alone is a weak signal; this weights consistency and recovery after a miss.",
  },
  {
    path: "/behavioral/friction-audit",
    title: "Friction audit",
    chapter: "Prove it",
    persona: "river",
    label: "working",
    summary: "Finding the moments where someone is most likely to break.",
    detail: "Targets intervention at the point of failure rather than spreading it evenly.",
  },
  {
    path: "/behavioral/reentry",
    title: "After a miss",
    chapter: "Prove it",
    persona: "river",
    label: "working",
    summary: "What happens the day after someone breaks their promise.",
    detail:
      "The most important surface in the product for retention. The seeded data includes a missed-and-recovered streak specifically so this can be shown honestly.",
  },
  {
    path: "/behavioral/academy",
    title: "Academy",
    chapter: "Prove it",
    persona: "river",
    label: "working",
    summary: "Teaching the method rather than only enforcing it.",
    detail: "Education lowers support load and raises the quality of the promises people make.",
  },
  {
    path: "/behavioral/gateway-oath",
    title: "The oath",
    chapter: "Prove it",
    persona: "river",
    label: "working",
    summary: "The explicit commitment someone makes on entry.",
    detail: "A deliberate friction point: stating the promise plainly improves follow-through before any money is involved.",
  },
  {
    path: "/behavioral/auditor-wellness",
    title: "Auditor wellness",
    chapter: "Prove it",
    persona: "alecto",
    label: "working",
    summary: "Looking after the people who review other people's failures.",
    detail:
      "Reviewer burnout is the quiet failure mode of any peer-audit system. Worth showing to anyone who asks whether the model scales.",
  },

  // ── Hold the line ─────────────────────────────────────────────────────────
  {
    path: "/guardrails",
    title: "Guardrails",
    chapter: "Hold the line",
    persona: "none",
    label: "working",
    summary: "The limits the product puts on itself — what it will refuse to let someone stake or promise.",
    detail:
      "The single most important page for a regulator or a cautious investor. A product that takes money against behaviour has to be able to say no.",
  },

  // ── The coach ─────────────────────────────────────────────────────────────
  {
    path: "/practitioner",
    title: "The coach's console",
    chapter: "The coach",
    persona: "moira",
    label: "working",
    summary:
      "A coach sees, in one place, which of their clients is drifting — without reading anyone's private journal.",
    detail:
      "This is the first buyer. Independent coaches already do this work in spreadsheets and memory. The console turns scattered self-reports into a ranked risk view backed by an auditable record.",
    steps: [
      {
        selector: "text=Composite risk intelligence for assigned clients",
        title: "Ranked by risk",
        body: "Not an alphabetical client list — an ordering by who most needs attention this week. That ordering is the product.",
      },
      {
        selector: "text=Practitioner Console",
        title: "Assigned clients only",
        body: "A coach sees only clients assigned to them, and sees signals rather than raw private content.",
      },
    ],
  },

  // ── The employer ──────────────────────────────────────────────────────────
  {
    path: "/hr",
    title: "The employer view",
    chapter: "The employer",
    persona: "hr",
    label: "future",
    summary:
      "An employer sees whether a wellbeing programme is working in aggregate — and cannot see any individual employee.",
    detail:
      "A preview of a direction, not a deployed enterprise product. Individual data is structurally redacted rather than hidden by permission, which is the only version of this an employer can legally buy.",
    steps: [
      {
        selector: "text=Enterprise Group Analytics",
        title: "Aggregate only",
        body: "Group-level outcomes. The seeded enterprise is Acheron Logistics Group, with a deliberate mix of active, completed and failed contracts so the numbers are not flattering.",
      },
      {
        selector: "text=Total Contracts",
        title: "The metric an employer buys on",
        body: "Participation and completion in aggregate. Note what is absent: no name, no individual outcome, no journal content.",
      },
    ],
  },
  {
    path: "/admin",
    title: "Operator console",
    chapter: "The employer",
    persona: "hr",
    label: "future",
    summary: "The internal view for whoever runs the platform.",
    detail: "Not a customer-facing surface. Shown so the operational cost of running the product is visible rather than assumed.",
  },
  {
    path: "/admin/cac-ltv",
    title: "Acquisition cost and lifetime value",
    chapter: "The employer",
    persona: "hr",
    label: "future",
    summary: "What a customer costs to acquire against what they are worth.",
    detail:
      "The two numbers an investor will ask for. Figures here are modelled from synthetic data — say so plainly rather than letting them read as trading history.",
  },
  {
    path: "/admin/jurisdictions",
    title: "Where this is allowed",
    chapter: "The employer",
    persona: "hr",
    label: "future",
    summary: "Which places the product can legally operate in, and which are blocked.",
    detail:
      "Staking money on outcomes is regulated differently everywhere. Blocked jurisdictions fail closed. In the local demo the geofence runs in a permissive demo posture, so this shows the control, not a verified legal position.",
  },

  // ── Trust and limits ──────────────────────────────────────────────────────
  {
    path: "/legal/terms",
    title: "Terms",
    chapter: "Trust and limits",
    persona: "none",
    label: "working",
    summary: "The agreement someone accepts before staking anything.",
    detail: "Acceptance is captured at registration and is part of what makes a forfeit defensible.",
  },
  {
    path: "/legal/privacy",
    title: "Privacy",
    chapter: "Trust and limits",
    persona: "none",
    label: "working",
    summary: "What is collected, what is shared, and what never leaves the account.",
    detail: "Read alongside the employer view: the privacy promise is what makes that view sellable.",
  },
  {
    path: "/legal/responsible-use",
    title: "Responsible use",
    chapter: "Trust and limits",
    persona: "none",
    label: "working",
    summary: "Who this product is not for, stated by the product itself.",
    detail: "A behaviour-and-money product without this page is not credible. Pair it with /guardrails.",
  },
  {
    path: "/legal/rules",
    title: "The rules",
    chapter: "Trust and limits",
    persona: "none",
    label: "working",
    summary: "How stakes, evidence and disputes are actually decided.",
    detail: "The operational rulebook behind the truth log.",
  },
  {
    path: "/legal/compliance-artifacts",
    title: "Compliance artifacts",
    chapter: "Trust and limits",
    persona: "none",
    label: "working",
    summary: "The compliance documents this build ships, and the hash CI checks them against.",
    detail:
      "The release gate hashes this artifact set on every run, so what is published here and what CI enforces cannot drift apart silently.",
  },
];

export const TOUR_BY_PATH = new Map(TOUR_ROUTES.map((route) => [route.path, route]));

const splitSegments = (value: string): string[] => value.split("/").filter(Boolean);

/**
 * Matches a live pathname to a registry entry, including dynamic segments.
 *
 * Compares segment by segment rather than compiling the registry path into a
 * regex. Building a pattern by escaping a string is the sink CodeQL flags as
 * incomplete sanitization (js/incomplete-sanitization) -- and escaping is the
 * wrong tool here anyway, since a dynamic segment is exactly "one segment, any
 * value", which a direct comparison expresses without an escaping rule to get
 * subtly wrong.
 */
export function matchTourRoute(pathname: string): TourRoute | undefined {
  // The Cloudflare snapshot builds with trailingSlash, so usePathname() reports
  // "/tour/" while every registry key is "/tour". Left unnormalised the tour simply
  // does not appear on the hosted build -- silently, since a missing panel looks like
  // a route that was never added rather than a lookup miss.
  const normalised =
    pathname.length > 1 && pathname.endsWith('/') ? pathname.replace(/\/+$/, '') : pathname;

  const direct = TOUR_BY_PATH.get(normalised);
  if (direct) return direct;

  const actual = splitSegments(normalised);
  return TOUR_ROUTES.find((route) => {
    if (!route.path.includes("[")) return false;
    const expected = splitSegments(route.path);
    if (expected.length !== actual.length) return false;
    return expected.every(
      (segment, index) =>
        (segment.startsWith("[") && segment.endsWith("]")) || segment === actual[index],
    );
  });
}

/** Registry order, grouped by chapter, for next/previous navigation. */
export const TOUR_ORDER: TourRoute[] = CHAPTERS.flatMap((chapter) =>
  TOUR_ROUTES.filter((route) => route.chapter === chapter),
);
