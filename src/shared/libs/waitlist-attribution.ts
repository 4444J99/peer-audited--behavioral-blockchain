/**
 * Beta-waitlist source attribution — the single source of truth shared by the
 * public landing/funnel (web) and the signup API.
 *
 * CTAs and campaigns hand us a raw `source` token plus optional UTM params. For
 * cohort admissions and conversion tracking we need those mapped into a small,
 * stable set of marketing channels so traffic can be grouped consistently no
 * matter which surface (homepage, emergency asset, creator post, referral link)
 * produced the signup. Raw values are always preserved verbatim alongside the
 * derived channel; only the channel is normalized.
 */

export const WAITLIST_CHANNELS = [
  "organic",
  "creator",
  "practitioner",
  "referral",
  "direct",
] as const;

export type WaitlistChannel = (typeof WAITLIST_CHANNELS)[number];

export interface WaitlistAttribution {
  /** Raw source token from the CTA/campaign, preserved verbatim. */
  source: string;
  /** Normalized marketing channel derived from all attribution signals. */
  channel: WaitlistChannel;
  intent: string | null;
  utmSource: string | null;
  utmCampaign: string | null;
  utmMedium: string | null;
  /** HTTP/document referrer, informational only. */
  referrer: string | null;
  /** Explicit referral code from a `ref` param; its presence implies referral traffic. */
  referralCode: string | null;
}

export type AttributionInput = Record<string, string | null | undefined>;

// Hint sets are checked against the combined, lowercased attribution signals.
// Order of evaluation below encodes precedence (referral wins over creator, etc.).
const REFERRAL_HINTS = ["referral", "refer", "invite", "ref="];
const PRACTITIONER_HINTS = [
  "practitioner",
  "therapist",
  "coach",
  "clinician",
  "counselor",
  "clinic",
];
const CREATOR_HINTS = [
  "creator",
  "influencer",
  "youtube",
  "tiktok",
  "instagram",
  "reels",
  "podcast",
  "newsletter",
];
const ORGANIC_HINTS = [
  "organic",
  "seo",
  "search",
  "blog",
  "owned",
  "asset",
  "emergency_asset",
  "do-not-text",
  "do_not_text",
];

function firstNonEmpty(...values: Array<string | null | undefined>): string | null {
  for (const value of values) {
    if (typeof value === "string") {
      const trimmed = value.trim();
      if (trimmed.length > 0) return trimmed;
    }
  }
  return null;
}

function matchesAny(haystack: string, hints: string[]): boolean {
  return hints.some((hint) => haystack.includes(hint));
}

/**
 * Classify a set of attribution signals into a stable marketing channel.
 * Precedence: referral → practitioner → creator → organic → direct (fallback).
 * When no signals are present at all, the channel is `direct`.
 */
export function classifyWaitlistChannel(
  signals: Array<string | null | undefined>,
): WaitlistChannel {
  const haystack = signals
    .filter((s): s is string => typeof s === "string" && s.trim().length > 0)
    .join(" ")
    .toLowerCase();

  if (haystack.length === 0) return "direct";
  if (matchesAny(haystack, REFERRAL_HINTS)) return "referral";
  if (matchesAny(haystack, PRACTITIONER_HINTS)) return "practitioner";
  if (matchesAny(haystack, CREATOR_HINTS)) return "creator";
  if (matchesAny(haystack, ORGANIC_HINTS)) return "organic";
  return "direct";
}

/**
 * Parse a loose attribution bag (query params or request body) into a complete,
 * normalized `WaitlistAttribution`. Accepts both snake_case (`utm_source`) and
 * camelCase (`utmSource`) keys so the same parser serves URLSearchParams and JSON.
 */
export function parseWaitlistAttribution(input: AttributionInput): WaitlistAttribution {
  const source = firstNonEmpty(input.source, input.src) ?? "direct";
  const intent = firstNonEmpty(input.intent);
  const utmSource = firstNonEmpty(input.utm_source, input.utmSource);
  const utmCampaign = firstNonEmpty(input.utm_campaign, input.utmCampaign);
  const utmMedium = firstNonEmpty(input.utm_medium, input.utmMedium);
  const referrer = firstNonEmpty(input.referrer, input.referer);
  const referralCode = firstNonEmpty(
    input.ref,
    input.referral_code,
    input.referralCode,
  );

  const channel = classifyWaitlistChannel([
    referralCode ? "referral" : null,
    input.channel,
    source,
    utmSource,
    utmMedium,
    utmCampaign,
    referrer,
  ]);

  return {
    source,
    channel,
    intent,
    utmSource,
    utmCampaign,
    utmMedium,
    referrer,
    referralCode,
  };
}
