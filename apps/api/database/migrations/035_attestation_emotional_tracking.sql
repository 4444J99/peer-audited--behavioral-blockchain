-- Migration 035: Extended Daily Attestation with Emotional Tracking
-- Adds urge level, trigger categories, and coping mechanism fields to attestations.

ALTER TABLE attestations
  ADD COLUMN IF NOT EXISTS urge_level INTEGER CHECK (urge_level >= 0 AND urge_level <= 10),
  ADD COLUMN IF NOT EXISTS triggers JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS coping_mechanisms JSONB DEFAULT '[]';
