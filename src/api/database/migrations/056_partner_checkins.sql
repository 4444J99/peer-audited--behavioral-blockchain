CREATE TABLE IF NOT EXISTS partner_checkins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  partner_id UUID NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('SCHEDULED', 'EMERGENCY', 'STREAK_MILESTONE')),
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'COMPLETED', 'MISSED', 'ESCALATED')),
  scheduled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_partner_checkins_contract ON partner_checkins(contract_id);
CREATE INDEX IF NOT EXISTS idx_partner_checkins_status ON partner_checkins(status);
CREATE INDEX IF NOT EXISTS idx_partner_checkins_partner ON partner_checkins(partner_id);
