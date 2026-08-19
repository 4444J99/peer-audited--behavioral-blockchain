-- 058: Practitioner intelligence tables (Circle 5)
-- Backing tables for PractitionerIntelligenceService, plus columns that the
-- Circle-5 services (AntiSybilService, PractitionerIntelligenceService) query
-- but that no earlier migration created.

CREATE TABLE IF NOT EXISTS practitioner_client_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  practitioner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  CHECK (practitioner_id != client_id)
);

-- One live assignment per practitioner/client pair; inactive rows are history.
CREATE UNIQUE INDEX IF NOT EXISTS uq_pca_active_pair
  ON practitioner_client_assignments(practitioner_id, client_id) WHERE active;
CREATE INDEX IF NOT EXISTS idx_pca_practitioner_active
  ON practitioner_client_assignments(practitioner_id) WHERE active;
CREATE INDEX IF NOT EXISTS idx_pca_client
  ON practitioner_client_assignments(client_id);

-- The service INSERTs client_id but SELECTs user_id for the same person
-- (getClientRecentAlerts), so user_id is a generated mirror of client_id.
CREATE TABLE IF NOT EXISTS practitioner_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  practitioner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user_id UUID GENERATED ALWAYS AS (client_id) STORED,
  alert_type TEXT NOT NULL CHECK (alert_type IN ('RATIONALIZATION', 'DISTRESS_ESCALATION', 'TRIGGER_MENTION', 'CRISIS_LANGUAGE')),
  excerpt TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_practitioner_alerts_client_created
  ON practitioner_alerts(client_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_practitioner_alerts_practitioner
  ON practitioner_alerts(practitioner_id);

-- App-engagement events (late-night activity ratio, weekly app-open counts).
CREATE TABLE IF NOT EXISTS activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL DEFAULT 'APP_OPEN',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activity_log_user_created
  ON activity_log(user_id, created_at);

CREATE TABLE IF NOT EXISTS contract_violations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID REFERENCES contracts(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  violation_type TEXT NOT NULL DEFAULT 'ATTESTATION_MISSED',
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_contract_violations_user
  ON contract_violations(user_id);
CREATE INDEX IF NOT EXISTS idx_contract_violations_contract
  ON contract_violations(contract_id);

-- ------------------------------------------------------------------
-- Columns queried by the Circle-5 services that exist in no migration.
-- ------------------------------------------------------------------

-- AntiSybilService.detectSharedIP / analyzeUser read proofs.ip_address and
-- proofs.created_at (the table only had submitted_at). Backfill created_at
-- from submitted_at so the 30-day IP-correlation window stays truthful.
ALTER TABLE proofs ADD COLUMN IF NOT EXISTS ip_address TEXT;
ALTER TABLE proofs ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
UPDATE proofs SET created_at = submitted_at WHERE submitted_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_proofs_ip_address
  ON proofs(ip_address) WHERE ip_address IS NOT NULL;

-- AntiSybilService.appealSharedDevice reads users.phone_number.
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_number TEXT;

-- PractitionerIntelligenceService.getPractitionerDashboard reads users.alias.
ALTER TABLE users ADD COLUMN IF NOT EXISTS alias TEXT;

-- PractitionerIntelligenceService.getGraceDayBurnRate reads contracts.grace_days_total.
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS grace_days_total INTEGER NOT NULL DEFAULT 0;
