-- 051_device_attestation_keys.sql
-- Device attestation key registry for App Attest (iOS) and Play Integrity (Android).

CREATE TABLE IF NOT EXISTS device_attestation_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('ios', 'android')),
  key_id TEXT NOT NULL,
  public_key TEXT NOT NULL,
  sign_count BIGINT NOT NULL DEFAULT 0,
  device_info JSONB DEFAULT '{}',
  revoked BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, platform, key_id)
);

CREATE INDEX IF NOT EXISTS idx_device_attestation_keys_user ON device_attestation_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_device_attestation_keys_platform ON device_attestation_keys(platform);
