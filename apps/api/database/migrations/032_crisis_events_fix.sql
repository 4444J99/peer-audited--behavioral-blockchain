ALTER TABLE crisis_events DROP CONSTRAINT crisis_events_user_id_fkey;
ALTER TABLE crisis_events ADD CONSTRAINT crisis_events_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id);
CREATE INDEX IF NOT EXISTS idx_crisis_events_created_at ON crisis_events(created_at DESC);
