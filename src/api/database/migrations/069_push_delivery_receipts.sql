-- 069: Two-phase push delivery — tickets on send, receipts afterwards.
--
-- Expo's push API is two-phase and 044 only recorded the first half. A 200 from
-- /push/send returns a *ticket*, which means "accepted for delivery", not
-- "delivered": DeviceNotRegistered, MessageTooBig and MessageRateExceeded are
-- only ever reported later, by /push/getReceipts, keyed on the ticket id. A row
-- whose status was 'SENT' therefore proved nothing about the device.
--
-- provider_ticket_id is what makes a delivery row addressable in phase two, and
-- receipt_status is its own lifecycle independent of `status`:
--
--   PENDING     -- a ticket exists, no receipt has come back yet
--   OK          -- the receipt confirmed delivery to the push service
--   ERROR       -- the receipt reported a failure; receipt_error_code names it
--   UNAVAILABLE -- Expo never produced a receipt within the poll ceiling
--
-- Receipts stay retrievable for roughly 24 hours, so a delivery that is still
-- PENDING long after that will never resolve; receipt_attempts bounds the
-- polling the same way contracts.reconcile_attempts bounds the stuck-contract
-- sweep (068). Existing rows keep NULL and are never polled — they predate any
-- ticket being recorded.

ALTER TABLE push_deliveries
    ADD COLUMN IF NOT EXISTS provider_ticket_id TEXT,
    ADD COLUMN IF NOT EXISTS receipt_status TEXT,
    ADD COLUMN IF NOT EXISTS receipt_error_code TEXT,
    ADD COLUMN IF NOT EXISTS receipt_checked_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS receipt_attempts INTEGER NOT NULL DEFAULT 0;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'push_deliveries_receipt_status_check'
    ) THEN
        ALTER TABLE push_deliveries
            ADD CONSTRAINT push_deliveries_receipt_status_check
            CHECK (receipt_status IN ('PENDING', 'OK', 'ERROR', 'UNAVAILABLE'));
    END IF;
END $$;

-- The receipt sweep's only query: the oldest tickets still awaiting a verdict.
CREATE INDEX IF NOT EXISTS idx_push_deliveries_receipt_pending
    ON push_deliveries (created_at)
    WHERE receipt_status = 'PENDING';
