-- 069: Persist enterprise webhook registrations.
--
-- POST /b2b/webhook/register previously echoed {status:'registered'} and stored
-- nothing, so no contract-lifecycle code could ever find a URL to notify. This is
-- the missing store: one row per (enterprise, url), soft-deactivated rather than
-- deleted so a re-registration after a delivery outage keeps its history.
--
-- last_delivery_at / last_delivery_ok are written by the delivery worker. They are
-- the only support signal an operator has when an enterprise reports "we stopped
-- receiving events" — the payload itself is never retained (it carries a pseudonym
-- for a real employee, and the privacy firewall means Styx keeps no copy).

CREATE TABLE IF NOT EXISTS webhook_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enterprise_id UUID NOT NULL REFERENCES enterprises(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  registered_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_delivery_at TIMESTAMPTZ,
  last_delivery_ok BOOLEAN,
  CONSTRAINT one_subscription_per_enterprise_url UNIQUE (enterprise_id, url)
);

-- The dispatch path only ever asks for the active rows of one enterprise.
CREATE INDEX IF NOT EXISTS idx_webhook_subscriptions_active
  ON webhook_subscriptions(enterprise_id)
  WHERE active;
