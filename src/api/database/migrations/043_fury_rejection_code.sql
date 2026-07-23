-- Migration 043: Add rejection code for Fury taxonomy
ALTER TABLE fury_assignments ADD COLUMN IF NOT EXISTS rejection_code TEXT;
