-- TKT-P1-008: Cross-Lobby Auditing (Anti-Collusion)
-- Ensure auditors are geographically and socially isolated from subjects.

ALTER TABLE users
ADD COLUMN IF NOT EXISTS last_known_state TEXT,
ADD COLUMN IF NOT EXISTS social_guild_id UUID;

CREATE INDEX IF NOT EXISTS idx_users_last_known_state ON users (last_known_state);
CREATE INDEX IF NOT EXISTS idx_users_social_guild_id ON users (social_guild_id);

-- Backfill last_known_state from compliance_decisions if available
UPDATE users u
SET last_known_state = (
    SELECT jurisdiction_code 
    FROM compliance_decisions cd 
    WHERE cd.user_id = u.id 
    AND cd.jurisdiction_code IS NOT NULL 
    ORDER BY cd.created_at DESC 
    LIMIT 1
)
WHERE last_known_state IS NULL;
