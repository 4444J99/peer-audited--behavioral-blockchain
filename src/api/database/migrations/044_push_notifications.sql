-- 044: Push notification infrastructure
-- Adds push_tokens table for device registration and push_deliveries for audit.

CREATE TABLE IF NOT EXISTS push_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    platform TEXT NOT NULL CHECK (platform IN ('ios', 'android', 'web', 'unknown')),
    token TEXT NOT NULL,
    device_identifier TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    last_seen_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(token)
);

CREATE INDEX idx_push_tokens_user_id ON push_tokens(user_id);
CREATE INDEX idx_push_tokens_active ON push_tokens(user_id) WHERE is_active = TRUE;

CREATE TABLE IF NOT EXISTS push_deliveries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    push_token_id UUID REFERENCES push_tokens(id) ON DELETE SET NULL,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    notification_type TEXT NOT NULL,
    title TEXT NOT NULL,
    body TEXT,
    payload JSONB,
    provider TEXT NOT NULL DEFAULT 'expo',
    provider_result TEXT,
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'SENT', 'FAILED', 'UNREGISTERED')),
    error_message TEXT,
    delivered_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_push_deliveries_user_id ON push_deliveries(user_id);
CREATE INDEX idx_push_deliveries_created_at ON push_deliveries(created_at DESC);
