CREATE TABLE IF NOT EXISTS ccpa_deletion_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  request_type TEXT NOT NULL CHECK (request_type IN ('DELETE', 'OPT_OUT')),
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PROCESSING', 'COMPLETED', 'DENIED')),
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  denial_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ccpa_deletion_user ON ccpa_deletion_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_ccpa_deletion_status ON ccpa_deletion_requests(status);

CREATE TABLE IF NOT EXISTS sar_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  transaction_ids TEXT[] NOT NULL,
  suspicion_type TEXT NOT NULL,
  description TEXT NOT NULL,
  filed_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'FILED', 'WITHDRAWN'))
);

CREATE INDEX IF NOT EXISTS idx_sar_reports_user ON sar_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_sar_reports_status ON sar_reports(status);
