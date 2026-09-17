CREATE TABLE IF NOT EXISTS sybil_device_fingerprints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  device_hash TEXT NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('ios', 'android', 'web')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, device_hash)
);

CREATE INDEX IF NOT EXISTS idx_sybil_device_hash ON sybil_device_fingerprints(device_hash);
CREATE INDEX IF NOT EXISTS idx_sybil_device_user ON sybil_device_fingerprints(user_id);

CREATE TABLE IF NOT EXISTS sybil_signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  signal_type TEXT NOT NULL CHECK (signal_type IN ('SHARED_DEVICE', 'SHARED_IP', 'SHARED_PAYMENT', 'SHARED_PHONE')),
  related_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  confidence NUMERIC(5,2) NOT NULL,
  detected_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sybil_signals_user ON sybil_signals(user_id);
CREATE INDEX IF NOT EXISTS idx_sybil_signals_type ON sybil_signals(signal_type);
