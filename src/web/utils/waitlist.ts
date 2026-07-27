// Attribution forwarding for the public beta-waitlist funnel.
//
// The web surface only *collects* the raw source/UTM params that a CTA or
// campaign placed on the URL and forwards them to the signup API, which owns the
// channel classification (single source of truth in @styx/shared). Keeping the
// web side classification-free avoids duplicating that logic across workspaces.

export const WAITLIST_ATTRIBUTION_KEYS = [
  'source',
  'intent',
  'utm_source',
  'utm_campaign',
  'utm_medium',
  'ref',
] as const;

export type WaitlistAttributionParams = Partial<
  Record<(typeof WAITLIST_ATTRIBUTION_KEYS)[number] | 'referrer', string>
>;

/** Extract the known attribution params from a URLSearchParams-like object. */
export function collectAttribution(
  params: Pick<URLSearchParams, 'get'>,
): WaitlistAttributionParams {
  const out: WaitlistAttributionParams = {};
  for (const key of WAITLIST_ATTRIBUTION_KEYS) {
    const value = params.get(key);
    if (value) out[key] = value;
  }
  return out;
}

export interface WaitlistSignupBody extends WaitlistAttributionParams {
  email: string;
  name?: string;
  goal?: string;
}

/** Build the POST body for a signup, folding in optional referrer attribution. */
export function buildSignupBody(
  fields: { email: string; name?: string; goal?: string },
  attribution: WaitlistAttributionParams,
  referrer?: string,
): WaitlistSignupBody {
  const body: WaitlistSignupBody = {
    email: fields.email.trim(),
    ...attribution,
  };
  const name = fields.name?.trim();
  const goal = fields.goal?.trim();
  if (name) body.name = name;
  if (goal) body.goal = goal;
  if (referrer && referrer.trim()) body.referrer = referrer.trim();
  return body;
}
