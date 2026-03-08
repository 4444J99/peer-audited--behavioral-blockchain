-- Migration 025: Realms — Portal-Based Behavioral Domain Separation
-- Each behavioral stream becomes a Realm with its own identity, verification oracle,
-- and explicit cross-realm bridges.

-- Realm configuration table (thin reference, not transactional)
CREATE TABLE IF NOT EXISTS realms (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    stream_prefix TEXT NOT NULL,
    config JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed 7 realms (ontological-function IDs; display names are a rendering concern)
INSERT INTO realms (id, name, slug, stream_prefix, config) VALUES
  ('BIOLOGICAL_HARDWARE',  'Biological Hardware',  'biological-hardware',  'BIOLOGICAL',   '{}'),
  ('COGNITIVE_DEVICE',     'Cognitive Device',     'cognitive-device',     'COGNITIVE',    '{}'),
  ('PROFESSIONAL_API',     'Professional API',     'professional-api',     'PROFESSIONAL', '{}'),
  ('CREATIVE_PROCESS',     'Creative Process',     'creative-process',     'CREATIVE',     '{}'),
  ('ENVIRONMENTAL_VISUAL', 'Environmental Visual', 'environmental-visual', 'VISUAL',       '{}'),
  ('CHARACTER_SOCIAL',     'Character Social',     'character-social',     'SOCIAL',       '{}'),
  ('RECOVERY_ABSTINENCE',  'Recovery Abstinence',  'recovery-abstinence',  'RECOVERY',     '{}')
ON CONFLICT (id) DO NOTHING;

-- Add realm_id to contracts (nullable initially for backfill)
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS realm_id TEXT REFERENCES realms(id);

-- Backfill from oath_category prefix
UPDATE contracts SET realm_id = 'BIOLOGICAL_HARDWARE'  WHERE realm_id IS NULL AND oath_category LIKE 'BIOLOGICAL_%';
UPDATE contracts SET realm_id = 'COGNITIVE_DEVICE'     WHERE realm_id IS NULL AND oath_category LIKE 'COGNITIVE_%';
UPDATE contracts SET realm_id = 'PROFESSIONAL_API'     WHERE realm_id IS NULL AND oath_category LIKE 'PROFESSIONAL_%';
UPDATE contracts SET realm_id = 'CREATIVE_PROCESS'     WHERE realm_id IS NULL AND oath_category LIKE 'CREATIVE_%';
UPDATE contracts SET realm_id = 'ENVIRONMENTAL_VISUAL' WHERE realm_id IS NULL AND oath_category LIKE 'VISUAL_%';
UPDATE contracts SET realm_id = 'CHARACTER_SOCIAL'     WHERE realm_id IS NULL AND oath_category LIKE 'SOCIAL_%';
UPDATE contracts SET realm_id = 'RECOVERY_ABSTINENCE'  WHERE realm_id IS NULL AND oath_category LIKE 'RECOVERY_%';

-- Make NOT NULL after backfill
ALTER TABLE contracts ALTER COLUMN realm_id SET NOT NULL;
CREATE INDEX IF NOT EXISTS idx_contracts_realm_id ON contracts(realm_id);

-- Fury realm expertise (Phase 2: realm-specialized auditors)
CREATE TABLE IF NOT EXISTS fury_realm_expertise (
    fury_user_id UUID REFERENCES users(id),
    realm_id TEXT REFERENCES realms(id),
    audits_completed INTEGER DEFAULT 0,
    accuracy FLOAT DEFAULT 1.0,
    specialization_level TEXT DEFAULT 'NOVICE',
    PRIMARY KEY (fury_user_id, realm_id)
);

-- Realm_id on fury_assignments for realm-scoped routing
ALTER TABLE fury_assignments ADD COLUMN IF NOT EXISTS realm_id TEXT REFERENCES realms(id);
CREATE INDEX IF NOT EXISTS idx_fury_assignments_realm_id ON fury_assignments(realm_id);

-- Realm preferences on users
ALTER TABLE users ADD COLUMN IF NOT EXISTS realm_preferences JSONB DEFAULT '{}';
